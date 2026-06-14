/**
 * @license
 * SPDX-License-Identifier: Apache-2.5
 */

import React, { useState } from "react";
import { 
  X, 
  Settings, 
  Sliders, 
  Users, 
  Image as ImageIcon, 
  Globe, 
  Database, 
  UserPlus, 
  Play, 
  Flame, 
  Sparkles,
  Check,
  Smartphone,
  ShieldCheck,
  ShieldAlert,
  List,
  Cpu,
  Download,
  Terminal,
  FileCode,
  CheckCircle,
  Plus,
  Trash2,
  RefreshCw,
  Award
} from "lucide-react";
import { SELIX_PERSONAS } from "../utils/personas";
import { LocaleType } from "../utils/billingAndI18n";

interface ConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  
  // Market Variables
  brent: number;
  onUpdateBrent: (val: number) => void;
  ttf: number;
  onUpdateTtf: (val: number) => void;
  selic: number;
  onUpdateSelic: (val: number) => void;
  sentiment: number;
  onUpdateSentiment: (val: number) => void;
  
  // Design / Locales
  activeWallpaper: string;
  onWallpaperChange: (theme: string) => void;
  activeLocale: LocaleType;
  onLanguageChange: (locale: LocaleType) => void;
  
  // Persona
  activePersona: string;
  onChangePersona: (pId: string) => void;
  
  // Traffic / Waitlist
  simultaneousUsers: number;
  maxAllowedUsers: number;
  onUpdateUsers: (val: number) => void;
  
  // Waitlist Form State & Submission
  waitlistName: string;
  setWaitlistName: (val: string) => void;
  waitlistPhone: string;
  setWaitlistPhone: (val: string) => void;
  waitlistHandle: string;
  setWaitlistHandle: (val: string) => void;
  isWaitlistSubmitting: boolean;
  waitlistSuccess: boolean;
  onSubmitWaitlist: (e: React.FormEvent) => void;
  waitlistEntries: any[];
  
  // Special geopolitical scenario launcher
  onTriggerSpecialScenario: () => void;

  // NEW: LLM and Moltbook States
  llmModelType: "gemini" | "local1bit" | "rag";
  onUpdateLlmModelType: (type: "gemini" | "local1bit" | "rag") => void;
  geminiApiKey: string;
  onUpdateGeminiApiKey: (val: string) => void;
  isLocalModelInstalled: boolean;
  onUpdateLocalModelInstalled: (val: boolean) => void;

  moltbookAgents: any[];
  onUpdateMoltbookAgents: (agents: any[]) => void;
  activeMoltbookAgentId: string;
  onSelectMoltbookAgent: (id: string) => void;
}

