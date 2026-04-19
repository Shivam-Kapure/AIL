import { useState, useEffect, useRef } from 'react'

// Realistic templates to feed the simulation
const SIMULATION_TEMPLATES = [
  { Day_of_Week: "Monday", Time: 12, Type_of_Card: "Visa", Entry_Mode: "Tap", Amount: 12.50, Type_of_Transaction: "POS", Merchant_Group: "Restaurant", Country_of_Transaction: "United Kingdom", Shipping_Address: "United Kingdom", Country_of_Residence: "United Kingdom", Gender: "M", Age: 34.0, Bank: "Barclays" },
  { Day_of_Week: "Friday", Time: 19, Type_of_Card: "MasterCard", Entry_Mode: "PIN", Amount: 65.00, Type_of_Transaction: "POS", Merchant_Group: "Entertainment", Country_of_Transaction: "United Kingdom", Shipping_Address: "United Kingdom", Country_of_Residence: "United Kingdom", Gender: "F", Age: 28.5, Bank: "Monzo" },
  { Day_of_Week: "Sunday", Time: 3, Type_of_Card: "Visa", Entry_Mode: "CVC", Amount: 2450.00, Type_of_Transaction: "Online", Merchant_Group: "Electronics", Country_of_Transaction: "China", Shipping_Address: "China", Country_of_Residence: "United Kingdom", Gender: "M", Age: 55.0, Bank: "Halifax" }, // High Risk
  { Day_of_Week: "Wednesday", Time: 9, Type_of_Card: "MasterCard", Entry_Mode: "Tap", Amount: 4.20, Type_of_Transaction: "POS", Merchant_Group: "Food", Country_of_Transaction: "United Kingdom", Shipping_Address: "United Kingdom", Country_of_Residence: "United Kingdom", Gender: "M", Age: 41.0, Bank: "HSBC" }
]

