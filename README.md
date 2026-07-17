# SecureFlow: Agentic AI Fraud Resolution System

SecureFlow is an enterprise-grade, autonomous fraud detection and resolution system. It bridges traditional Machine Learning (Random Forest) with an Agentic Large Language Model (LLM) layer to not only detect fraudulent transactions but also autonomously investigate anomalies and draft resolution protocols in real-time.

Built with an emphasis on Explainable AI (XAI), SecureFlow provides human operators with transparent risk vectors and AI-driven contextual analysis.

---

## 🚀 Key Features

- **Predictive ML Engine:** Uses a heavily optimized Random Forest classifier, trained on SMOTE-balanced financial data, to calculate mathematical fraud probabilities in milliseconds.
- **Explainable AI (XAI) Dashboard:** Deconstructs the "black box" of ML by visually mapping specific risk vectors (Geo-Spatial Mismatch, Temporal Anomaly, Value Velocity) for immediate human interpretability.
- **Agentic Resolution Layer:** Routes high-risk transactions (>70% probability) to a localized LLM (Ollama) acting as an autonomous financial investigator. The agent analyzes the context and outputs strict, actionable intelligence.
- **Live Telemetry Simulation:** Features a React-based command center with a live-feed simulation loop, auto-generating transactions to demonstrate system architecture without manual data entry.
- **Zero-Cloud Architecture:** Runs entirely locally, ensuring maximum data privacy for sensitive financial information.

---

## 🛠️ Technology Stack

**Machine Learning Pipeline**
- Python 3.11+
- Scikit-learn (Random Forest, Preprocessing)
- Imbalanced-learn (SMOTE)
- Pandas & NumPy

**Agentic Backend**
- FastAPI & Uvicorn (REST API)
- Ollama (Local LLM Execution)
- Qwen3:0.6b / Llama3.2:1b (Autonomous Agent Model)
- OpenAI Python SDK (Routing)

**Frontend Simulation Dashboard**
- React (Vite)
- Standard HTML5/CSS3 (Minimal Industrial UI)
- Fetch API

---

## ⚙️ System Architecture

1. **Ingestion:** The React frontend injects raw transaction telemetry via a JSON payload.
2. **Translation:** FastAPI intercepts the payload, mapping string variables (e.g., "Visa", "United Kingdom") to integers using pre-trained `LabelEncoders`.
3. **Prediction:** The standardized data is passed to the Random Forest model to calculate a hard mathematical probability.
4. **Agent Routing:** If `probability > 70%`, the system strips the PII, packages the context, and prompts the local LLM to generate an Anomaly Analysis, Action Plan, and Customer Message.
5. **Resolution:** The React dashboard renders the final math, the XAI threat vectors, and streams the Agent's response into the UI.

---

## 📦 Local Installation & Setup

### 1. Prerequisites
- [Python 3.11+](https://www.python.org/)
- [Node.js & npm](https://nodejs.org/)
- [Ollama](https://ollama.com/) installed on your host machine.

### 2. Configure the LLM (Ollama)
Ensure Ollama is running in your system tray. Open a terminal and pull the required model:
```bash
ollama run qwen3:0.6b
```
*(You can exit the prompt by typing `/bye` once the download completes).*

### 3. Train the Machine Learning Model
Navigate to the root directory containing your `CreditCardData.csv` and `train.py` script.
```bash
python train.py
```
*This will clean the data, apply SMOTE, train the Random Forest, and generate `fraud_rf_model.pkl`, `fraud_scaler.pkl`, and `fraud_label_encoders.pkl`.*

### 4. Start the Backend (FastAPI)
Move the three `.pkl` files into your `backend` folder. Navigate to the backend folder and install the dependencies:
```bash
cd backend
pip install fastapi uvicorn pydantic scikit-learn joblib pandas openai
```
Start the server:
```bash
uvicorn main:app --reload
```
*The backend will boot up on `http://localhost:8000`.*

### 5. Start the Frontend (React)
Open a new terminal, navigate to the `frontend` folder, and start the Vite development server:
```bash
cd frontend
npm install
npm run dev
```
*The application will launch on `http://localhost:5173`.*

---

## 📡 API Reference

### `POST /api/analyze`

**Request Payload:**
```json
{
  "Day_of_Week": "Sunday",
  "Time": 3,
  "Type_of_Card": "MasterCard",
  "Entry_Mode": "CVC",
  "Amount": 2450.00,
  "Type_of_Transaction": "Online",
  "Merchant_Group": "Electronics",
  "Country_of_Transaction": "Russia",
  "Shipping_Address": "Russia",
  "Country_of_Residence": "United Kingdom",
  "Gender": "M",
  "Age": 55.0,
  "Bank": "Halifax"
}
```

**Response Payload (Flagged Transaction):**
```json
{
  "fraud_probability": 98.45,
  "is_flagged": true,
  "agent_analysis": "ANOMALY ANALYSIS: The transaction originates in Russia while the customer resides in the United Kingdom, indicating a high-risk geographical mismatch at 03:00 AM.\nACTION TAKEN: HARD BLOCK\nCUSTOMER MESSAGE: SecureFlow Alert: We have blocked a suspicious £2450.00 transaction on your MasterCard. Please reply YES if this was you, or NO to secure your account."
}
```