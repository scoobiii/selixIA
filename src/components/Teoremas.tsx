/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { BookOpen, Shield, Code, CheckCircle2, ArrowRight, Volume2 } from "lucide-react";
import { THEOREMS } from "../utils/economicData";
import { speak, SPEECH_GUIDES } from "../utils/speech";

export default function Teoremas() {
  const [selectedTheoremId, setSelectedTheoremId] = useState(THEOREMS[0].id);

  const activeTheorem = THEOREMS.find((t) => t.id === selectedTheoremId) || THEOREMS[0];

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-2xl relative overflow-hidden" id="lean-proof-grounds">
      {/* Background radial highlight */}
      <div className="absolute top-0 right-0 w-44 h-44 bg-violet-600/5 blur-3xl rounded-full pointer-events-none" />

      <div className="flex items-center gap-2 border-b border-slate-800 pb-3 mb-4">
        <span className="p-1.5 rounded bg-violet-950 text-violet-400">
          <BookOpen className="w-5 h-5" />
        </span>
        <div>
          <div className="flex items-center gap-1.5">
            <h3 className="font-semibold text-slate-100 font-mono text-sm">Provas Formais & Provador Lean</h3>
            <button
              type="button"
              onClick={() => speak("Ambiente informativo e interativo do provador estrutural Lean 4. Aqui você confere as provas formais de consistência econômica do Selix.", true)}
              className="p-0.5 rounded text-slate-500 hover:text-violet-400 hover:bg-violet-950/45 transition-colors cursor-pointer"
              title="Ouvir introdução por voz de provas Lean"
            >
              <Volume2 className="w-3.5 h-3.5" />
            </button>
          </div>
          <p className="text-3xs text-slate-500 font-mono">SEGURANÇA MATEMÁTICA E COERÊNCIA INTEGRAL</p>
        </div>
      </div>

      <p className="text-slate-400 text-xs mb-5 leading-relaxed">
        O Selix foi validado matematicamente utilizando o provador de teoremas formal de código aberto <span className="font-semibold text-violet-400">Lean 4</span>. Estas provas provêm consistência irrefutável para o preventor de falhas em hardware limitado e garantem integridade dos dados coletados sem alucinamento.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6" id="theorems-grid">
        {/* Sidebar Selector list */}
        <div className="flex flex-col gap-2 font-mono" id="theorems-sidebar-list">
          <div className="text-3xs text-slate-500 font-bold uppercase tracking-widest pl-1 mb-1">TEOREMAS MATEMÁTICOS</div>
          {THEOREMS.map((theorem) => (
            <button
              key={theorem.id}
              onClick={() => setSelectedTheoremId(theorem.id)}
              className={`text-start px-3 py-2.5 rounded border transition-all text-2xs flex flex-col justify-center relative ${
                selectedTheoremId === theorem.id
                  ? "bg-violet-950/40 border-violet-500/50 text-violet-300"
                  : "bg-slate-950 border-slate-900 text-slate-400 hover:text-slate-200 hover:bg-slate-800/50"
              }`}
            >
              <div className="font-semibold">{theorem.name.split(":")[0]}</div>
              <div className="text-slate-500 text-3xs mt-0.5 truncate max-w-[200px]">{theorem.name.split(":")[1].trim()}</div>
              {selectedTheoremId === theorem.id && (
                <div className="absolute right-2 top-1/2 -translate-y-1/2 w-1.5 h-1.5 bg-violet-400 rounded-full" />
              )}
            </button>
          ))}
        </div>

        {/* Content Viewer pane */}
        <div className="md:col-span-2 flex flex-col gap-4" id="theorems-content-pane">
          {/* Proof Explanation */}
          <div className="bg-slate-950 p-4 border border-slate-800 rounded-lg">
            <div className="text-violet-400 font-bold font-mono text-xs mb-1 uppercase tracking-wider flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <Shield className="w-4 h-4 text-violet-400" />
                <span>{activeTheorem.name}</span>
              </div>
              <button
                type="button"
                onClick={() => speak(SPEECH_GUIDES.theorem(activeTheorem.name, activeTheorem.description), true)}
                className="p-1 rounded text-slate-400 hover:text-violet-300 hover:bg-violet-950/50 transition-all flex items-center gap-1 cursor-pointer text-4xs font-mono"
                title="Ouvir explicação do teorema ativo por voz"
              >
                <Volume2 className="w-3.5 h-3.5" />
                <span>Explicação por voz</span>
              </button>
            </div>
            <p className="text-slate-300 text-xs leading-relaxed mb-3">
              {activeTheorem.description}
            </p>

            {/* Visual Logic Flowchart Infographic */}
            <div className="bg-slate-900 border border-slate-800 p-2.5 rounded flex items-center gap-2.5 font-mono text-3xs text-violet-300">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
              <div className="flex-1">
                <span className="text-slate-500 uppercase tracking-widest block text-4xs font-bold leading-none mb-1">CONVERGÊNCIA VISUAL</span>
                {activeTheorem.visualProof}
              </div>
            </div>
          </div>

          {/* Code panel with Lean definition */}
          <div className="bg-slate-950 border border-slate-850 rounded-lg overflow-hidden flex flex-col flex-1">
            <div className="bg-slate-900 border-b border-slate-850 px-3.5 py-2 flex items-center justify-between font-mono text-3xs">
              <div className="flex items-center gap-1.5 text-slate-400 font-medium select-none">
                <Code className="w-3.5 h-3.5 text-violet-400" />
                selix_theorems_proofs.lean
              </div>
              <div className="text-slate-500 uppercase">LEAN 4 CORE</div>
            </div>
            
            <pre className="p-4 overflow-x-auto text-3xs font-mono text-violet-300/90 leading-normal select-text flex-1 min-h-[160px] bg-slate-950/60 font-medium">
              <code>{activeTheorem.leanCode}</code>
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
}
