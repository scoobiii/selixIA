/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from "react";
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
    activeUsers: 0,
    maxCapacity: 0,
    capacityReached: false,
    firstAccess: null,
  });

  const [promotionalTimeLeft, setPromotionalTimeLeft] = useState<number | null>(null);
  const promotionalTimerRef = useRef<NodeJS.Timeout | null>(null);

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
        setSimultaneousUsers(data.system.activeUsers ?? 8);
        setMaxAllowedUsers(data.system.maxCapacity ?? 20);
        if (data.system.firstAccess) {
          const timeLeft = data.system.firstAccess + (15 * 60 * 1000) - Date.now();
          setPromotionalTimeLeft(Math.max(0, timeLeft));
        }
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

    // Set up promotional timer countdown
    if (promotionalTimerRef.current) {
      clearInterval(promotionalTimerRef.current);
    }
    promotionalTimerRef.current = setInterval(() => {
      setPromotionalTimeLeft(prev => {
        if (prev === null) return null;
        const newTime = prev - 1000;
        if (newTime <= 0) {
          clearInterval(promotionalTimerRef.current!); // Stop timer when it reaches 0
          window.location.href = '/waitlist'; // Redirect to waitlist
          return 0;
        }
        return newTime;
      });
    }, 1000);

    return () => {
      clearInterval(interval);
      if (promotionalTimerRef.current) {
        clearInterval(promotionalTimerRef.current);
      }
    };
  }, [systemWatchdog.firstAccess]);

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
            {systemWatchdog.capacityReached && (
              <div className="bg-red-950/40 border border-red-500/40 text-red-300 shadow-[0_0_12px_rgba(239,68,68,0.1)] px-2.5 py-1.5 rounded flex items-center gap-1.5 animate-pulse">
                <AlertCircle className="w-3 h-3" />
                CAPACIDADE MÁXIMA ATINGIDA! <a href="/waitlist" className="underline text-red-200">Entrar na Lista de Espera</a>
              </div>
            )}
            {promotionalTimeLeft !== null && promotionalTimeLeft > 0 && (
              <div className="bg-blue-950/40 border border-blue-500/40 text-blue-300 shadow-[0_0_12px_rgba(59,130,246,0.1)] px-2.5 py-1.5 rounded flex items-center gap-1.5">
                <RefreshCcw className="w-3 h-3 animate-spin" />
                TEMPO PROMOCIONAL: <strong className="text-blue-200">{Math.floor(promotionalTimeLeft / 60000).toString().padStart(2, '0')}:{Math.floor((promotionalTimeLeft % 60000) / 1000).toString().padStart(2, '0')}</strong>
              </div>
            )}
            <div className="bg-slate-900 border border-slate-850 px-2.5 py-1.5 rounded flex items-center gap-1.5">
              <Server className="w-3 h-3" />
              USUÁRIOS ATIVOS: <strong className="text-slate-200">{systemWatchdog.activeUsers}/{systemWatchdog.maxCapacity}</strong>
            </div>
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
            RATING: <strong className={investmentGrade ? "text-emerald-400" : "text-slate-400"}>{rating}</strong>
          </div>
        </div>

        {/* User Login / Profile area */}
        <UserLoginArea 
          user={currentUser} 
          onLoginSuccess={handleLoginSuccess} 
          onLogout={handleLogout}
          onUpdateCustomizations={handleUpdateCustomizations}
        />
      </header>

      {/* SUB-HEADER PERSONA SELECTOR */}
      <div className="bg-slate-900/40 border-b border-slate-900 px-6 py-2 flex items-center gap-6 overflow-x-auto no-scrollbar">
        <div className="flex items-center gap-2 text-3xs font-mono text-slate-500 whitespace-nowrap">
          <Users className="w-3 h-3" />
          PERSONA ATIVA:
        </div>
        <div className="flex items-center gap-1">
          {Object.entries(SELIX_PERSONAS).map(([key, p]) => (
            <button
              key={key}
              onClick={() => setActivePersona(key)}
              className={`px-3 py-1 rounded-full text-3xs font-bold transition-all whitespace-nowrap border ${activePersona === key ? "bg-amber-500/10 border-amber-500/50 text-amber-400" : "bg-slate-900/50 border-slate-800 text-slate-500 hover:border-slate-700"}`}
            >
              {p.label.toUpperCase()}
            </button>
          ))}
        </div>
      </div>

      <main className="flex-1 flex flex-col md:flex-row overflow-hidden relative">
        {/* LEFT COLUMN: Indicators & Analysis */}
        <div className="flex-1 overflow-y-auto p-4 lg:p-6 space-y-6 custom-scrollbar scroll-smooth" id="left-column-main">
          
          {/* TOP GRID: REAL TIME DATA CARDS */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <IndicadoresMacro 
              brent={brent} 
              ttf={ttf} 
              selic={selic} 
              sentiment={sentiment} 
              brentHistory={brentHistory}
              ttfHistory={ttfHistory}
              onUpdateBrent={handleUpdateBrent}
              onUpdateTtf={handleUpdateTtf}
              onUpdateSelic={handleUpdateSelic}
              onUpdateSentiment={handleUpdateSentiment}
            />
          </div>

          {/* MIDDLE SECTION: PERSONA INSIGHTS & ANALYST */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="lg:col-span-7 space-y-6">
               <ConsolaAnalista 
                  persona={SELIX_PERSONAS[activePersona as keyof typeof SELIX_PERSONAS]}
                  metrics={calculatePersonaSpecificMetrics(activePersona, { brent, ttf, selic, sentiment, investmentGrade })}
                  isAiPending={isAiPending}
                  onQuery={handleCallAgentQuery}
                  onReloadRealTime={handleReloadRealTime}
                  isSyncingLive={isSyncingLive}
               />
               
               {/* DISTRESSED ASSETS (RJ) MONITOR */}
               <EmpresasRJ 
                  prices={rjPrices} 
                  stats={rjStats} 
                  onUpdateStats={handleUpdateRjStats}
               />
            </div>

            <div className="lg:col-span-5 space-y-6">
               <Teoremas />
               <GuiaDeVoz />
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: Bluesky Timeline & Logs */}
        <div className="w-full md:w-[380px] lg:w-[420px] border-l border-slate-900 bg-slate-950/40 flex flex-col overflow-hidden">
          <div className="flex-1 flex flex-col min-h-0">
            <div className="p-4 border-b border-slate-900 flex items-center justify-between bg-slate-950/40">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-500" />
                <h2 className="text-xs font-bold tracking-tight text-slate-300">BLUESKY FEED</h2>
              </div>
              <button 
                onClick={async () => {
                  const posts = await handleGenerateThreadAI();
                  if (posts) handlePublishThread(posts);
                }}
                disabled={isThreadGenerating}
                className="text-4xs font-bold bg-amber-500 hover:bg-amber-400 text-slate-950 px-2 py-1 rounded transition-colors disabled:opacity-50 flex items-center gap-1"
              >
                {isThreadGenerating ? <RefreshCw className="w-2.5 h-2.5 animate-spin" /> : <Play className="w-2.5 h-2.5" />}
                AUTO-GENERATE
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto custom-scrollbar bg-slate-950/20">
              <BlueskySim threads={threads} />
            </div>
          </div>

          <div className="h-[280px] border-t border-slate-900 flex flex-col bg-slate-950/60">
            <div className="p-3 border-b border-slate-900 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <TerminalIcon className="w-3.5 h-3.5 text-slate-500" />
                <h2 className="text-4xs font-bold tracking-widest text-slate-500 uppercase">System Logs</h2>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1.5">
                  <div className={`w-1.5 h-1.5 rounded-full ${systemWatchdog.isWatchdogActive ? "bg-emerald-500 animate-pulse" : "bg-slate-600"}`} />
                  <span className="text-4xs font-mono text-slate-600">WATCHDOG</span>
                </div>
              </div>
            </div>
            <div className="flex-1 overflow-hidden">
              <ConsolaLog logs={logs} watchdog={systemWatchdog} onTriggerSelfHeal={handleTriggerSelfHeal} />
            </div>
          </div>
        </div>
      </main>

      {/* PREMIUM UPGRADE & REGIONAL BILLING FLOATING PANEL */}
      <div className="fixed bottom-6 left-6 z-50 flex flex-col gap-3">
         <div className="flex items-center gap-2">
            <button 
              onClick={() => setActiveSecondaryPanel("subscription")}
              className={`p-2.5 rounded-full shadow-2xl border transition-all ${activeSecondaryPanel === "subscription" ? "bg-amber-500 border-amber-400 text-slate-950 scale-110" : "bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200"}`}
              title="Assinatura Premium"
            >
              <ShieldCheck className="w-5 h-5" />
            </button>
            <button 
              onClick={() => setActiveSecondaryPanel("watchdog")}
              className={`p-2.5 rounded-full shadow-2xl border transition-all ${activeSecondaryPanel === "watchdog" ? "bg-violet-600 border-violet-500 text-white scale-110" : "bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200"}`}
              title="Telemetria Watchdog"
            >
              <Database className="w-5 h-5" />
            </button>
         </div>

         {activeSecondaryPanel === "subscription" && (
            <PremiumControlPanel 
              user={currentUser} 
              onCheckoutSuccess={handleCheckoutSuccessUpgrade} 
              activeLocale={activeLocale}
            />
         )}

         {activeSecondaryPanel === "watchdog" && (
            <div className="w-72 bg-slate-900/95 backdrop-blur-xl border border-slate-800 rounded-xl p-4 shadow-2xl animate-in slide-in-from-left-4 duration-300">
               <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xs font-bold text-slate-200 flex items-center gap-2">
                    <Database className="w-3.5 h-3.5 text-violet-400" />
                    TELEMETRIA A23
                  </h3>
                  <span className="text-4xs font-mono text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded">LIVE</span>
               </div>
               <div className="space-y-3">
                  <div className="space-y-1">
                    <div className="flex justify-between text-4xs font-mono text-slate-500">
                      <span>CPU TEMP</span>
                      <span className={systemWatchdog.cpuTemp > 65 ? "text-amber-400" : "text-slate-300"}>{systemWatchdog.cpuTemp}°C</span>
                    </div>
                    <div className="h-1 bg-slate-800 rounded-full overflow-hidden">
                      <div className="h-full bg-violet-500 rounded-full transition-all duration-1000" style={{ width: `${(systemWatchdog.cpuTemp / 100) * 100}%` }} />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <div className="flex justify-between text-4xs font-mono text-slate-500">
                      <span>RAM ALLOCATION</span>
                      <span className="text-slate-300">{systemWatchdog.ramUsed}MB / 384MB</span>
                    </div>
                    <div className="h-1 bg-slate-800 rounded-full overflow-hidden">
                      <div className="h-full bg-emerald-500 rounded-full transition-all duration-1000" style={{ width: `${(systemWatchdog.ramUsed / 384) * 100}%` }} />
                    </div>
                  </div>
                  <div className="pt-2 border-t border-slate-800/50">
                    <div className="flex items-center justify-between text-4xs font-mono text-slate-500">
                      <span>ESTADO DO DAEMON</span>
                      <span className="text-emerald-400 uppercase">{systemWatchdog.status}</span>
                    </div>
                  </div>
               </div>
            </div>
         )}
      </div>

      {/* REGIONAL SETTINGS SELECTOR (Bottom Right) */}
      <div className="fixed bottom-6 right-6 z-50">
         <RegionalBillingPanel 
            activeLocale={activeLocale} 
            onLocaleChange={setActiveLocale} 
         />
      </div>

      {/* CAPACITY & WAITLIST MODAL OVERLAY (Optional if capacityReached) */}
      {systemWatchdog.capacityReached && (
        <div className="fixed inset-0 z-[100] bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-500">
          <div className="max-w-md w-full bg-slate-900 border border-red-500/30 rounded-2xl p-8 shadow-2xl text-center space-y-6">
            <div className="w-20 h-20 bg-red-500/10 rounded-full flex items-center justify-center mx-auto border border-red-500/20">
              <ShieldAlert className="w-10 h-10 text-red-500 animate-pulse" />
            </div>
            <div className="space-y-2">
              <h2 className="text-xl font-bold text-white tracking-tight">Capacidade Máxima Atingida</h2>
              <p className="text-sm text-slate-400 leading-relaxed">
                O SelixIA está operando no limite do hardware A23. Entre na lista de espera para ser notificado assim que uma vaga for liberada.
              </p>
            </div>

            {waitlistSuccess ? (
              <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-4 flex items-center gap-3 text-emerald-400 text-sm animate-in zoom-in duration-300">
                <CheckCircle className="w-5 h-5 flex-shrink-0" />
                Sua solicitação foi registrada! Avisaremos você em breve.
              </div>
            ) : (
              <form onSubmit={handleSubmitWaitlist} className="space-y-3 text-left">
                <div className="space-y-1">
                  <label className="text-4xs font-bold text-slate-500 uppercase ml-1">Nome Completo</label>
                  <input 
                    type="text" 
                    value={waitlistName}
                    onChange={(e) => setWaitlistName(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2.5 text-sm text-white focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/20 transition-all outline-none"
                    placeholder="Seu nome"
                    required
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-4xs font-bold text-slate-500 uppercase ml-1">Telefone / WhatsApp</label>
                    <input 
                      type="tel" 
                      value={waitlistPhone}
                      onChange={(e) => setWaitlistPhone(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2.5 text-sm text-white focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/20 transition-all outline-none"
                      placeholder="(00) 00000-0000"
                      required
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-4xs font-bold text-slate-500 uppercase ml-1">@ Bluesky</label>
                    <input 
                      type="text" 
                      value={waitlistHandle}
                      onChange={(e) => setWaitlistHandle(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2.5 text-sm text-white focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/20 transition-all outline-none"
                      placeholder="@usuario.bsky.social"
                      required
                    />
                  </div>
                </div>
                <button 
                  type="submit"
                  disabled={isWaitlistSubmitting}
                  className="w-full bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold py-3 rounded-xl transition-all shadow-lg shadow-amber-500/10 flex items-center justify-center gap-2 disabled:opacity-50 mt-4"
                >
                  {isWaitlistSubmitting ? <RefreshCw className="w-4 h-4 animate-spin" /> : <UserPlus className="w-4 h-4" />}
                  ENTRAR NA LISTA DE ESPERA
                </button>
              </form>
            )}
            
            <div className="pt-4 flex items-center justify-center gap-6">
               <div className="flex flex-col items-center gap-1">
                  <span className="text-2xs font-bold text-white">{simultaneousUsers}/{maxAllowedUsers}</span>
                  <span className="text-4xs text-slate-500 uppercase tracking-widest">Ocupação</span>
               </div>
               <div className="w-px h-8 bg-slate-800" />
               <div className="flex flex-col items-center gap-1">
                  <span className="text-2xs font-bold text-white">{waitlistEntries.length}</span>
                  <span className="text-4xs text-slate-500 uppercase tracking-widest">Na Fila</span>
               </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
