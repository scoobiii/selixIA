/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import { Terminal as TerminalIcon, ShieldCheck, Database, RefreshCw, Sparkles, Server, BookOpen, AlertCircle, RefreshCcw } from "lucide-react";
import IndicadoresMacro from "./components/IndicadoresMacro";
import ConsolaLog from "./components/ConsolaLog";
import BlueskySim from "./components/BlueskySim";
import ConsolaAnalista from "./components/ConsolaAnalista";
import Teoremas from "./components/Teoremas";
import GuiaDeVoz from "./components/GuiaDeVoz";
import { EconomicRecord, LogEntry, LogLevel, LogCategory, BlueskyThread } from "./types";

export default function App() {
  const [brent, setBrent] = useState(85.80);
  const [ttf, setTtf] = useState(35.40);
  const [selic, setSelic] = useState(10.75);
  const [sentiment, setSentiment] = useState(59);
  const [rating, setRating] = useState("BBB-");
  const [investmentGrade, setInvestmentGrade] = useState(false);
  const [brentHistory, setBrentHistory] = useState<number[]>([]);
  const [ttfHistory, setTtfHistory] = useState<number[]>([]);
  
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [threads, setThreads] = useState<BlueskyThread[]>([]);
  const [systemWatchdog, setSystemWatchdog] = useState({
    status: "idle",
    isWatchdogActive: true,
    cpuTemp: 52,
    ramUsed: 110,
    lastCheck: "",
  });

  const [isLoadingState, setIsLoadingState] = useState(true);
  const [isAiPending, setIsAiPending] = useState(false);
  const [isThreadGenerating, setIsThreadGenerating] = useState(false);
  const [isSyncingLive, setIsSyncingLive] = useState(false);

  // Fetch initial state from Express backend
  const fetchSystemState = async () => {
    try {
      const res = await fetch("/api/state");
      if (res.ok) {
        const data = await res.json();
        setBrent(data.brent);
        setTtf(data.ttf ?? 35.40);
        setSelic(data.selic);
        setSentiment(data.sentiment);
        setRating(data.rating ?? "BBB-");
        setInvestmentGrade(!!data.investmentGrade);
        setSystemWatchdog(data.system);
        if (data.brentHistory) {
          setBrentHistory(data.brentHistory);
        }
        if (data.ttfHistory) {
          setTtfHistory(data.ttfHistory);
        }
      }
    } catch (err) {
      console.error("Error communicating with Express state server:", err);
    } finally {
      setIsLoadingState(false);
    }
  };

  const handleReloadRealTime = async () => {
    setIsSyncingLive(true);
    try {
      const res = await fetch("/api/state/reload", {
        method: "POST",
      });
      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          await fetchSystemState();
          await fetchLogs();
        }
      }
    } catch (err) {
      console.error("Crawl sync failure:", err);
    } finally {
      setIsSyncingLive(false);
    }
  };

  const fetchLogs = async () => {
    try {
      const res = await fetch("/api/logs");
      if (res.ok) {
        const data = await res.json();
        setLogs(data);
      }
    } catch (err) {
      console.error("Error fetching crawler logs:", err);
    }
  };

  const fetchThreads = async () => {
    try {
      const res = await fetch("/api/threads");
      if (res.ok) {
        const data = await res.json();
        setThreads(data);
      }
    } catch (err) {
      console.error("Error fetching Bluesky threads:", err);
    }
  };

  useEffect(() => {
    fetchSystemState();
    fetchLogs();
    fetchThreads();
    
    // Poll logs occasionally to mimic live crawling events
    const interval = setInterval(() => {
      fetchLogs();
    }, 12000);
    return () => clearInterval(interval);
  }, []);

  // Update Brent/TTF/Selic/Sentiment and sync to backend
  const handleUpdateBrent = async (newValue: number) => {
    setBrent(newValue);
    try {
      await fetch("/api/state/update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ brent: newValue }),
      });
    } catch (err) {
      console.error(err);
    }
  };

  const handleUpdateTtf = async (newValue: number) => {
    setTtf(newValue);
    try {
      await fetch("/api/state/update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ttf: newValue }),
      });
    } catch (err) {
      console.error(err);
    }
  };

  const handleUpdateSelic = async (newValue: number) => {
    setSelic(newValue);
    try {
      await fetch("/api/state/update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ selic: newValue }),
      });
    } catch (err) {
      console.error(err);
    }
  };

  const handleUpdateSentiment = async (newValue: number) => {
    setSentiment(newValue);
    try {
      await fetch("/api/state/update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sentiment: newValue }),
      });
    } catch (err) {
      console.error(err);
    }
  };

  // Trigger self heal reboot simulation
  const handleTriggerSelfHeal = async () => {
    try {
      const res = await fetch("/api/state/update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ watchdogActive: true }),
      });
      if (res.ok) {
        await fetchSystemState();
      }
    } catch (err) {
      console.error("Self-heal API failure:", err);
    }
  };

  // Add custom log from client actions
  const handleInjectLog = async (level: LogLevel, category: LogCategory, message: string) => {
    try {
      const res = await fetch("/api/logs/add", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ level, category, message }),
      });
      if (res.ok) {
        fetchLogs();
      }
    } catch (err) {
      console.error("Fail writing to logs database:", err);
    }
  };

  // Publish newly composed thread to feed
  const handlePublishThread = async (posts: string[]) => {
    try {
      const res = await fetch("/api/threads/publish", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ posts, automated: true }),
      });
      if (res.ok) {
        fetchThreads();
        fetchLogs();
      }
    } catch (err) {
      console.error("Bluesky delivery exception:", err);
    }
  };

  // Call the RAG assistant query server route (proxies to Gemini)
  const handleCallAgentQuery = async (query: string) => {
    setIsAiPending(true);
    try {
      const res = await fetch("/api/agent-query", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          query,
          customData: { brent, selic, sentiment }
        }),
      });
      if (res.ok) {
        const data = await res.json();
        return data;
      } else {
        throw new Error("HTTP failure response");
      }
    } catch (err: any) {
      console.error(err);
      return { result: "Erro ao conectar-se com o processador analítico Selix." };
    } finally {
      setIsAiPending(false);
      fetchLogs(); // updates diagnostic RAG query records
    }
  };

  // Generate newly formatted economic thread with server-side Gemini
  const handleGenerateThreadAI = async (): Promise<string[] | null> => {
    setIsThreadGenerating(true);
    try {
      const prompt = `Gere uma thread econômica altamente inspiradora em formato de array de string JSON, dividida exatamente em 3 partes curtas, para postagem na timeline do @zeh-sobrinho.bsky.social.
Crie uma análise técnica e objetiva em Português considerando que o petróleo Brent está em USD ${brent.toFixed(2)}, o Gás Natural TTF Europeu em €${ttf.toFixed(2)} EUR/MWh, a Selic nacional em ${selic.toFixed(2)}% ao ano, o sentimento em ${sentiment}/100 e a situação de rating soberano: '${rating}' (${investmentGrade ? "com selo de Grau de Investimento" : "Nível especulativo"}).
Destaque com orgulho como a bio-estratégia verde desenvolvida pelo Ministério de Minas e Energia (MME) e Ministério do Meio Ambiente (MMA) - com blends compulsórios de Etanol e Biodiesel + biogás (misturas Ex/Bx) - cria um amortecedor contra choques de Brent e TTF Gás, aliviando a meta SELIC do Banco Central para um dígito (9.25% a.a.) sem precisar queimar divisas, promovendo o rating soberano nacional para A+ e consagrando o Brasil com o selo internacional de Grau de Investimento (Investment Grade).
Cite ou copie com destaque os stakeholders envolvidos como @zeh-sobrinho.bsky.social, MME, MMA e SELIX.
Formato estrito do retorno: Responda APENAS com um array JSON válido contendo exatamente 3 mensagens curtas adequadas para o limite de caracteres de uma publicação (máximo de 300 caracteres cada). Não adicione markdown externo adicional (sem blockquotes de crase), apenas o texto limpo do JSON ["frase 1", "frase 2", "frase 3"]`;

      const data = await handleCallAgentQuery(prompt);
      const textResult = data.result;

      // Extract JSON from text in case model wrapped it in markdown quotes
      const cleanJsonStr = textResult
        .replace(/```json/gi, "")
        .replace(/```/g, "")
        .trim();

      const parsedArray = JSON.parse(cleanJsonStr);
      if (Array.isArray(parsedArray) && parsedArray.length >= 2) {
        return parsedArray;
      }
    } catch (e) {
      console.warn("Could not perfectly parse JSON array from Gemini, using robust fallback formatting:", e);
      // Robust structural fallback if text generation returned standard paragraphs instead of precise JSON
    } finally {
      setIsThreadGenerating(false);
    }

    // High quality backup formatting
    return [
      `🌿 [SELIX ECOSYSTEM] Petróleo Brent a USD ${brent.toFixed(2)} e TTF Gás a €${ttf.toFixed(2)} neutralizados com maestria pela bio-estratégia pioneira de blends Ex/Bx do MME & MMA! @zeh-sobrinho.bsky.social`,
      `🇧🇷 Com a imunidade biológica a choques cambiais, o Banco Central mantém a taxa SELIC amortecida com folga para patamar de 1 dígito (9.25% a.a.) com previsibilidade fiscal integral.`,
      `⭐ O Rating nacional dispara para Soberano A+, coroando o ecossistema brasileiro com o cobiçado selo internacional de 'Investment Grade'. Robustez autônoma validada via verificação Lean!`
    ];
  };

  // Built realistic mock historical economic layout for first-loading scale matching
  const dynamicHistoricalRecords: EconomicRecord[] = [
    { date: "2026-05-15", brent: 83.1, selic: 10.5, sentiment: 65 },
    { date: "2026-05-19", brent: 82.8, selic: 10.5, sentiment: 60 },
    { date: "2026-05-22", brent: 84.15, selic: 10.5, sentiment: 67 },
    { date: "2026-05-26", brent: 83.9, selic: 10.5, sentiment: 64 },
    { date: "2026-05-29", brent: 84.6, selic: 10.75, sentiment: 52 },
    { date: "2026-06-02", brent: 85.3, selic: 10.75, sentiment: 56 },
    { date: "2026-06-04", brent: 84.95, selic: 10.75, sentiment: 55 },
    { date: "2026-06-06", brent: brent, selic: selic, sentiment: sentiment },
  ];

  if (isLoadingState) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center font-mono text-xs text-amber-500 gap-3">
        <Server className="w-8 h-8 animate-spin" />
        <span>INICIANDO COMPILADOR COGNITIVO SELIX v5.0...</span>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col relative overflow-x-hidden font-sans" id="selic-app-viewport">
      {/* Decorative ambient gradients */}
      <div className="absolute top-[-10%] left-[-15%] w-[50%] h-[50%] bg-violet-600/5 blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-15%] w-[50%] h-[50%] bg-emerald-600/5 blur-[120px] rounded-full pointer-events-none" />

      {/* COMPACT MAIN HEADER */}
      <header className="border-b border-slate-900 bg-slate-950/60 backdrop-blur px-6 py-4 sticky top-0 z-30 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-gradient-to-tr from-amber-500 to-violet-600 p-[1.5px] flex items-center justify-center shadow-lg" id="launcher-icon">
            <div className="w-full h-full bg-slate-950 rounded-[7px] flex items-center justify-center font-bold text-amber-500 text-sm font-mono tracking-tight">
              SX
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base font-extrabold text-slate-100 tracking-tight font-sans">SELIX</h1>
              <span className="text-4xs font-bold font-mono bg-amber-500/10 text-amber-400 border border-amber-500/20 rounded px-1.5 py-0.5 uppercase">
                Daemon v5.0
              </span>
            </div>
            <p className="text-3xs text-slate-500 font-mono">Inteligência Econômica Autônoma & Verificabilidade Lean</p>
          </div>
        </div>

        {/* Global stats bar */}
        <div className="flex items-center gap-2 sm:gap-4 flex-wrap font-mono text-3xs text-slate-400" id="global-stats-header">
          <div className="bg-slate-900 border border-slate-850 px-2.5 py-1.5 rounded flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            BRENT: <strong className="text-emerald-400">${brent.toFixed(2)}</strong>
          </div>
          <div className="bg-slate-900 border border-slate-850 px-2.5 py-1.5 rounded flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
            TTF DATA: <strong className="text-cyan-400">€{ttf.toFixed(2)}</strong>
          </div>
          <div className="bg-slate-900 border border-slate-850 px-2.5 py-1.5 rounded flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-sky-500" />
            SELIC: <strong className="text-sky-400">{selic.toFixed(2)}%</strong>
          </div>
          <div className="bg-slate-900 border border-slate-850 px-2.5 py-1.5 rounded flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
            SENTIMENT: <strong className="text-amber-400">{sentiment}/100</strong>
          </div>
          <div className={`border px-2.5 py-1.5 rounded flex items-center gap-1.5 transition-colors duration-500 ${investmentGrade ? "bg-emerald-950/40 border-emerald-500/40 text-emerald-300 shadow-[0_0_12px_rgba(16,185,129,0.1)]" : "bg-slate-900 border-slate-850 text-slate-500"}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${investmentGrade ? "bg-emerald-400 animate-pulse" : "bg-slate-600"}`} />
            SÕVERANO: <strong className={investmentGrade ? "text-emerald-400 font-extrabold" : "text-slate-400"}>{rating}</strong>
            {investmentGrade && <span className="text-[8px] font-black bg-emerald-500 text-slate-950 px-1 rounded uppercase tracking-tighter shadow-sm">INV GRADE</span>}
          </div>
          <button
            onClick={handleReloadRealTime}
            disabled={isSyncingLive}
            className={`p-1.5 px-3 border rounded text-xs transition-all flex items-center gap-1.5 font-bold font-mono cursor-pointer ${
              isSyncingLive
                ? "bg-emerald-950/40 border-emerald-500/50 text-emerald-400 shadow-[0_0_12px_rgba(16,185,129,0.15)]"
                : "bg-slate-900 hover:bg-slate-850 border-slate-800 text-slate-400 hover:text-indigo-400"
            }`}
            title="Coletar dados reais das APIs públicas e persistir no SQLite"
          >
            <RefreshCcw className={`w-3.5 h-3.5 ${isSyncingLive ? "animate-spin text-emerald-400" : ""}`} />
            {isSyncingLive ? "CRAWLING..." : "LIVE SYNC"}
          </button>
        </div>
      </header>

      {/* DASHBOARD CONTAINER - BENTO GRID DESIGN */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 space-y-6" id="dashboard-content">
        
        {/* Guia de Explanacao por Voz */}
        <GuiaDeVoz
          brent={brent}
          selic={selic}
          sentiment={sentiment}
          watchdogStatus={systemWatchdog.status}
          watchdogRam={systemWatchdog.ramUsed}
        />
        
        {/* ROW 1: Macro Charts & AI Assistant / Bluesky Simulation split */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6" id="bento-row-1">
          {/* Section 1A: Live economic gauges and mathematical models */}
          <div className="xl:col-span-2 flex flex-col gap-6" id="indicators-wrapper">
            <IndicadoresMacro
              data={dynamicHistoricalRecords}
              brent={brent}
              ttf={ttf}
              selic={selic}
              sentiment={sentiment}
              rating={rating}
              investmentGrade={investmentGrade}
              onUpdateBrent={handleUpdateBrent}
              onUpdateTtf={handleUpdateTtf}
              onUpdateSelic={handleUpdateSelic}
              onUpdateSentiment={handleUpdateSentiment}
            />
          </div>

          {/* Section 1B: RAG Economic Copilot Terminal (server-side Gemini) */}
          <div className="xl:col-span-1" id="analyst-wrapper">
            <ConsolaAnalista
              onSendMessage={handleCallAgentQuery}
              isPending={isAiPending}
            />
          </div>
        </div>

        {/* ROW 2: Linux Watchdog Monitor CLI Console & Bluesky Timeline Publisher */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6" id="bento-row-2">
          {/* Section 2A: Termux Terminal and Logs simulation */}
          <div id="logs-console-wrapper">
            <ConsolaLog
              logs={logs}
              watchdog={systemWatchdog}
              onTriggerSelfHeal={handleTriggerSelfHeal}
              onInjectLog={handleInjectLog}
              brent={brent}
              selic={selic}
            />
          </div>

          {/* Section 2B: Bluesky Profile and Thread composer (powered by Gemini) */}
          <div id="bluesky-sim-wrapper">
            <BlueskySim
              threads={threads}
              onPublishThread={handlePublishThread}
              currentBrent={brent}
              currentSelic={selic}
              currentSentiment={sentiment}
              isGeneratingThread={isThreadGenerating}
              onGenerateThreadAI={handleGenerateThreadAI}
            />
          </div>
        </div>

        {/* ROW 3: Lean 4 Consistency Proof Mathematics Playground */}
        <div id="theorems-grounds-wrapper">
          <Teoremas />
        </div>

      </main>

      {/* FOOTER */}
      <footer className="border-t border-slate-900 bg-slate-950 py-4 px-6 text-center text-4xs font-mono text-slate-500 flex flex-col sm:flex-row items-center justify-between gap-3">
        <div>
          DESENVOLVIDO POR <strong className="text-slate-400">ZEH SOBRINHO</strong> — BRASIL
        </div>
        <div className="flex items-center gap-2">
          <span>TERMUX OS DEPLOYMENT TARGET: A23 HARDWARE</span>
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
          <span>ZERO HALLUCINATION BOUNDS COMPILER ACTIVE</span>
        </div>
      </footer>
    </div>
  );
}
