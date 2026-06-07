/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import { Volume2, VolumeX, Radio, Play, Pause, Square, HelpCircle, Sparkles, Navigation } from "lucide-react";
import { speak, cancelSpeech, SPEECH_GUIDES, getMuteState, setMuteState } from "../utils/speech";

interface GuiaDeVozProps {
  brent: number;
  selic: number;
  sentiment: number;
  watchdogStatus: string;
  watchdogRam: number;
}

export default function GuiaDeVoz({
  brent,
  selic,
  sentiment,
  watchdogStatus,
  watchdogRam,
}: GuiaDeVozProps) {
  const [isMuted, setIsMuted] = useState(getMuteState());
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [activeGuideKey, setActiveGuideKey] = useState<string | null>(null);

  // Sync with global state
  useEffect(() => {
    setMuteState(isMuted);
  }, [isMuted]);

  const handleSpeak = (text: string, key: string) => {
    if (isMuted) {
      // Automatically unmute if user explicitly clicks a voice guide button
      setIsMuted(false);
      setMuteState(false);
    }
    
    setActiveGuideKey(key);
    speak(
      text,
      true, // force speak (will ignore mute state since we just unmuted it)
      () => setIsSpeaking(true),
      () => {
        setIsSpeaking(false);
        setActiveGuideKey(null);
      }
    );
  };

  const handleStop = () => {
    cancelSpeech();
    setIsSpeaking(false);
    setActiveGuideKey(null);
  };

  const toggleMute = () => {
    const nextMute = !isMuted;
    setIsMuted(nextMute);
    if (nextMute) {
      handleStop();
    } else {
      // Speak quick confirmation feedback
      speak("Guia de voz ativado. Clique nos botões para ouvir.", true, () => setIsSpeaking(true), () => setIsSpeaking(false));
    }
  };

  // Quick tours mapping
  const tours = [
    {
      key: "welcome",
      label: "Apresentar Selix",
      text: SPEECH_GUIDES.welcome,
      icon: "🧠"
    },
    {
      key: "brent",
      label: "Petróleo Brent",
      text: SPEECH_GUIDES.brent(brent),
      icon: "🛢️"
    },
    {
      key: "selic",
      label: "Taxa SELIC",
      text: SPEECH_GUIDES.selic(selic),
      icon: "🇧🇷"
    },
    {
      key: "sentiment",
      label: "Sentimento de Mercado",
      text: SPEECH_GUIDES.sentiment(sentiment),
      icon: "📈"
    },
    {
      key: "watchdog",
      label: "Watchdog & RAM",
      text: SPEECH_GUIDES.watchdog(watchdogStatus, watchdogRam),
      icon: "💻"
    },
    {
      key: "theorem",
      label: "Teoremas Lean 4",
      text: SPEECH_GUIDES.theorem("Teorema 1: Zero Fallback", "Formally guarantees that Selix never hallucinates or leaks economic stats."),
      icon: "📐"
    },
    {
      key: "rag_assistant",
      label: "Assistente RAG",
      text: SPEECH_GUIDES.rag_assistant,
      icon: "🤖"
    },
    {
      key: "bluesky",
      label: "Simulador Bluesky",
      text: SPEECH_GUIDES.bluesky,
      icon: "🦋"
    },
    {
      key: "mme_scenario",
      label: "Cenário MME",
      text: SPEECH_GUIDES.mme_scenario || "Cenário especial MME ativo.",
      icon: "🧪"
    },
    {
      key: "empresas_rj",
      label: "Empresas em R.J.",
      text: (SPEECH_GUIDES as any).empresas_rj ? (SPEECH_GUIDES as any).empresas_rj(selic) : "Análise e projeção de custo de capital das empresas brasileiras sob regime de Recuperação Judicial.",
      icon: "🏢"
    }
  ];

  return (
    <div className="bg-slate-900 border border-violet-500/20 rounded-xl p-4 shadow-2xl relative overflow-hidden" id="voice-assistant-guide">
      {/* Glow effect */}
      <div className="absolute top-0 right-0 w-24 h-24 bg-violet-600/5 blur-2xl rounded-full" />
      
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
        {/* Left info, volume toggle and live soundwave equalizer animation */}
        <div className="flex items-center gap-3">
          <button
            onClick={toggleMute}
            className={`p-2.5 rounded-lg border transition-all cursor-pointer ${
              isMuted
                ? "bg-slate-950 border-slate-800 text-slate-500 hover:text-slate-300"
                : "bg-violet-950 border-violet-500/30 text-violet-400"
            }`}
            title={isMuted ? "Ativar Guia por Voz" : "Mutar Guia de Voz"}
          >
            {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5 animate-bounce" />}
          </button>
          
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs font-extrabold text-slate-200">Guia de Explanação por Voz</span>
              {isSpeaking && (
                <span className="text-4xs font-bold font-mono bg-violet-950 text-violet-300 border border-violet-800/40 px-1.5 py-0.5 rounded uppercase animate-pulse flex items-center gap-1">
                  <Radio className="w-2.5 h-2.5 text-violet-400 animate-ping" />
                  NARRANDO
                </span>
              )}
            </div>
            <p className="text-3xs text-slate-400 leading-relaxed max-w-md">
              Módulo de áudio síntese para acessibilidade cognitiva. Clique nos tópicos para ouvir a explanação guiada do Selix em tempo real.
            </p>
          </div>
        </div>

        {/* Dynamic sound equalizer graphic */}
        <div className="flex items-center gap-2">
          {isSpeaking && (
            <div className="flex items-end gap-1 h-6 px-3 bg-slate-950/60 border border-slate-800/40 rounded-lg justify-center select-none font-mono">
              <span className="text-4xs text-slate-500 font-bold uppercase mr-1 animate-pulse">SAÍDA VOCAL</span>
              <div className="w-[3px] bg-violet-400 rounded-full h-1 animate-[pulse_0.6s_infinite_alternate]" style={{ animationDelay: "0.1s" }} />
              <div className="w-[3px] bg-violet-500 rounded-full h-3 animate-[pulse_0.5s_infinite_alternate]" style={{ animationDelay: "0.3s" }} />
              <div className="w-[3px] bg-violet-400 rounded-full h-2 animate-[pulse_0.7s_infinite_alternate]" style={{ animationDelay: "0.2s" }} />
              <div className="w-[3px] bg-violet-300 rounded-full h-4 animate-[pulse_0.4s_infinite_alternate]" style={{ animationDelay: "0.5s" }} />
              <div className="w-[3px] bg-violet-500 rounded-full h-1 animate-[pulse_0.6s_infinite_alternate]" style={{ animationDelay: "0.1s" }} />
            </div>
          )}

          {isSpeaking && (
            <button
              onClick={handleStop}
              className="bg-rose-950 hover:bg-rose-900 border border-rose-500/20 text-rose-400 font-semibold px-2.5 py-1.5 rounded text-3xs font-mono transition-all flex items-center gap-1 cursor-pointer"
            >
              <Square className="w-3 h-3 fill-rose-400" />
              PARAR SÍNTESE
            </button>
          )}
        </div>
      </div>

      {/* Grid of guide buttons */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 lg:grid-cols-9 gap-2 mt-3 font-mono text-3xs" id="voice-tours-grid">
        {tours.map((tour) => {
          const isActive = activeGuideKey === tour.key;
          return (
            <button
              key={tour.key}
              onClick={() => handleSpeak(tour.text, tour.key)}
              className={`px-2.5 py-2 rounded border text-left transition-all relative flex flex-col justify-between h-14 ${
                isActive
                  ? "bg-violet-950 border-violet-400/50 text-violet-300"
                  : "bg-slate-950 border-slate-850 hover:bg-slate-850 text-slate-400 hover:text-slate-200"
              }`}
            >
              <span className="text-sm select-none">{tour.icon}</span>
              <div className="flex items-center justify-between w-full">
                <span className="font-semibold block truncate select-none">{tour.label}</span>
                <Play className={`w-2.5 h-2.5 text-slate-500 ${isActive ? "text-violet-400 fill-violet-400" : ""}`} />
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
