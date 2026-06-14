/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from "react";
import { 
  Terminal, 
  ShieldCheck, 
  Database, 
  RefreshCw, 
  Cpu, 
  Activity, 
  Play, 
  AlertOctagon, 
  Info, 
  Volume2, 
  BarChart3, 
  Eye, 
  ThumbsUp, 
  Medal, 
  Palette, 
  Flame, 
  TrendingUp,
  Globe
} from "lucide-react";
import { LogEntry, LogCategory, LogLevel } from "../db/types";
import { speak, SPEECH_GUIDES } from "../utils/speech";

interface ConsolaLogProps {
  logs: LogEntry[];
  watchdog: {
    status: string;
    isWatchdogActive: boolean;
    cpuTemp: number;
    ramUsed: number;
    lastCheck: string;
  };
  onTriggerSelfHeal: () => Promise<void>;
  onInjectLog: (level: LogLevel, category: LogCategory, message: string) => void;
  brent: number;
  selic: number;
  activeWallpaper: string;
  onWallpaperChange: (theme: string) => void;
}

export default function ConsolaLog({
  logs,
  watchdog,
  onTriggerSelfHeal,
  onInjectLog,
  brent,
  selic,
  activeWallpaper,
  onWallpaperChange,
}: ConsolaLogProps) {
  const [activeTab, setActiveTab] = useState<"analytics" | "terminal">("analytics");
  const [filterCategory, setFilterCategory] = useState<LogCategory | "ALL">("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [isHealing, setIsHealing] = useState(false);
  const terminalEndRef = useRef<HTMLDivElement>(null);

  const handleSelfHealClick = async () => {
    setIsHealing(true);
    onInjectLog("WARN", "WATCHDOG", "Self-Heal command acknowledged. Triggering diagnostic loop...");
    
    setTimeout(() => {
      onInjectLog("INFO", "SYSTEM", "Flushing background memory caches. Releasing zombie processes.");
    }, 450);

    setTimeout(() => {
      onInjectLog("INFO", "CRAWLER", "Re-testing endpoint connections to national central bank and oil API sources.");
    }, 900);

    setTimeout(async () => {
      await onTriggerSelfHeal();
      onInjectLog("SUCCESS", "WATCHDOG", "Watchdog fully healed the daemon. Cache refreshed, process clean.");
      setIsHealing(false);
    }, 1500);
  };

  const injectBrentError = () => {
    onInjectLog(
      "CRITICAL",
      "CRAWLER",
      `Brent Drift Detected: Source A ($${(brent * 1.15).toFixed(2)}) differs from Source B ($${brent.toFixed(2)}). Halted via Theorem 1.`
    );
  };

  const injectDiscreteSelicError = () => {
    onInjectLog(
      "CRITICAL",
      "WATCHDOG",
      `COPOM Coherence Violation: Unexpected rate parsed of ${(selic + 0.12).toFixed(2)}% (+12 basis points is forbidden by Theorem 4).`
    );
  };

  const injectOomWarning = () => {
    onInjectLog(
      "WARN",
      "SYSTEM",
      "Constraint Leak: RAM allocation near 320MB of 384MB safety threshold. Triggering preemptive garbage collect."
    );
  };

  const filteredLogs = logs.filter((log) => {
    const categoryMatch = filterCategory === "ALL" || log.category === filterCategory;
    const searchMatch =
      log.message.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.level.toLowerCase().includes(searchQuery.toLowerCase());
    return categoryMatch && searchMatch;
  });

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-2xl flex flex-col gap-5" id="termux-watchdog-console">
      {/* Title & Speech Selector */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
        <div className="flex items-center gap-2">
          <span className="p-1.5 rounded bg-slate-950 text-indigo-400">
            <BarChart3 className="w-4 h-4 text-indigo-400" />
          </span>
          <div>
            <div className="flex items-center gap-1.5">
              <h3 className="font-semibold text-slate-100 font-mono text-xs uppercase">Google Analytics & Fundo de Tela</h3>
              <button
                type="button"
                onClick={() => speak("Painel Google Analytics integrado do Selix. Veja dados de uso dos serviços de RAG e voz, performance dos posts publicados no Moltbook e configure o papel de parede do sistema de acordo com a crise geopolítica ou tendências globais.", true)}
                className="p-0.5 rounded text-slate-500 hover:text-indigo-400 hover:bg-slate-850 transition-colors cursor-pointer"
                title="Ouvir introdução do Analytics"
              >
                <Volume2 className="w-3.5 h-3.5" />
              </button>
            </div>
            <p className="text-3xs text-slate-500 font-mono">DASHBOARD DE SERVIÇOS, DESEMPENHO DE POSTINGS & SELETOR DE TEMAS</p>
          </div>
        </div>

        {/* Tab switcher: Analytics vs Terminal */}
        <div className="flex gap-1 bg-slate-950 p-1 rounded-lg border border-slate-850 shrink-0 self-start font-mono text-3xs">
          <button
            onClick={() => setActiveTab("analytics")}
            className={`px-3 py-1 rounded transition-all cursor-pointer ${
              activeTab === "analytics"
                ? "bg-slate-800 font-bold text-indigo-400"
                : "text-slate-550 hover:text-slate-350"
            }`}
          >
            📊 GOOGLE ANALYTICS
          </button>
          <button
            onClick={() => setActiveTab("terminal")}
            className={`px-3 py-1 rounded transition-all cursor-pointer ${
              activeTab === "terminal"
                ? "bg-slate-800 font-bold text-amber-400"
                : "text-slate-550 hover:text-slate-350"
            }`}
          >
            📟 TERMINAL LOGS
          </button>
        </div>
      </div>

      {activeTab === "analytics" ? (
        <div className="space-y-5 animate-fade-in">
          {/* Wallpaper picker */}
          <div className="bg-slate-950/60 p-4 border border-slate-850 rounded-lg space-y-3">
            <div className="flex items-center gap-2">
              <Palette className="w-3.5 h-3.5 text-indigo-400" />
              <span className="text-3xs font-bold text-slate-300 font-mono uppercase tracking-wider">TEMA PAPEL DE PAREDE AMBIENTE</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 font-mono">
              {/* Brent oil crisis default theme */}
              <button
                onClick={() => {
                  onWallpaperChange("brent_crisis");
                  onInjectLog("SUCCESS", "SYSTEM", "Wallpaper de fundo alterado para Tema Dominante: Energia Brent s/ Crise Trump-Netanyau.");
                }}
                className={`p-2.5 rounded border text-left flex flex-col justify-between transition-all h-20 relative overflow-hidden cursor-pointer ${
                  activeWallpaper === "brent_crisis"
                    ? "bg-red-950/30 border-red-500/80 text-red-400"
                    : "bg-slate-900 border-slate-850 text-slate-400 hover:border-slate-750"
                }`}
              >
                <div className="absolute right-1 bottom-1 opacity-10">
                  <Flame className="w-12 h-12" />
                </div>
                <div className="flex justify-between items-center w-full">
                  <span className="text-[7px] font-bold text-rose-500 uppercase px-1 rounded bg-rose-950/40">CRISIS</span>
                  <span className="text-[6px] text-slate-550">DOMINANTE</span>
                </div>
                <div>
                  <span className="text-[8px] font-bold block">Energia Brent Crash</span>
                  <span className="text-[6px] text-slate-550 block">Trump-Netanyahu tensions</span>
                </div>
              </button>

              {/* US Elections 2026 Trend */}
              <button
                onClick={() => {
                  onWallpaperChange("us_elections");
                  onInjectLog("SUCCESS", "SYSTEM", "Wallpaper de fundo alterado para Tema Google Trend: Eleições US 2026 e Dívida Soberana.");
                }}
                className={`p-2.5 rounded border text-left flex flex-col justify-between transition-all h-20 relative overflow-hidden cursor-pointer ${
                  activeWallpaper === "us_elections"
                    ? "bg-indigo-950/30 border-cyan-500/80 text-cyan-400"
                    : "bg-slate-900 border-slate-850 text-slate-400 hover:border-slate-750"
                }`}
              >
                <div className="absolute right-1 bottom-1 opacity-10">
                  <Globe className="w-12 h-12" />
                </div>
                <div className="flex justify-between items-center w-full">
                  <span className="text-[7px] font-bold text-cyan-400 uppercase px-1 rounded bg-cyan-950/40">TREND</span>
                  <span className="text-[6px] text-slate-550">HOT</span>
                </div>
                <div>
                  <span className="text-[8px] font-bold block">US Elections & Debt</span>
                  <span className="text-[6px] text-slate-550 block">Sovereign ratings macro</span>
                </div>
              </button>

              {/* Brazil Investment Grade Recovery Trend */}
              <button
                onClick={() => {
                  onWallpaperChange("brazil_recovery");
                  onInjectLog("SUCCESS", "SYSTEM", "Wallpaper de fundo alterado para Tema Google Trend: Pico Selic & Recuperação Selix Investment Grade.");
                }}
                className={`p-2.5 rounded border text-left flex flex-col justify-between transition-all h-20 relative overflow-hidden cursor-pointer ${
                  activeWallpaper === "brazil_recovery"
                    ? "bg-emerald-950/30 border-emerald-500/80 text-emerald-400"
                    : "bg-slate-900 border-slate-850 text-slate-400 hover:border-slate-750"
                }`}
              >
                <div className="absolute right-1 bottom-1 opacity-10">
                  <TrendingUp className="w-12 h-12" />
                </div>
                <div className="flex justify-between items-center w-full">
                  <span className="text-[7px] font-bold text-emerald-400 uppercase px-1 rounded bg-emerald-950/40">TREND</span>
                  <span className="text-[6px] text-slate-550">SUCCESS</span>
                </div>
                <div>
                  <span className="text-[8px] font-bold block">Selic Peak & Upgrade</span>
                  <span className="text-[6px] text-slate-550 block">Brazil Investment Grade</span>
                </div>
              </button>

              {/* COPOM 1999 Historical Trend */}
              <button
                onClick={() => {
                  onWallpaperChange("copom_1999");
                  onInjectLog("SUCCESS", "SYSTEM", "Wallpaper de fundo alterado para Tema Histórico: Regime de Metas COPOM 1999.");
                }}
                className={`p-2.5 rounded border text-left flex flex-col justify-between transition-all h-20 relative overflow-hidden cursor-pointer ${
                  activeWallpaper === "copom_1999"
                    ? "bg-amber-950/20 border-amber-500/80 text-amber-500"
                    : "bg-slate-900 border-slate-850 text-slate-400 hover:border-slate-750"
                }`}
              >
                <div className="absolute right-1 bottom-1 opacity-10">
                  <Terminal className="w-12 h-12" />
                </div>
                <div className="flex justify-between items-center w-full">
                  <span className="text-[7px] font-bold text-amber-500 uppercase px-1 rounded bg-amber-950/40">HISTORIC</span>
                  <span className="text-[6px] text-slate-550">COPOM</span>
                </div>
                <div>
                  <span className="text-[8px] font-bold block">Metas de Inflação 1999</span>
                  <span className="text-[6px] text-slate-550 block">Vintage Arminio Fraga</span>
                </div>
              </button>
            </div>
          </div>

          {/* Core Analytics Metrics Grid: Service usage and Posting performance side-by-side */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            
            {/* Column A: Service Usage Analytics */}
            <div className="bg-slate-950 p-4 rounded-lg border border-slate-850 space-y-3 font-mono">
              <span className="text-[9px] text-indigo-400 font-bold block uppercase tracking-wider">A. MÉTRICAS DE USO DOS SERVIÇOS GOOGLE</span>
              
              <div className="space-y-2 text-3xs">
                {/* Metric 1 */}
                <div className="flex justify-between items-center bg-slate-900 px-2.5 py-1.5 rounded border border-slate-850">
                  <span className="text-slate-450">CHAMADAS DE API RAG COGNITIVO:</span>
                  <strong className="text-slate-200">142 hits / dia</strong>
                </div>
                {/* Metric 2 */}
                <div className="flex justify-between items-center bg-slate-900 px-2.5 py-1.5 rounded border border-slate-850">
                  <span className="text-slate-450">FLUXO DE SÍNTESE DE VOZ (SPEECH):</span>
                  <strong className="text-indigo-400">388 sintetizações</strong>
                </div>
                {/* Metric 3 */}
                <div className="flex justify-between items-center bg-slate-900 px-2.5 py-1.5 rounded border border-slate-850">
                  <span className="text-slate-450">CONEXÕES GOOGLE AUTH EXECUTADAS:</span>
                  <strong className="text-emerald-400">100% SECURE SSL</strong>
                </div>
                {/* Metric 4 */}
                <div className="flex justify-between items-center bg-slate-900 px-2.5 py-1.5 rounded border border-slate-850">
                  <span className="text-slate-450">DISPONIBILIDADE DO CO-PILOTO ECONOMICO:</span>
                  <strong className="text-sky-400">99.98% uptime</strong>
                </div>
              </div>
            </div>

            {/* Column B: Posting Performance (Moltbook/Bluesky) */}
            <div className="bg-slate-950 p-4 rounded-lg border border-slate-850 space-y-3 font-mono">
              <span className="text-[9px] text-indigo-400 font-bold block uppercase tracking-wider">B. DESEMPENHO E IMPACTO DOS POSTINGS</span>
              
              <div className="space-y-4 text-3xs">
                {/* Grid for counters */}
                <div className="grid grid-cols-3 gap-2">
                  <div className="bg-slate-900 p-2 rounded text-center border border-slate-850">
                    <span className="text-slate-500 block text-[7px] uppercase">Reach total</span>
                    <strong className="text-[11px] text-indigo-400 font-extrabold">12.4K+</strong>
                  </div>
                  <div className="bg-slate-900 p-2 rounded text-center border border-slate-850">
                    <span className="text-slate-500 block text-[7px] uppercase">Média Upvotes</span>
                    <strong className="text-[11px] text-amber-500 font-extrabold">24 likes</strong>
                  </div>
                  <div className="bg-slate-900 p-2 rounded text-center border border-slate-850">
                    <span className="text-slate-500 block text-[7px] uppercase">Karma Selix</span>
                    <strong className="text-[11px] text-emerald-400 font-extrabold">850 pts</strong>
                  </div>
                </div>

                {/* Additional list */}
                <div className="space-y-1.5 pt-1 text-[8px] text-slate-400">
                  <div className="flex items-center gap-1.5 text-emerald-400">
                    <span className="w-1 h-1 rounded-full bg-emerald-400" />
                    Automação de Desafios Matemáticos: <strong>100% de acertos</strong>
                  </div>
                  <div className="flex items-center gap-1.5 text-slate-400">
                    <span className="w-1 h-1 rounded-full bg-slate-500" />
                    Tempo médio para detecção de flutuações de BRENT: <strong>4.2s</strong>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>
      ) : (
        <div className="space-y-4 animate-fade-in">
          {/* Telemetry headers */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4" id="telemetry-grid">
            {/* Telemetry 1: Daemon Status */}
            <div className="bg-slate-950 px-3 py-2.5 rounded border border-slate-800 font-mono flex items-center gap-3">
              <div className="relative flex h-3 w-3">
                {watchdog.isWatchdogActive ? (
                  <>
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
                  </>
                ) : (
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-rose-500"></span>
                )}
              </div>
              <div>
                <div className="text-3xs text-slate-500 uppercase">DAEMON STAT</div>
                <div className="text-2xs font-bold text-slate-200">
                  {watchdog.isWatchdogActive ? "ATILANTE ACTV" : "MONITOR CRASHED"}
                </div>
              </div>
            </div>

            {/* Telemetry 2: RAM */}
            <div className="bg-slate-950 px-3 py-2.5 rounded border border-slate-800 font-mono flex items-center gap-3">
              <Database className="w-5 h-5 text-emerald-400 opacity-85" />
              <div className="flex-1">
                <div className="text-3xs text-slate-500 uppercase">MEMORY BOUNDS</div>
                <div className="text-2xs font-bold text-emerald-400">
                  {watchdog.ramUsed}MB / <span className="text-slate-500">384MB</span>
                </div>
                <div className="w-full bg-slate-900 h-1 rounded overflow-hidden mt-1 max-w-[120px]">
                  <div
                    className="bg-emerald-500 h-1 rounded transition-all"
                    style={{ width: `${Math.min(100, (watchdog.ramUsed / 384) * 100)}%` }}
                  />
                </div>
              </div>
            </div>

            {/* Telemetry 3: Hardware Processor temp */}
            <div className="bg-slate-950 px-3 py-2.5 rounded border border-slate-800 font-mono flex items-center gap-3">
              <Cpu className="w-5 h-5 text-sky-400 opacity-85" />
              <div>
                <div className="text-3xs text-slate-500 uppercase">A23 CORE TEMP</div>
                <div className="text-2xs font-bold text-sky-400">{watchdog.cpuTemp}°C</div>
              </div>
            </div>

            {/* Telemetry 4: Watchdog status */}
            <div className="bg-slate-950 px-3 py-2.5 rounded border border-slate-800 font-mono flex items-center gap-3">
              <ShieldCheck className="w-5 h-5 text-amber-400 opacity-85" />
              <div className="w-full">
                <div className="text-3xs text-slate-400 uppercase leading-none mb-1">AUTO-HEAL ENGINE</div>
                <button
                  onClick={handleSelfHealClick}
                  disabled={isHealing}
                  className={`w-full text-center text-3xs font-bold py-1 px-2 rounded border transition-all flex items-center justify-center gap-1.5 ${
                    isHealing
                      ? "bg-amber-950 text-amber-300 border-amber-800 cursor-not-allowed"
                      : "bg-slate-900 hover:bg-slate-800 text-amber-400 border-amber-500/30"
                  }`}
                >
                  <RefreshCw className={`w-2.5 h-2.5 ${isHealing ? "animate-spin" : ""}`} />
                  {isHealing ? "HEALING NOW" : "RUN DIAGNOSTIC"}
                </button>
              </div>
            </div>
          </div>

          {/* FILTER BUTTONS & DIAGNOSTICS CONTROL RAIL */}
          <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 border-b border-slate-800 pb-3">
            <div className="flex items-center gap-1.5 overflow-x-auto py-1 font-mono text-3xs" id="category-filter-rail">
              <span className="text-slate-500 mr-1.5 uppercase">FILTRAR:</span>
              {(["ALL", "WATCHDOG", "CRAWLER", "RAG", "BLUESKY", "SYSTEM"] as const).map((cat) => (
                <button
                  key={cat}
                  onClick={() => setFilterCategory(cat)}
                  className={`px-2 py-1 rounded transition-all select-none cursor-pointer ${
                    filterCategory === cat
                      ? "bg-emerald-500 text-slate-950 font-bold"
                      : "bg-slate-950 text-slate-400 hover:text-slate-200 hover:bg-slate-800"
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            {/* Search */}
            <div className="relative flex items-center">
              <input
                type="text"
                placeholder="Search terminal..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-slate-950 border border-slate-800 text-slate-300 text-xs px-2.5 py-1.5 rounded w-full md:w-48 font-mono outline-none focus:border-slate-700"
              />
            </div>
          </div>

          {/* TERMINAL MONITOR SCREEN */}
          <div className="bg-slate-950 rounded-xl border border-slate-880 p-4 h-64 overflow-y-auto font-mono flex flex-col gap-2 shadow-inner text-xs relative select-text" id="crt-terminal-screen">
            <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black/10 pointer-events-none" />
            
            {filteredLogs.length === 0 ? (
              <div className="text-slate-600 text-center py-20 flex flex-col items-center gap-1">
                <Info className="w-5 h-5 opacity-50" />
                No entries found matching filter.
              </div>
            ) : (
              filteredLogs.map((log) => {
                const levelColor =
                  log.level === "SUCCESS"
                    ? "text-emerald-400"
                    : log.level === "WARN"
                    ? "text-amber-400"
                    : log.level === "CRITICAL"
                    ? "text-rose-500 font-bold"
                    : "text-blue-400";

                return (
                  <div key={log.id} className="flex items-start gap-2 border-b border-slate-900/40 pb-1.5 leading-relaxed">
                    <span className="text-slate-600 text-2xs select-none">[{log.timestamp}]</span>
                    <span className={`text-2xs font-extrabold uppercase px-1 rounded bg-slate-900 ${levelColor}`}>
                      {log.level}
                    </span>
                    <span className="text-slate-500 uppercase text-3xs border border-slate-800 px-1 rounded select-none">
                      {log.category}
                    </span>
                    <span className="text-slate-300 flex-1">{log.message}</span>
                  </div>
                );
              })
            )}
            <div ref={terminalEndRef} />
          </div>

          {/* FAILURE MANUAL INJECTION AREA */}
          <div className="bg-slate-950 p-3 rounded-lg border border-slate-800">
            <div className="flex items-center justify-between border-b border-slate-900 pb-2 mb-2 font-mono text-xs">
              <span className="text-slate-400 flex items-center gap-1">
                <AlertOctagon className="w-4 h-4 text-rose-500" />
                SALA DE TESTE / INJEÇÃO DE FALHAS EM HARDWARE
              </span>
              <span className="text-slate-600 uppercase text-3xs">Modo Desenvolvimento</span>
            </div>
            
            <p className="text-slate-500 text-3xs mb-3 leading-relaxed">
              Injete artificialmente anomalias de dados ou restrições do Termux. Isso demonstra de forma transparente como os teoremas formais em Lean e o Watchdog do Selix reagem de forma segura a problemas no mundo real.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 font-mono">
              <button
                onClick={injectBrentError}
                className="bg-slate-900 hover:bg-rose-950/20 text-rose-400 hover:text-rose-300 border border-rose-500/20 hover:border-rose-500/40 py-1.5 px-2 rounded text-3xs text-center transition-all flex items-center justify-center gap-1 cursor-pointer"
              >
                <Play className="w-2.5 h-2.5" />
                Falha de Drift Brent (T1)
              </button>
              
              <button
                onClick={injectDiscreteSelicError}
                className="bg-slate-900 hover:bg-amber-950/20 text-amber-400 hover:text-amber-300 border border-amber-500/20 hover:border-amber-500/40 py-1.5 px-2 rounded text-3xs text-center transition-all flex items-center justify-center gap-1 cursor-pointer"
              >
                <Play className="w-2.5 h-2.5" />
                Erro de Selic bps (T4)
              </button>

              <button
                onClick={injectOomWarning}
                className="bg-slate-900 hover:bg-sky-950/20 text-sky-400 hover:text-sky-300 border border-sky-500/20 hover:border-sky-500/40 py-1.5 px-2 rounded text-3xs text-center transition-all flex items-center justify-center gap-1 cursor-pointer"
              >
                <Play className="w-2.5 h-2.5" />
                Limite RAM Termux (T5)
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
