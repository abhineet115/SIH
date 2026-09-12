import React, { useEffect, useState } from "react";
import { Satellite, ShieldCheck, TerminalSquare } from "lucide-react";

export function SplashSequence({ onComplete }: { onComplete: () => void }) {
  const [logs, setLogs] = useState<string[]>([]);
  
  const bootSequence = [
    "INITIALIZING SATQUERY AI KERNEL v2.4.9...",
    "ESTABLISHING SECURE UPLINK TO RISAT CONSTELLATION...",
    "CALIBRATING OPTICAL SENSORS (EPSG:32643)...",
    "VERIFYING MULTI-MODAL NEURAL WEIGHTS...",
    "AGENTIC CONTROLLER ONLINE."
  ];

  useEffect(() => {
    let currentLog = 0;
    const interval = setInterval(() => {
      if (currentLog < bootSequence.length) {
        setLogs(prev => [...prev, bootSequence[currentLog]]);
        currentLog++;
      } else {
        clearInterval(interval);
        setTimeout(onComplete, 900);
      }
    }, 450);
    return () => clearInterval(interval);
  }, [onComplete]);

  return (
    <div className="splash-container">
      <div className="splash-content animate-fade-in-up">
         <div style={{ position: "relative", display: "inline-block" }}>
             <Satellite size={64} className="splash-icon pulse-glow" />
             <div className="radar-sweep"></div>
         </div>
         <h1 className="splash-title">SatQuery <span style={{ color: "var(--primary)" }}>AI</span></h1>
         <p className="splash-subtitle">ISRO Space Applications Hub</p>
         
         <div className="splash-terminal">
            {logs.map((log, idx) => (
                <div key={idx} className="splash-log type-writer"> 
                   <span style={{ color: "var(--primary)", marginRight: "8px" }}>{">"}</span> 
                   {log} 
                   {idx === bootSequence.length - 1 && <ShieldCheck size={14} style={{ display: "inline", marginLeft: '6px', color: 'var(--success)' }}/>}
                </div>
            ))}
            <span className="cursor-blink">_</span>
         </div>
         <div className="loading-bar-container">
            <div className="loading-bar-fill" style={{ width: `${(logs.length / bootSequence.length) * 100}%` }}></div>
         </div>
      </div>
    </div>
  );
}
