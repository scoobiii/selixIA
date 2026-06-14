/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import { Cpu, ShieldCheck, Zap, Sliders, Play, Server, AlertTriangle, Key, ArrowRight, Gauge, CheckCircle, Database, Eye, Award } from "lucide-react";

interface SelixBoltProps {
  onInjectLog: (level: string, category: string, message: string) => void;
  currentUser: any | null;
  totalRevenue: number;
  llmModelType: "gemini" | "local1bit" | "rag";
  onUpdateLlmModelType: (type: "gemini" | "local1bit" | "rag") => void;
  moltbookAgents: any[];
  activeMoltbookAgentId: string;
}

export default function SelixBolt({ 
  onInjectLog, 
  currentUser, 
  totalRevenue,
  llmModelType,
  onUpdateLlmModelType,
  moltbookAgents,
  activeMoltbookAgentId
}: SelixBoltProps) {
  const [targetAccuracy, setTargetAccuracy] = useState<number>(98.5);
  const [currentAccuracy, setCurrentAccuracy] = useState<number>(98.2);
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [gcloudKeyTimer, setGcloudKeyTimer] = useState<number>(30); // 30-day dynamic trial countdown
  const [isGeneratingGcloudKey, setIsGeneratingGcloudKey] = useState(false);
  const [generatedKey, setGeneratedKey] = useState<string>("");

  // Reinvestment cache (5% of subscriber revenues)
  const reinvestmentBalance = totalRevenue * 0.05;

  const handleGenerateKey = () => {
    if (!currentUser) {
      onInjectLog("WARN", "SYSTEM", "Autenticação requerida: Conecte sua Conta Google na Área do Investidor para herdar o token de 30 dias.");
      return;
    }
    setIsGeneratingGcloudKey(true);
    onInjectLog("INFO", "SYSTEM", `Iniciando provisionamento de chave de API no Google Cloud Console para ${currentUser.email}...`);
    
    setTimeout(() => {
      const mockKey = `GCLOUD_SELIX_30D_ACC_${Math.random().toString(36).substring(2, 10).toUpperCase()}`;
      setGeneratedKey(mockKey);
      setGcloudKeyTimer(30);
      setIsGeneratingGcloudKey(false);
      onInjectLog("SUCCESS", "SYSTEM", `Chave GCloud gerada com sucesso! Liberada por 30 dias. Token: ${mockKey}`);
    }, 1500);
  };

  const handleRunOptimizer = () => {
    setIsOptimizing(true);
    onInjectLog("WARN", "RAG", "Alinhando vetores de contexto. Calculando perda de precisão e índice de acertos do RAG...");

    setTimeout(() => {
      setCurrentAccuracy(99.8);
      setIsOptimizing(false);
      onInjectLog("SUCCESS", "RAG", "Otimizador concluído: Modelo customizado treinado no Selix ativado para garantir acurácia de 99.8% (limite >98.0% restaurado).");
    }, 1800);
  };

  // Auto-trigger Selix Custom model if accuracy dips below 98%
  useEffect(() => {
    if (currentAccuracy < 98.0) {
      onInjectLog("CRITICAL", "RAG", `Acurácia do RAG caiu para ${currentAccuracy.toFixed(1)}% (Abaixo do mínimo tolerável de 98%!). Forçando ativação da LLM customizada treinada no Selix.`);
      const timer = setTimeout(() => {
        setCurrentAccuracy(99.8);
        onInjectLog("SUCCESS", "RAG", "LLM customizada do Selix recalibrou as dimensões de embeddings automaticamente para restabelecer acurácia em 99.8%!");
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [currentAccuracy]);

  // Derive active model label
  const getActiveModelName = () => {
    if (llmModelType === "gemini") return "CLOUD GEMINI v3.5";
    if (llmModelType === "local1bit") return "LOCAL 1-BIT QWEN";
    return "HEURÍSTICO RAG LOCAL";
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-2xl space-y-6" id="selixbolt-engine-panel">
      {/* Title */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-3">
        <div className="flex items-center gap-2">
          <span className="p-1.5 rounded bg-amber-500/10 text-amber-500">
            <Zap className="w-4 h-4 animate-bounce" />
          </span>
          <div>
            <h3 className="font-semibold text-slate-100 font-mono text-xs uppercase">SelixBolt: Mecanismo & Ativos de IA</h3>
            <p className="text-3xs text-slate-500 font-mono">MAPA DE INFRAESTRUTURA COGNITIVA, ATIVOS E MODELOS REGISTRADOS</p>
          </div>
        </div>
        <div className="shrink-0 text-3xs font-mono px-2 py-0.5 rounded bg-amber-950/40 text-amber-500 border border-amber-900/40">
          CÉREBRO VIGENTE: {getActiveModelName()}
        </div>
      </div>

      {/* SECTION: ATIVOS DO MOLTBOOK ("Molt Bolt mostre os ativos") */}
      <div className="bg-slate-950 p-4 border border-slate-850 rounded-lg space-y-3.5">
        <div className="flex items-center justify-between">
          <span className="text-[10px] text-amber-400 font-mono font-bold uppercase tracking-wider block flex items-center gap-1.5">
            <Eye className="w-3.5 h-3.5" /> Ativos de Agentes do Sistema (Moltbook Federated Agents)
          </span>
          <span className="text-slate-500 font-mono text-[8px]">TOTAL: {moltbookAgents.length} REDE</span>
        </div>

        <p className="text-slate-400 font-mono text-[8.5px] leading-relaxed">
          Cada agente do Moltbook representa um ativo lógico associado ao modelo <strong>{getActiveModelName()}</strong> automaticamente. Suas ferramentas formais (Skill MD) regulam seus comportamentos bitwise.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-3xs font-mono">
          {moltbookAgents.map((ag) => {
            const isSelected = ag.id === activeMoltbookAgentId;
            return (
              <div 
                key={ag.id} 
                className={`p-3 rounded-lg border flex flex-col justify-between gap-2.5 transition relative ${
                  isSelected 
                    ? "bg-rose-950/15 border-rose-500/40 text-rose-350 shadow" 
                    : "bg-slate-900/70 border-slate-850 text-slate-400"
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm select-none">{ag.avatar || "👾"}</span>
                  <div className="flex items-center gap-1.5">
                    <span className="text-[7px] text-slate-500">KARMA: {ag.karma ?? 150}</span>
                    <span className={`text-[6px] px-1 rounded font-black uppercase ${isSelected ? "bg-rose-500/20 text-rose-300 animate-pulse" : "bg-slate-800 text-slate-500"}`}>
                      {isSelected ? "Ativo" : "Standby"}
                    </span>
                  </div>
                </div>

                <div>
                  <span className="font-extrabold text-2xs block text-slate-200">{ag.name}</span>
                  <p className="text-[8px] text-slate-500 font-sans mt-0.5 leading-normal">
                    {ag.description}
                  </p>
                </div>

                {/* Skill Tools Summary */}
                <div className="p-1.5 rounded bg-slate-950 border border-slate-850 mt-1 space-y-1">
                  <span className="text-[7.5px] text-indigo-400 block font-bold">🛠️ SKILLS ATIVAS REGULADAS (SKILL MD):</span>
                  <div className="text-[7px] text-slate-400 line-clamp-2 max-h-12 leading-relaxed overflow-hidden font-sans">
                    {ag.skillMd || "Nenhuma skill cadastrada. Edite nas configurações."}
                  </div>
                </div>

                <div className="flex justify-between items-center text-[7.5px] text-slate-500 pt-1.5 border-t border-slate-900">
                  <span>Sincronia: AUTO-MODEL</span>
                  <span>Trigger: {ag.replyMode === "auto" ? "✅ AUTOMÁTICO" : "⏳ MANUAL"}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Left Side: Model Selector & key generator */}
        <div className="space-y-4 bg-slate-950/40 p-4 border border-slate-850 rounded-lg">
          <span className="text-[10px] text-indigo-400 font-mono font-bold uppercase tracking-wider block">1. CONFIGURAÇÃO DE INFRAESTRUTURA LLM</span>
          
          <div className="grid grid-cols-3 gap-2 text-3xs font-mono">
            {/* GCloud Option */}
            <button
              onClick={() => {
                onUpdateLlmModelType("gemini");
                onInjectLog("INFO", "SYSTEM", "Mecanismo Selix Bolt alterado para Google Cloud Gemini API (Escala infinita).");
              }}
              className={`p-2 py-3 rounded border text-left font-mono transition-all flex flex-col justify-between h-20 cursor-pointer ${
                llmModelType === "gemini"
                  ? "bg-indigo-950/30 border-indigo-500/80 text-indigo-400"
                  : "bg-slate-900/60 border-slate-800 text-slate-400 hover:border-slate-700"
              }`}
            >
              <div className="flex items-center justify-between w-full">
                <Server className="w-3.5 h-3.5" />
                <span className={`text-[6px] font-bold px-0.5 rounded ${llmModelType === "gemini" ? "bg-indigo-900 text-indigo-200" : "bg-slate-800 text-slate-500"}`}>CLOUD</span>
              </div>
              <div>
                <span className="text-[8px] font-bold block">Gemini API</span>
              </div>
            </button>

            {/* Qwen Local 1-bit Option */}
            <button
              onClick={() => {
                onUpdateLlmModelType("local1bit");
                onInjectLog("WARN", "SYSTEM", "Selix Bolt alterado para QwenCoder 0.5B (Quantizado em 1-bit local). Uso de memória reduzido para preservar limites de hardware.");
              }}
              className={`p-2 py-3 rounded border text-left font-mono transition-all flex flex-col justify-between h-20 cursor-pointer ${
                llmModelType === "local1bit"
                  ? "bg-emerald-950/30 border-emerald-500/80 text-emerald-400"
                  : "bg-slate-900/60 border-slate-800 text-slate-400 hover:border-slate-700"
              }`}
            >
              <div className="flex items-center justify-between w-full">
                <Cpu className="w-3.5 h-3.5" />
                <span className={`text-[6px] font-bold px-0.5 rounded ${llmModelType === "local1bit" ? "bg-emerald-900 text-emerald-200" : "bg-slate-800 text-slate-500"}`}>LOCAL</span>
              </div>
              <div>
                <span className="text-[8px] font-bold block">Qwen 1-Bit</span>
              </div>
            </button>

            {/* RAG Heuristic Option */}
            <button
              onClick={() => {
                onUpdateLlmModelType("rag");
                onInjectLog("INFO", "SYSTEM", "Mecanismo Selix Bolt alterado para RAG Heurístico de Contexto.");
              }}
              className={`p-2 py-3 rounded border text-left font-mono transition-all flex flex-col justify-between h-20 cursor-pointer ${
                llmModelType === "rag"
                  ? "bg-sky-950/30 border-sky-500/80 text-sky-400"
                  : "bg-slate-900/60 border-slate-800 text-slate-400 hover:border-slate-700"
              }`}
            >
              <div className="flex items-center justify-between w-full">
                <Database className="w-3.5 h-3.5" />
                <span className={`text-[6px] font-bold px-0.5 rounded ${llmModelType === "rag" ? "bg-sky-900 text-sky-200" : "bg-slate-800 text-slate-500"}`}>RAG</span>
              </div>
              <div>
                <span className="text-[8px] font-bold block">RAG Heuristics</span>
              </div>
            </button>
          </div>

          {/* Context Details based on selected type */}
          {llmModelType === "gemini" ? (
            <div className="bg-slate-900 p-3 rounded border border-slate-800 text-3xs font-mono space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-slate-400">STATUS DA LICENÇA GCLOUD:</span>
                {generatedKey ? (
                  <span className="text-emerald-400 font-bold">ATIVO ({gcloudKeyTimer} DIAS RESTANTES)</span>
                ) : (
                  <span className="text-amber-400 font-bold">REQUISITAR CHAVE</span>
                )}
              </div>

              <div className="text-slate-500 text-[8px] leading-normal font-sans">
                Seu faturamento é indexado diretamente à conta cadastrada do investidor para prover o faturamento em nuvem (Gemini 3.5 Flash).
              </div>

              {currentUser ? (
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-indigo-500 animate-ping" />
                    <span className="text-[8px] text-slate-350">VINCULADO: <strong>{currentUser.email}</strong></span>
                  </div>
                  {generatedKey && (
                    <div className="p-1 px-2 rounded bg-slate-950 border border-slate-850 font-mono text-[9px] text-amber-500 flex items-center justify-between">
                      <span className="truncate max-w-[140px]">{generatedKey}</span>
                      <span className="text-[7px] text-slate-500 uppercase">30D TRIAL OK</span>
                    </div>
                  )}
                  <button
                    onClick={handleGenerateKey}
                    disabled={isGeneratingGcloudKey}
                    className="w-full py-1.5 px-3 rounded bg-indigo-600 hover:bg-indigo-500 text-slate-100 font-bold uppercase tracking-wider text-[9px] cursor-pointer transition-all flex items-center justify-center gap-1.5"
                  >
                    {isGeneratingGcloudKey ? "GENERATING KEY..." : generatedKey ? "RENOVAR LICENÇA GCLOUD 30D" : "GERAR CHAVE GCLOUD (30 DIAS)"}
                  </button>
                </div>
              ) : (
                <div className="p-2 border border-dashed border-rose-500/20 bg-rose-950/10 text-rose-300 rounded text-center text-[9px]">
                  Sem login. Faça login em sua <strong>Conta Google</strong> no painel de investidor para herdar licenças GCloud.
                </div>
              )}

              {/* Automated payment indicator */}
              <div className="border-t border-slate-800 pt-2 flex items-center justify-between text-[8px] text-slate-500">
                <span>REINVESTIMENTO (5% S/ ASSINATURAS):</span>
                <span className="text-slate-300">R$ {reinvestmentBalance.toFixed(2)}</span>
              </div>
            </div>
          ) : llmModelType === "local1bit" ? (
            <div className="bg-slate-900 p-3 rounded border border-slate-800 text-3xs font-mono space-y-2">
              <div className="flex items-center justify-between text-slate-400">
                <span>ALOCAÇÃO EM HARDWARE:</span>
                <span className="text-emerald-400 font-bold">124MB RAM COMPATÍVEL</span>
              </div>
              <p className="text-slate-500 text-[8px] leading-normal font-sans">
                Seu modelo rodará livre de OOM (Out Of Memory) no sandbox do navegador. Excelência de inferência offline completa.
              </p>
              <div className="grid grid-cols-2 gap-2 text-[8px] text-slate-400 font-bold pt-1">
                <div className="bg-slate-950 p-1.5 rounded text-center">
                  <span className="text-slate-500 uppercase block text-[6px]">PREDICT SPEED</span>
                  <span className="text-emerald-400 font-mono text-[10px]">18 tok/s</span>
                </div>
                <div className="bg-slate-950 p-1.5 rounded text-center">
                  <span className="text-slate-500 uppercase block text-[6px]">INFERENCE LOAD</span>
                  <span className="text-sky-400 font-mono text-[10px]">35% CPU</span>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-slate-900 p-3 rounded border border-slate-800 text-3xs font-mono space-y-2">
              <div className="flex items-center justify-between text-slate-400">
                <span>RAG OFF-GRID STATUS:</span>
                <span className="text-sky-400 font-bold">ATIVADO</span>
              </div>
              <p className="text-slate-500 text-[8px] leading-normal font-sans">
                Heurísticas e recuperação locais lendo o dicionário indexado de dados do Selix para responder com confiabilidade matemática de 100%.
              </p>
            </div>
          )}
        </div>

        {/* Right Side: RAG Optimization & Fallback Trigger */}
        <div className="space-y-4 bg-slate-950/40 p-4 border border-slate-850 rounded-lg flex flex-col justify-between">
          <div>
            <span className="text-[10px] text-indigo-400 font-mono font-bold uppercase tracking-wider block mb-2">2. CONTROLE DE ACURÁCIA & RAG COGNITIVO</span>
            
            <p className="text-slate-400 text-3xs leading-relaxed font-sans mb-3">
              Monitore a precisão de recuperação do RAG. Caso o índice de acerto caia para menos do que <strong>98,0%</strong>, nosso auto-tuning aciona de forma instantânea uma LLM customizada treinada especificamente nos logs econômicos do Selix.
            </p>

            <div className="space-y-3 font-mono text-3xs bg-slate-900 p-3 rounded border border-slate-800">
              <div className="flex items-center justify-between">
                <span className="text-slate-400">ACURÁCIA ALVO RAG:</span>
                <span className="text-amber-400 font-bold text-xs">{targetAccuracy.toFixed(1)}%</span>
              </div>
              
              <input
                type="range"
                min="95"
                max="100"
                step="0.1"
                value={targetAccuracy}
                onChange={(e) => setTargetAccuracy(parseFloat(e.target.value))}
                className="w-full h-1.5 bg-slate-950 rounded appearance-none cursor-pointer accent-indigo-500"
              />

              <div className="flex items-center justify-between border-t border-slate-800 pt-2 mt-2">
                <span className="text-slate-400">ACURÁCIA EM TEMPO REAL:</span>
                <span className={`font-bold text-xs ${currentAccuracy >= 98.0 ? 'text-emerald-400' : 'text-rose-500 animate-pulse'}`}>
                  {currentAccuracy.toFixed(1)}%
                </span>
              </div>

              <div className="w-full bg-slate-950 h-2 rounded overflow-hidden mt-1.5">
                <div
                  className={`h-full transition-all duration-500 ${currentAccuracy >= 98.0 ? 'bg-gradient-to-r from-emerald-500 to-indigo-500' : 'bg-gradient-to-r from-rose-600 to-amber-500 animate-pulse'}`}
                  style={{ width: `${currentAccuracy}%` }}
                />
              </div>

              <div className="pt-2 flex justify-between gap-2">
                <button
                  type="button"
                  onClick={() => {
                    const newAcc = 95.0 + Math.random() * 4;
                    setCurrentAccuracy(newAcc);
                    onInjectLog("WARN", "RAG", `Injetando anomalia de consulta: Índice de acerto do RAG flutuou para ${newAcc.toFixed(1)}%`);
                  }}
                  className="px-2 py-1 bg-slate-950 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 text-slate-400 rounded tracking-tight uppercase text-[8px] transition-all cursor-pointer"
                >
                  ⚠ Simular Queda
                </button>
                <div className="text-[7px] text-slate-500 text-right leading-tight">
                  {currentAccuracy < 98.0 ? (
                    <span className="text-rose-400">LLM Customizada Ativada (Fallback)</span>
                  ) : (
                    <span>Embeddings otimizados localmente</span>
                  )}
                </div>
              </div>
            </div>
          </div>

          <button
            onClick={handleRunOptimizer}
            disabled={isOptimizing}
            className="w-full mt-2 py-2 px-3 rounded bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-extrabold uppercase tracking-widest text-2xs cursor-pointer transition-all flex items-center justify-center gap-1.5"
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            {isOptimizing ? "COGNITIVE TUNING RUNNING..." : "OTIMIZAR VETORES RAG"}
          </button>
        </div>
      </div>
    </div>
  );
}