function App() {
  const [feed, setFeed] = useState([])
  const [activeItem, setActiveItem] = useState(null)
  const [isSimulating, setIsSimulating] = useState(false)
  const simulationRef = useRef(null)

  // Generate a random transaction with slight jitter
  const generateTransaction = () => {
    const template = SIMULATION_TEMPLATES[Math.floor(Math.random() * SIMULATION_TEMPLATES.length)]
    // Add slight randomization to amount so it doesn't look static
    const jitterAmount = template.Amount * (1 + (Math.random() * 0.1 - 0.05))
    return { ...template, Amount: parseFloat(jitterAmount.toFixed(2)) }
  }

  const processTransaction = async (txData) => {
    try {
      const response = await fetch('http://localhost:8000/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(txData)
      })
      const result = await response.json()
      
      const enrichedData = {
        id: Math.random().toString(36).substr(2, 9),
        timestamp: new Date().toLocaleTimeString(),
        input: txData,
        ...result
      }

      setFeed(prev => [enrichedData, ...prev].slice(0, 50)) // Keep last 50
      if (result.is_flagged) setActiveItem(enrichedData) // Auto-focus high risk
      
    } catch (error) {
      console.error("API Error:", error)
    }
  }

  // The Simulation Loop
  useEffect(() => {
    if (isSimulating) {
      // Run every 5 seconds to give the LLM time to respond if flagged
      simulationRef.current = setInterval(() => {
        processTransaction(generateTransaction())
      }, 5000)
    } else {
      clearInterval(simulationRef.current)
    }
    return () => clearInterval(simulationRef.current)
  }, [isSimulating])

  // Minimal Industrial Styling Variables
  const theme = {
    bg: '#f4f4f5', // zinc-100
    panel: '#ffffff',
    border: '#e4e4e7', // zinc-200
    textMain: '#27272a', // zinc-800
    textMuted: '#a1a1aa', // zinc-400
    accent: '#3b82f6', // blue-500
    danger: '#ef4444', // red-500
    success: '#10b981', // emerald-500
    fontUI: 'system-ui, -apple-system, sans-serif',
    fontData: '"JetBrains Mono", "Roboto Mono", monospace'
  }

  return (
    <div style={{ fontFamily: theme.fontUI, backgroundColor: theme.bg, minHeight: '100vh', padding: '2rem', color: theme.textMain }}>
      
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', borderBottom: `1px solid ${theme.border}`, paddingBottom: '1rem' }}>
        <div>
          <h1 style={{ margin: 0, fontSize: '1.5rem', fontWeight: '600', letterSpacing: '-0.5px' }}>SecureFlow // Analytics Core</h1>
          <p style={{ margin: '0.2rem 0 0 0', color: theme.textMuted, fontSize: '0.85rem' }}>Autonomous Fraud Detection & Resolution</p>
        </div>
        
        <button 
          onClick={() => setIsSimulating(!isSimulating)}
          style={{
            padding: '0.5rem 1.5rem',
            backgroundColor: isSimulating ? theme.panel : theme.textMain,
            color: isSimulating ? theme.danger : '#fff',
            border: `1px solid ${isSimulating ? theme.danger : theme.textMain}`,
            borderRadius: '4px',
            cursor: 'pointer',
            fontWeight: '500',
            fontFamily: theme.fontUI,
            transition: 'all 0.2s'
          }}
        >
          {isSimulating ? '■ STOP SIMULATION' : '▶ START LIVE FEED'}
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem', height: 'calc(100vh - 150px)' }}>
        
        {/* LEFT PANEL: LIVE DATA FEED */}
        <div style={{ backgroundColor: theme.panel, border: `1px solid ${theme.border}`, borderRadius: '6px', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          <div style={{ padding: '1rem', borderBottom: `1px solid ${theme.border}`, backgroundColor: '#fafafa', fontSize: '0.8rem', fontWeight: '600', color: theme.textMuted, textTransform: 'uppercase' }}>
            Live Transaction Stream
          </div>
          
          <div style={{ overflowY: 'auto', flexGrow: 1, padding: '0.5rem' }}>
            {feed.length === 0 && <div style={{ padding: '2rem', textAlign: 'center', color: theme.textMuted, fontFamily: theme.fontData }}>Waiting for telemetry...</div>}
            
            {feed.map((item) => (
              <div 
                key={item.id} 
                onClick={() => setActiveItem(item)}
                style={{ 
                  display: 'grid', 
                  gridTemplateColumns: 'auto 1fr auto auto', 
                  gap: '1rem',
                  padding: '0.75rem 1rem', 
                  borderBottom: `1px solid ${theme.border}`,
                  cursor: 'pointer',
                  backgroundColor: activeItem?.id === item.id ? '#f0f9ff' : 'transparent',
                  fontFamily: theme.fontData,
                  fontSize: '0.85rem',
                  alignItems: 'center'
                }}
              >
                <span style={{ color: theme.textMuted }}>{item.timestamp}</span>
                <span>{item.input.Merchant_Group} ({item.input.Country_of_Transaction})</span>
                <span style={{ fontWeight: '600' }}>£{item.input.Amount.toFixed(2)}</span>
                <span style={{ 
                  color: item.is_flagged ? theme.danger : theme.success,
                  backgroundColor: item.is_flagged ? '#fee2e2' : '#d1fae5',
                  padding: '0.2rem 0.5rem',
                  borderRadius: '3px',
                  fontWeight: 'bold'
                }}>
                  {item.fraud_probability.toFixed(1)}%
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* RIGHT PANEL: AGENT INTELLIGENCE */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          
          {/* Metadata Card */}
          <div style={{ backgroundColor: theme.panel, border: `1px solid ${theme.border}`, borderRadius: '6px', padding: '1.5rem' }}>
            <h3 style={{ margin: '0 0 1rem 0', fontSize: '0.8rem', textTransform: 'uppercase', color: theme.textMuted }}>Context Variables</h3>
            {activeItem ? (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', fontFamily: theme.fontData, fontSize: '0.85rem' }}>
                <div><span style={{ color: theme.textMuted }}>Card:</span> {activeItem.input.Type_of_Card}</div>
                <div><span style={{ color: theme.textMuted }}>Entry:</span> {activeItem.input.Entry_Mode}</div>
                <div><span style={{ color: theme.textMuted }}>Location:</span> {activeItem.input.Country_of_Transaction}</div>
                <div><span style={{ color: theme.textMuted }}>Origin:</span> {activeItem.input.Country_of_Residence}</div>
              </div>
            ) : (
              <div style={{ color: theme.textMuted, fontSize: '0.85rem' }}>Select a transaction from the feed to view parameters.</div>
            )}
          </div>

          {/* AI Resolution Console */}
          <div style={{ backgroundColor: '#18181b', border: `1px solid ${theme.border}`, borderRadius: '6px', padding: '1.5rem', color: '#e4e4e7', flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem', borderBottom: '1px solid #3f3f46', paddingBottom: '0.5rem' }}>
              <h3 style={{ margin: 0, fontSize: '0.8rem', textTransform: 'uppercase', color: '#a1a1aa' }}>Agent Resolution Logic</h3>
              {activeItem?.is_flagged && <span style={{ color: theme.danger, fontSize: '0.8rem', fontWeight: 'bold' }}>⚠️ INTERVENTION REQUIRED</span>}
            </div>
            
            <div style={{ fontFamily: theme.fontData, fontSize: '0.9rem', lineHeight: '1.6', whiteSpace: 'pre-wrap', overflowY: 'auto' }}>
              {!activeItem && <span style={{ color: '#52525b' }}>System idle...</span>}
              
              {activeItem && !activeItem.is_flagged && (
                <span style={{ color: theme.success }}>{"[SYS_LOG]: Transaction cleared. Risk threshold nominal. No agent intervention triggered."}</span>
              )}

              {activeItem && activeItem.is_flagged && (
                <span>{`[AGENT_ACTIVE]: Parsing anomaly context...\n\n${activeItem.agent_analysis}`}</span>
              )}
            </div>
          </div>

        </div>
      </div>
    </div>
  )
}

export default App