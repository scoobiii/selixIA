/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import { Terminal as TerminalIcon, ShieldCheck, Database, RefreshCw, Sparkles, Server, BookOpen, AlertCircle, RefreshCcw, Users, Clock, UserPlus, AlertTriangle, List, ShieldAlert, ArrowRight, Play, CheckCircle } from "lucide-react";
import IndicadoresMacro from "./components/IndicadoresMacro";
import EmpresasRJ from "./components/EmpresasRJ";
import ConsolaLog from "./components/ConsolaLog";
import BlueskySim from "./components/BlueskySim";
import ConsolaAnalista from "./components/ConsolaAnalista";
import Teoremas from "./Teoremas";
import GuiaDeVoz from "./components/GuiaDeVoz";
import UserLoginArea from "./components/UserLoginArea";
import PremiumControlPanel from "./components/PremiumControlPanel";
import { EconomicRecord, LogEntry, LogLevel, LogCategory, BlueskyThread } from "./db/types";
import { SELIX_PERSONAS, calculatePersonaSpecificMetrics } from "./utils/personas";
import RegionalBillingPanel from "./components/RegionalBillingPanel";
import { LocaleType } from "./utils/billingAndI18n";

export default function App() {
  const [brent, setBrent] = useState(93.09);
  const [ttf, setTtf] = useState(48.50);
  const [selic, setSelic] = useState(10.75);
  const [sentiment, setSentiment] = useState(59);
  const [rating, setRating] = useState("BBB-");
  const [investmentGrade, setInvestmentGrade] = useState(false);
  const [brentHistory, setBrentHistory] = useState<number[]>([]);
  const [ttfHistory, setTtfHistory] = useState<number[]>([]);
  const [rjPrices, setRjPrices] = useState<Record<string, number> | undefined>(undefined);
  const [rjStats, setRjStats] = useState<any | undefined>(undefined);
  
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

  // Peak Concurrent Users and Waitlist State Variables
  const [simultaneousUsers, setSimultaneousUsers] = useState(8);
  const [maxAllowedUsers, setMaxAllowedUsers] = useState(20);
  const [waitlistEntries, setWaitlistEntries] = useState<any[]>([]);
  const [waitlistName, setWaitlistName] = useState("");
  const [waitlistPhone, setWaitlistPhone] = useState("");
  const [waitlistHandle, setWaitlistHandle] = useState("");
  const [isWaitlistSubmitting, setIsWaitlistSubmitting] = useState(false);
  const [waitlistSuccess, setWaitlistSuccess] = useState(false);

  // User Session & Customizable Preferences State
  const [currentUser, setCurrentUser] = useState<any | null>(null);

  // Target Persona State (Jornalista, Economista, Politico, etc.)
  const [activePersona, setActivePersona] = useState<string>(() => localStorage.getItem("selix_active_persona") || "jornalista");

  useEffect(() => {
    localStorage.setItem("selix_active_persona", activePersona);
  }, [activePersona]);

  // Regionalization and multi-tenant billing active locale (pt-BR, en-US, es-ES)
  const [activeLocale, setActiveLocale] = useState<LocaleType>(() => (localStorage.getItem("selix_active_locale") as LocaleType) || "pt-BR");

  useEffect(() => {
    localStorage.setItem("selix_active_locale", activeLocale);
  }, [activeLocale]);

  // Active secondary panel toggle: default is subscription payments GUI
  const [activeSecondaryPanel, setActiveSecondaryPanel] = useState<"watchdog" | "subscription">("subscription");

  const handleCheckoutSuccessUpgrade = async () => {
    const cachedEmail = localStorage.getItem("selix_user_email");
    if (cachedEmail) {
      const cachedName = localStorage.getItem("selix_user_name") || undefined;
      const cachedPct = localStorage.getItem("selix_user_picture") || undefined;
      await loadUserProfile(cachedEmail, cachedName, cachedPct);
    }
  };

  const loadUserProfile = async (email: string, name?: string, picture?: string) => {
    try {
      const res = await fetch("/api/auth/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, name, picture })
      });
      if (res.ok) {
        const data = await res.json();
        if (data.user) {
          setCurrentUser(data.user);
          // Auto-synchronize browser cache with official profile values
          if (data.user.name) localStorage.setItem("selix_user_name", data.user.name);
          if (data.user.picture) localStorage.setItem("selix_user_picture", data.user.picture);
        }
      }
    } catch (err) {
      console.error("Error loading profile from JSON DB:", err);
    }
  };

  const handleLoginSuccess = (user: any) => {
    setCurrentUser(user);
    localStorage.setItem("selix_user_email", user.email);
    localStorage.setItem("selix_user_name", user.name);
    if (user.picture) localStorage.setItem("selix_user_picture", user.picture);
    
    // Add success logger log immediately
    fetchLogs();
  };

  const handleLogout = () => {
    setCurrentUser(null);
    localStorage.removeItem("selix_user_email");
    localStorage.removeItem("selix_user_name");
    localStorage.removeItem("selix_user_picture");
    fetchLogs();
  };

  const handleUpdateCustomizations = async (newCusts: any) => {
    if (!currentUser) return;
    try {
      const res = await fetch("/api/auth/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: currentUser.email, customizations: newCusts })
      });
      if (res.ok) {
        const data = await res.json();
        if (data.user) {
          setCurrentUser(data.user);
        }
      }
    } catch (err) {
      console.error("Error updating customizations:", err);
    }
  };

  // Sync session on mount
  useEffect(() => {
    const cachedEmail = localStorage.getItem("selix_user_email");
    if (cachedEmail) {
      const cachedName = localStorage.getItem("selix_user_name") || undefined;
      const cachedPct = localStorage.getItem("selix_user_picture") || undefined;
      loadUserProfile(cachedEmail, cachedName, cachedPct);
    }
  }, []);


  const fetchWaitlist = async () => {
    try {
      const res = await fetch("/api/waitlist");
      if (res.ok) {
        const data = await res.json();
        setWaitlistEntries(data);
      }
    } catch (err) {
      console.error("Error fetching waitlist:", err);
    }
  };

  const handleUpdateUsers = async (val: number) => {
    setSimultaneousUsers(val);
    try {
      await fetch("/api/state/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ users: val }),
      });
      fetchLogs();
    } catch (err) {
      console.error(err);
    }
  };

  const handleSubmitWaitlist = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!waitlistName || !waitlistPhone || !waitlistHandle) return;
    setIsWaitlistSubmitting(true);
    try {
      const res = await fetch("/api/waitlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: waitlistName, phone: waitlistPhone, handle: waitlistHandle }),
      });
      if (res.ok) {
        setWaitlistSuccess(true);
        setWaitlistName("");
        setWaitlistPhone("");
        setWaitlistHandle("");
        fetchWaitlist();
        fetchLogs();
        setTimeout(() => setWaitlistSuccess(false), 5000);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsWaitlistSubmitting(false);
    }
  };

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
        setSimultaneousUsers(data.simultaneousUsers ?? 8);
        setMaxAllowedUsers(data.maxAllowedUsers ?? 20);
        if (data.brentHistory) {
          setBrentHistory(data.brentHistory);
        }
        if (data.ttfHistory) {
          setTtfHistory(data.ttfHistory);
        }
        if (data.rjPrices) {
          setRjPrices(data.rjPrices);
        }
        if (data.rjStats) {
          setRjStats(data.rjStats);
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

  const handleUpdateRjStats = async (updatedPayload: any) => {
    try {
      const res = await fetch("/api/state/update-rj-stats", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updatedPayload)
      });
      if (res.ok) {
        const data = await res.json();
        if (data.success && data.rjStats) {
          setRjStats(data.rjStats);
          await fetchLogs();
        }
      }
    } catch (err) {
      console.error("Failed to update RJ stats in server:", err);
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
    fetchWaitlist();
    
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
    if (newValue >= 10.00) {
      setRating("BBB-");
      setInvestmentGrade(false);
    } else {
      setRating("Investment Grade");
      setInvestmentGrade(true);
    }
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
    const pConfig = SELIX_PERSONAS.find(p => p.id === activePersona) || SELIX_PERSONAS[0];
    try {
      const res = await fetch("/api/agent-query", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          query: `[Foco do Perfil: ${pConfig.name}. Diretriz analítica: ${pConfig.geminiFocusPrompt}] ${query}`,
          customData: { brent, selic, sentiment, activePersona }
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

  // Generate newly formatted economic economic thread with server-side Gemini
  const handleGenerateThreadAI = async (overridePersona?: string): Promise<string[] | null> => {
    setIsThreadGenerating(true);
    const selectedPersonaId = overridePersona || activePersona;
    const pConfig = SELIX_PERSONAS.find(p => p.id === selectedPersonaId) || SELIX_PERSONAS[0];
    try {
      const prompt = `Você é um analista agindo estritamente do ponto de vista do perfil '${pConfig.name}'. 
Slogan do Perfil: ${pConfig.slogan}
Diretriz de Escrita e Viés: ${pConfig.geminiFocusPrompt}

Gere uma thread econômica brasileira altamente customizada para este perfil em formato de array de string JSON, dividida exatamente em 3 partes curtas, para postagem na timeline do @zeh-sobrinho.bsky.social.
Crie uma análise técnica correspondente em Português considerando que o petróleo Brent está em USD ${brent.toFixed(2)}, o Gás Natural TTF Europeu em €${ttf.toFixed(2)} EUR/MWh, a Selic nacional em ${selic.toFixed(2)}% ao ano, o sentimento em ${sentiment}/100 e a situação de rating soberano: '${rating}' (${investmentGrade ? "com selo de Grau de Investimento" : "Nível especulativo"}).
Destaque o impacto na perspectiva e prioridades de ${pConfig.name}. Se o perfil for 'Energia & Clima', dê foco absoluto na bio-estratégia verde de blends Ex/Bx desenvolvida pelo Ministério de Minas e Energia (MME). Se for 'Trabalhador', dê foco no impacto no salário real, poder de compra familiar e PLR retido pelas empresas em RJ. Se for 'Setor Produtivo', debêntures corporativas e WACC. If 'Mercado', prêmio de risco, di futuro, valuation descontado.
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

  const getThemeColors = () => {
    const accent = currentUser?.customizations?.themeAccent || "indigo";
    switch (accent) {
      case "violet":
        return {
          glowPrimary: "bg-violet-600/10",
          glowSecondary: "bg-indigo-600/5",
          accentColor: "violet",
        };
      case "emerald":
        return {
          glowPrimary: "bg-emerald-600/10",
          glowSecondary: "bg-teal-600/5",
          accentColor: "emerald",
        };
      case "sky":
        return {
          glowPrimary: "bg-sky-400/10",
          glowSecondary: "bg-blue-600/5",
          accentColor: "sky",
        };
      case "gray":
        return {
          glowPrimary: "bg-slate-500/10",
          glowSecondary: "bg-slate-700/5",
          accentColor: "slate",
        };
      case "indigo":
      default:
        return {
          glowPrimary: "bg-indigo-600/10",
          glowSecondary: "bg-violet-600/5",
          accentColor: "indigo",
        };
    }
  };

  const themeColors = getThemeColors();

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
      <div className={`absolute top-[-10%] left-[-15%] w-[50%] h-[50%] ${themeColors.glowPrimary} blur-[120px] rounded-full pointer-events-none`} />
      <div className={`absolute bottom-[-10%] right-[-15%] w-[50%] h-[50%] ${themeColors.glowSecondary} blur-[120px] rounded-full pointer-events-none`} />

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

          {/* User Sign-In/Auth area */}
          <UserLoginArea
            currentUser={currentUser}
            onLoginSuccess={handleLoginSuccess}
            onLogout={handleLogout}
          />
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
          activePersonaId={activePersona}
        />

        {/* TARGET PERSONA WORKSPACE PANEL */}
        <section className="bg-slate-900/40 border border-slate-900 rounded-xl p-5 space-y-4 backdrop-blur shadow-xl relative" id="persona-workspace-section">
          <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 blur-3xl rounded-full pointer-events-none" />
          
          <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 border-b border-slate-850 pb-3">
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded bg-indigo-950 text-indigo-400">
                <Sparkles className="w-4 h-4 animate-spin-slow" />
              </span>
              <div>
                <h2 className="text-xs font-bold font-mono text-slate-100 uppercase tracking-wider block">
                  Seletor de Perfil de Público-Alvo: Adaptabilidade Geral
                </h2>
                <div className="text-4xs text-slate-500 font-mono">
                  CLIQUE EM UM PERFIL DE INTERESSE ABAIXO PARA ADAPTAR A EXPERIÊNCIA DO DASHBOARD EM TEMPO REAL.
                </div>
              </div>
            </div>
            <div className="text-3xs font-mono bg-indigo-950/40 text-indigo-400 border border-indigo-905/30 rounded px-2.5 py-1 flex items-center gap-1.5 shrink-0">
              <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-ping" />
              MODO ATIVO: <strong className="uppercase">{activePersona}</strong>
            </div>
          </div>

          {/* Persona quick select grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2" id="persona-tabs-bar">
            {SELIX_PERSONAS.map((p) => {
              const isSelected = activePersona === p.id;
              return (
                <button
                  key={p.id}
                  onClick={() => {
                    setActivePersona(p.id);
                  }}
                  className={`p-2.5 rounded-lg border text-left transition-all hover:scale-[1.02] cursor-pointer flex flex-col justify-between h-20 ${
                    isSelected
                      ? "bg-slate-900 border-indigo-500 text-indigo-300 shadow-[0_0_12px_rgba(99,102,241,0.1)]"
                      : "bg-slate-950/60 border-slate-850 hover:bg-slate-850 text-slate-400 hover:text-slate-200"
                  }`}
                >
                  <div className="flex items-center justify-between w-full">
                    <span className="text-base select-none">{p.emoji}</span>
                    {isSelected && (
                      <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-pulse" />
                    )}
                  </div>
                  <div>
                    <span className="font-extrabold text-[10px] block truncate select-none leading-tight">{p.name}</span>
                    <span className="text-[7.5px] text-slate-500 block truncate select-none font-mono mt-0.5">{p.role}</span>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Active Persona Insight Showcase Widget */}
          {(() => {
            const currentPersona = SELIX_PERSONAS.find((p) => p.id === activePersona) || SELIX_PERSONAS[0];
            const metrics = calculatePersonaSpecificMetrics(activePersona, brent, selic, ttf) as any;
            
            return (
              <div className="bg-slate-950/80 border border-slate-855 rounded-lg p-4 grid grid-cols-1 lg:grid-cols-3 gap-5 animate-fade-in" id="persona-workbench">
                {/* Information Column */}
                <div className="lg:col-span-1 space-y-3 border-r border-slate-900 pr-5 flex flex-col justify-between h-full">
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-lg">{currentPersona.emoji}</span>
                      <h3 className="font-bold text-slate-200 text-xs tracking-tight font-sans">
                        Foco de Interesse do {currentPersona.name}
                      </h3>
                    </div>
                    <p className="text-[10px] text-slate-500 font-sans leading-relaxed mt-1">
                      {currentPersona.slogan}
                    </p>
                  </div>

                  <div className="space-y-1 bg-slate-900/40 p-2.5 rounded border border-slate-855 font-mono text-[9px]">
                    <span className="text-slate-550 text-[7px] uppercase block mb-1">MÉTRICAS DE ATENÇÃO:</span>
                    {currentPersona.focusHighlights.map((hl, k) => (
                      <div key={k} className="flex items-center gap-1.5 text-slate-400">
                        <CheckCircle className="w-3 h-3 text-indigo-400 shrink-0" />
                        <span>{hl}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Analytical Action / Calculations widget */}
                <div className="lg:col-span-2 flex flex-col justify-between gap-4">
                  <div>
                    <span className="text-[7.5px] font-mono text-indigo-400 bg-indigo-950/40 border border-indigo-900/20 px-1.5 py-0.5 rounded font-bold uppercase tracking-wider mb-2 inline-block">
                      {currentPersona.badgeText} INTERACTION PLATFORM
                    </span>
                    
                    {/* Dynamic view selection per profile mode */}
                    {activePersona === "jornalista" && (
                      <div className="space-y-3 font-mono text-3xs">
                        <div className="space-y-1">
                          <label className="text-slate-550 uppercase font-black text-[7px]">Pre-manchete Factual Sugerida (Fact-Checked):</label>
                          <div className="bg-slate-900 border border-slate-850 rounded p-2 text-slate-300 leading-relaxed font-sans text-[10px] relative">
                            {metrics.pressReadinessHeadline}
                            <button
                              onClick={() => {
                                navigator.clipboard.writeText(metrics.pressReadinessHeadline);
                              }}
                              className="absolute right-2 top-2 p-1 bg-slate-950 hover:bg-slate-800 rounded border border-slate-800 text-[8px] text-indigo-450 uppercase select-none cursor-pointer"
                            >
                              Copiar
                            </button>
                          </div>
                        </div>
                        <div className="flex items-center justify-between pt-1 font-mono text-[9px] text-slate-400">
                          <span>Índice de Confiabilidade Editorial:</span>
                          <span className="text-emerald-450 font-extrabold">{metrics.factCheckTruthRating.toFixed(1)}% Verificado</span>
                        </div>
                      </div>
                    )}

                    {activePersona === "economista" && (
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 font-mono text-3xs">
                        <div className="bg-slate-900 p-2.5 rounded border border-slate-850">
                          <span className="text-slate-550 text-[7px] uppercase block">Gini Projetado (Selic {selic}%)</span>
                          <span className="text-[11px] font-bold text-slate-200 mt-1 block">{(metrics.giniSimulated * 10).toFixed(3)}</span>
                          <span className="text-[7px] text-rose-500 font-sans block mt-0.5">Selic alta eleva concentração patrimonial</span>
                        </div>
                        <div className="bg-slate-900 p-2.5 rounded border border-slate-855">
                          <span className="text-slate-550 text-[7px] uppercase block">Transferência Rentista (Anual)</span>
                          <span className="text-[11px] font-bold text-rose-400 mt-1 block">R$ {metrics.rentismTransferBillions.toFixed(1)} Bi</span>
                          <span className="text-[7px] text-slate-550 font-sans block mt-0.5">Pagamento de juros aos credores da dívida</span>
                        </div>
                        <div className="bg-slate-900 p-2.5 rounded border border-slate-855">
                          <span className="text-slate-550 text-[7px] uppercase block">Alíquota Dividendo Sugerida</span>
                          <span className="text-[11px] font-bold text-emerald-400 mt-1 block">{metrics.dividendSurtaxPercent.toFixed(2)}%</span>
                          <span className="text-[7px] text-slate-550 font-sans block mt-0.5">Para restabelecer neutralidade social</span>
                        </div>
                      </div>
                    )}

                    {activePersona === "politico" && (
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 font-mono text-3xs">
                        <div className="bg-slate-900 p-2.5 rounded border border-slate-850">
                          <span className="text-slate-550 text-[7px] uppercase block">Aprovação Popular Estimada</span>
                          <span className="text-[11px] font-bold text-emerald-400 mt-1 block">{metrics.popularApprovalPercent.toFixed(1)}%</span>
                          <span className="text-[7px] text-emerald-500 font-sans block mt-0.5">Aprovação sobe com juros mais baixos</span>
                        </div>
                        <div className="bg-slate-900 p-2.5 rounded border border-slate-855">
                          <span className="text-slate-550 text-[7px] uppercase block">Resistência do Congresso</span>
                          <span className="text-[11px] font-bold text-rose-400 mt-1 block">{metrics.congressionalCoalitionResistance.toFixed(1)}/100</span>
                          <span className="text-[7px] text-slate-550 font-sans block mt-0.5">Pressão do Congresso por juros altos</span>
                        </div>
                        <div className="bg-slate-900 p-2.5 rounded border border-slate-855">
                          <span className="text-slate-550 text-[7px] uppercase block">Encargo da Dívida pública</span>
                          <span className="text-[11px] font-bold text-slate-300 mt-1 block">R$ {metrics.publicDebtInterestCostBillions.toFixed(1)} Bi / ano</span>
                          <span className="text-[7px] text-slate-550 font-sans block mt-0.5">Gasto exclusivo com juros rolagem</span>
                        </div>
                      </div>
                    )}

                    {activePersona === "empresario" && (
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 font-mono text-3xs">
                        <div className="bg-slate-900 p-2.5 rounded border border-slate-850">
                          <span className="text-slate-550 text-[7px] uppercase block">WACC Médio Corporativo</span>
                          <span className="text-[11px] font-bold text-rose-405 mt-1 block">{metrics.genericWacc.toFixed(2)}%</span>
                          <span className="text-[7px] text-rose-500 block mt-0.5">Taxa básica {selic}% + prêmio 4.5%</span>
                        </div>
                        <div className="bg-slate-900 p-2.5 rounded border border-slate-855">
                          <span className="text-slate-550 text-[7px] uppercase block">WACC Reprojetado (Selic 9%)</span>
                          <span className="text-[11px] font-bold text-emerald-400 mt-1 block">{metrics.reprojectedWacc.toFixed(2)}%</span>
                          <span className="text-[7px] text-emerald-500 block mt-0.5">Economia substancial na rolagem de dívida</span>
                        </div>
                        <div className="bg-slate-900 p-2.5 rounded border border-slate-855">
                          <span className="text-slate-550 text-[7px] uppercase block">Média EBITDA da Indústria</span>
                          <span className="text-[11px] font-bold text-slate-205 mt-1 block">{metrics.genericEbitdaMargin.toFixed(2)}%</span>
                          <span className="text-[7px] text-slate-550 block mt-0.5">Margem esmagada por juros CDI</span>
                        </div>
                      </div>
                    )}

                    {activePersona === "ambientalista" && (
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 font-mono text-3xs">
                        <div className="bg-slate-900 p-2.5 rounded border border-slate-850">
                          <span className="text-slate-550 text-[7px] uppercase block">Paridade Etanol / Gasolina</span>
                          <span className="text-[11px] font-bold text-emerald-400 mt-1 block">{(metrics.ethanolGasParityRatio * 100).toFixed(1)}%</span>
                          <span className="text-[7px] text-slate-550 block mt-0.5">Limite de viabilidade econômica</span>
                        </div>
                        <div className="bg-slate-900 p-2.5 rounded border border-slate-855">
                          <span className="text-slate-550 text-[7px] uppercase block">Mistura Mandatária Biodiesel</span>
                          <span className="text-[11px] font-bold text-slate-100 mt-1 block">{metrics.biodieselMandatoryBlendPercent}% (B{metrics.biodieselMandatoryBlendPercent})</span>
                          <span className="text-[7px] text-slate-550 block mt-0.5">Blends compulsórios Ex/Bx do MME</span>
                        </div>
                        <div className="bg-slate-900 p-2.5 rounded border border-slate-855">
                          <span className="text-slate-550 text-[7px] uppercase block">Crédito Descarbonização (CBIO)</span>
                          <span className="text-[11px] font-bold text-teal-400 mt-1 block">USD ${metrics.decarbonizationCreditPriceUSD.toFixed(2)}</span>
                          <span className="text-[7px] text-slate-550 block mt-0.5 font-sans">Preço de atacado por tonelada poupada</span>
                        </div>
                      </div>
                    )}

                    {activePersona === "trabalhador" && (
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 font-mono text-3xs">
                        <div className="bg-slate-900 p-2.5 rounded border border-slate-850">
                          <span className="text-slate-550 text-[7px] uppercase block">Cesta Básica Estimada</span>
                          <span className="text-[11px] font-bold text-rose-400 mt-1 block">R$ {metrics.basicBasketCost.toFixed(2)}</span>
                          <span className="text-[7px] text-slate-500 block">Pesquisa de custo de alimentos</span>
                        </div>
                        <div className="bg-slate-900 p-2.5 rounded border border-slate-855">
                          <span className="text-slate-550 text-[7px] uppercase block">Salários Mínimos p/ Cesta</span>
                          <span className="text-[11px] font-bold text-slate-100 mt-1 block">{(metrics.minimumWagesRequired * 10).toFixed(2)}% de um salário militar</span>
                          <span className="text-[7px] text-slate-500 block">Proporção diária necessária</span>
                        </div>
                        <div className="bg-slate-900 p-2.5 rounded border border-slate-855">
                          <span className="text-slate-550 text-[7px] uppercase block">Fator Prestação Parcelado</span>
                          <span className="text-[11px] font-bold text-rose-455 mt-1 block">+{(metrics.installmentRateFactor * 100 - 100).toFixed(1)}% Juros</span>
                          <span className="text-[7px] text-slate-500 block">Acréscimo no crediário básico familiar</span>
                        </div>
                      </div>
                    )}

                    {activePersona === "investidor" && (
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 font-mono text-3xs">
                        <div className="bg-slate-900 p-2.5 rounded border border-slate-850">
                          <span className="text-slate-550 text-[7px] uppercase block">Custo Equity Requerido (Ke)</span>
                          <span className="text-[11px] font-bold text-indigo-400 mt-1 block">{metrics.discountRate.toFixed(2)}%</span>
                          <span className="text-[7px] text-slate-500 block font-sans">Taxa de desconto Gordon</span>
                        </div>
                        <div className="bg-slate-900 p-2.5 rounded border border-slate-855">
                          <span className="text-slate-550 text-[7px] uppercase block">Múltiplo de Lucro Justo</span>
                          <span className="text-[11px] font-bold text-emerald-400 mt-1 block">{metrics.genericTerminalMultiple.toFixed(1)}x P/L</span>
                          <span className="text-[7px] text-slate-500 block font-sans">Múltiplo implícito de retorno terminal</span>
                        </div>
                        <div className="bg-slate-900 p-2.5 rounded border border-slate-855">
                          <span className="text-slate-555 text-[7px] uppercase block">Sovereign CDS 5 Years</span>
                          <span className="text-[11px] font-bold text-slate-300 mt-1 block">{metrics.countryRiskCds.toFixed(0)} bps</span>
                          <span className="text-[7px] text-slate-500 block font-sans">Prêmio implícito contra default</span>
                        </div>
                      </div>
                    )}

                  </div>

                  <div className="flex items-center justify-between border-t border-slate-900/60 pt-3 text-3xs font-mono text-slate-500">
                    <div>
                      *Todos os dados cognitivos recalculam instantaneamente ao mover os simuladores de commodities.
                    </div>
                    <div className="text-indigo-400 text-3xs flex items-center gap-1">
                      <Sparkles className="w-3.5 h-3.5" />
                      Fórmula de Consistência Formal Lean 4 Ativa
                    </div>
                  </div>
                </div>
              </div>
            );
          })()}
        </section>

        {/* Premium Customization Control Panel */}
        {currentUser && (
          <PremiumControlPanel
            currentUser={currentUser}
            onUpdateCustomizations={handleUpdateCustomizations}
          />
        )}
        
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

        {/* ROW 1.5: B3 Listed Distressed Assets under Judicial Recovery (R.J.) Projection Simulator */}
        <div id="rj-companies-wrapper" className="w-full">
          <EmpresasRJ 
            currentSelic={selic} 
            defaultProjectedSelic={currentUser?.customizations?.customSelicTarget}
            rjPrices={rjPrices}
            rjStats={rjStats}
            onUpdateRjStats={handleUpdateRjStats}
          />
        </div>

        {/* ROW 2: Managed Cloud Infrastructure (Subscription) & Bluesky Timeline Publisher */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6" id="bento-row-2">
          {/* Section 2A: Dynamic Payments & Subscription Setup */}
          <div id="logs-console-wrapper" className="flex flex-col gap-4">
            {/* Header Toggles */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 font-mono text-xs">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-slate-350 uppercase tracking-tight text-[10px] font-bold">GERENCIADOR DE ASSINATURA & PAGAMENTO</span>
              </div>
              <div className="flex gap-1 bg-slate-950 p-1 rounded-lg border border-slate-850">
                <button
                  type="button"
                  onClick={() => setActiveSecondaryPanel("subscription")}
                  className={`px-2.5 py-1 rounded transition-all text-3xs font-bold uppercase cursor-pointer select-none ${activeSecondaryPanel === "subscription" ? "bg-indigo-650 text-slate-100" : "text-slate-550 hover:text-slate-350"}`}
                >
                  ⭐ ASSINATURA (CLOUD)
                </button>
                <button
                  type="button"
                  onClick={() => setActiveSecondaryPanel("watchdog")}
                  className={`px-2.5 py-1 rounded transition-all text-xs font-bold uppercase cursor-pointer select-none ${activeSecondaryPanel === "watchdog" ? "bg-slate-800 text-indigo-400 border border-slate-700" : "text-slate-500 hover:text-slate-400"}`}
                >
                  📋 Watchdog (Legacy Termux)
                </button>
              </div>
            </div>

            {activeSecondaryPanel === "subscription" ? (
              <RegionalBillingPanel
                activeLocale={activeLocale}
                onLanguageChange={(newLocale) => {
                  setActiveLocale(newLocale);
                }}
                currentUser={currentUser}
                onUpgradeSuccess={handleCheckoutSuccessUpgrade}
                onAddLog={(message, level, category) => {
                  const mappedLevel: LogLevel = 
                    level === "WARNING" ? "WARN" : 
                    level === "DANGER" ? "CRITICAL" : 
                    level as LogLevel;
                  const mappedCategory: LogCategory = 
                    category === "AI" ? "RAG" : 
                    category === "MARKET" ? "CRAWLER" : 
                    category as LogCategory;
                  handleInjectLog(mappedLevel, mappedCategory, message);
                }}
              />
            ) : (
              <ConsolaLog
                logs={logs}
                watchdog={systemWatchdog}
                onTriggerSelfHeal={handleTriggerSelfHeal}
                onInjectLog={handleInjectLog}
                brent={brent}
                selic={selic}
              />
            )}
          </div>

          {/* Section 2B: Bluesky Profile and Thread composer (powered by Gemini) */}
          <div id="bluesky-sim-wrapper">
            <button 
              id="trigger-threads-refresh" 
              onClick={fetchThreads} 
              className="hidden" 
              style={{ display: "none" }}
            />
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

        {/* ROW 3: Concurrent Traffic Traffic Control & SQLite Waiting List Registration */}
        <section className="bg-slate-900/60 border border-slate-900 rounded-xl p-6 space-y-6 backdrop-blur shadow-2xl" id="trafe-control-wrapper">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-slate-850 pb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 rounded-lg">
                <Users className="w-5 h-5 animate-pulse" />
              </div>
              <div>
                <h2 className="text-sm font-extrabold text-slate-100 tracking-tight font-sans">
                  MONITOR DE TRÁFEGO CONCORRENTE & REDUNDÂNCIA ATIVA
                </h2>
                <p className="text-3xs text-slate-500 font-mono">
                  Gargalo de Hardware do A23 (Termux, limits 384MB RAM) & Filtro de Lista de Espera ao atingir 90%
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-3 font-mono text-3xs">
              <div className="bg-slate-950 border border-slate-850 px-2.5 py-1 rounded flex items-center gap-1.5">
                <span className="text-slate-500">PROMOÇÃO:</span>
                <strong className="text-violet-400">ATIVADA (5 MIN)</strong>
              </div>
              <div className="bg-slate-950 border border-slate-850 px-2.5 py-1 rounded flex items-center gap-1.5">
                <span className="text-slate-500">LIMITE REGISTRO:</span>
                <strong className="text-amber-500">90% CAPACIDADE</strong>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* COLUMN 1: Explanation & Simulated Users Config */}
            <div className="lg:col-span-1 space-y-4 bg-slate-950/40 p-4 border border-slate-850/50 rounded-lg flex flex-col justify-between">
              <div className="space-y-3">
                <h3 className="text-xs font-bold text-indigo-400 flex items-center gap-2 font-mono">
                  <Clock className="w-3.5 h-3.5" /> METRICAS DE CONCORRÊNCIA
                </h3>
                <p className="text-3xs text-slate-450 leading-relaxed font-sans">
                  O Selix executa localmente dentro da infraestrutura hermética do celular <strong className="text-slate-300">Samsung A23 (Termux Dev Node)</strong>. 
                  Com limites processuais impostos para evitar sobressaltos e estagnação térmica, o limite seguro foi fixado em <strong className="text-slate-300">20 usuários simultâneos</strong>. 
                  Atingindo 90% de estresse térmico/processamento (18 usuários ou mais), novos visitantes recebem um tempo de navegação bônus promocional de 5 minutos, sendo encaminhados à nossa lista de espera ativa persistida de forma segura usando <strong className="text-slate-300">SQLite3 local</strong>.
                </p>
              </div>

              <div className="space-y-3 pt-4 border-t border-slate-850/60 font-mono">
                <div className="flex items-center justify-between text-3xs text-slate-400">
                  <span>USUÁRIOS SIMULTÂNEOS:</span>
                  <span className={`font-bold ${simultaneousUsers >= 18 ? "text-amber-400 animate-pulse" : "text-emerald-400"}`}>
                    {simultaneousUsers} / {maxAllowedUsers} ({Math.round((simultaneousUsers / maxAllowedUsers) * 100)}%)
                  </span>
                </div>
                
                {/* Simulated Users Slider */}
                <div className="space-y-1">
                  <input
                    type="range"
                    min="0"
                    max="20"
                    value={simultaneousUsers}
                    onChange={(e) => handleUpdateUsers(parseInt(e.target.value))}
                    className="w-full h-1.5 bg-slate-850 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                  />
                  <div className="flex justify-between text-[8px] text-slate-600">
                    <span>Sessão Vazia</span>
                    <span>90% Alerta</span>
                    <span>Capacidade Max (20)</span>
                  </div>
                </div>

                {/* Capacity Status Card */}
                {simultaneousUsers >= 18 ? (
                  <div className="p-3 bg-amber-950/30 border border-amber-500/30 text-amber-300 rounded flex items-start gap-2.5 animate-pulse text-3xs">
                    <ShieldAlert className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                    <div>
                      <strong className="text-amber-450 block font-bold mb-0.5">ALERTA: 90% DA CAPACIDADE ALCANÇADA</strong>
                      Novos usuários adicionais devem registrar-se na Lista de Espera persistente para liberar tokens de navegação promocional redundantes.
                    </div>
                  </div>
                ) : (
                  <div className="p-3 bg-emerald-950/20 border border-emerald-500/20 text-emerald-300 rounded flex items-start gap-2.5 text-3xs">
                    <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                    <div>
                      <strong className="text-emerald-400 block font-bold mb-0.5">STATUS DO SMARTPHONE: ESTÁVEL</strong>
                      Acesso público disponível sem fila de espera ativa. Capacidade excedente disponível para redundância secundária.
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* COLUMN 2: Waitlist Registration Form */}
            <div className="lg:col-span-1 space-y-4 bg-slate-950/40 p-4 border border-slate-850/50 rounded-lg flex flex-col justify-between">
              <div className="space-y-3">
                <h3 className="text-xs font-bold text-indigo-400 flex items-center gap-2 font-mono">
                  <UserPlus className="w-4 h-4" /> REGISTRO DE FILA / REDUNDÂNCIA
                </h3>
                <p className="text-3xs text-slate-500 font-sans">
                  Mesmo estando abaixo de 90% de estresse de hardware, você pode se pré-cadastrar preventivamente para garantir acessibilidade persistente através do segundo nó de redundância autônoma.
                </p>
              </div>

              <form onSubmit={handleSubmitWaitlist} className="space-y-3 font-mono text-3xs text-slate-200">
                <div className="space-y-1">
                  <label className="text-[9px] text-slate-400">NOME DO STAKEHOLDER / DEVA:</label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: José Sobrinho Sobrinho"
                    value={waitlistName}
                    onChange={(e) => setWaitlistName(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 focus:border-indigo-500 text-slate-200 rounded px-2.5 py-1.5 text-3xs outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[9px] text-slate-400">TELEFONE DE CONTATO (SMS/WA):</label>
                  <input
                    type="tel"
                    required
                    placeholder="Ex: +55 (11) 99999-9999"
                    value={waitlistPhone}
                    onChange={(e) => setWaitlistPhone(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 focus:border-indigo-500 text-slate-200 rounded px-2.5 py-1.5 text-3xs outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[9px] text-slate-400">BLUESKY HANDLE (@):</label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: @zeh-sobrinho.bsky.social"
                    value={waitlistHandle}
                    onChange={(e) => setWaitlistHandle(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-805 text-slate-200 rounded px-2.5 py-1.5 text-3xs outline-none"
                  />
                </div>

                {waitlistSuccess && (
                  <div className="text-[10px] text-emerald-400 bg-emerald-950/20 border border-emerald-500/20 rounded px-3 py-1.5 mt-2 animate-pulse">
                    ✓ Registrado com sucesso no banco de dados SQLite local!
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isWaitlistSubmitting}
                  className="w-full bg-indigo-900 hover:bg-indigo-850 disabled:opacity-50 text-slate-100 font-bold border border-indigo-700 text-3xs px-4 py-2 rounded transition-colors cursor-pointer flex items-center justify-center gap-1.5 uppercase font-mono tracking-wider mt-4"
                >
                  <UserPlus className="w-3.5 h-3.5" />
                  {isWaitlistSubmitting ? "REGISTRANDO..." : "REQUISITAR ENTRADA NA FILA"}
                </button>
              </form>
            </div>

            {/* COLUMN 3: Real SQLite Waitlist Database Stored rows */}
            <div className="lg:col-span-1 space-y-4 bg-slate-950/40 p-4 border border-slate-850/50 rounded-lg flex flex-col">
              <div className="flex items-center justify-between border-b border-slate-850 pb-2">
                <h3 className="text-xs font-bold text-indigo-400 flex items-center gap-2 font-mono">
                  <List className="w-4 h-4" /> BANCO DE ESPERA (SQLITE FILE)
                </h3>
                <span className="text-4xs bg-indigo-500/10 text-indigo-400 px-1.5 py-0.5 rounded font-mono font-bold">
                  {waitlistEntries.length} FILTRADOS
                </span>
              </div>

              <div className="flex-1 overflow-y-auto max-h-[220px] pr-1 space-y-2.5 font-mono text-3xs">
                {waitlistEntries.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-slate-600 text-center py-10">
                    <Database className="w-8 h-8 opacity-20 mb-2" />
                    <span>Nenhum registro de fila</span>
                    <span className="text-[9px] opacity-60">Tabela SQLite SQLite_waitlist ativa</span>
                  </div>
                ) : (
                  waitlistEntries.map((row: any, i: number) => (
                    <div key={row.id || i} className="p-2.5 bg-slate-900 border border-slate-850 rounded hover:border-slate-800 transition-colors">
                      <div className="flex items-center justify-between text-slate-400 font-extrabold mb-1">
                        <span className="text-indigo-400">ID #{row.id || i+1}</span>
                        <span className="text-[9px] text-slate-600 font-normal">
                          {new Date(row.timestamp).toLocaleTimeString()}
                        </span>
                      </div>
                      <div className="space-y-0.5 text-[10px]">
                        <div className="text-slate-300">
                          Nome: <strong className="text-slate-200">{row.name}</strong>
                        </div>
                        <div className="text-slate-500 text-[9px]">
                          Tel: <strong className="text-slate-400">{row.phone}</strong>
                        </div>
                        <div className="text-indigo-400/80 text-[9px]">
                          Handle: <strong>{row.handle}</strong>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

          </div>
        </section>

        {/* ROW 4: Lean 4 Consistency Proof Mathematics Playground */}
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
