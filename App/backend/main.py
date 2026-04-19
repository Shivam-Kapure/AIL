from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from fastapi.middleware.cors import CORSMiddleware
import joblib
import numpy as np
import pandas as pd
from openai import OpenAI

app = FastAPI(title="SecureFlow Agentic Engine")

# 1. Allow React frontend to communicate with this API
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], 
    allow_methods=["*"],
    allow_headers=["*"],
)

# 2. Load ML Artifacts on startup
print("Loading Engine...")
model = joblib.load('fraud_rf_model.pkl')
scaler = joblib.load('fraud_scaler.pkl')
encoders = joblib.load('fraud_label_encoders.pkl')

# 3. Setup LLM Client (Pointing to local Ollama)
llm_client = OpenAI(
    base_url="http://localhost:11434/v1",
    api_key="ollama" 
)

# 4. Define incoming Data Structure
class Transaction(BaseModel):
    # Add your 15 features here. Match the exact names from your CSV.
    Day_of_Week: str
    Time: int
    Type_of_Card: str
    Entry_Mode: str
    Amount: float
    Type_of_Transaction: str
    Merchant_Group: str
    Country_of_Transaction: str
    Shipping_Address: str
    Country_of_Residence: str
    Gender: str
    Age: float
    Bank: str
    # Note: 'Transaction ID' and 'Date' were dropped in training, don't include them.

def call_investigator_agent(tx_data: dict, risk_score: float):
    print(f"⚠️ HIGH RISK DETECTED ({risk_score:.2f}). Routing to Investigator Agent...")
    
    # We strip out boring data so the LLM focuses only on the context
    context = {
        "Time": tx_data.get("Time"),
        "Amount": tx_data.get("Amount"),
        "Merchant": tx_data.get("Merchant_Group"),
        "Transaction_Country": tx_data.get("Country_of_Transaction"),
        "Home_Country": tx_data.get("Country_of_Residence"),
        "Entry_Mode": tx_data.get("Entry_Mode")
    }
    
    system_prompt = """
    You are an autonomous Fraud Resolution Agent for a global bank.
    A predictive model has flagged a transaction as highly likely to be fraudulent.
    Analyze the transaction context provided by the user.
    
    You must respond STRICTLY in this format:
    ANOMALY ANALYSIS: [1 sentence explaining the geographical, temporal, or financial mismatch]
    ACTION TAKEN: [Choose one: SOFT FREEZE / HARD BLOCK / SMS VERIFICATION]
    CUSTOMER MESSAGE: [Draft a short, professional SMS to the customer alerting them]
    """
    
    try:
        response = llm_client.chat.completions.create(
            model="qwen3:0.6b", # Make sure this matches the model you downloaded in Ollama!
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": f"Risk Score: {risk_score}\nTransaction Context: {context}"}
            ],
            temperature=0.2 # Keep it low so the agent is highly deterministic and doesn't hallucinate
        )
        return response.choices[0].message.content
    except Exception as e:
        return f"Agent offline or failed to respond: {str(e)}"

@app.post("/api/analyze")
async def analyze_transaction(tx: Transaction):
    try:
        # Convert incoming JSON to a DataFrame
        tx_dict = tx.model_dump()
        input_df = pd.DataFrame([tx_dict])
        
        # 1. THE SPACE FIX: Convert JSON underscores back to CSV spaces
        # This translates "Day_of_Week" -> "Day of Week" so the ML model recognizes it
        input_df.columns = input_df.columns.str.replace('_', ' ')
        
        # 2. CRASH-PROOF ENCODING
        for col, le in encoders.items():
            if col in input_df.columns:
                # Grab the incoming value
                val = str(input_df[col].iloc[0])
                
                # If the user sends a brand new word the model hasn't seen, 
                # default it to the most common class to prevent a 400 crash
                if val not in le.classes_:
                    val = le.classes_[0] 
                    
                input_df[col] = le.transform([val])
                
        # 3. Scale and Predict
        scaled_data = scaler.transform(input_df)
        fraud_prob = float(model.predict_proba(scaled_data)[0][1])
        
        # Agent Routing
        agent_report = "Transaction cleared automatically."
        is_flagged = fraud_prob > 0.70
        
        if is_flagged:
            agent_report = call_investigator_agent(tx_dict, fraud_prob)
            
        return {
            "fraud_probability": round(fraud_prob * 100, 2),
            "is_flagged": is_flagged,
            "agent_analysis": agent_report
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))