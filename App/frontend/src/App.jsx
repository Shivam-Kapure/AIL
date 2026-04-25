import { useState, useEffect, useRef } from "react";

const SIMULATION_TEMPLATES = [
  { Day_of_Week: "Monday", Time: 12, Type_of_Card: "Visa", Entry_Mode: "Tap", Amount: 12.5, Type_of_Transaction: "POS", Merchant_Group: "Restaurant", Country_of_Transaction: "United Kingdom", Shipping_Address: "United Kingdom", Country_of_Residence: "United Kingdom", Gender: "M", Age: 34.0, Bank: "Barclays" },
  { Day_of_Week: "Friday", Time: 19, Type_of_Card: "MasterCard", Entry_Mode: "PIN", Amount: 65.0, Type_of_Transaction: "POS", Merchant_Group: "Entertainment", Country_of_Transaction: "United Kingdom", Shipping_Address: "United Kingdom", Country_of_Residence: "United Kingdom", Gender: "F", Age: 28.5, Bank: "Monzo" },
  { Day_of_Week: "Sunday", Time: 3, Type_of_Card: "Visa", Entry_Mode: "CVC", Amount: 2450.0, Type_of_Transaction: "Online", Merchant_Group: "Electronics", Country_of_Transaction: "Russia", Shipping_Address: "Russia", Country_of_Residence: "United Kingdom", Gender: "M", Age: 55.0, Bank: "Halifax" },
  { Day_of_Week: "Wednesday", Time: 9, Type_of_Card: "MasterCard", Entry_Mode: "Tap", Amount: 4.2, Type_of_Transaction: "POS", Merchant_Group: "Food", Country_of_Transaction: "United Kingdom", Shipping_Address: "United Kingdom", Country_of_Residence: "United Kingdom", Gender: "M", Age: 41.0, Bank: "HSBC" },
];

const C = {
  danger: "#ff3b3b",
  dangerBg: "rgba(255,59,59,0.08)",
  ok: "#00d68f",
  okBg: "rgba(0,214,143,0.08)",
  warn: "#f5a623",
  accent: "#6c7fff",
  accentBg: "rgba(108,127,255,0.08)",
  muted: "#4e4e62",
  text: "#dddde8",
  border: "#1e1e26",
  dim: "#2a2a36",
};

