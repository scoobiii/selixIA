/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { Building, TrendingDown, TrendingUp, DollarSign, Calculator, HelpCircle, Volume2, Landmark, RefreshCw } from "lucide-react";
import { speak } from "../utils/speech";

interface RJCompany {
  id: string;
  name: string;
  ticker: string;
  mktCapCurrent: number; // in R$ Billion
  roi: number;           // ROI %
  leverageSensitivity: number; // sensitivity multiplier for mkt cap projection
  description: string;
}

interface EmpresasRJProps {
  currentSelic: number;
  defaultProjectedSelic?: number;
}

export default function EmpresasRJ({ currentSelic, defaultProjectedSelic }: EmpresasRJProps) {
  // Single-digit Selic target projection (defaulting to 9.00%)
  const [projectedSelic, setProjectedSelic] = useState(defaultProjectedSelic || 9.00);
  const [showSensitivityHelper, setShowSensitivityHelper] = useState(false);

  // Sync projected Selic state when prop changes
  React.useEffect(() => {
    if (defaultProjectedSelic !== undefined) {
      setProjectedSelic(defaultProjectedSelic);
    }
  }, [defaultProjectedSelic]);


  // List of high-profile companies headquartered in Rio de Janeiro (RJ)
  // All have ROIs below typical double-digit Selic
  const rjCompaniesList: RJCompany[] = [
    {
      id: "ligt3",
      name: "Light S.A.",
      ticker: "LIGT3",
      mktCapCurrent: 1.62,
      roi: 4.80,
      leverageSensitivity: 4.5,
      description: "Distribuidora de energia do RJ em recuperação judicial. Altamente sensível ao custo da dívida local.",
    },
    {
      id: "elet3",
      name: "Eletrobras",
      ticker: "ELET3",
      mktCapCurrent: 84.80,
      roi: 6.20,
      leverageSensitivity: 1.6,
      description: "Gigante do setor elétrico pós-privatização. Investimentos pesados de infraestrutura indexados ao IPCA+.",
    },
    {
      id: "irbr3",
      name: "IRB Brasil RE",
      ticker: "IRBR3",
      mktCapCurrent: 3.35,
      roi: 5.50,
      leverageSensitivity: 1.4,
      description: "Resseguradora nacional baseada no Rio de Janeiro. Recuperando rentabilidade operacional após reestruturação.",
    },
    {
      id: "petr4",
      name: "Petrobras",
      ticker: "PETR4",
      mktCapCurrent: 485.40,
      roi: 9.30,
      leverageSensitivity: 0.8,
      description: "Multinacional estatal de energia sediada em RJ. Caixa financeiro robusto, sensibilidade média de WACC.",
    },
    {
      id: "vale3",
      name: "Vale S.A.",
      ticker: "VALE3",
      mktCapCurrent: 282.50,
      roi: 8.80,
      leverageSensitivity: 0.6,
      description: "Líder global em minério de ferro sediada no Rio. Receitas dolarizadas mitigam impacto direto de juros locais.",
    },
    {
      id: "amer3",
      name: "Lojas Americanas",
      ticker: "AMER3",
      mktCapCurrent: 0.32,
      roi: -15.40,
      leverageSensitivity: 5.0,
      description: "Varejista histórica carioca sob forte distress financeiro pós-fraude. Sobrevivência depende de juros de 1 dígito.",
    }
  ];

  // Recalculates reprojected market cap and spread
  const calculateProjection = (company: RJCompany) => {
    // Spread with current Selic vs. projected Selic
    const spreadCurrent = company.roi - currentSelic;
    const spreadProjected = company.roi - projectedSelic;

    // Formula: Projected Mkt Cap grows as Projected Selic shrinks below current Selic
    // Growth rate: (Current Selic - Projected Selic) * LeverageSensitivity * 10 (multiplier effect of WACC discount rate)
    const selicDrop = Math.max(0, currentSelic - projectedSelic);
    const mktCapIncreasePercent = selicDrop * company.leverageSensitivity * 10;
    const mktCapProjected = company.mktCapCurrent * (1 + mktCapIncreasePercent / 100);

    return {
      spreadCurrent,
      spreadProjected,
      mktCapIncreasePercent,
      mktCapProjected,
      isViableCurrent: spreadCurrent > 0,
      isViableProjected: spreadProjected > 0,
    };
  };

  const handleVoiceExplanation = () => {
    const textToSpeak = `Análise de viabilidade para empresas sediadas no Rio de Janeiro. ` +
      `Atualmente, com a Selic em ${currentSelic.toFixed(2)} por cento, todas as empresas cariocas analisadas, ` +
      `incluindo gigantes como Eletrobras e Petrobras, ou em recuperação como a Light, possuem retorno sobre investimento menor do que a Selic. ` +
      `Isso destrói valor econômico. Ao reprogramar a Selic para um dígito de ${projectedSelic.toFixed(2)} por cento, ` +
      `o prêmio de risco cai, reduzindo os custos de WACC. Como resultado, o valor de mercado implícito delas expande expressivamente.`;
    speak(textToSpeak, true);
  };

  return (
    <div className="bg-slate-900 border border-indigo-500/20 rounded-xl p-5 shadow-2xl relative overflow-hidden" id="rj-companies-valuation">
      {/* Glow decorative effect */}
      <div className="absolute top-0 right-0 w-36 h-36 bg-blue-600/5 blur-3xl rounded-full pointer-events-none" />

      {/* Header section with Voice Assistance */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-800 pb-3 mb-4 gap-2">
        <div className="flex items-center gap-2">
          <span className="p-1.5 rounded bg-indigo-950 text-indigo-400">
            <Landmark className="w-5 h-5" />
          </span>
          <div>
            <div className="flex items-center gap-1.5">
              <h3 className="font-semibold text-slate-100 font-sans text-sm">Empresas RJ: Viabilidade & Sensibilidade</h3>
              <button
                type="button"
                onClick={handleVoiceExplanation}
                className="p-0.5 rounded text-slate-500 hover:text-indigo-450 hover:bg-slate-800 transition-colors cursor-pointer"
                title="Ouvir análise de viabilidade por voz"
              >
                <Volume2 className="w-3.5 h-3.5 text-indigo-400" />
              </button>
            </div>
            <p className="text-3xs text-slate-550 font-mono">STOCKS CARIOCAS | ROI VS TAXA SELIC DE 1 DÍGITO</p>
          </div>
        </div>

        <div className="bg-slate-950 border border-slate-850 px-2 py-0.5 rounded text-start font-mono text-[10px]">
          <span className="text-slate-500 text-3xs uppercase block">SELIC CORRENTE</span>
          <span className="text-sky-400 font-bold">{currentSelic.toFixed(2)}%</span>
        </div>
      </div>

      <p className="text-slate-400 text-xs mb-4 leading-relaxed">
        Empresas sediadas no <strong>Rio de Janeiro (RJ)</strong> enfrentam custos severos de capital com juros de dois dígitos. Abaixo, observe a destruição de valor quando o <strong>ROI</strong> é menor que a Selic corrente, e simule a valorização implícita do valor de firma (<span className="text-indigo-400">Market Cap</span>) ao reajustar a taxa Selic para o patamar de <strong>1 dígito</strong>.
      </p>

      {/* Interactive simulation slider */}
      <div className="bg-slate-950 border border-slate-850 rounded-lg p-3.5 mb-5 font-mono text-2xs space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-slate-350">
            <Calculator className="w-3.5 h-3.5 text-indigo-400 animate-pulse" />
            <span className="font-semibold">PROJEÇÃO SELIC ALVO (1 DÍGITO):</span>
          </div>
          <span className="text-emerald-400 font-black text-xs bg-emerald-950/40 px-2 py-0.5 rounded border border-emerald-500/20">
            {projectedSelic.toFixed(2)}% A.A.
          </span>
        </div>

        <div className="space-y-1.5">
          <input
            type="range"
            min="5.00"
            max="9.75"
            step="0.25"
            value={projectedSelic}
            onChange={(e) => setProjectedSelic(parseFloat(e.target.value))}
            className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-emerald-400"
          />
          <div className="flex justify-between text-[8px] text-slate-550">
            <span>5.00% (Mínimo Projetado)</span>
            <span>7.50% (Meta Clássica)</span>
            <span>9.75% (Limite Máximo de 1 dígito)</span>
          </div>
        </div>

        <div className="border-t border-slate-900 pt-2.5 flex flex-wrap items-center justify-between gap-2 text-[10px]">
          <div className="text-slate-400 text-3xs leading-relaxed max-w-[80%]">
            *Reduzir a Selic de <strong>{currentSelic.toFixed(2)}%</strong> para <strong>{projectedSelic.toFixed(2)}%</strong> contrai o custo médio ponderado de capital (WACC), estimulando alavancagem tática e gerando expansão exponencial de Valuation.
          </div>
          <button
            onClick={() => setShowSensitivityHelper(!showSensitivityHelper)}
            className="p-1 rounded bg-slate-900 border border-slate-850 text-indigo-400 hover:bg-slate-850 leading-none select-none text-[8px]"
          >
            {showSensitivityHelper ? "OCULTAR" : "COMO É FEITO?"}
          </button>
        </div>

        {showSensitivityHelper && (
          <div className="bg-slate-900 p-2.5 rounded border border-slate-800/80 text-4xs text-slate-400 leading-normal animate-fade-in">
            A projeção de Valor de Mercado implícito utiliza uma fórmula de desconto financeiro: <br />
            <code className="text-indigo-300 font-bold block my-1">Projected Cap = Current Cap * (1 + ΔSelic * Sensibilidade * 10)</code>
            Cada empresa possui um perfil de dívida (Sensibilidade/Alavancagem). Empresas como <strong>LIGT3</strong> ou <strong>AMER3</strong> têm alta sensibilidade devido à estrangulação por dívida bancária líquida; menores taxas detonam uma valorização abrupta de reestruturação.
          </div>
        )}
      </div>

      {/* Companies detailed list */}
      <div className="space-y-3.5" id="rj-companies-grids">
        <div className="text-3xs text-slate-500 font-bold uppercase tracking-widest pl-1">PORTFÓLIO DE EMPRESAS SELECIONADAS EM RJ</div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {rjCompaniesList.map((company) => {
            const proj = calculateProjection(company);
            return (
              <div
                key={company.id}
                className="bg-slate-950 border border-slate-850 rounded-lg p-3 hover:border-indigo-500/20 transition-all flex flex-col justify-between"
              >
                <div className="flex items-start justify-between mb-1.5">
                  <div>
                    <h4 className="font-bold text-slate-200 text-xs flex items-center gap-1.5 font-sans">
                      <Building className="w-3.5 h-3.5 text-slate-400" />
                      {company.name}
                    </h4>
                    <span className="font-mono text-3xs text-slate-500">RJ HEADQUARTERS | SECTOR REPRESENTATIVE</span>
                  </div>
                  <span className="font-mono text-xs font-black text-indigo-400 bg-indigo-950/50 border border-indigo-500/30 px-2 py-0.5 rounded">
                    {company.ticker}
                  </span>
                </div>

                <p className="text-4xs text-slate-450 leading-relaxed min-h-[30px] mb-2">{company.description}</p>

                {/* Economic gauges */}
                <div className="grid grid-cols-2 gap-2 font-mono text-[9px] mb-3">
                  <div className="bg-slate-900 p-1.5 rounded border border-slate-850">
                    <span className="text-slate-500 text-4xs uppercase block">MKT CAP ATUAL</span>
                    <span className="font-bold text-slate-300">R$ {company.mktCapCurrent.toFixed(2)} Bi</span>
                  </div>
                  <div className="bg-slate-900 p-1.5 rounded border border-slate-850">
                    <span className="text-slate-500 text-4xs uppercase block">ROI OPERACIONAL</span>
                    <span className="font-bold text-slate-300">{company.roi.toFixed(2)}%</span>
                  </div>
                </div>

                {/* Simulation results details */}
                <div className="bg-slate-900/50 border border-slate-900 rounded p-2.5 font-mono text-[10px] space-y-2">
                  <div className="flex justify-between items-center text-4xs border-b border-slate-900/80 pb-1.5">
                    <span className="text-slate-500">Spread Selic Atual ({currentSelic.toFixed(2)}%):</span>
                    <span className="text-rose-400 flex items-center gap-0.5 font-bold">
                      <TrendingDown className="w-3 h-3 text-rose-500" /> {proj.spreadCurrent.toFixed(2)}%
                    </span>
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="text-slate-400">Spread Selic Projetada ({projectedSelic.toFixed(2)}%):</span>
                    <span className={`font-black flex items-center gap-0.5 ${proj.spreadProjected > 0 ? "text-emerald-400" : "text-amber-400"}`}>
                      {proj.spreadProjected > 0 ? (
                        <>
                          <TrendingUp className="w-3 h-3 text-emerald-400 animate-bounce" />
                          +{proj.spreadProjected.toFixed(2)}% (Superavit)
                        </>
                      ) : (
                        <>
                          <TrendingDown className="w-3 h-3 text-amber-400" />
                          {proj.spreadProjected.toFixed(2)}%
                        </>
                      )}
                    </span>
                  </div>

                  <div className="flex justify-between items-center pt-1 border-t border-slate-900/85">
                    <span className="text-slate-400 font-medium">Mkt Cap Projetado:</span>
                    <span className="text-slate-200 font-extrabold flex items-center gap-1">
                      R$ {proj.mktCapProjected.toFixed(2)} Bi
                      {proj.mktCapIncreasePercent > 0 && (
                        <span className="text-[8px] text-emerald-400 bg-emerald-950/50 rounded px-1 font-black">
                          +{proj.mktCapIncreasePercent.toFixed(1)}%
                        </span>
                      )}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
