/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from "react";
import { Terminal, ShieldCheck, Database, RefreshCw, Cpu, Activity, Play, AlertOctagon, Info, Volume2 } from "lucide-react";
import { LogEntry, LogCategory, LogLevel, WatchdogState } from "../db/types";
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
}

export default function ConsolaLog({
  logs,
  watchdog,
  onTriggerSelfHeal,
  onInjectLog,
  brent,
  selic,
}: ConsolaLogProps) {
  const [filterCategory, setFilterCategory] = useState<LogCategory | "ALL">("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [isHealing, setIsHealing] = useState(false);
  const terminalEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to top when a new log appears (logs is descending/unshifted)
  useEffect(() => {
    // Optional: could flash terminal header
  }, [logs]);

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
      {/* Title with speak button */}
      <div className="flex items-center gap-2 border-b border-slate-800 pb-2">
        <span className="p-1.5 rounded bg-slate-950 text-emerald-400">
          <Terminal className="w-4 h-4" />
        </span>
        <div>
          <div className="flex items-center gap-1.5">
            <h3 className="font-semibold text-slate-100 font-mono text-xs uppercase">Terminal & Auto-Heal Watchdog</h3>
            <button
              type="button"
              onClick={() => speak(SPEECH_GUIDES.watchdog(watchdog.status, watchdog.ramUsed), true)}
              className="p-0.5 rounded text-slate-500 hover:text-emerald-400 hover:bg-emerald-950/45 transition-colors cursor-pointer"
              title="Ouvir explicação do console Termux"
            >
              <Volume2 className="w-3.5 h-3.5" />
            </button>
          </div>
          <p className="text-3xs text-slate-500 font-mono">MONITORAMENTO DE HARDWARE RESTRITO A 384MB DE RAM NO ANDROID A23</p>
        </div>
      </div>

      {/* HEADER telemetry */}
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
              className={`px-2 py-1 rounded transition-all select-none ${
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

      {/* TERMINAL CRT INTERACTIVE MONITOR SCREEN */}
      <div className="bg-slate-950 rounded-xl border border-slate-800 p-4 h-64 overflow-y-auto font-mono flex flex-col gap-2 shadow-inner text-xs relative select-text" id="crt-terminal-screen">
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
            className="bg-slate-900 hover:bg-rose-950/20 text-rose-400 hover:text-rose-300 border border-rose-500/20 hover:border-rose-500/40 py-1.5 px-2 rounded text-3xs text-center transition-all flex items-center justify-center gap-1"
          >
            <Play className="w-2.5 h-2.5" />
            Falha de Drift Brent (T1)
          </button>
          
          <button
            onClick={injectDiscreteSelicError}
            className="bg-slate-900 hover:bg-amber-950/20 text-amber-400 hover:text-amber-300 border border-amber-500/20 hover:border-amber-500/40 py-1.5 px-2 rounded text-3xs text-center transition-all flex items-center justify-center gap-1"
          >
            <Play className="w-2.5 h-2.5" />
            Erro de Selic bps (T4)
          </button>

          <button
            onClick={injectOomWarning}
            className="bg-slate-900 hover:bg-sky-950/20 text-sky-400 hover:text-sky-300 border border-sky-500/20 hover:border-sky-500/40 py-1.5 px-2 rounded text-3xs text-center transition-all flex items-center justify-center gap-1"
          >
            <Play className="w-2.5 h-2.5" />
            Limite RAM Termux (T5)
          </button>
        </div>
      </div>
    </div>
  );
}
