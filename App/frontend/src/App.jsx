import { useState, useEffect, useRef } from "react";

const SIMULATION_TEMPLATES = [
  {
    Day_of_Week: "Monday",
    Time: 12,
    Type_of_Card: "Visa",
    Entry_Mode: "Tap",
    Amount: 12.5,
    Type_of_Transaction: "POS",
    Merchant_Group: "Restaurant",
    Country_of_Transaction: "United Kingdom",
    Shipping_Address: "United Kingdom",
    Country_of_Residence: "United Kingdom",
    Gender: "M",
    Age: 34.0,
    Bank: "Barclays",
  },
  {
    Day_of_Week: "Friday",
    Time: 19,
    Type_of_Card: "MasterCard",
    Entry_Mode: "PIN",
    Amount: 65.0,
    Type_of_Transaction: "POS",
    Merchant_Group: "Entertainment",
    Country_of_Transaction: "United Kingdom",
    Shipping_Address: "United Kingdom",
    Country_of_Residence: "United Kingdom",
    Gender: "F",
    Age: 28.5,
    Bank: "Monzo",
  },
  {
    Day_of_Week: "Sunday",
    Time: 3,
    Type_of_Card: "Visa",
    Entry_Mode: "CVC",
    Amount: 2450.0,
    Type_of_Transaction: "Online",
    Merchant_Group: "Electronics",
    Country_of_Transaction: "Russia",
    Shipping_Address: "Russia",
    Country_of_Residence: "United Kingdom",
    Gender: "M",
    Age: 55.0,
    Bank: "Halifax",
  },
  {
    Day_of_Week: "Wednesday",
    Time: 9,
    Type_of_Card: "MasterCard",
    Entry_Mode: "Tap",
    Amount: 4.2,
    Type_of_Transaction: "POS",
    Merchant_Group: "Food",
    Country_of_Transaction: "United Kingdom",
    Shipping_Address: "United Kingdom",
    Country_of_Residence: "United Kingdom",
    Gender: "M",
    Age: 41.0,
    Bank: "HSBC",
  },
];

