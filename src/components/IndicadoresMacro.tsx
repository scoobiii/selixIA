/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { TrendingUp, Droplet, DollarSign, Calendar, Calculator, Activity, HelpCircle, Volume2, Flame, ShieldCheck, Award } from "lucide-react";
import { EconomicRecord } from "../db/types";
import { simulateMonteCarlo, calculateTaylorRule } from "../utils/economicData";
import { speak, SPEECH_GUIDES } from "../utils/speech";

interface IndicadoresMacroProps {
  data: EconomicRecord[];
  brent: number;
  ttf: number;
  selic: number;
  sentiment: number;
  rating: string;
  investmentGrade: boolean;
  onUpdateBrent: (val: number) => void;
  onUpdateTtf: (val: number) => void;
  onUpdateSelic: (val: number) => void;
  onUpdateSentiment?: (val: number) => void;
}

export default function IndicadoresMacro({
  data,
  brent,
  ttf,
  selic,
  sentiment,
  rating,
  investmentGrade,
  onUpdateBrent,
  onUpdateTtf,
  onUpdateSelic,
  onUpdateSentiment,
}: IndicadoresMacroProps) {
  // Monte Carlo state
  const [simulationPaths, setSimulationPaths] = useState<number[][]>([]);
  const [isSimulating, setIsSimulating] = useState(false);

  // Taylor Rule Calculator state
  const [inflationInput, setInflationInput] = useState(3.85); // IPCA %
  const [outputGapInput, setOutputGapInput] = useState(-0.75); // GDP gap %

  // Calculate Taylor rule theoretical rate
  const theoreticalSelic = calculateTaylorRule(inflationInput, outputGapInput);

  // Trigger Monte Carlo simulations for Brent
  const runBrentSimulation = () => {
    setIsSimulating(true);
    const paths = simulateMonteCarlo(brent, 10, 6); // 10 days, 6 paths
    setSimulationPaths(paths);
    setTimeout(() => setIsSimulating(false), 800);
  };

  // Clear Monte Carlo paths
  const clearSimulation = () => {
    setSimulationPaths([]);
  };

  // Find max and min in historic data for SVG scaling
  const brentValues = data.map((d) => d.brent);
  const maxBrent = Math.max(...brentValues, 90) + 2;
  const minBrent = Math.min(...brentValues, 75) - 2;

  // Generate main Brent line coordinates
  const width = 500;
  const height = 180;
  const padding = 30;

  const getX = (index: number) => padding + (index * (width - padding * 2)) / (data.length - 1);
  const getY = (val: number) => height - padding - ((val - minBrent) * (height - padding * 2)) / (maxBrent - minBrent);

  const mainPathPoints = data
    .map((d, i) => `${getX(i).toFixed(1)},${getY(d.brent).toFixed(1)}`)
    .join(" L ");

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6" id="macro-dashboard-grid">
      {/* SECTION 1: BRENT CRUDE OIL MONITOR */}
      <div className="bg-slate-900 border border-emerald-500/20 rounded-xl p-5 shadow-2xl relative overflow-hidden" id="brent-monitor-card">
        <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 blur-3xl rounded-full" />
        
        <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded bg-emerald-950 text-emerald-400">
              <Droplet className="w-5 h-5" />
            </span>
            <div>
              <div className="flex items-center gap-1.5 animate-fade-in">
                <h3 className="font-semibold text-slate-100">Brent Crude Oil</h3>
                <button
                  type="button"
                  onClick={() => speak(SPEECH_GUIDES.brent(brent), true)}
                  className="p-0.5 rounded text-slate-500 hover:text-emerald-400 hover:bg-emerald-950/45 transition-colors cursor-pointer"
                  title="Ouvir explicação por voz"
                >
                  <Volume2 className="w-3.5 h-3.5" />
                </button>
              </div>
              <p className="text-xs text-slate-500 font-mono">DADO INTEGRAL (MAIOR-MÓVEL)</p>
            </div>
          </div>
          <div className="text-right font-mono">
            <span className="text-xs text-slate-400">ATIVO ATUAL</span>
            <div className="text-xl font-bold text-emerald-400 flex items-center gap-1 justify-end">
              <DollarSign className="w-4 h-4 opacity-75" />
              {brent.toFixed(2)}
            </div>
          </div>
        </div>

        {/* Dynamic Controls */}
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div className="bg-slate-950 p-2.5 rounded border border-slate-800 font-mono text-xs">
            <label className="text-slate-400 block mb-1">MANUAL VALUE (USD)</label>
            <div className="flex items-center gap-2">
              <input
                type="range"
                min="70"
                max="100"
                step="0.1"
                value={brent}
                onChange={(e) => onUpdateBrent(parseFloat(e.target.value))}
                className="w-full accent-emerald-400"
              />
              <span className="text-emerald-400 font-bold whitespace-nowrap">{brent.toFixed(1)}</span>
            </div>
          </div>

          <div className="bg-slate-950 p-2.5 rounded border border-slate-800 flex flex-col justify-center">
            <div className="flex gap-1.5">
              <button
                onClick={runBrentSimulation}
                disabled={isSimulating}
                className="text-2xs font-mono bg-emerald-950 hover:bg-emerald-900 text-emerald-400 border border-emerald-500/30 font-semibold py-1 px-2.5 rounded transition-all flex-1"
              >
                {isSimulating ? "SIMULANDO..." : "MONTE CARLO"}
              </button>
              {simulationPaths.length > 0 && (
                <button
                  onClick={clearSimulation}
                  className="text-2xs font-mono bg-slate-950 hover:bg-slate-900 text-slate-400 border border-slate-800 py-1 px-1.5 rounded transition-all"
                >
                  CLEAR
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Live Vector Graphic SVG */}
        <div className="bg-slate-950 rounded border border-slate-800 p-2 relative h-48 flex flex-col justify-end">
          <div className="absolute top-2 left-2 font-mono text-2xs text-slate-500">
            INTERVALO: 10 DIAS | CONVERSÃO CONVERCENTE (σ:{2.5})
          </div>
          
          <svg className="w-full h-full" viewBox={`0 0 ${width} ${height}`}>
            {/* Grid Rules */}
            <line x1={padding} y1={getY(80)} x2={width - padding} y2={getY(80)} stroke="#1e293b" strokeDasharray="3,3" />
            <line x1={padding} y1={getY(85)} x2={width - padding} y2={getY(85)} stroke="#1e293b" strokeDasharray="3,3" />
            <line x1={padding} y1={getY(75)} x2={width - padding} y2={getY(75)} stroke="#1e293b" strokeDasharray="3,3" />

            {/* Standard Deviation Band (Shadow Glow) */}
            <rect
              x={padding}
              y={getY(brent + 2.5)}
              width={width - padding * 2}
              height={Math.max(10, getY(brent - 2.5) - getY(brent + 2.5))}
              fill="#10b981"
              fillOpacity="0.03"
            />

            {/* Monte Carlo Simulated Paths */}
            {simulationPaths.map((path, pIdx) => {
              const simPoints = path
                .map((val, step) => {
                  const stepX = getX(data.length - 1) + (step * (width - padding * 2)) / (12 * 2);
                  const stepY = getY(val);
                  return `${stepX.toFixed(1)},${stepY.toFixed(1)}`;
                })
                .join(" L ");

              return (
                <path
                  key={pIdx}
                  d={`M ${simPoints}`}
                  fill="none"
                  stroke="rgba(16, 185, 129, 0.35)"
                  strokeWidth="1.5"
                  strokeDasharray="2,2"
                />
              );
            })}

            {/* Historical Brent Price Line */}
            {mainPathPoints && (
              <path
                d={`M ${mainPathPoints}`}
                fill="none"
                stroke="#10b981"
                strokeWidth="2.5"
                className="drop-shadow-[0_2px_8px_rgba(16,185,129,0.5)]"
              />
            )}

            {/* Data Dots */}
            {data.map((d, i) => (
              <circle
                key={i}
                cx={getX(i)}
                cy={getY(d.brent)}
                r="3"
                className="fill-emerald-400 hover:r-5 transition-all outline-none"
              />
            ))}

            {/* Simulated Path Indicator Label */}
            {simulationPaths.length > 0 && (
              <text
                x={width - padding - 70}
                y={padding + 25}
                fill="#10b981"
                fontSize="8"
                fontFamily="monospace"
                opacity="0.8"
              >
                PROJEÇÃO MONTE CARLO
              </text>
            )}
          </svg>
        </div>
      </div>

      {/* SECTION 1B: TTF EUROPEAN NATURAL GAS MONITOR */}
      <div className="bg-slate-900 border border-cyan-500/20 rounded-xl p-5 shadow-2xl relative overflow-hidden" id="ttf-monitor-card">
        <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-500/5 blur-3xl rounded-full" />
        
        <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded bg-cyan-950 text-cyan-400">
              <Flame className="w-5 h-5" />
            </span>
            <div>
              <div className="flex items-center gap-1.5">
                <h3 className="font-semibold text-slate-100 font-sans">TTF Natural Gas</h3>
                <button
                  type="button"
                  onClick={() => speak(SPEECH_GUIDES.ttf(ttf), true)}
                  className="p-0.5 rounded text-slate-500 hover:text-cyan-400 hover:bg-cyan-950/45 transition-colors cursor-pointer"
                  title="Ouvir explicação do TTF Natural Gas por voz"
                >
                  <Volume2 className="w-3.5 h-3.5" />
                </button>
              </div>
              <p className="text-xs text-slate-500 font-mono">INDEXADOR ENERGÉTICO EUROPEU (EUR/MWh)</p>
            </div>
          </div>
          <div className="text-right font-mono">
            <span className="text-xs text-slate-400 font-bold block mb-0.5">ATIVO ATUAL</span>
            <div className="text-xl font-bold text-cyan-400 flex items-center gap-1 justify-end">
              <span>€</span>
              {ttf.toFixed(2)}
            </div>
          </div>
        </div>

        {/* Ranger control manual */}
        <div className="bg-slate-950 p-3 rounded border border-slate-800 font-mono text-xs mb-4">
          <div className="flex items-center justify-between mb-1">
            <label className="text-slate-400 uppercase">MANUAL VALUE (EUR/MWh)</label>
            <span className="text-cyan-400 font-bold">{ttf.toFixed(1)} €</span>
          </div>
          <input
            type="range"
            min="15"
            max="65"
            step="0.1"
            value={ttf}
            onChange={(e) => onUpdateTtf(parseFloat(e.target.value))}
            className="w-full accent-cyan-400"
          />
          <p className="text-slate-500 text-3xs text-right mt-1 italic">Rastreamento de gás natural em EUR/MWh</p>
        </div>

        {/* Sparkline visualization of Natural Gas */}
        <div className="bg-slate-950 rounded border border-slate-850 p-3 h-48 flex flex-col justify-end relative">
          <div className="absolute top-2 left-2 font-mono text-3xs text-slate-500 leading-none">
            REPRESENTAÇÃO DE AMOSTRAGEM: 10 DIAS | VOLATIBILIDADE SENSÍVEL
          </div>

          <div className="flex items-center justify-between h-full pt-6">
            <div className="w-full h-32 flex items-end gap-1.5" id="gas-bars">
              {[31.50, 32.10, 33.40, 32.80, 34.00, 34.90, 35.20, 36.10, 34.80, ttf].map((val, idx) => {
                const percent = ((val - 15) / (65 - 15)) * 100;
                const isLatest = idx === 9;
                return (
                  <div key={idx} className="flex-1 flex flex-col items-center h-full justify-end">
                    <div 
                      style={{ height: `${Math.max(5, percent)}%` }}
                      className={`w-full rounded-t transition-all duration-300 ${isLatest ? 'bg-gradient-to-t from-cyan-600 to-cyan-400 shadow-[0_0_8px_rgba(34,211,238,0.4)]' : 'bg-slate-800 hover:bg-slate-700'}`}
                    />
                    <span className="text-[7.5px] font-mono text-slate-500 mt-1">D{idx+1}</span>
                  </div>
                );
              })}
            </div>
          </div>
          
          <div className="flex items-center justify-between mt-2 border-t border-slate-900 pt-1.5 text-4xs font-mono text-slate-500">
            <span>RESISTÊNCIA CRÍTICA: €50.00</span>
            <span>MÉDIA REGRESSIVA: €34.05</span>
          </div>
        </div>
      </div>

      {/* SECTION 2: BRASIL TAXA SELIC MONITOR & TAYLOR RULE */}
      <div className="bg-slate-900 border border-sky-500/20 rounded-xl p-5 shadow-2xl relative overflow-hidden" id="selic-monitor-card">
        <div className="absolute top-0 right-0 w-32 h-32 bg-sky-500/5 blur-3xl rounded-full" />

        <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded bg-sky-950 text-sky-400">
              <TrendingUp className="w-5 h-5" />
            </span>
            <div>
              <div className="flex items-center gap-1.5">
                <h3 className="font-semibold text-slate-100">Taxa SELIC</h3>
                <button
                  type="button"
                  onClick={() => speak(SPEECH_GUIDES.selic(selic), true)}
                  className="p-0.5 rounded text-slate-500 hover:text-sky-400 hover:bg-sky-950/45 transition-colors cursor-pointer"
                  title="Ouvir explicação por voz de taxa Selic"
                >
                  <Volume2 className="w-3.5 h-3.5" />
                </button>
              </div>
              <p className="text-xs text-slate-500 font-mono">AUTORIDADE MONETÁRIA BRASIL</p>
            </div>
          </div>
          <div className="text-right font-mono">
            <span className="text-xs text-slate-400">DESPACHO COPOM</span>
            <div className="text-xl font-bold text-sky-400 flex items-center justify-end">
              {selic.toFixed(2)}%
            </div>
          </div>
        </div>

        {/* Dynamic Slide controls */}
        <div className="bg-slate-950 p-3 rounded border border-slate-800 font-mono text-xs mb-4">
          <div className="flex items-center justify-between mb-1">
            <label className="text-slate-400">SELIC ALVO MANUAL (%)</label>
            <span className="text-sky-400 font-bold">{selic.toFixed(2)}%</span>
          </div>
          <input
            type="range"
            min="8.0"
            max="14.0"
            step="0.25"
            value={selic}
            onChange={(e) => onUpdateSelic(parseFloat(e.target.value))}
            className="w-full accent-sky-400 mb-2"
          />
          <p className="text-slate-500 text-3xs text-right italic">Theorem 4 Discrete Rule: Ajustável em incrementos de 0.25%</p>
        </div>

        {/* Taylor Rule Interactive Calculator */}
        <div className="bg-slate-950 rounded border border-sky-500/15 p-3 relative flex flex-col justify-between">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2 mb-2">
            <div className="flex items-center gap-1.5 text-slate-300 font-semibold font-mono text-xs">
              <Calculator className="w-4 h-4 text-sky-400" />
              REGRA DE TAYLOR (ADAPTAÇÃO BRASIL)
            </div>
            <div className="text-2xs font-mono font-bold bg-sky-950 text-sky-400 px-1.5 py-0.5 rounded">
              TEÓRICO: {theoreticalSelic.toFixed(2)}%
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-2xs font-mono">
            <div className="space-y-2">
              <div>
                <div className="flex justify-between mb-1">
                  <span className="text-slate-400">Inflação Expectativa (IPCA)</span>
                  <span className="text-slate-200 font-semibold">{inflationInput.toFixed(2)}%</span>
                </div>
                <input
                  type="range"
                  min="2.0"
                  max="6.0"
                  step="0.05"
                  value={inflationInput}
                  onChange={(e) => setInflationInput(parseFloat(e.target.value))}
                  className="w-full h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-sky-400"
                />
              </div>

              <div>
                <div className="flex justify-between mb-1">
                  <span className="text-slate-400">Hiato do Produto (PIB)</span>
                  <span className="text-slate-200 font-semibold">{outputGapInput.toFixed(2)}%</span>
                </div>
                <input
                  type="range"
                  min="-2.0"
                  max="1.5"
                  step="0.05"
                  value={outputGapInput}
                  onChange={(e) => setOutputGapInput(parseFloat(e.target.value))}
                  className="w-full h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-sky-400"
                />
              </div>
            </div>

            <div className="bg-sky-950/20 border border-sky-950 rounded p-2.5 flex flex-col justify-between relative">
              <div className="text-3xs text-sky-400 uppercase tracking-widest font-bold">MODELAGEM QUANTITATIVA</div>
              <p className="text-slate-400 text-3xs mt-1 leading-relaxed">
                A taxa de equilíbrio calcula a Selic com base em neutro real de 4.5% de juros e meta inflacionária de 3.0%. 
              </p>
              
              <div className="flex items-center justify-between border-t border-sky-900/40 pt-2 mt-2">
                <span className="text-3xs text-slate-500">Divergência Real vs Teórico:</span>
                <span className={`text-2xs font-bold ${Math.abs(selic - theoreticalSelic) < 0.5 ? "text-emerald-400" : "text-amber-400"}`}>
                  {Math.abs(selic - theoreticalSelic).toFixed(2)}%
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* FOOTER SUBSECTION: MARKET SENTIMENT DIAL COAX */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-2xl lg:col-span-2 relative overflow-hidden" id="sentiment-card">
        <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/5 blur-3xl rounded-full" />
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <span className="p-1 rounded bg-amber-950 text-amber-400">
                <Activity className="w-4 h-4" />
              </span>
              <div className="flex items-center gap-1.5">
                <h3 className="font-semibold text-slate-100 text-sm font-mono">Índice de Sentimento de Mercado</h3>
                <button
                  type="button"
                  onClick={() => speak(SPEECH_GUIDES.sentiment(sentiment), true)}
                  className="p-0.5 rounded text-slate-500 hover:text-amber-400 hover:bg-amber-950/45 transition-colors cursor-pointer"
                  title="Ouvir explicação do sentimento de mercado"
                >
                  <Volume2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed max-w-xl">
              Análise de NLP sintática de redes e economia calculada pelo RAG do Selix. Atualmente calibrado como <span className="font-semibold text-amber-400 font-mono">Moderadamente Otimista ({sentiment}/100)</span>. Mede a aversão a risco de investidores domésticos que monitoram a relação do barril brent com o impacto na receita da Petrobras e risco fiscal.
            </p>
            
            <div className="flex items-center gap-2 mt-3 font-mono text-3xs text-slate-500">
              <div className="bg-slate-950 px-2 py-1 rounded border border-slate-800">
                PESSIMISMO FUGIDIO: &lt; 35
              </div>
              <div className="bg-slate-950 px-2 py-1 rounded border border-slate-800">
                NEUTRALIDADE: 35 - 65
              </div>
              <div className="bg-slate-950 px-2 py-1 rounded border border-slate-800">
                EUFORIA TÁTICA: &gt; 65
              </div>
            </div>
          </div>

          <div className="flex flex-col items-center justify-center bg-slate-950 p-4 border border-slate-800 rounded-lg min-w-[220px]">
            {/* SVG Arc Gauge */}
            <div className="relative w-36 h-20 mb-1">
              <svg className="w-full h-full" viewBox="0 0 100 50">
                {/* Arc Background */}
                <path
                  d="M 10 45 A 35 35 0 0 1 90 45"
                  fill="none"
                  stroke="#1e293b"
                  strokeWidth="8"
                  strokeLinecap="round"
                />
                
                {/* Gauge colors */}
                <path
                  d="M 10 45 A 35 35 0 0 1 40 20"
                  fill="none"
                  stroke="#ef4444" // pessimistic / flight red
                  strokeWidth="8"
                  opacity="0.3"
                />
                <path
                  d="M 40 20 A 35 35 0 0 1 60 20"
                  fill="none"
                  stroke="#f59e0b" // neutral amber
                  strokeWidth="8"
                  opacity="0.3"
                />
                <path
                  d="M 60 20 A 35 35 0 0 1 90 45"
                  fill="none"
                  stroke="#10b981" // optimistic green
                  strokeWidth="8"
                  opacity="0.3"
                />
                
                {/* Arrow Pointer */}
                {/* Angle from 0 to 180 degrees correspond to sentiment from 0 to 100 */}
                {(() => {
                  const angle = (sentiment / 100) * 180 * (Math.PI / 180);
                  const radius = 30;
                  const targetX = 50 - radius * Math.cos(angle);
                  const targetY = 45 - radius * Math.sin(angle);
                  return (
                    <>
                      <line
                        x1="50"
                        y1="45"
                        x2={targetX}
                        y2={targetY}
                        stroke="#f59e0b"
                        strokeWidth="2.5"
                        strokeLinecap="round"
                        className="drop-shadow-[0_2px_4px_rgba(245,158,11,0.5)]"
                      />
                      <circle cx="50" cy="45" r="4" fill="#f59e0b" />
                    </>
                  );
                })()}
              </svg>
            </div>
            
            <div className="text-xl font-bold font-mono text-amber-500">{sentiment}</div>
            <div className="text-3xs text-slate-400 font-mono mt-0.5 uppercase tracking-widest">SENTIMENTO SENTINELA</div>
          </div>
        </div>
      </div>

      {/* SECTION 4: SIMULADOR DE BIO-NEUTRALIZAÇÃO MME & MMA */}
      {(() => {
        const isMmeActive = rating === "A+";

        const handleTriggerMmeScenario = async () => {
          onUpdateBrent(96.50);
          onUpdateTtf(48.20);
          onUpdateSelic(9.25);
          if (onUpdateSentiment) {
            onUpdateSentiment(82);
          }

          try {
            await fetch("/api/state/update", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                brent: 96.50,
                ttf: 48.20,
                selic: 9.25,
                sentiment: 82,
                rating: "A+",
                investmentGrade: true
              }),
            });

            await fetch("/api/logs/add", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                level: "SUCCESS",
                category: "SYSTEM",
                message: "MME & MMA: Mistura Ex/Bx e biogás nacional ativos com sucesso! Choques no Brent (USD 96.50) e no gás natural europeu TTF (EUR 48.20) neutralizados do mercado interno. Taxa SELIC estabilizada sob um único dígito (9.25% a.a.) sem necessidade de BC intervir ou sacrificar reservas. Classificação soberano promovida para RATING A+ com selo INVESTMENT GRADE internacional!",
              }),
            });
          } catch (e) {
            console.error("Failed to persist simulation scenario setup:", e);
          }

          speak(SPEECH_GUIDES.mme_scenario, true);
        };

        const handleResetToNormal = async () => {
          onUpdateBrent(85.80);
          onUpdateTtf(35.40);
          onUpdateSelic(null as any);
          if (onUpdateSentiment) {
            onUpdateSentiment(59);
          }

          try {
            await fetch("/api/state/update", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                brent: 85.80,
                ttf: 35.40,
                selic: null,
                sentiment: 59,
                rating: "BBB-",
                investmentGrade: false
              }),
            });

            await fetch("/api/logs/add", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                level: "INFO",
                category: "SYSTEM",
                message: "Cenário de simulação do Selix resetado para as variáveis normais de mercado (Brent a 85.80, TTF a 35.40).",
              }),
            });
          } catch (e) {
            console.error(e);
          }

          speak("Sistema restaurado para os parâmetros originais normais.", true);
        };

        return (
          <div className="bg-slate-900 border border-amber-500/20 rounded-xl p-5 shadow-2xl lg:col-span-2 relative overflow-hidden" id="mme-simulation-card">
            <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/5 blur-3xl rounded-full" />
            
            <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-6 border-b border-slate-800/40 pb-4 mb-4">
              <div className="flex items-center gap-3">
                <span className="p-2 rounded bg-amber-950/60 text-amber-500 border border-amber-500/25">
                  <span className="text-lg">🧪</span>
                </span>
                <div>
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <h3 className="font-semibold text-slate-100 font-mono text-sm leading-none">
                      Painel de Bio-Neutralização MME & MMA
                    </h3>
                    <span className="text-4xs font-mono font-bold bg-amber-950 text-amber-400 border border-amber-400/25 px-1.5 py-0.5 rounded uppercase">
                      CENÁRIO ESPECIAL
                    </span>
                    <button
                      type="button"
                      onClick={() => speak(SPEECH_GUIDES.mme_scenario, true)}
                      className="p-0.5 rounded text-amber-500 hover:text-amber-400 hover:bg-amber-950/45 transition-colors cursor-pointer"
                      title="Ouvir explicação do cenário por voz"
                    >
                      <Volume2 className="w-4 h-4 animate-pulse text-amber-400" />
                    </button>
                  </div>
                  <p className="text-3xs text-slate-500 font-mono mt-1 uppercase">
                    Amortecedor biológico contra surtos de Brent e TTF Gás sustentando juros saudáveis e atração de liquidez global
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3 flex-wrap">
                <button
                  onClick={handleTriggerMmeScenario}
                  className="bg-gradient-to-r from-amber-500 to-emerald-500 hover:from-amber-450 hover:to-emerald-450 font-black px-4 py-2 text-slate-950 rounded text-xs font-mono transition-all flex items-center gap-1.5 cursor-pointer shadow-lg shadow-amber-500/10"
                >
                  🚀 SIMULAR MISTURA MME & RATING A+
                </button>
                <button
                  onClick={handleResetToNormal}
                  className="bg-slate-950 hover:bg-slate-850 hover:text-slate-200 border border-slate-800 text-slate-400 py-2 px-3 rounded text-xs font-mono transition-all cursor-pointer"
                >
                  RESTAURAR PADRÃO
                </button>
              </div>
            </div>

            {/* Technical Flow Visualization */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4" id="mme-metrics-flow">
              {/* Node 1: Brent & TTF Gas Shock */}
              <div className={`p-3 rounded border font-mono transition-all ${
                isMmeActive
                  ? "bg-rose-950/15 border-rose-500/30 text-rose-300"
                  : "bg-slate-950 border-slate-850 text-slate-500"
              }`}>
                <span className="text-4xs text-slate-400 uppercase font-bold block mb-1">Passo 1: Choques Brent e TTF</span>
                <div className="text-base font-bold flex flex-col gap-0.5 leading-none">
                  <div>Brent: USD {isMmeActive ? "96.50" : brent.toFixed(2)}</div>
                  <div className="text-xs text-rose-400 mt-1 font-semibold">TTF Gás: €{isMmeActive ? "48.20" : ttf.toFixed(2)}</div>
                </div>
                <p className="text-[10px] text-slate-500 leading-relaxed mt-2 border-t border-slate-800/40 pt-1.5">
                  Estresse geopolítico severo dispara combustíveis nos portos mundiais e indexador europeu de gás natural.
                </p>
              </div>

              {/* Node 2: Biofuel Neutralization (MME) */}
              <div className={`p-3 rounded border font-mono transition-all ${
                isMmeActive
                  ? "bg-amber-950/20 border-amber-400/40 text-amber-300 shadow-[0_0_15px_rgba(245,158,11,0.05)]"
                  : "bg-slate-950 border-slate-850 text-slate-500"
              }`}>
                <span className="text-4xs text-slate-400 uppercase font-bold block mb-1">Passo 2: Defesa Biológica</span>
                <div className="text-base font-bold flex items-baseline gap-1">
                  {isMmeActive ? "Blends Ex e Bx" : "Mistura Normal"}
                  {isMmeActive && <span className="text-4xs font-semibold text-emerald-400 font-sans animate-bounce">ATIVE BIO</span>}
                </div>
                <p className="text-[10px] text-slate-500 leading-relaxed mt-2 border-t border-slate-800/40 pt-1.5">
                  A mistura compulsória de Etanol de cana e Biodiesel + biogás purificado amortece 100% da transmissão de preços externos.
                </p>
              </div>

              {/* Node 3: Bacen Intervention Exonerated */}
              <div className={`p-3 rounded border font-mono transition-all ${
                isMmeActive
                  ? "bg-emerald-950/15 border-emerald-500/30 text-emerald-300"
                  : "bg-slate-950 border-slate-850 text-slate-500"
              }`}>
                <span className="text-4xs text-slate-400 uppercase font-bold block mb-1">Passo 3: Blindagem de Divisas</span>
                <div className="text-base font-bold text-emerald-400">
                  {isMmeActive ? "Isento de Intervenção" : "Observando"}
                </div>
                <p className="text-[10px] text-slate-500 leading-relaxed mt-2 border-t border-slate-800/40 pt-1.5">
                  O PIB permanece imune. Banco Central fica livre de queimar valiosas reservas internacionais ou forçar aumento de juros.
                </p>
              </div>

              {/* Node 4: Selic Relaxed Target */}
              <div className={`p-3 rounded border font-mono transition-all ${
                isMmeActive
                  ? "bg-cyan-950/20 border-cyan-400/40 text-cyan-300 shadow-[0_0_15px_rgba(34,211,238,0.05)]"
                  : "bg-slate-950 border-slate-850 text-slate-500"
              }`}>
                <div className="flex items-center justify-between gap-1 mb-1">
                  <span className="text-4xs text-slate-400 uppercase font-bold block">Passo 4: Alívio Selic e Upgrade Rating</span>
                  <button
                    type="button"
                    onClick={() => speak(SPEECH_GUIDES.rating(isMmeActive ? "A+" : "BBB-", isMmeActive), true)}
                    className="p-0.5 rounded text-slate-500 hover:text-emerald-400 hover:bg-emerald-950/45 transition-colors cursor-pointer"
                    title="Ouvir explicação do rating soberano por voz"
                  >
                    <Volume2 className="w-3 h-3" />
                  </button>
                </div>
                <div className="text-sm font-bold flex flex-col gap-0.5 leading-none">
                  <div className="text-cyan-400 font-black">SELIC: {isMmeActive ? "9.25%" : `${selic.toFixed(2)}%`}</div>
                  <div className="text-[10px] text-emerald-400 font-extrabold mt-1">Soberano: {isMmeActive ? "A+ Sovereign" : "BBB-"}</div>
                </div>
                <p className="text-[10px] text-slate-505 leading-relaxed mt-2 border-t border-slate-800/40 pt-1.5">
                  A meta Selic flui em um dígito seguro. O país atinge o selo de <strong className="text-emerald-400 font-bold">Investment Grade</strong> sob aplauso de credores externos!
                </p>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
}