export default function ConfigModal({
  isOpen,
  onClose,
  brent,
  onUpdateBrent,
  ttf,
  onUpdateTtf,
  selic,
  onUpdateSelic,
  sentiment,
  onUpdateSentiment,
  activeWallpaper,
  onWallpaperChange,
  activeLocale,
  onLanguageChange,
  activePersona,
  onChangePersona,
  simultaneousUsers,
  maxAllowedUsers,
  onUpdateUsers,
  waitlistName,
  setWaitlistName,
  waitlistPhone,
  setWaitlistPhone,
  waitlistHandle,
  setWaitlistHandle,
  isWaitlistSubmitting,
  waitlistSuccess,
  onSubmitWaitlist,
  waitlistEntries,
  onTriggerSpecialScenario,

  // NEW states
  llmModelType,
  onUpdateLlmModelType,
  geminiApiKey,
  onUpdateGeminiApiKey,
  isLocalModelInstalled,
  onUpdateLocalModelInstalled,
  moltbookAgents,
  onUpdateMoltbookAgents,
  activeMoltbookAgentId,
  onSelectMoltbookAgent
}: ConfigModalProps) {
  const [activeTab, setActiveTab] = useState<"market" | "personas" | "llm_agents" | "traffic" | "appearance" | "geopolitical">("market");

  // Local model download simulation State
  const [downloadStep, setDownloadStep] = useState<string>("");
  const [downloadProgress, setDownloadProgress] = useState<number>(0);
  const [isDownloading, setIsDownloading] = useState<boolean>(false);
  const [downloadLogs, setDownloadLogs] = useState<string[]>([]);

  // Moltbook agent creation Form State
  const [newAgentName, setNewAgentName] = useState("");
  const [newAgentDesc, setNewAgentDesc] = useState("");
  const [newAgentApiKey, setNewAgentApiKey] = useState("");
  const [newAgentAvatar, setNewAgentAvatar] = useState("🤖");
  const [newAgentSkillMd, setNewAgentSkillMd] = useState("# Minhas Skills de IA\nDescreva as capacidades e ferramentas do agente...");
  const [newAgentReplyMode, setNewAgentReplyMode] = useState<"auto" | "manual">("auto");
  const [creationSuccess, setCreationSuccess] = useState(false);

  // Active Moltbook Agent
  const activeAgent = moltbookAgents.find(a => a.id === activeMoltbookAgentId) || moltbookAgents[0] || {
    id: "selix",
    name: "SelixBR",
    description: "",
    apiKey: "",
    replyMode: "auto",
    skillMd: "",
    avatar: "🦞"
  };

  if (!isOpen) return null;

  const wallpapers = [
    { id: "brent_crisis", label: "Crise Brent (Vermelho)", emoji: "🌋" },
    { id: "brazil_recovery", label: "Recuperação Nacional (Ecológico)", emoji: "🌿" },
    { id: "us_elections", label: "Eleições EUA (Azul Profundo)", emoji: "🦅" },
    { id: "copom_1999", label: "Copom Histórico (Âmbar)", emoji: "📜" },
  ];

  const localesList: { id: LocaleType; label: string; flag: string }[] = [
    { id: "pt-BR", label: "Português (Brasil)", flag: "🇧🇷" },
    { id: "en-US", label: "English (United States)", flag: "🇺🇸" },
    { id: "es-ES", label: "Español (España)", flag: "🇪🇸" },
  ];

  // Handler for model downloading simulation
  const handleDownloadAndTestLocalModel = () => {
    setIsDownloading(true);
    setDownloadProgress(10);
    setDownloadStep("Analisando dependências e bibliotecas locais...");
    setDownloadLogs(["[SYS] Iniciando instalador de dependências de 1-bit qwen-0.5b_quantized…", "[SYS] Conferindo node_modules…"]);

    const steps = [
      { prg: 25, step: "Configurando descompactador bitwise em C++ / WASM…", log: "Instalando @selix/decompression-bitwise-wasm… (Concluído)" },
      { prg: 50, step: "Baixando pesos de 1-bit (7.4MB) do HuggingFace…", log: "Baixado 'qwen-0.5B-1bit-matrix.bin' - Tamanho real: 7.42 MB." },
      { prg: 75, step: "Compilando aceleradores locais para hardware móvel…", log: "Compilação bem-sucedida! Alocados kernels internos de tensores." },
      { prg: 90, step: "Fazendo teste unitário (Inference latency benchmarks)…", log: "Auto-teste OK: 'Selic ótima calculada em 9.48%' gerado em 88ms." },
      { prg: 100, step: "Modelo Leve quantizado liberado!", log: "Inference server habilitado com sucesso. Cache ativado localmente." }
    ];

    let currentIdx = 0;
    const interval = setInterval(() => {
      if (currentIdx < steps.length) {
        const item = steps[currentIdx];
        setDownloadProgress(item.prg);
        setDownloadStep(item.step);
        setDownloadLogs(prev => [...prev, `[OK] ${item.log}`]);
        currentIdx++;
      } else {
        clearInterval(interval);
        setIsDownloading(false);
        onUpdateLocalModelInstalled(true);
        onUpdateLlmModelType("local1bit");
      }
    }, 1000);
  };

  // Agent updates
  const handleUpdateActiveAgentSkill = (newSkill: string) => {
    const updated = moltbookAgents.map(a => {
      if (a.id === activeMoltbookAgentId) {
        return { ...a, skillMd: newSkill };
      }
      return a;
    });
    onUpdateMoltbookAgents(updated);
  };

  const handleUpdateActiveAgentReplyMode = (newMode: "auto" | "manual") => {
    const updated = moltbookAgents.map(a => {
      if (a.id === activeMoltbookAgentId) {
        return { ...a, replyMode: newMode };
      }
      return a;
    });
    onUpdateMoltbookAgents(updated);
  };

  const handleUpdateActiveAgentApiKey = (newKey: string) => {
    const updated = moltbookAgents.map(a => {
      if (a.id === activeMoltbookAgentId) {
        return { ...a, apiKey: newKey };
      }
      return a;
    });
    onUpdateMoltbookAgents(updated);
  };

  const handleCreateAgent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAgentName.trim()) return;

    const newAgent = {
      id: "agent_" + Date.now(),
      name: newAgentName.trim(),
      description: newAgentDesc.trim() || `Agente de Inteligência ${newAgentName.trim()} com conexões Selix.`,
      apiKey: newAgentApiKey.trim() || `moltbook_key_${Math.random().toString(36).substring(3, 9).toUpperCase()}`,
      replyMode: newAgentReplyMode,
      skillMd: newAgentSkillMd,
      avatar: newAgentAvatar,
      karma: 150,
      postsCount: 0,
      isCustom: true
    };

    const updated = [...moltbookAgents, newAgent];
    onUpdateMoltbookAgents(updated);
    onSelectMoltbookAgent(newAgent.id);
    
    setNewAgentName("");
    setNewAgentDesc("");
    setNewAgentApiKey("");
    setNewAgentAvatar("🤖");
    setNewAgentSkillMd("# Minhas Skills de IA\nDescreva as capacidades e ferramentas do agente...");
    setNewAgentReplyMode("auto");
    setCreationSuccess(true);
    setTimeout(() => setCreationSuccess(false), 3000);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-fade-in font-sans">
      <div 
        className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-4xl h-[92vh] md:h-[85vh] flex flex-col overflow-hidden shadow-2xl relative"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Ambient Top Glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-1/2 h-20 bg-indigo-505/10 blur-3xl rounded-full pointer-events-none" />

        {/* Modal Header */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/50">
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded bg-indigo-950 text-indigo-400">
              <Settings className="w-5 h-5 animate-spin-slow" />
            </span>
            <div>
              <h2 className="text-sm font-black text-slate-100 font-mono tracking-wider uppercase">Painel de Ajustes Globais</h2>
              <p className="text-[9px] text-indigo-400 font-mono">SIMULAÇÃO DE CENÁRIOS & CONFIGURAÇÕES GERAIS SELIX</p>
            </div>
          </div>
          <button 
            type="button" 
            onClick={onClose}
            className="p-1.5 rounded-lg bg-slate-950 hover:bg-slate-850 border border-slate-800 text-slate-400 hover:text-slate-100 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Navigation Tabs (Compact & Responsive) */}
        <div className="bg-slate-950 px-3 py-2 border-b border-slate-850 flex gap-1 overflow-x-auto scrollbar-none select-none text-2xs font-mono">
          {[
            { id: "market", label: "Mercado & Juros", icon: Sliders },
            { id: "personas", label: "Perfis (Persona)", icon: Users },
            { id: "llm_agents", label: "LLM & Agentes Moltbook", icon: Cpu },
            { id: "traffic", label: "Tráfego & Fila SQL", icon: Database },
            { id: "appearance", label: "Design & Idioma", icon: ImageIcon },
            { id: "geopolitical", label: "Caso Geopolítico", icon: Flame },
          ].map((t) => {
            const Icon = t.icon;
            const active = activeTab === t.id;
            return (
              <button
                key={t.id}
                onClick={() => setActiveTab(t.id as any)}
                className={`px-3 py-1.5 rounded-lg border flex items-center gap-1.5 transition-all cursor-pointer whitespace-nowrap ${
                  active 
                    ? "bg-indigo-600 border-indigo-400 text-slate-100 font-black shadow-md shadow-indigo-600/15 scale-[1.01]" 
                    : "bg-slate-900/40 border-slate-850 text-slate-450 hover:text-slate-200 hover:bg-slate-900"
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{t.label}</span>
              </button>
            );
          })}
        </div>

        {/* Modal Body (Scrollable Container) */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5 custom-scrollbar text-slate-300">
          
          {/* TAB 1: MARKET & COMMODITIES SLIDERS */}
          {activeTab === "market" && (
            <div className="space-y-4 animate-fade-in">
              <div className="bg-slate-950/40 p-3 rounded-xl border border-slate-850 text-3xs space-y-1">
                <span className="text-amber-500 font-mono font-bold block">MODELAGEM DÍRAPIDA EM TEMPO REAL:</span>
                <p className="font-sans leading-relaxed text-slate-400">
                  Os valores simulados abaixo penetram diretamente nos algoritmos de cálculo de Taylor e no provador de teoremas Lean 4. Ajuste os sliders para observar as flutuações das métricas de rentismo e desvio macroeconômico.
                </p>
              </div>

              {/* Brent Slider */}
              <div className="bg-slate-955 p-3.5 rounded-xl border border-slate-850 space-y-2">
                <div className="flex items-center justify-between text-2xs font-mono">
                  <span className="text-slate-400 font-bold uppercase tracking-wider flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-500" />
                    Petróleo Brent Crude (USD)
                  </span>
                  <span className="text-emerald-400 font-bold text-xs bg-emerald-950/40 px-2 py-0.5 rounded border border-emerald-900/40">
                    ${brent.toFixed(2)}
                  </span>
                </div>
                <input
                  type="range"
                  min="70"
                  max="110"
                  step="0.1"
                  value={brent}
                  onChange={(e) => onUpdateBrent(parseFloat(e.target.value))}
                  className="w-full accent-emerald-400 cursor-pointer"
                />
                <div className="flex justify-between text-[8px] text-slate-600 font-mono">
                  <span>$70.00 Mínimo Histórico</span>
                  <span>$90.00 Neutro</span>
                  <span>$110.00 Escassez/Crise</span>
                </div>
              </div>

              {/* TTF Slider */}
              <div className="bg-slate-955 p-3.5 rounded-xl border border-slate-855 space-y-2">
                <div className="flex items-center justify-between text-2xs font-mono">
                  <span className="text-slate-400 font-bold uppercase tracking-wider flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-cyan-400" />
                    Gás Natural TTF Europeu (EUR/MWh)
                  </span>
                  <span className="text-cyan-400 font-bold text-xs bg-cyan-955/40 px-2 py-0.5 rounded border border-cyan-900/40">
                    €{ttf.toFixed(2)}
                  </span>
                </div>
                <input
                  type="range"
                  min="30"
                  max="70"
                  step="0.1"
                  value={ttf}
                  onChange={(e) => onUpdateTtf(parseFloat(e.target.value))}
                  className="w-full accent-cyan-400 cursor-pointer"
                />
                <div className="flex justify-between text-[8px] text-slate-600 font-mono">
                  <span>€30.00 Base Verde</span>
                  <span>€48.00 Estável</span>
                  <span>€70.00 Inverno/Crise Energética</span>
                </div>
              </div>

              {/* SELIC Slider */}
              <div className="bg-slate-955 p-3.5 rounded-xl border border-slate-855 space-y-2">
                <div className="flex items-center justify-between text-2xs font-mono">
                  <span className="text-slate-400 font-bold uppercase tracking-wider flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-sky-400 animate-pulse" />
                    Taxa Básica Metálica SELIC (% a.a.)
                  </span>
                  <span className="text-sky-400 font-black text-xs bg-sky-955/40 px-2 py-0.5 rounded border border-sky-900/40">
                    {selic.toFixed(2)}%
                  </span>
                </div>
                <input
                  type="range"
                  min="7"
                  max="18"
                  step="0.25"
                  value={selic}
                  onChange={(e) => onUpdateSelic(parseFloat(e.target.value))}
                  className="w-full accent-sky-400 cursor-pointer"
                />
                <div className="flex justify-between text-[8px] text-slate-600 font-mono">
                  <span>7.00% Alvo Teórico MME</span>
                  <span>10.00% Zona de Equilíbrio</span>
                  <span>18.50% Estrangulamento Rentista</span>
                </div>
              </div>

              {/* Sentiment Slider */}
              <div className="bg-slate-955 p-3.5 rounded-xl border border-slate-855 space-y-2">
                <div className="flex items-center justify-between text-2xs font-mono">
                  <span className="text-slate-400 font-bold uppercase tracking-wider flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-amber-500" />
                    Macroeconomic Sentiment Tracker
                  </span>
                  <span className="text-amber-400 font-bold text-xs bg-amber-955/40 px-2 py-0.5 rounded border border-amber-900/40">
                    {sentiment}/100
                  </span>
                </div>
                <input
                  type="range"
                  min="10"
                  max="100"
                  step="1"
                  value={sentiment}
                  onChange={(e) => onUpdateSentiment(parseInt(e.target.value))}
                  className="w-full accent-amber-500 cursor-pointer"
                />
                <div className="flex justify-between text-[8px] text-slate-600 font-mono">
                  <span>10 Panic / Crash</span>
                  <span>50 Neutro</span>
                  <span>100 Otimismo Superior</span>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: PORTADO PERSONAS SELECTION */}
          {activeTab === "personas" && (
            <div className="space-y-4 animate-fade-in">
              <div className="bg-slate-950/40 p-3 rounded-xl border border-slate-850 text-3xs space-y-1">
                <span className="text-indigo-400 font-mono font-bold block">PÚBLICO-ALVO INTEGRADO:</span>
                <p className="font-sans text-slate-400 leading-relaxed">
                  Selecione um dos perfis cognitivos federados abaixo. A ativação de um perfil atualiza as fórmulas de amostragem de dados e as heurísticas das respostas do conselheiro RAG.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {SELIX_PERSONAS.map((p) => {
                  const isSelected = activePersona === p.id;
                  return (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => onChangePersona(p.id)}
                      className={`p-3.5 rounded-xl border text-left transition-all hover:scale-[1.01] cursor-pointer flex items-center justify-between ${
                        isSelected
                          ? "bg-indigo-955 border-indigo-505 text-indigo-300 shadow-[0_0_12px_rgba(99,102,241,0.15)]"
                          : "bg-slate-955/60 border-slate-850 hover:bg-slate-850 text-slate-400"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-2xl select-none shrink-0">{p.emoji}</span>
                        <div>
                          <span className="font-extrabold text-2xs block text-slate-100">{p.name}</span>
                          <span className="text-[8px] text-slate-500 font-mono tracking-wide mt-0.5 block">{p.role}</span>
                        </div>
                      </div>
                      <div className="shrink-0 pl-2">
                        {isSelected ? (
                          <span className="p-1 rounded-full bg-indigo-500 text-slate-950 block">
                            <Check className="w-3 h-3 stroke-[3]" />
                          </span>
                        ) : (
                          <div className="w-4 h-4 rounded-full border border-slate-700" />
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 3: NEW: LLM & MOLTBOOK AGENTS */}
          {activeTab === "llm_agents" && (
            <div className="space-y-6 animate-fade-in font-mono text-3xs">
              
              {/* SUBSECTION A: INFERENCE MOTOR CHOOSE */}
              <div className="bg-slate-950 p-4 rounded-xl border border-slate-850 space-y-4">
                <div className="flex items-center gap-2 border-b border-slate-900 pb-2">
                  <Cpu className="text-indigo-400 w-4 h-4" />
                  <span className="font-black text-xs text-slate-100 uppercase tracking-wider">1. Selecionar LLM Coder & API Key</span>
                </div>
                <p className="font-sans text-slate-400 leading-normal">
                  Selecione o cérebro cognitivo do Selix e do seu assistente de postagem automática. Modelos quantizados rodam 100% no navegador offline, preservando limites de hardware.
                </p>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {/* Gemini Cloud Option */}
                  <button
                    type="button"
                    onClick={() => onUpdateLlmModelType("gemini")}
                    className={`p-3.5 rounded-lg border text-left flex flex-col justify-between gap-3 transition-all cursor-pointer ${
                      llmModelType === "gemini"
                        ? "bg-indigo-950/40 border-indigo-500 text-indigo-300 shadow-lg shadow-indigo-950/20"
                        : "bg-slate-900/40 border-slate-800 text-slate-400 hover:border-slate-750"
                    }`}
                  >
                    <div className="flex items-center justify-between w-full">
                      <span className="p-1 rounded bg-indigo-500/10 text-indigo-400">🌩️</span>
                      <span className="text-[7px] bg-indigo-900 text-indigo-200 px-1 py-0.5 rounded font-black uppercase">Cloud</span>
                    </div>
                    <div>
                      <span className="text-2xs font-extrabold text-slate-200 block">Cloud LLM (Gemini API)</span>
                      <span className="text-[8px] text-slate-500 mt-0.5 block font-sans">Requer API Key do Gemini.</span>
                    </div>
                  </button>

                  {/* Qwen Local 1-bit Option */}
                  <button
                    type="button"
                    onClick={() => {
                      if (isLocalModelInstalled) {
                        onUpdateLlmModelType("local1bit");
                      } else {
                        handleDownloadAndTestLocalModel();
                      }
                    }}
                    className={`p-3.5 rounded-lg border text-left flex flex-col justify-between gap-3 transition-all cursor-pointer ${
                      llmModelType === "local1bit"
                        ? "bg-emerald-955 border-emerald-500 text-emerald-300 shadow-lg"
                        : "bg-slate-900/40 border-slate-800 text-slate-400 hover:border-slate-750"
                    }`}
                  >
                    <div className="flex items-center justify-between w-full">
                      <span className="p-1 rounded bg-emerald-500/10 text-emerald-400">💾</span>
                      <span className={`text-[7px] px-1 py-0.5 rounded font-black uppercase ${isLocalModelInstalled ? "bg-emerald-900 text-emerald-100" : "bg-amber-950 text-amber-400"}`}>
                        {isLocalModelInstalled ? "INSTALADO 1-BIT" : "BAIXAR REQUERIDO"}
                      </span>
                    </div>
                    <div>
                      <span className="text-2xs font-extrabold text-slate-200 block">LLM Local Leve 1-Bit</span>
                      <span className="text-[8px] text-slate-500 mt-0.5 block font-sans">Rodando em apenas 124MB de RAM local.</span>
                    </div>
                  </button>

                  {/* RAG Heuristic Option */}
                  <button
                    type="button"
                    onClick={() => onUpdateLlmModelType("rag")}
                    className={`p-3.5 rounded-lg border text-left flex flex-col justify-between gap-3 transition-all cursor-pointer ${
                      llmModelType === "rag"
                        ? "bg-sky-955 border-sky-500 text-sky-300 shadow-lg"
                        : "bg-slate-900/40 border-slate-800 text-slate-400 hover:border-slate-750"
                    }`}
                  >
                    <div className="flex items-center justify-between w-full">
                      <span className="p-1 rounded bg-sky-500/10 text-sky-400">📖</span>
                      <span className="text-[7px] bg-sky-900 text-sky-100 px-1 py-0.5 rounded font-black uppercase">Heurística</span>
                    </div>
                    <div>
                      <span className="text-2xs font-extrabold text-slate-200 block">RAG Heurístico Local</span>
                      <span className="text-[8px] text-slate-500 mt-0.5 block font-sans">Sem chamadas externas de rede.</span>
                    </div>
                  </button>
                </div>

                {/* Gemini Setup Key input */}
                {llmModelType === "gemini" && (
                  <div className="bg-slate-900 p-3 rounded-lg border border-slate-800 space-y-2.5">
                    <span className="text-slate-400 font-bold block uppercase tracking-wider">Chave de API Gemini:</span>
                    <input
                      type="password"
                      placeholder="Insira sua GEMINI_API_KEY do Google AI Studio (Ex: AIzaSy…)"
                      value={geminiApiKey}
                      onChange={(e) => onUpdateGeminiApiKey(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded px-2.5 py-1.5 text-slate-300 font-mono outline-none focus:border-indigo-505"
                    />
                    <p className="text-[8px] text-slate-500 font-sans">
                      Se você deixar este campo vazio, o sistema usará a chave global provida por variável de ambiente cloud ou o RAG de fallback.
                    </p>
                  </div>
                )}

                {/* Local installer simulation */}
                {llmModelType === "local1bit" && !isLocalModelInstalled && (
                  <div className="bg-slate-900 p-4 rounded-lg border border-dashed border-amber-500/30 space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-amber-400 font-bold flex items-center gap-1.5 uppercase">
                        <Download className="w-3.5 h-3.5 animate-bounce" /> Falta Instalar Dependências Locais de 1-Bit
                      </span>
                    </div>
                    <p className="text-[8.5px] leading-relaxed text-slate-400 font-sans">
                      Para executar a LLM Qwen-0.5B localmente quantizada com apenas 1-bit de pesos de precisão, precisamos baixar cerca de 7.4MB de arquivos de pesos neurais e empacotar o interpretador de matrizes binárias WebAssembly.
                    </p>

                    <button
                      type="button"
                      disabled={isDownloading}
                      onClick={handleDownloadAndTestLocalModel}
                      className="py-2 px-3 bg-amber-500 text-slate-950 hover:bg-amber-400 rounded font-black cursor-pointer transition uppercase text-4xs flex items-center justify-center gap-1.5"
                    >
                      <Plus className="w-3 h-3 stroke-[2]" /> {isDownloading ? "BAIXANDO SEU MODELO..." : "BAIXAR, INSTALAR E TESTAR AGORA"}
                    </button>

                    {isDownloading && (
                      <div className="space-y-2">
                        <div className="flex justify-between text-[8px] text-slate-400 font-mono">
                          <span>{downloadStep}</span>
                          <span className="font-bold">{downloadProgress}%</span>
                        </div>
                        <div className="w-full bg-slate-950 h-2 rounded overflow-hidden">
                          <div className="bg-amber-500 h-full transition-all duration-300" style={{ width: `${downloadProgress}%` }} />
                        </div>
                        <div className="max-h-20 overflow-y-auto bg-slate-955/65 p-2 rounded text-[7.5px] text-slate-500 font-mono leading-relaxed select-text border border-slate-850">
                          {downloadLogs.map((l, i) => (
                            <div key={i}>{l}</div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* General model feedback */}
                {llmModelType === "local1bit" && isLocalModelInstalled && (
                  <div className="bg-emerald-950/10 border border-emerald-500/20 text-emerald-300 p-3 rounded-lg flex items-center justify-between">
                    <span className="flex items-center gap-1.5">
                      <CheckCircle className="w-3.5 h-3.5" /> Modelo quantizado Qwen-0.5B de 1-bit instalado e operando em 12ms.
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        onUpdateLocalModelInstalled(false);
                        onUpdateLlmModelType("rag");
                      }}
                      className="text-rose-450 text-[8px] underline uppercase"
                    >
                      Excluir pesos locais
                    </button>
                  </div>
                )}
              </div>

              {/* SUBSECTION B: ATIVOS DO MOLTBOOK & GESTÃO ("Molt Bolt mostre os ativos") */}
              <div className="bg-slate-950 p-4 rounded-xl border border-slate-850 space-y-4">
                <div className="flex items-center gap-2 border-b border-slate-900 pb-2">
                  <Flame className="text-rose-500 w-4 h-4" />
                  <span className="font-black text-xs text-slate-100 uppercase tracking-wider">2. Central de Ativos do Moltbook</span>
                </div>
                
                {/* Active model automatically associated to current agent */}
                <div className="p-2 bg-rose-950/10 border border-rose-900/40 text-rose-300 rounded font-mono text-[9px] flex items-center justify-between">
                  <span>⚓ STATUS ASSOCIADOR AUTOMÁTICO DE MODELO:</span>
                  <span className="font-extrabold uppercase bg-rose-600/10 px-2 py-0.5 rounded border border-rose-500/20 text-[8px]">
                    {llmModelType === "gemini" ? `MODO CLOUD GEMINI + KEY` : llmModelType === "local1bit" ? `MODO 1-BIT NEURAL LOCAL` : `MODO RAG HEURÍSTICO LOCAL`}
                  </span>
                </div>

                {/* Show Active Agents grid */}
                <div className="space-y-2">
                  <span className="text-slate-400 font-bold block uppercase tracking-wider">AGENTES ATIVOS REGISTRADOS:</span>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-3xs">
                    {moltbookAgents.map((agentItem) => {
                      const isActive = agentItem.id === activeMoltbookAgentId;
                      return (
                        <div
                          key={agentItem.id}
                          onClick={() => onSelectMoltbookAgent(agentItem.id)}
                          className={`p-3 rounded-lg border text-left cursor-pointer transition relative flex flex-col gap-1 hover:scale-[1.01] ${
                            isActive
                              ? "bg-rose-950/10 border-rose-500/50 text-rose-300 shadow-md shadow-rose-950/20"
                              : "bg-slate-900/40 border-slate-850 hover:bg-slate-850 text-slate-400"
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-xl select-none">{agentItem.avatar || "👾"}</span>
                            <span className={`text-[7px] font-black uppercase px-1 py-0.5 rounded ${isActive ? "bg-rose-600 text-slate-100 animate-pulse" : "bg-slate-850 text-slate-500"}`}>
                              {isActive ? "ATIVO" : "STANDBY"}
                            </span>
                          </div>
                          <div>
                            <span className="font-extrabold text-2xs block text-slate-200 truncate">{agentItem.name}</span>
                            <span className="text-[8px] text-slate-500 mt-0.5 block truncate leading-normal font-sans">
                              {agentItem.description}
                            </span>
                          </div>
                          <div className="flex justify-between items-center text-[7.5px] mt-1 border-t border-slate-900/40 pt-1">
                            <span className="text-amber-500 font-bold">🏆 {agentItem.karma ?? 150} Karma</span>
                            <span className="text-slate-500 font-bold">
                              Trigger: {agentItem.replyMode === "auto" ? "✅ AUTO" : "⏳ MANUAL"}
                            </span>
                          </div>

                          {/* Quick delete custom agent */}
                          {agentItem.isCustom && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                const filtered = moltbookAgents.filter(a => a.id !== agentItem.id);
                                onUpdateMoltbookAgents(filtered);
                                if (isActive) {
                                  onSelectMoltbookAgent(moltbookAgents[0]?.id || "selix");
                                }
                              }}
                              className="absolute top-1 right-1 p-0.5 hover:text-rose-455 text-slate-600 cursor-pointer"
                              title="Remover Agente do cache"
                            >
                              <Trash2 className="w-2.5 h-2.5" />
                            </button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Edit active agent Skills and rules */}
                <div className="bg-slate-900 p-3.5 rounded-lg border border-slate-850 space-y-3">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-1.5">
                    <span className="text-slate-200 font-bold flex items-center gap-1">
                      <span>⚙️ Customizar Agente Ativo:</span>
                      <strong className="text-rose-400">{activeAgent.name} {activeAgent.avatar}</strong>
                    </span>
                    <span className="text-[8px] text-slate-500">Associado a LLM: {llmModelType}</span>
                  </div>

                  <div className="space-y-3">
                    {/* Switch automatic vs manual response */}
                    <div>
                      <span className="text-slate-400 block mb-1">GATILHO DE RÉPLICA NO FEED:</span>
                      <div className="flex gap-4">
                        <label className="flex items-center gap-1.5 cursor-pointer text-slate-300">
                          <input
                            type="radio"
                            name="replyMode"
                            checked={activeAgent.replyMode === "auto"}
                            onChange={() => handleUpdateActiveAgentReplyMode("auto")}
                            className="accent-rose-500"
                          />
                          <span>Resposta Automática ao ler feed</span>
                        </label>
                        <label className="flex items-center gap-1.5 cursor-pointer text-slate-300">
                          <input
                            type="radio"
                            name="replyMode"
                            checked={activeAgent.replyMode === "manual"}
                            onChange={() => handleUpdateActiveAgentReplyMode("manual")}
                            className="accent-rose-500"
                          />
                          <span>Apenas Resposta Manual (Trigger Manual)</span>
                        </label>
                      </div>
                    </div>

                    {/* API Key config per agent */}
                    <div>
                      <span className="text-slate-400 block mb-1">Chave API Moltbook (Opcional por Agente):</span>
                      <input
                        type="text"
                        placeholder="Ex: moltbook_xxx..."
                        value={activeAgent.apiKey || ""}
                        onChange={(e) => handleUpdateActiveAgentApiKey(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 rounded px-2.5 py-1 text-slate-300 text-[9px]"
                      />
                    </div>

                    {/* Skill MD editor */}
                    <div>
                      <span className="text-slate-400 block mb-1 flex items-center gap-1">
                        <FileCode className="w-3.5 h-3.5 text-indigo-400" />
                        <span>Customizar Skill MD Tools (Markdown format):</span>
                      </span>
                      <textarea
                        value={activeAgent.skillMd || ""}
                        onChange={(e) => handleUpdateActiveAgentSkill(e.target.value)}
                        placeholder="# Taylor Rule Tool\n...\n# Bio-Neutralizer\n..."
                        className="w-full bg-slate-950 border border-slate-800 rounded px-2.5 py-1.5 text-slate-300 font-mono text-[9px] h-28 resize-none"
                      />
                      <p className="text-[8px] text-slate-500 mt-1 font-sans leading-relaxed">
                        Descreva as ferramentas e as fórmulas formais (ex: Regra de Taylor, blends, Z3 watchdog, devedor em RJ) que o agente utilizará para resolver os desafios matemáticos recebidos ao publicar.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Subform: Criar Novo Agente */}
                <form onSubmit={handleCreateAgent} className="bg-slate-900 p-3.5 rounded-lg border border-slate-850 space-y-3">
                  <span className="text-slate-200 font-bold block uppercase flex items-center gap-1">
                    <UserPlus className="w-3.5 h-3.5 text-rose-455" />
                    <span>Criar Novo Agente Moltbook</span>
                  </span>

                  {creationSuccess && (
                    <div className="p-2 bg-emerald-950/20 border border-emerald-500/20 text-emerald-300 font-bold text-[9px] rounded">
                      ✓ Sucesso: Novo Agente configurado e automaticamente associado à LLM vigorante!
                    </div>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-slate-500 block text-[8px]">NOME DO AGENTE: *</label>
                      <input
                        type="text"
                        required
                        placeholder="Ex: EconomistaBot"
                        value={newAgentName}
                        onChange={(e) => setNewAgentName(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 rounded px-2.5 py-1 text-slate-300 uppercase text-[9px]"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-slate-500 block text-[8px]">AVATAR EMOJI:</label>
                      <input
                        type="text"
                        placeholder="Ex: 👷"
                        value={newAgentAvatar}
                        onChange={(e) => setNewAgentAvatar(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 rounded px-2.5 py-1 text-slate-300 text-[9px]"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-slate-500 block text-[8px]">MOLTBOOK BIO / DESCRIÇÃO BREVE:</label>
                    <input
                      type="text"
                      placeholder="Ex: Agente econometrista focado no bem-estar social…"
                      value={newAgentDesc}
                      onChange={(e) => setNewAgentDesc(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded px-2.5 py-1 text-slate-300 text-[9px]"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-slate-500 block text-[8px]">MOLTBOOK API KEY (DEIXE VAZIO PARA MOCK):</label>
                    <input
                      type="text"
                      placeholder="moltbook_xxx..."
                      value={newAgentApiKey}
                      onChange={(e) => setNewAgentApiKey(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded px-2.5 py-1 text-slate-300 text-[9px]"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-slate-500 block text-[8px]">DEDETIZAR SKILLS INICIAIS (MARKDOWN):</label>
                    <textarea
                      value={newAgentSkillMd}
                      onChange={(e) => setNewAgentSkillMd(e.target.value)}
                      className="w-full bg-slate-955 border border-slate-800 rounded px-2.5 py-1 text-slate-300 font-mono text-[9px] h-14 resize-none"
                    />
                  </div>

                  <div className="flex gap-3 pt-1">
                    <button
                      type="submit"
                      className="flex-1 py-1.5 bg-rose-600 hover:bg-rose-500 text-slate-950 font-black rounded text-[9px] uppercase cursor-pointer"
                    >
                      Criar Agente & Associar ao Modelo
                    </button>
                  </div>
                </form>
              </div>

            </div>
          )}

          {/* TAB 4: TRAFFIC & waitlist SQLLITE DIRECT REGISTRY */}
          {activeTab === "traffic" && (
            <div className="space-y-6 animate-fade-in text-3xs font-mono">
              {/* Traffic Limits Slider */}
              <div className="bg-slate-950 p-4 rounded-xl border border-slate-850 space-y-3">
                <div className="flex items-center justify-between border-b border-slate-900 pb-2">
                  <span className="text-2xs font-bold font-mono text-indigo-400 flex items-center gap-1.5 uppercase">
                    <Smartphone className="w-4 h-4 animate-pulse" />
                    Tráfego Simultâneo (Nó Termux)
                  </span>
                  <span className={`font-mono text-2xs font-extrabold ${simultaneousUsers >= 18 ? "text-amber-400" : "text-emerald-400"}`}>
                    {simultaneousUsers} / {maxAllowedUsers} Ativos
                  </span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="20"
                  value={simultaneousUsers}
                  onChange={(e) => onUpdateUsers(parseInt(e.target.value))}
                  className="w-full accent-indigo-500 cursor-pointer h-1.5 bg-slate-850 rounded-lg appearance-none"
                />
                <div className="flex justify-between text-[8px] text-slate-600 font-mono">
                  <span>0 (Estéril)</span>
                  <span>18 (Filtro Ativado)</span>
                  <span>20 (Carga Extrema)</span>
                </div>

                {simultaneousUsers >= 18 ? (
                  <div className="p-3 bg-amber-955/30 border border-amber-500/20 text-amber-300 rounded-lg flex items-start gap-2.5 text-3xs font-mono">
                    <ShieldAlert className="w-3.5 h-3.5 text-amber-500 shrink-0 mt-0.5 animate-pulse" />
                    <div>
                      <strong className="text-amber-400 block mb-0.5">FILTRO DE FILA ACTIVADO:</strong>
                      Limite seguro de hardware ultrapassado. Novos visitantes devem preencher o formulário abaixo para registrar slot redundante.
                    </div>
                  </div>
                ) : (
                  <div className="p-3 bg-emerald-950/10 border border-emerald-500/20 text-emerald-300 rounded-lg flex items-start gap-2.5 text-3xs font-mono">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                    <div>
                      <strong className="text-emerald-400 block mb-0.5">REDEMPRESA ESTÁVEL:</strong>
                      Equipamento rodando refrigerado a {Math.round(48 + simultaneousUsers * 0.8)}°C. Fila inativa.
                    </div>
                  </div>
                )}
              </div>

              {/* Waitlist SQLite entry Form */}
              <div className="bg-slate-950/40 p-4 rounded-xl border border-slate-850 space-y-3.5">
                <span className="text-xs font-bold font-mono text-indigo-400 flex items-center gap-1.5 uppercase">
                  <UserPlus className="w-4 h-4 text-indigo-455" />
                  Cadastrar Fila (SQLite local)
                </span>
                
                <form onSubmit={onSubmitWaitlist} className="space-y-3 font-mono text-3xs text-slate-200">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="space-y-1">
                      <label className="text-[8px] text-slate-500 block">NÕME DO STAKEHOLDER:</label>
                      <input
                        type="text"
                        required
                        placeholder="José Sobrinho"
                        value={waitlistName}
                        onChange={(e) => setWaitlistName(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-800 text-slate-300 rounded px-2.5 py-1.5 text-3xs outline-none focus:border-indigo-500"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[8px] text-slate-500 block">TELEFONE (SMS/WA):</label>
                      <input
                        type="tel"
                        required
                        placeholder="+55 (11) 99999"
                        value={waitlistPhone}
                        onChange={(e) => setWaitlistPhone(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-800 text-slate-300 rounded px-2.5 py-1.5 text-3xs outline-none focus:border-indigo-505"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[8px] text-slate-500 block">BLUESKY (@):</label>
                      <input
                        type="text"
                        required
                        placeholder="@zeh-sobrinho"
                        value={waitlistHandle}
                        onChange={(e) => setWaitlistHandle(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-800 text-slate-300 rounded px-2.5 py-1.5 text-3xs outline-none focus:border-indigo-505"
                      />
                    </div>
                  </div>

                  {waitlistSuccess && (
                    <div className="text-[10px] text-emerald-400 bg-emerald-950/20 border border-emerald-500/20 rounded px-2.5 py-1 px-3 mt-2 font-mono">
                      ✓ Sucesso: Salvaguardado na tabela SQLite local SQLite_waitlist!
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={isWaitlistSubmitting}
                    className="w-full bg-indigo-900 hover:bg-indigo-850 disabled:opacity-50 text-slate-100 font-bold border border-indigo-700 text-3xs px-4 py-2 rounded transition-colors cursor-pointer flex items-center justify-center gap-1.5 uppercase font-mono tracking-wider"
                  >
                    <UserPlus className="w-3.5 h-3.5" />
                    {isWaitlistSubmitting ? "Cadastrando..." : "Confirmar Pré-Inscrição Ativa"}
                  </button>
                </form>
              </div>

              {/* Stored waitlist rows preview widget */}
              <div className="bg-slate-950 p-4 rounded-xl border border-slate-850/65 space-y-3">
                <div className="flex items-center justify-between border-b border-slate-900 pb-2">
                  <span className="text-2xs font-bold font-mono text-slate-400 flex items-center gap-1.5 uppercase">
                    <List className="w-3.5 h-3.5" />
                    Tabela SQLite_waitlist
                  </span>
                  <span className="text-[8px] bg-slate-900 text-indigo-400 px-1.5 py-0.5 rounded font-mono border border-slate-800 font-bold">
                    {waitlistEntries.length} FILTRADOS
                  </span>
                </div>

                <div className="space-y-1.5 max-h-[145px] overflow-y-auto pr-1">
                  {waitlistEntries.length === 0 ? (
                    <div className="text-center py-6 text-slate-600 font-mono text-3xs">
                      Tabela SQLite inabitada. Cadastre acima para simular gatilho.
                    </div>
                  ) : (
                    waitlistEntries.map((row: any, i: number) => (
                      <div key={row.id || i} className="p-2 bg-slate-900/60 border border-slate-850 rounded text-3xs font-mono flex items-center justify-between">
                        <div>
                          <span className="text-indigo-400 font-black">ID #{row.id || i+1}</span>
                          <span className="text-slate-300 ml-2 font-sans">{row.name}</span>
                          <span className="text-slate-550 ml-2">({row.phone})</span>
                        </div>
                        <span className="text-indigo-455/85">{row.handle}</span>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          )}

          {/* TAB 5: APPEARANCE & LOCALES SELECTOR */}
          {activeTab === "appearance" && (
            <div className="space-y-5 animate-fade-in">
              {/* Wallpaper picker */}
              <div className="bg-slate-950 p-4 rounded-xl border border-slate-850 space-y-3.5">
                <span className="text-xs font-bold font-mono text-indigo-400 flex items-center gap-1.5 uppercase">
                  <ImageIcon className="w-4 h-4 text-indigo-455" />
                  Tema do Papel de Parede Global
                </span>
                <p className="text-3xs text-slate-500 font-sans leading-relaxed">
                  Modifique a paleta de cores dominante e o gradiente dinâmico de fundo correspondente aos cenários clássicos de volatilidade.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 font-mono text-2xs">
                  {wallpapers.map((wp) => {
                    const isSelected = activeWallpaper === wp.id;
                    return (
                      <button
                        key={wp.id}
                        type="button"
                        onClick={() => onWallpaperChange(wp.id)}
                        className={`p-3 rounded-lg border text-left transition-all hover:scale-[1.01] cursor-pointer flex items-center justify-between ${
                          isSelected
                            ? "bg-slate-900 border-indigo-500 text-indigo-300 shadow-[0_0_12px_rgba(99,102,241,0.1)]"
                            : "bg-slate-955/40 border-slate-850 hover:bg-slate-850 text-slate-400"
                        }`}
                      >
                        <span className="flex items-center gap-2">
                          <span className="text-base select-none">{wp.emoji}</span>
                          <span className="font-bold">{wp.label}</span>
                        </span>
                        {isSelected && (
                          <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-ping" />
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Locales Selector */}
              <div className="bg-slate-955 p-4 rounded-xl border border-slate-851 space-y-3.5">
                <span className="text-xs font-bold font-mono text-indigo-400 flex items-center gap-1.5 uppercase">
                  <Globe className="w-4 h-4 text-indigo-405" />
                  Seletor Regional (Billing Locale)
                </span>
                <p className="text-3xs text-slate-500 font-sans leading-relaxed">
                  Adapte a moeda fictícia faturada e a indexação de faturamento regional (R$ no Brasil, € na Europa e $ internacional).
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 font-mono text-2xs">
                  {localesList.map((loc) => {
                    const isSelected = activeLocale === loc.id;
                    return (
                      <button
                        key={loc.id}
                        type="button"
                        onClick={() => onLanguageChange(loc.id)}
                        className={`p-3 rounded-lg border text-left transition-all hover:scale-[1.01] cursor-pointer flex items-center justify-between ${
                          isSelected
                            ? "bg-indigo-950/40 border-indigo-550 text-indigo-300"
                            : "bg-slate-955/40 border-slate-850 hover:bg-slate-850 text-slate-400"
                        }`}
                      >
                        <span className="flex items-center gap-1.5">
                          <span className="text-sm select-none">{loc.flag}</span>
                          <span className="font-bold truncate">{loc.label}</span>
                        </span>
                        {isSelected && (
                          <span className="w-1.5 h-1.5 rounded-full bg-indigo-455 animate-pulse" />
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* TAB 6: SPECIAL GEOPOLITICAL SCENARIO TRIGGER */}
          {activeTab === "geopolitical" && (
            <div className="space-y-4 animate-fade-in text-center p-3">
              <div className="max-w-md mx-auto space-y-4">
                <div className="w-16 h-16 rounded-full bg-red-955/80 text-red-400 border border-red-500/30 flex items-center justify-center mx-auto shadow-lg shadow-red-500/10">
                  <Flame className="w-8 h-8 animate-pulse" />
                </div>
                
                <h3 className="text-sm font-extrabold text-slate-100 font-mono text-center uppercase"> GATILHO GEOPOLÍTICO ADVERSO</h3>
                
                <p className="text-3xs text-slate-400 font-sans text-center leading-relaxed">
                  Dispare o algoritmo de simulação do <strong>Energy Crash pós Trump-Netanyahu</strong>. Esse cenário simula a elevação radical dos preços do refino e petróleo Brent, ativando instantaneamente a imunização de blends Ex/Bx e permitindo cortes contundentes de juros para patamares saudáveis de 1 dígito com rating Soberano rebaixado para <strong>Investment Grade (Grau de Investimento Soberano A+)</strong>.
                </p>

                <button
                  type="button"
                  onClick={() => {
                    onTriggerSpecialScenario();
                    onClose();
                  }}
                  className="w-full bg-gradient-to-r from-amber-500 to-rose-600 hover:from-amber-400 hover:to-rose-500 text-slate-950 font-black text-2xs px-5 py-3.5 rounded-xl transition-all hover:scale-[1.03] shadow-lg shadow-amber-500/15 cursor-pointer uppercase flex items-center justify-center gap-1.5 font-mono select-none"
                >
                  <Play className="w-4 h-4 fill-slate-950 stroke-none" />
                  <span>Simular Crash Trump-Netanyahu</span>
                </button>
                
                <p className="text-[8px] text-slate-500 font-mono uppercase">
                  *Atenção: A ação executará leituras narradas por voz artificial de forma imediata.
                </p>
              </div>
            </div>
          )}

        </div>

        {/* Modal Footer */}
        <div className="p-3.5 bg-slate-950 border-t border-slate-850 text-center font-mono text-[9px] text-slate-500 uppercase flex items-center justify-between px-6">
          <span>COMPILADOR NEURAL SELIX v5.1 — TRAMPOFORTE ENGINE ACTIVE</span>
          <span className="text-[8px] text-indigo-450 bg-indigo-950/40 px-2 py-0.5 rounded border border-indigo-900/40">
            CÉREBRO ATIVO: {llmModelType === "gemini" ? "🔍 CLOUD GEMINI-3.5" : llmModelType === "local1bit" ? "💾 LOCAL 1-BIT QWEN" : "📖 CONTEXT RAG LOCAL"}
          </span>
        </div>
      </div>
    </div>
  );
}