// Only kept for values used in dynamic/computed inline styles
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
  const [feed, setFeed] = useState([]);
  const [activeItem, setActiveItem] = useState(null);
  const [isSimulating, setIsSimulating] = useState(false);
  const simulationRef = useRef(null);

  useEffect(() => {
    const link = document.createElement("link");
    link.href =
      "https://fonts.googleapis.com/css2?family=Syne:wght@400;500;600;700&family=IBM+Plex+Mono:wght@300;400;500&display=swap";
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
      
    `;
    document.head.appendChild(style);
    return () => {
      document.head.removeChild(link);
      document.head.removeChild(style);
    };
  }, []);

  const generateTransaction = () => {
    const t =
      SIMULATION_TEMPLATES[
        Math.floor(Math.random() * SIMULATION_TEMPLATES.length)
      ];
    return {
      ...t,
      Amount: parseFloat(
        (t.Amount * (1 + (Math.random() * 0.1 - 0.05))).toFixed(2),
      ),
    };
  };

  const processTransaction = async (txData) => {
    try {
      const response = await fetch("http://localhost:8000/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(txData),
      });
      const result = await response.json();
      const enriched = {
        id: Math.random().toString(36).substr(2, 9),
        timestamp: new Date().toLocaleTimeString("en-GB", { hour12: false }),
        input: txData,
        ...result,
      };
      setFeed((prev) => [enriched, ...prev].slice(0, 50));
      if (result.is_flagged) setActiveItem(enriched);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    if (isSimulating) {
      simulationRef.current = setInterval(
        () => processTransaction(generateTransaction()),
        5000,
      );
    } else {
      clearInterval(simulationRef.current);
    }
    return () => clearInterval(simulationRef.current);
  }, [isSimulating]);

  const calculateFeatureRisk = (tx) => {
    if (!tx) return [];
    return [
      {
        label: "GEO-SPATIAL MISMATCH",
        score: tx.Country_of_Transaction !== tx.Country_of_Residence ? 95 : 10,
      },
      {
        label: "TEMPORAL ANOMALY",
        score: tx.Time < 6 || tx.Time > 23 ? 88 : 15,
      },
      {
        label: "VALUE VELOCITY",
        score: tx.Amount > 1000 ? 92 : tx.Amount > 200 ? 45 : 12,
      },
    ];
  };

  // ── ATOMS ────────────────────────────────────────────────

  const Label = ({ children, className = "" }) => (
    <span
      className={`font-mono text-[0.65rem] tracking-[0.12em] text-[#4e4e62] uppercase ${className}`}
    >
      {children}
    </span>
  );

  const Chip = ({ flagged, value }) => (
    <span
      className="font-mono text-[0.72rem] font-medium py-[0.2rem] px-[0.55rem] rounded-[2px]"
      style={{
        background: flagged ? C.dangerBg : C.okBg,
        color: flagged ? C.danger : C.ok,
        border: `1px solid ${flagged ? C.danger + "44" : C.ok + "44"}`,
      }}
    >
      {value}
    </span>
  );

  const KV = ({ k, v, highlight }) => (
    <div className="flex justify-between items-center py-[0.55rem] border-b border-[#1e1e26]">
      <Label>{k}</Label>
      <span
        className="font-mono text-[0.78rem]"
        style={{ color: highlight ? C.danger : C.text }}
      >
        {v}
      </span>
    </div>
  );

  const RiskBar = ({ label, score }) => {
    const color = score > 75 ? C.danger : score > 40 ? C.warn : C.ok;
    return (
      <div className="mb-[1.1rem]">
        <div className="flex justify-between mb-[0.4rem]">
          <Label>{label}</Label>
          <span
            className="font-mono text-[0.72rem] font-medium"
            style={{ color }}
          >
            {score}%
          </span>
        </div>
        <div
          className="h-[2px] rounded-[1px] overflow-hidden"
          style={{ background: C.dim }}
        >
          <div
            className="h-full rounded-[1px] bar-fill"
            style={{ width: `${score}%`, background: color }}
          />
        </div>
      </div>
    );
  };

  const PanelHeader = ({ title, right }) => (
    <div className="flex justify-between items-center py-3 px-5 border-b border-[#1e1e26] bg-[#141418]">
      <Label>{title}</Label>
      {right}
    </div>
  );

  const flagged = activeItem?.is_flagged;
  const features = calculateFeatureRisk(activeItem?.input);

  return (
    <div className="font-syne bg-[#07070a] min-h-screen w-full text-[#dddde8] flex flex-col">
      {/* ── TOPBAR ── */}
      <header className="flex justify-between items-center h-14 px-5 border-b border-[#1e1e26] bg-[#0e0e12] shrink-0">
        <div className="flex items-center gap-6">
          <span className="font-syne font-bold text-base tracking-[-0.02em]">
            SecureFlow
          </span>
          <div className="w-px h-[14px] bg-[#1e1e26]" />
          <Label>Fraud Intelligence Platform</Label>
        </div>

        <div className="flex items-center gap-5">
          {isSimulating && (
            <div className="flex items-center gap-2">
              <div
                className="blink w-1.5 h-1.5 rounded-full"
                style={{ background: C.ok }}
              />
              <Label className="text-[#00d68f]!">LIVE</Label>
            </div>
          )}
          <button
            onClick={() => setIsSimulating((v) => !v)}
            className="font-mono text-[0.72rem] tracking-[0.1em] uppercase py-[0.45rem] px-[1.1rem] rounded-[3px] cursor-pointer font-medium transition-all duration-150"
            style={{
              background: isSimulating ? C.dangerBg : C.accentBg,
              color: isSimulating ? C.danger : C.accent,
              border: `1px solid ${isSimulating ? C.danger + "55" : C.accent + "55"}`,
            }}
          >
            {isSimulating ? "■  Stop Feed" : "▶  Start Feed"}
          </button>
        </div>
      </header>

      {/* ── BODY ── */}
      <div className="grid grid-cols-[1.05fr_0.95fr] gap-5 p-5 flex-1 overflow-hidden h-[calc(100vh-56px)]">
        {/* ── LEFT: TRANSACTION STREAM ── */}
        <div className="bg-[#0e0e12] border border-[#1e1e26] rounded flex flex-col overflow-hidden">
          <PanelHeader
            title="Transaction Stream"
            right={
              <span className="font-mono text-[0.7rem] text-[#4e4e62]">
                {feed.length} events
              </span>
            }
          />

          {/* Column headers */}
          <div className="grid grid-cols-[72px_1fr_80px_72px] gap-2 py-2 px-5 border-b border-[#1e1e26] bg-[#141418]">
            {["Time", "Merchant / Region", "Amount", "Score"].map((h) => (
              <Label key={h}>{h}</Label>
            ))}
          </div>

          <div className="overflow-y-auto flex-1">
            {feed.length === 0 && (
              <div className="p-12 text-center font-mono text-[0.78rem] text-[#4e4e62]">
                Awaiting telemetry…
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
                    background: isActive
                      ? C.accentBg
                      : isFlag
                        ? C.dangerBg
                        : "transparent",
                    borderLeft: `2px solid ${isFlag ? C.danger : isActive ? C.accent : "transparent"}`,
                  }}
                  onClick={() => setActiveItem(item)}
                >
                  <span className="font-mono text-[0.72rem] text-[#4e4e62]">
                    {item.timestamp}
                  </span>
                  <div>
                    <span className="font-mono text-[0.78rem] text-[#dddde8]">
                      {item.input.Merchant_Group}
                    </span>
                    <span className="font-mono text-[0.68rem] text-[#4e4e62] ml-2">
                      {item.input.Country_of_Transaction}
                    </span>
                  </div>
                  <span className="font-mono text-[0.78rem] font-medium text-[#dddde8]">
                    £{item.input.Amount.toFixed(2)}
                  </span>
                  <Chip
                    flagged={isFlag}
                    value={`${item.fraud_probability.toFixed(1)}%`}
                  />
                </div>
              );
            })}
          </div>
        </div>

        {/* ── RIGHT ── */}
        <div className="flex flex-col gap-5 overflow-hidden">
          {/* Context + Vectors */}
          <div className="grid grid-cols-2 gap-5">
            {/* Context Variables */}
            <div className="bg-[#0e0e12] border border-[#1e1e26] rounded overflow-hidden">
              <PanelHeader title="Context" />
              <div className="px-5">
                {activeItem ? (
                  <>
                    <KV k="Card Type" v={activeItem.input.Type_of_Card} />
                    <KV k="Entry Mode" v={activeItem.input.Entry_Mode} />
                    <KV k="Tx Type" v={activeItem.input.Type_of_Transaction} />
                    <KV
                      k="Residence"
                      v={activeItem.input.Country_of_Residence}
                    />
                    <KV
                      k="Terminal"
                      v={activeItem.input.Country_of_Transaction}
                      highlight={
                        activeItem.input.Country_of_Transaction !==
                        activeItem.input.Country_of_Residence
                      }
                    />
                    <KV k="Bank" v={activeItem.input.Bank} />
                  </>
                ) : (
                  <p className="font-mono text-[0.75rem] text-[#4e4e62] py-6">
                    No transaction selected.
                  </p>
                )}
              </div>
            </div>

            {/* XAI Threat Vectors */}
            <div className="bg-[#0e0e12] border border-[#1e1e26] rounded overflow-hidden">
              <PanelHeader title="XAI  ·  Threat Vectors" />
              <div className="p-5">
                {activeItem ? (
                  features.map((f, i) => (
                    <RiskBar key={i} label={f.label} score={f.score} />
                  ))
                ) : (
                  <p className="font-mono text-[0.75rem] text-[#4e4e62]">
                    No transaction selected.
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Agent Console */}
          <div className="bg-[#070709] border border-[#1e1e26] rounded flex flex-col flex-1 min-h-0">
            <PanelHeader
              title="Agent Resolution Console"
              right={
                flagged && (
                  <span
                    className="blink font-mono text-[0.68rem] tracking-[0.1em]"
                    style={{ color: C.danger }}
                  >
                    ⚑ INTERVENTION REQUIRED
                  </span>
                )
              }
            />
            <div className="flex-1 overflow-y-auto p-5 font-mono text-[0.8rem] leading-[1.8] text-[#dddde8] whitespace-pre-wrap">
              {!activeItem && (
                <span className="text-[#2a2a36]">
                  {"// System idle — select a transaction or start simulation"}
                </span>
              )}
              {activeItem && !flagged && (
                <span style={{ color: C.ok }}>
                  {
                    "[PASS]  Risk threshold nominal\n[PASS]  Transaction cleared — no agent intervention triggered."
                  }
                </span>
              )}
              {activeItem && flagged && (
                <>
                  <span style={{ color: C.danger }}>
                    {"[ALERT] Anomaly context detected\n"}
                  </span>
                  <span className="text-[#2a2a36]">
                    {"──────────────────────────────\n"}
                  </span>
                  <span className="text-[#dddde8]">
                    {activeItem.agent_analysis}
                  </span>
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
