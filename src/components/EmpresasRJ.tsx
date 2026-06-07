/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { Building, TrendingDown, TrendingUp, DollarSign, Calculator, HelpCircle, Volume2, Landmark, RefreshCw, Sparkles, AlertCircle } from "lucide-react";
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
  rjPrices?: Record<string, number>;
}

export default function EmpresasRJ({ currentSelic, defaultProjectedSelic, rjPrices }: EmpresasRJProps) {
  // Single-digit Selic target projection (defaulting to 9.00%)
  const [projectedSelic, setProjectedSelic] = useState(defaultProjectedSelic || 9.00);
  const [showSensitivityHelper, setShowSensitivityHelper] = useState(false);

  // Sync projected Selic state when prop changes
  React.useEffect(() => {
    if (defaultProjectedSelic !== undefined) {
      setProjectedSelic(defaultProjectedSelic);
    }
  }, [defaultProjectedSelic]);


  // List of high-profile companies currently undergoing Recuperação Judicial (R.J.) or extrajudicial restructure
  const rjCompaniesList: RJCompany[] = [
    {
      id: "amer3",
      name: "Americanas S.A.",
      ticker: "AMER3",
      mktCapCurrent: 0.32,
      roi: -15.40,
      leverageSensitivity: 5.0,
      description: "Varejista histórica nacional em emblemática Recuperação Judicial após inconsistências contábeis de R$ 20 bi. Sua sobrevivência operacional depende visceralmente do custo de capital de 1 dígito.",
    },
    {
      id: "ligt3",
      name: "Light S.A.",
      ticker: "LIGT3",
      mktCapCurrent: 1.62,
      roi: 4.80,
      leverageSensitivity: 4.5,
      description: "Distribuidora e geradora de energia elétrica em regime de Recuperação Judicial para repactuar passivos maciços. Altamente asfixiada por juros flutuantes e custos de debêntures.",
    },
    {
      id: "oibr3",
      name: "Oi S.A.",
      ticker: "OIBR3",
      mktCapCurrent: 0.45,
      roi: 3.10,
      leverageSensitivity: 4.0,
      description: "Pioneira de telecomunicações lidando com sua segunda e complexa Recuperação Judicial. A amortização de dívidas bilionárias com credores internacionais exige alívio na taxa básica de juros.",
    },
    {
      id: "goll4",
      name: "Gol Linhas Aéreas",
      ticker: "GOLL4",
      mktCapCurrent: 0.52,
      roi: 5.50,
      leverageSensitivity: 3.5,
      description: "Grande player da aviação civil atualmente operando sob reestruturação financeira em Chapter 11 nos EUA. Taxas asfixiantes elevam os custos de arrendamento e debêntures de leasing.",
    },
    {
      id: "pmam3",
      name: "Paranapanema S.A.",
      ticker: "PMAM3",
      mktCapCurrent: 0.18,
      roi: 4.20,
      leverageSensitivity: 3.0,
      description: "Líder nacional na termo-metalurgia e refino de cobre sob regime de Recuperação Judicial. Excessivo endividamento financeiro indexado ao CDI consome integralmente a margem EBITDA.",
    },
    {
      id: "bhia3",
      name: "Grupo Casas Bahia",
      ticker: "BHIA3",
      mktCapCurrent: 0.42,
      roi: 5.95,
      leverageSensitivity: 2.8,
      description: "Gigante do e-commerce e varejo físico nacional que homologou Recuperação Extrajudicial para prolongar e equacionar debêntures e custos de WACC indexados à taxa básica de juros.",
    },
    {
      id: "raiz4",
      name: "Raízen S.A.",
      ticker: "RAIZ4",
      mktCapCurrent: 21.50,
      roi: 6.80,
      leverageSensitivity: 2.5,
      description: "Gigante de biocombustíveis e distribuição em severa crise de liquidez. Entregou o comitê de reestruturação financeira e governança nas mãos de credores nacionais em troca de sobrevivência para equacionar debêntures indexadas ao CDI.",
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
    const textToSpeak = `Análise de estrutura de capital para empresas sob regime de Recuperação Judicial. ` +
      `Com a Selic em ${currentSelic.toFixed(2)} por cento, todas as empresas em reestruturação analisadas, ` +
      `como Americanas S.A. e Light, possuem retorno operacional sobre investimentos inferior ao juro indexador básico. ` +
      `Isso acelera a destruição de valor econômico e eleva o risco de falência direta. Ao reprogramar a Selic para um patamar de um dígito como ` +
      `${projectedSelic.toFixed(2)} por cento, a contração do custo médio de capital barateia o WACC e as debêntures mobiliárias. Como consequência, o valor implícito de capitação e firma delas expande, destravando o plano de recuperação pactuado com credores.`;
    speak(textToSpeak, true);
  };

  return (
    <div className="bg-slate-900 border border-indigo-500/20 rounded-xl p-5 shadow-2xl relative overflow-hidden" id="rj-companies-valuation">
      {/* Glow decorative effect */}
      <div className="absolute top-0 right-0 w-36 h-36 bg-indigo-600/5 blur-3xl rounded-full pointer-events-none" />

      {/* Header section with Voice Assistance */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-800 pb-3 mb-4 gap-2">
        <div className="flex items-center gap-2">
          <span className="p-1.5 rounded bg-indigo-950 text-amber-400">
            <AlertCircle className="w-5 h-5 animate-pulse" />
          </span>
          <div>
            <div className="flex items-center gap-1.5">
              <h3 className="font-semibold text-slate-100 font-sans text-sm">Empresas em Recuperação Judicial (R.J.)</h3>
              <button
                type="button"
                onClick={handleVoiceExplanation}
                className="p-0.5 rounded text-slate-500 hover:text-indigo-455 hover:bg-slate-800 transition-colors cursor-pointer"
                title="Ouvir análise de viabilidade por voz"
              >
                <Volume2 className="w-3.5 h-3.5 text-indigo-400" />
              </button>
            </div>
            <p className="text-3xs text-slate-550 font-mono">DÍVIDAS EM REESTRUTURAÇÃO | SULPHUR SPREAD & CUSTO DO CAPITAL WACC</p>
          </div>
        </div>

        <div className="bg-slate-950 border border-slate-850 px-2 py-0.5 rounded text-start font-mono text-[10px]">
          <span className="text-slate-550 text-3xs uppercase block">CDI/SELIC ATUAL</span>
          <span className="text-sky-400 font-bold">{currentSelic.toFixed(2)}%</span>
        </div>
      </div>

      <p className="text-slate-400 text-xs mb-4 leading-relaxed">
        Empresas sob regime de <strong>Recuperação Judicial (R.J.) / Extrajudicial</strong> enfrentam custos severos de capital com juros de dois dígitos. Juros elevados corroem o fluxo de caixa através de taxas flutuantes indexadas ao CDI. Abaixo, observe a destruição de ativo operacional quando o <strong>ROI</strong> é menor que a Selic atual, e simule a projeção do valor de firma do portfólio corporativo (<span className="text-indigo-400">Market Cap</span>) se a SELIC recuar para <strong>1 dígito</strong>.
      </p>

      {/* Interactive simulation slider */}
      <div className="bg-slate-950 border border-slate-850 rounded-lg p-3.5 mb-5 font-mono text-2xs space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-slate-350">
            <Calculator className="w-3.5 h-3.5 text-indigo-400 animate-pulse" />
            <span className="font-semibold text-slate-400 text-[10px]">PROJEÇÃO ALVO DA SELIC (1 DÍGITO):</span>
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
            *Reduzir a Selic de <strong>{currentSelic.toFixed(2)}%</strong> para <strong>{projectedSelic.toFixed(2)}%</strong> contrai o custo de endividamento direto, liberando o fluxo de caixa para amortizar passivos extraconcursais e gerando expansão exponencial de Valuation corporativo.
          </div>
          <button
            type="button"
            onClick={() => setShowSensitivityHelper(!showSensitivityHelper)}
            className="p-1 rounded bg-slate-900 border border-slate-850 text-indigo-400 hover:bg-slate-850 leading-none select-none text-[8px] cursor-pointer"
          >
            {showSensitivityHelper ? "OCULTAR MODELO" : "COMO É FEITO?"}
          </button>
        </div>

        {showSensitivityHelper && (
          <div className="bg-slate-900 p-2.5 rounded border border-slate-800/80 text-4xs text-slate-400 leading-normal animate-fade-in">
            A projeção de Valor de Reestruturação implícito utiliza uma fórmula de desconto financeiro ancorada na alavancagem média: <br />
            <code className="text-indigo-300 font-bold block my-1">Projected Cap = Current Cap * (1 + ΔSelic * Sensibilidade * 10)</code>
            Cada empresa possui um perfil de dívida estruturada. Empresas em regime crítico como <strong>AMER3</strong> ou <strong>LIGT3</strong> têm altíssima alavancagem (Sensibilidade); menores taxas geram uma amortização e valorização abrupta decorrente do alívio direto de debêntures.
          </div>
        )}
      </div>

      {/* Companies detailed list */}
      <div className="space-y-3.5" id="rj-companies-grids">
        <div className="flex justify-between items-center text-3xs text-slate-500 font-bold uppercase tracking-widest pl-1">
          <span>PORTFÓLIO DE EMPRESAS MONITORADAS EM R.J. (ATUALIZAÇÃO DIÁRIA)</span>
          <span className="text-[8px] text-indigo-400 font-mono animate-pulse flex items-center gap-1">
            <Sparkles className="w-2.5 h-2.5" /> FONTE OFICIAL B3 / YAHOO FINANCE
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {rjCompaniesList.map((company) => {
            const proj = calculateProjection(company);
            const liveStockPrice = rjPrices ? rjPrices[company.id] : undefined;

            return (
              <div
                key={company.id}
                className="bg-slate-950 border border-slate-850 rounded-lg p-3 hover:border-indigo-500/20 transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between mb-1.5">
                    <div>
                      <h4 className="font-bold text-slate-200 text-xs flex items-center gap-1.5 font-sans">
                        <Building className="w-3.5 h-3.5 text-amber-500" />
                        {company.name}
                      </h4>
                      <span className="font-mono text-[8px] bg-amber-955/40 text-amber-500 px-1 rounded inline-block mt-0.5">RECUPERAÇÃO JUDICIAL</span>
                    </div>
                    <span className="font-mono text-xs font-black text-rose-400 bg-rose-950/20 border border-rose-850/30 px-2 py-0.5 rounded">
                      {company.ticker}
                    </span>
                  </div>

                  <p className="text-[10px] text-slate-400 leading-relaxed mb-3">{company.description}</p>
                </div>

                <div className="space-y-2">
                  {/* Stock price display indexed from Yahoo daily */}
                  <div className="bg-slate-900/80 p-2 rounded border border-slate-850/60 font-mono text-[10px] flex justify-between items-center">
                    <span className="text-slate-500 text-3xs font-semibold">COTAÇÃO LIVE (DAILY FEED):</span>
                    {liveStockPrice !== undefined ? (
                      <span className="text-emerald-400 font-black animate-pulse">
                        R$ {liveStockPrice.toFixed(2)}
                      </span>
                    ) : (
                      <span className="text-slate-500 text-[9px] italic">Aguardando feed...</span>
                    )}
                  </div>

                  {/* Economic gauges */}
                  <div className="grid grid-cols-2 gap-2 font-mono text-[9px]">
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
                      <span className="text-slate-400 text-[9px]">Spread Selic Projetada ({projectedSelic.toFixed(2)}%):</span>
                      <span className={`font-black flex items-center gap-0.5 text-[9px] ${proj.spreadProjected > 0 ? "text-emerald-400" : "text-amber-400"}`}>
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

                    <div className="flex justify-between items-center pt-1.5 border-t border-slate-900/85">
                      <span className="text-slate-400 font-medium">Mkt Cap Projetado:</span>
                      <span className="text-slate-200 font-extrabold flex items-center gap-1 text-[11px]">
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
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