function App() {
  // ── STATE ────────────────────────────────────────────────
  const [appMode, setAppMode] = useState("STREAM"); // 'STREAM' | 'SANDBOX'
  
  // Feed & Selection
  const [feed, setFeed] = useState([]);
  const [activeItem, setActiveItem] = useState(null);
  
  // Stream Mode State
  const [isSimulating, setIsSimulating] = useState(false);
  const simulationRef = useRef(null);

  // Sandbox Mode State
  const [sandboxInputs, setSandboxInputs] = useState(null);
  const [sandboxResult, setSandboxResult] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  // ── STYLES ───────────────────────────────────────────────
  useEffect(() => {
    const link = document.createElement("link");
    link.href = "https://fonts.googleapis.com/css2?family=Syne:wght@400;500;600;700&family=IBM+Plex+Mono:wght@300;400;500&display=swap";
    link.rel = "stylesheet";
    document.head.appendChild(link);

    const style = document.createElement("style");
    style.textContent = `
      body, #root { margin: 0; padding: 0; width: 100%; }
      ::-webkit-scrollbar { width: 3px; }
      ::-webkit-scrollbar-track { background: #07070a; }
      ::-webkit-scrollbar-thumb { background: #1e1e26; border-radius: 2px; }
      .font-syne  { font-family: 'Syne', sans-serif; }
      .font-mono  { font-family: 'IBM Plex Mono', monospace; }
      @keyframes slideIn  { from { opacity: 0; transform: translateY(-6px); } to { opacity: 1; transform: translateY(0); } }
      @keyframes pulseRed { 0%, 100% { opacity: 1; } 50% { opacity: 0.3; } }
      @keyframes barFill  { from { width: 0%; } }
      .tx-row   { animation: slideIn  0.25s ease forwards; }
      .blink    { animation: pulseRed 1.2s ease infinite; }
      .bar-fill { animation: barFill  0.6s cubic-bezier(0.22,1,0.36,1) forwards; }
      
      /* Input overrides for Sandbox */
      input[type=range] { -webkit-appearance: none; width: 100%; background: transparent; }
      input[type=range]:focus { outline: none; }
      input[type=range]::-webkit-slider-thumb { -webkit-appearance: none; height: 12px; width: 12px; border-radius: 50%; background: ${C.accent}; cursor: pointer; margin-top: -4px; box-shadow: 0 0 8px ${C.accentBg}; }
      input[type=range]::-webkit-slider-runnable-track { width: 100%; height: 4px; cursor: pointer; background: ${C.border}; border-radius: 2px; }
      select { outline: none; -webkit-appearance: none; background-image: url("data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22292.4%22%20height%3D%22292.4%22%3E%3Cpath%20fill%3D%22%234e4e62%22%20d%3D%22M287%2069.4a17.6%2017.6%200%200%200-13-5.4H18.4c-5%200-9.3%201.8-12.9%205.4A17.6%2017.6%200%200%200%200%2082.2c0%205%201.8%209.3%205.4%2012.9l128%20127.9c3.6%203.6%207.8%205.4%2012.8%205.4s9.2-1.8%2012.8-5.4L287%2095c3.5-3.5%205.4-7.8%205.4-12.8%200-5-1.9-9.2-5.5-12.8z%22%2F%3E%3C%2Fsvg%3E"); background-repeat: no-repeat; background-position: right 0.7rem top 50%; background-size: 0.65rem auto; }
    `;
    document.head.appendChild(style);
    return () => {
      document.head.removeChild(link);
      document.head.removeChild(style);
    };
  }, []);

  // ── LOGIC ────────────────────────────────────────────────
  const generateTransaction = () => {
    const t = SIMULATION_TEMPLATES[Math.floor(Math.random() * SIMULATION_TEMPLATES.length)];
    return { ...t, Amount: parseFloat((t.Amount * (1 + (Math.random() * 0.1 - 0.05))).toFixed(2)) };
  };

  const processTransaction = async (txData) => {
    try {
      const response = await fetch("http://localhost:8000/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(txData),
      });
      const result = await response.json();
      return {
        id: Math.random().toString(36).substr(2, 9),
        timestamp: new Date().toLocaleTimeString("en-GB", { hour12: false }),
        input: txData,
        ...result,
      };
    } catch (e) {
      console.error(e);
      return null;
    }
  };

  // Stream Interval
  useEffect(() => {
    if (isSimulating && appMode === "STREAM") {
      simulationRef.current = setInterval(async () => {
        const enriched = await processTransaction(generateTransaction());
        if (enriched) {
          setFeed((prev) => [enriched, ...prev].slice(0, 50));
          if (enriched.is_flagged) setActiveItem(enriched);
        }
      }, 5000);
    } else {
      clearInterval(simulationRef.current);
    }
    return () => clearInterval(simulationRef.current);
  }, [isSimulating, appMode]);

  // Sync Sandbox inputs when active item changes
  useEffect(() => {
    if (appMode === "SANDBOX" && activeItem) {
      setSandboxInputs(activeItem.input);
      setSandboxResult(activeItem); // Base state is the selected transaction
    }
  }, [activeItem, appMode]);

  const handleSandboxChange = (e) => {
    const { name, value } = e.target;
    setSandboxInputs((prev) => ({
      ...prev,
      [name]: ["Time", "Amount"].includes(name) ? Number(value) : value,
    }));
  };

  const runSandboxAnalysis = async () => {
    setIsAnalyzing(true);
    const enriched = await processTransaction(sandboxInputs);
    if (enriched) setSandboxResult(enriched);
    setIsAnalyzing(false);
  };

  const toggleMode = (mode) => {
    setAppMode(mode);
    if (mode === "SANDBOX") setIsSimulating(false);
  };

  const calculateFeatureRisk = (tx) => {
    if (!tx) return [];
    return [
      { label: "GEO-SPATIAL MISMATCH", score: tx.Country_of_Transaction !== tx.Country_of_Residence ? 95 : 10 },
      { label: "TEMPORAL ANOMALY", score: tx.Time < 6 || tx.Time > 23 ? 88 : 15 },
      { label: "VALUE VELOCITY", score: tx.Amount > 1000 ? 92 : tx.Amount > 200 ? 45 : 12 },
    ];
  };

  // Determine what data to show in the right panels based on mode
  const displayItem = appMode === "SANDBOX" && sandboxResult ? sandboxResult : activeItem;
  const displayInputs = appMode === "SANDBOX" && sandboxInputs ? sandboxInputs : activeItem?.input;
  const flagged = displayItem?.is_flagged;
  const features = calculateFeatureRisk(displayInputs);

  // ── COMPONENTS ───────────────────────────────────────────
  const Label = ({ children, className = "" }) => (
    <span className={`font-mono text-[0.65rem] tracking-[0.12em] text-[#4e4e62] uppercase ${className}`}>{children}</span>
  );

  const Chip = ({ flagged, value }) => (
    <span className="font-mono text-[0.72rem] font-medium py-[0.2rem] px-[0.55rem] rounded-[2px]"
      style={{ background: flagged ? C.dangerBg : C.okBg, color: flagged ? C.danger : C.ok, border: `1px solid ${flagged ? C.danger + "44" : C.ok + "44"}` }}>
      {value}
    </span>
  );

  const KV = ({ k, v, highlight }) => (
    <div className="flex justify-between items-center py-[0.55rem] border-b border-[#1e1e26]">
      <Label>{k}</Label>
      <span className="font-mono text-[0.78rem]" style={{ color: highlight ? C.danger : C.text }}>{v}</span>
    </div>
  );

  const RiskBar = ({ label, score }) => {
    const color = score > 75 ? C.danger : score > 40 ? C.warn : C.ok;
    return (
      <div className="mb-[1.1rem]">
        <div className="flex justify-between mb-[0.4rem]">
          <Label>{label}</Label>
          <span className="font-mono text-[0.72rem] font-medium" style={{ color }}>{score}%</span>
        </div>
        <div className="h-[2px] rounded-[1px] overflow-hidden" style={{ background: C.dim }}>
          <div className="h-full rounded-[1px] bar-fill" style={{ width: `${score}%`, background: color }} />
        </div>
      </div>
    );
  };

  const PanelHeader = ({ title, right }) => (
    <div className="flex justify-between items-center py-3 px-5 border-b border-[#1e1e26] bg-[#141418] shrink-0">
      <Label>{title}</Label>
      {right}
    </div>
  );

  const selectClass = "w-full bg-[#07070a] border border-[#1e1e26] rounded-[3px] text-[#dddde8] font-mono text-[0.75rem] py-[0.4rem] px-3 mt-[0.3rem] outline-none focus:border-[#6c7fff] transition-colors cursor-pointer";

  return (
    <div className="font-syne bg-[#07070a] min-h-screen w-full text-[#dddde8] flex flex-col">
      {/* ── TOPBAR ── */}
      <header className="flex justify-between items-center h-14 px-5 border-b border-[#1e1e26] bg-[#0e0e12] shrink-0">
        <div className="flex items-center gap-6">
          <span className="font-syne font-bold text-base tracking-[-0.02em]">SecureFlow</span>
          <div className="w-px h-[14px] bg-[#1e1e26]" />
          <Label>Fraud Intelligence Platform</Label>
        </div>

        <div className="flex items-center gap-5">
          {/* Mode Switcher */}
          <div className="flex bg-[#07070a] border border-[#1e1e26] p-[3px] rounded-[4px]">
            <button 
              onClick={() => toggleMode("STREAM")}
              className="font-mono text-[0.65rem] tracking-[0.1em] px-3 py-1.5 rounded-[2px] transition-colors cursor-pointer uppercase font-medium"
              style={{ background: appMode === "STREAM" ? C.border : "transparent", color: appMode === "STREAM" ? C.text : C.muted }}
            >
              Live Feed
            </button>
            <button 
              onClick={() => toggleMode("SANDBOX")}
              className="font-mono text-[0.65rem] tracking-[0.1em] px-3 py-1.5 rounded-[2px] transition-colors cursor-pointer uppercase font-medium"
              style={{ background: appMode === "SANDBOX" ? C.border : "transparent", color: appMode === "SANDBOX" ? C.text : C.muted }}
            >
              XAI Sandbox
            </button>
          </div>

          {appMode === "STREAM" && (
            <>
              {isSimulating && (
                <div className="flex items-center gap-2">
                  <div className="blink w-1.5 h-1.5 rounded-full" style={{ background: C.ok }} />
                  <Label className="text-[#00d68f]!">LIVE</Label>
                </div>
              )}
              <button
                onClick={() => setIsSimulating((v) => !v)}
                className="font-mono text-[0.72rem] tracking-[0.1em] uppercase py-[0.45rem] px-[1.1rem] rounded-[3px] cursor-pointer font-medium transition-all duration-150"
                style={{ background: isSimulating ? C.dangerBg : C.accentBg, color: isSimulating ? C.danger : C.accent, border: `1px solid ${isSimulating ? C.danger + "55" : C.accent + "55"}` }}
              >
                {isSimulating ? "■  Stop Feed" : "▶  Start Feed"}
              </button>
            </>
          )}
        </div>
      </header>

      {/* ── BODY ── */}
      <div className="grid grid-cols-[1.05fr_0.95fr] gap-5 p-5 flex-1 overflow-hidden h-[calc(100vh-56px)]">
        
        {/* ── LEFT: TRANSACTION STREAM (Always Visible) ── */}
        <div className="bg-[#0e0e12] border border-[#1e1e26] rounded flex flex-col overflow-hidden">
          <PanelHeader 
            title={appMode === "STREAM" ? "Transaction Stream" : "Select Baseline Transaction"} 
            right={<span className="font-mono text-[0.7rem] text-[#4e4e62]">{feed.length} events</span>} 
          />

          <div className="grid grid-cols-[72px_1fr_80px_72px] gap-2 py-2 px-5 border-b border-[#1e1e26] bg-[#141418]">
            {["Time", "Merchant / Region", "Amount", "Score"].map((h) => <Label key={h}>{h}</Label>)}
          </div>

          <div className="overflow-y-auto flex-1">
            {feed.length === 0 && (
              <div className="p-12 text-center font-mono text-[0.78rem] text-[#4e4e62]">
                {appMode === "STREAM" ? "Awaiting telemetry…" : "Switch to Live Feed to collect data."}
              </div>
            )}
            {feed.map((item) => {
              const isActive = activeItem?.id === item.id;
              const isFlag = item.is_flagged;
              return (
                <div
                  key={item.id}
                  className="tx-row grid grid-cols-[72px_1fr_80px_72px] gap-2 py-[0.65rem] px-5 border-b border-[#1e1e26] cursor-pointer items-center transition-colors duration-150"
                  style={{
                    background: isActive ? C.accentBg : isFlag ? C.dangerBg : "transparent",
                    borderLeft: `2px solid ${isFlag ? C.danger : isActive ? C.accent : "transparent"}`,
                  }}
                  onClick={() => setActiveItem(item)}
                >
                  <span className="font-mono text-[0.72rem] text-[#4e4e62]">{item.timestamp}</span>
                  <div>
                    <span className="font-mono text-[0.78rem] text-[#dddde8] block">{item.input.Merchant_Group}</span>
                    <span className="font-mono text-[0.68rem] text-[#4e4e62]">{item.input.Country_of_Transaction}</span>
                  </div>
                  <span className="font-mono text-[0.78rem] font-medium text-[#dddde8]">£{item.input.Amount.toFixed(2)}</span>
                  <Chip flagged={isFlag} value={`${item.fraud_probability.toFixed(1)}%`} />
                </div>
              );
            })}
          </div>
        </div>

        {/* ── RIGHT: CONTEXT & INTELLIGENCE ── */}
        <div className="flex flex-col gap-5 overflow-hidden">
          
          <div className="grid grid-cols-2 gap-5">
            {/* Top Left: Context OR Sandbox Inputs */}
            <div className="bg-[#0e0e12] border border-[#1e1e26] rounded overflow-hidden flex flex-col">
              <PanelHeader title={appMode === "STREAM" ? "Context" : "Counterfactual Sandbox"} />
              <div className="px-5 py-2 flex-1 overflow-y-auto">
                {appMode === "STREAM" ? (
                  activeItem ? (
                    <div className="py-2">
                      <KV k="Card Type" v={activeItem.input.Type_of_Card} />
                      <KV k="Entry Mode" v={activeItem.input.Entry_Mode} />
                      <KV k="Tx Type" v={activeItem.input.Type_of_Transaction} />
                      <KV k="Residence" v={activeItem.input.Country_of_Residence} />
                      <KV k="Terminal" v={activeItem.input.Country_of_Transaction} highlight={activeItem.input.Country_of_Transaction !== activeItem.input.Country_of_Residence} />
                      <KV k="Bank" v={activeItem.input.Bank} />
                    </div>
                  ) : (
                    <p className="font-mono text-[0.75rem] text-[#4e4e62] py-4">No transaction selected.</p>
                  )
                ) : (
                  sandboxInputs ? (
                    <div className="py-2 flex flex-col gap-4">
                      {/* Interactive Sliders */}
                      <div>
                        <div className="flex justify-between mb-2">
                          <Label>Amount</Label>
                          <span className="font-mono text-[0.75rem] text-[#dddde8]">£{sandboxInputs.Amount}</span>
                        </div>
                        <input type="range" name="Amount" min="5" max="5000" step="5" value={sandboxInputs.Amount} onChange={handleSandboxChange} />
                      </div>
                      <div>
                        <div className="flex justify-between mb-2">
                          <Label>Time of Day</Label>
                          <span className="font-mono text-[0.75rem] text-[#dddde8]">{sandboxInputs.Time}:00</span>
                        </div>
                        <input type="range" name="Time" min="0" max="23" step="1" value={sandboxInputs.Time} onChange={handleSandboxChange} />
                      </div>
                      {/* Select Dropdowns */}
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <Label>Entry Mode</Label>
                          <select name="Entry_Mode" value={sandboxInputs.Entry_Mode} onChange={handleSandboxChange} className={selectClass}>
                            <option value="Tap">Tap</option>
                            <option value="PIN">Chip & PIN</option>
                            <option value="CVC">CVC (Online)</option>
                          </select>
                        </div>
                        <div>
                          <Label>Terminal</Label>
                          <select name="Country_of_Transaction" value={sandboxInputs.Country_of_Transaction} onChange={handleSandboxChange} className={selectClass}>
                            <option value="United Kingdom">UK</option>
                            <option value="Russia">Russia</option>
                            <option value="China">China</option>
                          </select>
                        </div>
                      </div>
                      <button 
                        onClick={runSandboxAnalysis} 
                        disabled={isAnalyzing}
                        className="mt-2 font-mono text-[0.7rem] tracking-[0.1em] uppercase py-2 rounded-[3px] font-bold transition-all cursor-pointer"
                        style={{ background: isAnalyzing ? C.dim : C.accent, color: isAnalyzing ? C.muted : "#fff", border: "none" }}
                      >
                        {isAnalyzing ? "Executing..." : "Analyze Scenario"}
                      </button>
                    </div>
                  ) : (
                    <p className="font-mono text-[0.75rem] text-[#4e4e62] py-4">Select a transaction from the feed to edit.</p>
                  )
                )}
              </div>
            </div>

            {/* Top Right: XAI Threat Vectors */}
            <div className="bg-[#0e0e12] border border-[#1e1e26] rounded overflow-hidden flex flex-col">
              <PanelHeader title="XAI  ·  Threat Vectors" right={displayItem && <span className="font-mono text-[0.8rem] font-bold" style={{ color: flagged ? C.danger : C.ok }}>{displayItem.fraud_probability.toFixed(1)}% RISK</span>} />
              <div className="p-5 flex-1">
                {displayItem ? (
                  features.map((f, i) => <RiskBar key={i} label={f.label} score={f.score} />)
                ) : (
                  <p className="font-mono text-[0.75rem] text-[#4e4e62]">No transaction selected.</p>
                )}
              </div>
            </div>
          </div>

          {/* Bottom: Agent Console */}
          <div className="bg-[#070709] border border-[#1e1e26] rounded flex flex-col flex-1 min-h-0">
            <PanelHeader 
              title="Agent Resolution Console" 
              right={flagged && <span className="blink font-mono text-[0.68rem] tracking-[0.1em]" style={{ color: C.danger }}>⚑ INTERVENTION REQUIRED</span>} 
            />
            <div className="flex-1 overflow-y-auto p-5 font-mono text-[0.8rem] leading-[1.8] text-[#dddde8] whitespace-pre-wrap">
              {!displayItem && <span className="text-[#2a2a36]">{"// System idle — select a transaction"}</span>}
              {displayItem && !flagged && <span style={{ color: C.ok }}>{"[PASS]  Risk threshold nominal\n[PASS]  Transaction cleared — no agent intervention triggered."}</span>}
              {displayItem && flagged && (
                <>
                  <span style={{ color: C.danger }}>{"[ALERT] Anomaly context detected\n"}</span>
                  <span className="text-[#2a2a36]">{"──────────────────────────────\n"}</span>
                  <span className="text-[#dddde8]">{displayItem.agent_analysis}</span>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;