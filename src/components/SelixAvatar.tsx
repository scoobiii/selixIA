/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from "react";
import { animate, motion, useMotionValue, useTransform } from "motion/react";
import { Volume2, VolumeX, Sparkles, Terminal, Activity, MessageCircle } from "lucide-react";
import { subscribeSpeech, speak, cancelSpeech } from "../utils/speech";

export default function SelixAvatar() {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [spokenText, setSpokenText] = useState("");
  const [isMuted, setIsMuted] = useState(false);
  const [blink, setBlink] = useState(false);
  const [currentMouthPath, setCurrentMouthPath] = useState("M 85,95 Q 100,105 115,95 Q 100,97 85,95");
  const mouthCycleRef = useRef<number | null>(null);

  // Classic Lego Smile Grin (Idle)
  const idleMouth = "M 85,95 Q 100,105 115,95 Q 100,97 85,95";

  // Speaking mouth shapes for lip sync
  const mouthShapes = [
    "M 85,93 Q 100,118 115,93 Q 100,83 85,93", // A (Wide Open)
    "M 92,95 Q 100,108 108,95 Q 100,86 92,95", // O (Round Circle)
    "M 80,95 Q 100,101 120,95 Q 100,91 80,95", // E (Stretched wide)
    "M 88,96 Q 100,98 112,96 Q 100,96 88,96", // M (Closed/Pursed)
    "M 86,94 Q 100,108 114,94 Q 100,94 86,94"  // U/Woo (Tense open)
  ];

  // Self-introduction trigger
  const makeSelixIntroduceSelf = () => {
    speak(
      "Olá! Eu sou o Selix, seu agente inteligente de estabilidade econômica. Rigor matemático e transparência absoluta são meus pilares!",
      true
    );
  };

  // Subscribe to global speechSynthesis events to sync lips in real time
  useEffect(() => {
    const unsubscribe = subscribeSpeech((speaking, text) => {
      setIsSpeaking(speaking);
      setSpokenText(text);
    });

    return () => {
      unsubscribe();
    };
  }, []);

  // Eye blinking simulation
  useEffect(() => {
    const doBlink = () => {
      setBlink(true);
      setTimeout(() => setBlink(false), 150);
    };

    const interval = setInterval(() => {
      if (Math.random() > 0.4) {
        doBlink();
      }
    }, 4000);

    return () => clearInterval(interval);
  }, []);

  // Lip morphing sequencer when speaking
  useEffect(() => {
    if (isSpeaking) {
      let index = 0;
      const speakSequence = () => {
        // High fidelity rapid mouth shape switching to simulate true lip alignment
        const randomShapeIdx = Math.floor(Math.random() * mouthShapes.length);
        setCurrentMouthPath(mouthShapes[randomShapeIdx]);
        
        // Speed varying between 100ms - 180ms depending on speech cadence
        const nextSpeed = 100 + Math.random() * 80;
        mouthCycleRef.current = window.setTimeout(speakSequence, nextSpeed);
      };

      speakSequence();
    } else {
      if (mouthCycleRef.current) {
        clearTimeout(mouthCycleRef.current);
      }
      // Revert smoothly to cute icon lego smirk
      setCurrentMouthPath(idleMouth);
    }

    return () => {
      if (mouthCycleRef.current) {
        clearTimeout(mouthCycleRef.current);
      }
    };
  }, [isSpeaking]);

  return (
    <div className="bg-slate-950/60 border border-slate-800 rounded-lg p-3 flex flex-col md:flex-row gap-4 items-center relative overflow-hidden select-none" id="lego-agent-display-panel">
      {/* Dynamic sound equalizer lines running in background when speaking */}
      {isSpeaking && (
        <div className="absolute top-2 right-2 flex gap-0.5 items-end h-5 bg-indigo-950/20 px-2 rounded-full border border-indigo-900/30">
          <span className="text-[7px] text-indigo-400 font-mono font-bold uppercase tracking-wider mr-1 select-none">FALANDO:</span>
          <span className="w-[2px] h-3 bg-indigo-500 animate-[pulse_0.4s_infinite_alternate]" />
          <span className="w-[2px] h-4 bg-indigo-400 animate-[pulse_0.3s_infinite_alternate] [animation-delay:0.1s]" />
          <span className="w-[2px] h-1 bg-indigo-500 animate-[pulse_0.5s_infinite_alternate] [animation-delay:0.2s]" />
          <span className="w-[2px] h-3.5 bg-indigo-300 animate-[pulse_0.4s_infinite_alternate] [animation-delay:0.3s]" />
        </div>
      )}

      {/* Symmetrical Left Column: Lego figure render */}
      <div className="relative w-28 h-32 flex-shrink-0 cursor-pointer group mt-1" onClick={makeSelixIntroduceSelf} title="Clique para ouvir minha voz central!">
        <div className="absolute inset-0 bg-indigo-500/5 rounded-full filter blur-xl group-hover:bg-indigo-500/10 transition-all" />
        
        <svg 
          viewBox="0 0 200 220" 
          className="w-full h-full relative z-10 filter drop-shadow-[0_4px_12px_rgba(0,0,0,0.5)] transform group-hover:scale-105 transition-transform duration-300"
          id="lego-agent-vector-interactive-mouth"
        >
          {/* Lego stud on top under hair */}
          <rect x="86" y="32" width="28" height="12" rx="3" fill="#dfb300" stroke="#b08600" strokeWidth="1.5" />
          
          {/* Yellow Lego Head Base shape */}
          <rect x="62" y="42" width="76" height="70" rx="18" fill="#ffcd00" stroke="#cc9600" strokeWidth="2" />
          
          {/* Spiky Black Hair exactly matching photo */}
          <path 
            className="fill-slate-900 stroke-black stroke-[1.5]"
            d="M 52,50 
               Q 44,32 60,25
               Q 75,20 85,28
               Q 92,12 112,18
               Q 125,10 138,28
               Q 148,34 144,52
               Q 150,56 142,65
               Q 135,70 134,60
               Q 130,44 116,42
               Q 110,35 100,44
               Q 88,34 76,44
               Q 66,40 60,52
               Q 54,62 52,50 Z" 
          />

          {/* Stubble beard details on chin */}
          <path 
            className="stroke-slate-700 stroke-1 fill-none stroke-dasharray-[2,3]"
            strokeDasharray="2,2"
            d="M 66,80 Q 72,110 100,110 Q 128,110 134,84 M 68,90 Q 80,111 100,111 Q 120,111 132,90"
          />

          {/* Eyebrows */}
          <rect x="73" y="66" width="16" height="4" rx="2" fill="#1e1e1e" transform="rotate(-5 81 68)" />
          <rect x="111" y="66" width="16" height="4" rx="2" fill="#1e1e1e" transform="rotate(5 119 68)" />

          {/* Blink-capable Lego Eyes */}
          {blink ? (
            <>
              {/* Closed eyes slits */}
              <line x1="74" y1="76" x2="88" y2="76" stroke="#1e1e1e" strokeWidth="3" strokeLinecap="round" />
              <line x1="112" y1="76" x2="126" y2="76" stroke="#1e1e1e" strokeWidth="3" strokeLinecap="round" />
            </>
          ) : (
            <>
              {/* Left eye with white focus highlight gloss */}
              <circle cx="81" cy="76" r="5" fill="#1e1e1e" />
              <circle cx="79.5" cy="74.5" r="1.5" fill="#ffffff" />
              {/* Right eye with white focus highlight gloss */}
              <circle cx="119" cy="76" r="5" fill="#1e1e1e" />
              <circle cx="117.5" cy="74.5" r="1.5" fill="#ffffff" />
            </>
          )}

          {/* THE MOUTH - Animated in real-time or sequence */}
          <motion.path 
            d={currentMouthPath}
            fill={isSpeaking ? "#991b1b" : "#1e1e1e"} // Deep red backing when open laughing
            stroke="#1e1e1e" 
            strokeWidth="2.5" 
            strokeLinecap="round"
            transition={{ type: "spring", stiffness: 350, damping: 20 }}
          />

          {/* Little white teeth highlight inside mouth if speaking */}
          {isSpeaking && (
            <rect x="94" y="93" width="12" height="3" fill="#ffffff" rx="1" />
          )}

          {/* Neck collar connector */}
          <rect x="88" y="112" width="24" height="12" rx="2" fill="#ebebeb" stroke="#b3b3b3" strokeWidth="1.5" />

          {/* Torso */}
          <path 
            className="fill-slate-100 stroke-slate-300 stroke-[1.5]"
            d="M 80,123 L 120,123 L 148,195 L 52,195 Z" 
          />

          {/* Torso Graphics Content: I ❤️ SELIX */}
          
          {/* Little green check checkmark box on the left breast of the shirt */}
          <rect x="65" y="140" width="10" height="12" fill="#e2e8f0" stroke="#94a3b8" strokeWidth="1" rx="1" />
          <path d="M 67,146 L 69,149 L 73,142" stroke="#22c55e" strokeWidth="1.5" fill="none" strokeLinecap="round" />

          {/* Letter 'I' */}
          <text x="81" y="152" fill="#111827" fontSize="12" fontWeight="900" fontFamily="sans-serif">I</text>
          
          {/* Pulsing Red Heart */}
          <path 
            className="fill-red-500 animate-pulse"
            d="M 94,142 C 92,139 88,139 86,141 C 84,143 84,147 86,149 L 94,156 L 102,149 C 104,147 104,143 102,141 C 100,139 96,139 94,142 Z" 
          />

          {/* "SELIX" bold lettering */}
          <text x="68" y="172" fill="#111827" fontSize="11" fontWeight="900" fontFamily="monospace" letterSpacing="0.5">SELIX</text>
        </svg>

        {/* Hover voice suggestion label */}
        <div className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 bg-slate-900 border border-indigo-500/20 text-[7px] text-indigo-400 font-mono font-bold py-0.5 px-2 rounded-full whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity">
          OUVIR AGENTE 🔊
        </div>
      </div>

      {/* Right Column: Mini Whiteboard with Lean4 checkmarks, console description */}
      <div className="flex-1 space-y-2 text-left w-full">
        {/* Profile title */}
        <div className="flex items-center gap-1.5 justify-between">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            <span className="text-[10px] font-bold text-slate-200 tracking-wide font-sans">SELIX AGENTE COGNITIVO</span>
          </div>
          <span className="text-[8px] px-1.5 py-0.5 rounded bg-slate-900 text-slate-500 font-mono">ID: AGENTE_LEO</span>
        </div>

        {/* Dynamic speech bubble if talking, or custom mission board */}
        {isSpeaking ? (
          <div className="bg-gradient-to-r from-indigo-950/40 via-purple-950/30 to-slate-950 rounded p-2.5 border border-indigo-900/40 animate-fade-in space-y-1">
            <div className="flex items-center gap-1 text-[7px] text-indigo-400 font-mono uppercase tracking-wider">
              <MessageCircle className="w-3 h-3 text-indigo-400 animate-bounce" />
              Sincronização de Lábios Ativa:
            </div>
            <p className="text-[9px] text-indigo-200 leading-normal font-sans line-clamp-2 italic italic-line italic-color">
              "{spokenText}"
            </p>
          </div>
        ) : (
          <div className="bg-slate-900/80 rounded border border-slate-800 p-2.5 text-3xs font-mono text-slate-400 leading-relaxed grid grid-cols-2 gap-2">
            <div>
              <span className="text-[8px] text-slate-200 font-bold block mb-1">MÉTRICAS COPORATIVAS:</span>
              <ul className="space-y-0.5 text-[8px]">
                <li className="text-emerald-400">✔ Rigor Lean 4 Concluído</li>
                <li className="text-emerald-400">✔ Modelos Taylor Auditados</li>
                <li className="text-emerald-400">✔ Reservas Fiscais Certas</li>
              </ul>
            </div>
            <div className="border-l border-slate-800 pl-2">
              <span className="text-[8px] text-slate-200 font-bold block mb-1">PROVAS LEAN 4:</span>
              <span className="text-[8px] text-purple-400 font-mono block">thm1_zero_fallback [OK]</span>
              <span className="text-[8px] text-sky-400 font-mono block">thm2_brent_safety [OK]</span>
            </div>
          </div>
        )}

        <div className="text-[8px] text-slate-500 font-sans leading-tight">
          Agente LEGO calibrado para agir com rigor matemático e providor lógico. Fale livremente no chat abaixo e veja o avatar simular a movimentação labial em tempo real ao narrar respostas.
        </div>
      </div>
    </div>
  );
}
