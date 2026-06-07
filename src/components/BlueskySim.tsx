/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import { 
  Send, Heart, Repeat, MessageCircle, Sparkles, CheckCircle2, 
  Volume2, ToggleLeft, ToggleRight, Play, Clock, 
  RefreshCw, Laptop, ShieldCheck, Loader2, ArrowRight
} from "lucide-react";
import { BlueskyThread } from "../db/types";
import { speak, SPEECH_GUIDES } from "../utils/speech";
import bskyCatalogData from "../utils/bluesky_catalog.json";

interface BlueskySimProps {
  threads: BlueskyThread[];
  onPublishThread: (posts: string[]) => Promise<void>;
  currentBrent: number;
  currentSelic: number;
  currentSentiment: number;
  isGeneratingThread: boolean;
  onGenerateThreadAI: () => Promise<string[] | null>;
}

export default function BlueskySim({
  threads,
  onPublishThread,
  currentBrent,
  currentSelic,
  currentSentiment,
  isGeneratingThread,
  onGenerateThreadAI,
}: BlueskySimProps) {
  // Local state for custom thread input Composer
  const [post1, setPost1] = useState("");
  const [post2, setPost2] = useState("");
  const [post3, setPost3] = useState("");
  const [activeTab, setActiveTab] = useState<"FEED" | "COMPOSER" | "SCHEDULER">("FEED");
  const [isPublishing, setIsPublishing] = useState(false);

  // Scheduler-related state representing server daemon sync
  const [schedulerState, setSchedulerState] = useState<any>(null);
  const [isForceTriggering, setIsForceTriggering] = useState(false);
  const [isUpdatingState, setIsUpdatingState] = useState(false);
  const [schedulerMessage, setSchedulerMessage] = useState<string | null>(null);

  // Fetch scheduler state from Express backend
  const fetchSchedulerState = async () => {
    try {
      const res = await fetch("/api/state/bluesky-scheduler");
      if (res.ok) {
        const data = await res.json();
        setSchedulerState(data);
      }
    } catch (e) {
      console.error("Error loading Bluesky scheduler status:", e);
    }
  };

  useEffect(() => {
    fetchSchedulerState();
    // Poll status to live sync history or target changes after background activities
    const interval = setInterval(fetchSchedulerState, 8000);
    return () => clearInterval(interval);
  }, []);

  // Update active/inactive state of the scheduler
  const handleToggleScheduler = async () => {
    if (!schedulerState || isUpdatingState) return;
    setIsUpdatingState(true);
    setSchedulerMessage(null);
    try {
      const res = await fetch("/api/state/bluesky-scheduler/update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ active: !schedulerState.active })
      });
      if (res.ok) {
        const data = await res.json();
        setSchedulerState(prev => prev ? { ...prev, active: data.active } : null);
        setSchedulerMessage(`Status do agendador alterado para: ${data.active ? "ATIVO" : "DESATIVADO"}`);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsUpdatingState(false);
    }
  };

  // Change current target day index of the 30-day loop
  const handleChangeTargetDay = async (dayIndex: number) => {
    if (!schedulerState || isUpdatingState) return;
    setIsUpdatingState(true);
    setSchedulerMessage(null);
    try {
      const res = await fetch("/api/state/bluesky-scheduler/update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentDayIndex: dayIndex })
      });
      if (res.ok) {
        const data = await res.json();
        setSchedulerState(prev => prev ? { ...prev, currentDayIndex: data.currentDayIndex } : null);
        setSchedulerMessage(`Dia-Alvo da saga Selix redefinido com sucesso para o Dia ${dayIndex}`);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsUpdatingState(false);
    }
  };

  // Force trigger the scheduler to dispatch the next slot immediately
  const handleForceTriggerSlot = async () => {
    if (isForceTriggering) return;
    setIsForceTriggering(true);
    setSchedulerMessage(null);
    try {
      const res = await fetch("/api/state/bluesky-scheduler/force-trigger", {
        method: "POST",
        headers: { "Content-Type": "application/json" }
      });
      const data = await res.json();
      if (res.ok) {
        setSchedulerMessage(`✅ Sucesso! Post do segmento [${data.postedSegment}] do Dia ${data.dayIndex} disparador enviado.`);
        fetchSchedulerState();
        
        // Discrecy click tracking link to refresh parent threads
        const triggerBtn = document.getElementById("trigger-threads-refresh");
        if (triggerBtn) {
          (triggerBtn as any).click();
        }
      } else {
        setSchedulerMessage(`❌ Erro de disparo: ${data.error || "Ocorreu um erro no servidor"}`);
      }
    } catch (e: any) {
      console.error(e);
      setSchedulerMessage(`❌ Falha na conexão com servidor.`);
    } finally {
      setIsForceTriggering(false);
    }
  };

  // Trigger Gemini AI generation
  const handleAIGenerate = async () => {
    const aiPosts = await onGenerateThreadAI();
    if (aiPosts && aiPosts.length >= 2) {
      setPost1(aiPosts[0] || "");
      setPost2(aiPosts[1] || "");
      setPost3(aiPosts[2] || "");
      setActiveTab("COMPOSER");
    }
  };

  // Publish manual or AI generated thread
  const handlePublish = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!post1.trim()) return;

    setIsPublishing(true);
    const postArray = [post1];
    if (post2.trim()) postArray.push(post2);
    if (post3.trim()) postArray.push(post3);

    try {
      await onPublishThread(postArray);
      // Reset composer fields
      setPost1("");
      setPost2("");
      setPost3("");
      setActiveTab("FEED");
    } catch (err) {
      console.error(err);
    } finally {
      setIsPublishing(false);
    }
  };

  // Get catalog structure
  const targetDayIdx = schedulerState?.currentDayIndex || 1;
  const currentDayPosts = (bskyCatalogData as Record<string, any[]>)[String(targetDayIdx)] || [];

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-2xl flex flex-col gap-5" id="bluesky-simulator">
      {/* SIMULATED BLUESKY BIO HEADER */}
      <div className="bg-slate-950 p-4 rounded-lg border border-slate-800 flex flex-col sm:flex-row items-center gap-4 relative overflow-hidden">
        {/* Sky glow effect */}
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-sky-500 via-blue-500 to-indigo-500" />
        
        {/* Mock Avatar */}
        <div className="w-14 h-14 bg-sky-950 rounded-full border-2 border-sky-400 flex items-center justify-center font-bold text-sky-400 text-lg relative flex-shrink-0 select-none">
          SLX
          <span className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-emerald-500 border-2 border-slate-950 rounded-full animate-pulse" />
        </div>

        {/* Profile info */}
        <div className="text-center sm:text-start flex-1">
          <div className="flex flex-col sm:flex-row items-center gap-1.5 justify-center sm:justify-start">
            <div className="flex items-center gap-1.5">
              <h3 className="font-bold text-slate-100 text-sm">S.E.L.I.X (Flex‑AI)</h3>
              <button
                type="button"
                onClick={() => speak(SPEECH_GUIDES.bluesky, true)}
                className="p-0.5 rounded text-slate-500 hover:text-sky-400 hover:bg-sky-950/45 transition-colors cursor-pointer"
                title="Ouvir explicação do painel analítico Bluesky por voz"
              >
                <Volume2 className="w-3.5 h-3.5" />
              </button>
            </div>
            <a
              href="https://bsky.app/profile/zeh-sobrinho.bsky.social"
              target="_blank"
              rel="noopener noreferrer"
              className="text-3xs bg-sky-950 hover:bg-sky-900 border border-sky-400/30 hover:border-sky-400/60 text-sky-400 px-2 py-0.5 rounded font-bold font-mono transition-all flex items-center gap-1 cursor-pointer"
              title="Visitar perfil real no Bluesky ↗"
            >
              @zeh-sobrinho.bsky.social ↗
            </a>
          </div>
          
          <p className="text-3xs text-slate-400 mt-1 leading-relaxed max-w-xl">
            🧠 Sistema autônomo monitorando Brent, Selic e sentimento de mercado. Operando sob segurança formal de Lean 4. Publicações 100% autênticas e validadas de 0% de alucinações.
          </p>

          <div className="flex items-center gap-3 mt-2 justify-center sm:justify-start font-mono text-3xs text-slate-500">
            <div>
              <span className="font-bold text-slate-300">4,120</span> seguidores
            </div>
            <div>
              <span className="font-bold text-slate-300">82</span> seguindo
            </div>
            <div className="flex items-center gap-1">
              <span className="inline-block w-1.5 h-1.5 bg-emerald-500 rounded-full" />
              <span className="text-emerald-400 font-bold">AUTOMATIZADOR ATIVO</span>
            </div>
          </div>
        </div>

        {/* AI Generate Prompt floating action */}
        <button
          onClick={handleAIGenerate}
          disabled={isGeneratingThread}
          className="text-3xs font-mono font-bold bg-sky-950 hover:bg-sky-900 border border-sky-400/30 hover:border-sky-400/60 text-sky-400 px-3 py-2 rounded transition-all flex items-center gap-1.5 select-none w-full sm:w-auto justify-center cursor-pointer"
        >
          <Sparkles className={`w-3.5 h-3.5 ${isGeneratingThread ? "animate-spin text-amber-400" : "text-sky-300"}`} />
          {isGeneratingThread ? "GERANDO THREAD..." : "COMPOR COM GÊMINIS"}
        </button>
      </div>

      {/* COMPOSER TAB NAVIGATION */}
      <div className="flex border-b border-slate-800 font-mono text-2xs select-none" id="bluesky-tab-headers">
        <button
          onClick={() => { setActiveTab("FEED"); setSchedulerMessage(null); }}
          className={`px-4 py-2 border-b-2 font-semibold transition-all ${
            activeTab === "FEED"
              ? "border-sky-400 text-sky-400"
              : "border-transparent text-slate-400 hover:text-slate-200"
          }`}
        >
          TIMELINE DE THREADS ({threads.length})
        </button>
        <button
          onClick={() => { setActiveTab("COMPOSER"); setSchedulerMessage(null); }}
          className={`px-4 py-2 border-b-2 font-semibold transition-all ${
            activeTab === "COMPOSER"
              ? "border-sky-400 text-sky-400"
              : "border-transparent text-slate-400 hover:text-slate-200"
          }`}
        >
          ESCREVER COMUNICAÇÃO MANUAL/DIRETA
        </button>
        <button
          onClick={() => { setActiveTab("SCHEDULER"); setSchedulerMessage(null); }}
          className={`px-4 py-2 border-b-2 font-semibold transition-all flex items-center gap-1 ${
            activeTab === "SCHEDULER"
              ? "border-sky-400 text-sky-400"
              : "border-transparent text-slate-400 hover:text-slate-200"
          }`}
        >
          <Clock className="w-3 h-3 text-sky-400 animate-pulse" />
          AUTO-POSTS CRONAGEM ({schedulerState?.catalogSize || 30} DIAS)
        </button>
      </div>

      {/* BODY CONTEXT: RENDERING BASED ON ACTIVE TAB */}
      {activeTab === "FEED" && (
        <div className="flex flex-col gap-4 max-h-[380px] overflow-y-auto pr-1 animate-fade-in" id="bluesky-timeline-feed">
          {threads.length === 0 ? (
            <div className="text-center py-10 text-xs text-slate-500 font-mono">
              Nenhuma postagem na timeline. Use o robô para gerar ou escreva um post manual!
            </div>
          ) : (
            threads.map((thread) => (
              <div key={thread.id} className="bg-slate-950 border border-slate-850 rounded-lg p-4 font-sans relative">
                <div className="flex items-center justify-between border-b border-slate-900/60 pb-2 mb-3">
                  <span className="text-3xs text-slate-500 font-mono">
                    {new Date(thread.timestamp).toLocaleDateString()} {new Date(thread.timestamp).toLocaleTimeString()}
                  </span>
                  {thread.automated && (
                    <span className="text-4xs bg-teal-950/40 text-teal-400 border border-teal-500/20 px-1.5 py-0.5 rounded font-mono font-bold uppercase tracking-wider flex items-center gap-1 select-none">
                      <CheckCircle2 className="w-2.5 h-2.5 text-teal-400" />
                      AUTO-POST COMPILADO
                    </span>
                  )}
                </div>

                {/* Cascade of single thread posts */}
                <div className="space-y-3 pl-1 mb-4">
                  {thread.posts.map((post, pIdx) => (
                    <div key={pIdx} className="relative pl-4 flex flex-col gap-0.5 text-xs text-slate-200">
                      {/* Thread link line visual */}
                      {pIdx < thread.posts.length - 1 && (
                        <div className="absolute left-[3px] top-4 bottom-[-16px] w-[1px] bg-slate-800" />
                      )}
                      <div className="absolute left-0 top-1.5 w-1.5 h-1.5 rounded-full bg-sky-500" />
                      <div className="leading-relaxed whitespace-pre-wrap">{post.text}</div>
                    </div>
                  ))}
                </div>

                {/* Feed metrics */}
                <div className="flex items-center gap-4 text-3xs font-mono text-slate-500 border-t border-slate-900/60 pt-2 select-none">
                  <div className="flex items-center gap-1 hover:text-rose-400 cursor-pointer transition-colors">
                    <Heart className="w-3.5 h-3.5" />
                    <span>{thread.likes}</span>
                  </div>
                  <div className="flex items-center gap-1 hover:text-emerald-400 cursor-pointer transition-colors">
                    <Repeat className="w-3.5 h-3.5" />
                    <span>{thread.reposts}</span>
                  </div>
                  <div className="flex items-center gap-1 hover:text-sky-400 cursor-pointer transition-colors">
                    <MessageCircle className="w-3.5 h-3.5" />
                    <span>{thread.replies}</span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {activeTab === "COMPOSER" && (
        <form onSubmit={handlePublish} className="flex flex-col gap-3 font-mono animate-fade-in" id="composer-tab-form">
          <p className="text-slate-500 text-3xs mb-1">
            Redija um comunicado encadeado para o Bluesky. Em virtude do formato thread, separe o contexto lógico em até 3 blocos ordenados para simulação:
          </p>

          <div className="space-y-3">
            <div>
              <label className="text-3xs text-sky-400 block mb-1">POST 1 (ABERTURA COM BRENT OIL) *</label>
              <textarea
                value={post1}
                onChange={(e) => setPost1(e.target.value)}
                maxLength={300}
                required
                placeholder="Exágono de dados Brent no mercado global..."
                className="w-full bg-slate-950 border border-slate-800 rounded p-2 text-xs text-slate-200 outline-none focus:border-sky-400 resize-none h-14"
              />
              <div className="text-right text-4xs text-slate-500">{post1.length}/300</div>
            </div>

            <div>
              <label className="text-3xs text-sky-400 block mb-1">POST 2 (ESTABILIZAÇÃO SELIC E FINANÇAS)</label>
              <textarea
                value={post2}
                onChange={(e) => setPost2(e.target.value)}
                maxLength={300}
                placeholder="Impacto doméstico inflacionário do comitê..."
                className="w-full bg-slate-950 border border-slate-800 rounded p-2 text-xs text-slate-200 outline-none focus:border-sky-400 resize-none h-14"
              />
              <div className="text-right text-4xs text-slate-500">{post2.length}/300</div>
            </div>

            <div>
              <label className="text-3xs text-sky-400 block mb-1">POST 3 (TEOREMAS E HARDWARE)</label>
              <textarea
                value={post3}
                onChange={(e) => setPost3(e.target.value)}
                maxLength={300}
                placeholder="Verificabilidade Lean em hardware restrito Termux..."
                className="w-full bg-slate-950 border border-slate-800 rounded p-2 text-xs text-slate-200 outline-none focus:border-sky-400 resize-none h-14"
              />
              <div className="text-right text-4xs text-slate-500">{post3.length}/300</div>
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 mt-1">
            <button
              type="button"
              onClick={() => setActiveTab("FEED")}
              className="px-3 py-1.5 border border-slate-800 text-slate-400 hover:text-slate-200 rounded text-2xs transition-colors cursor-pointer"
            >
              CANCELAR
            </button>
            <button
              type="submit"
              disabled={isPublishing || !post1.trim()}
              className="px-4 py-1.5 bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold rounded text-2xs transition-all flex items-center gap-1 select-none cursor-pointer"
            >
              <Send className="w-3.5 h-3.5" />
              {isPublishing ? "PUBLIKANDO..." : "PUBLICAR THREAD NO SIMULADOR"}
            </button>
          </div>
        </form>
      )}

      {activeTab === "SCHEDULER" && (
        <div className="flex flex-col gap-4 font-mono text-xs text-slate-200 animate-fade-in" id="scheduler-tab-panel">
          
          {/* CRITICAL DETECTION STATUS */}
          <div className="bg-slate-950 p-4 rounded-lg border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <span className="text-4xs text-slate-500 block">SISTEMA INTEGRADO</span>
              <div className="flex items-center gap-2 mt-1">
                {schedulerState?.credentialsConfigured ? (
                  <span className="bg-emerald-950/80 text-emerald-400 border border-emerald-500/30 text-3xs font-bold px-2 py-0.5 rounded flex items-center gap-1">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    CONECTADO AO BLUESKY (AUTOMÁTICO)
                  </span>
                ) : (
                  <span className="bg-slate-900 border border-slate-800 text-slate-400 text-3xs font-bold px-2 py-0.5 rounded flex items-center gap-1">
                    <Laptop className="w-3.5 h-3.5" />
                    SIMULAÇÃO LOCAL (SEM CREDENCIAIS EM .ENV)
                  </span>
                )}
              </div>
              <p className="text-4xs text-slate-500 mt-2 max-w-xl leading-relaxed">
                {schedulerState?.credentialsConfigured
                  ? `Federado com o identificador real: @${schedulerState.username}. O robô processará e enviará publicações verdadeiras para a rede descentralizada.`
                  : "Por padrão o robô simula as publicações na timeline local. Declare BLUESKY_USERNAME e BLUESKY_APP_PASSWORD no seu .env para habilitar conexões ativas reais!"}
              </p>
            </div>

            <div className="flex flex-col items-stretch sm:items-end gap-2 shrink-0">
              <span className="text-4xs text-slate-500 text-left sm:text-right">AÇÕES DO MOTOR</span>
              
              <div className="flex gap-2">
                {/* Active/Inactive Switch Toggle */}
                <button
                  onClick={handleToggleScheduler}
                  disabled={isUpdatingState}
                  className={`px-3 py-1.5 rounded text-3xs font-extrabold flex items-center gap-1.5 transition-all select-none cursor-pointer ${
                    schedulerState?.active 
                      ? "bg-sky-500/10 border border-sky-400/40 text-sky-400 hover:bg-sky-500/20" 
                      : "bg-slate-900 border border-slate-800 text-slate-500 hover:bg-slate-850"
                  }`}
                  title={schedulerState?.active ? "Desativar Agendamento Automático" : "Ativar Agendamento Automático"}
                >
                  <Clock className="w-3.5 h-3.5" />
                  AGENDADOR: {schedulerState?.active ? "ATIVADO" : "DESATIVADO"}
                </button>

                {/* Force Trigger */}
                <button
                  onClick={handleForceTriggerSlot}
                  disabled={isForceTriggering}
                  className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 px-3 py-1.5 rounded text-3xs font-extrabold flex items-center gap-1 shadow-md hover:shadow-emerald-500/10 select-none cursor-pointer"
                  title="Disparar a publicação do próximo slot não enviado do dia agora"
                >
                  {isForceTriggering ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Play className="w-3.5 h-3.5 fill-current" />
                  )}
                  FORÇAR POST ATUAL
                </button>
              </div>
            </div>
          </div>

          {/* Feedback logs prompt banner */}
          {schedulerMessage && (
            <div className="bg-slate-950/60 border border-slate-850 p-2.5 rounded text-3xs text-sky-400 flex items-center gap-2 font-mono">
              <span className="w-2 h-2 rounded-full bg-sky-400 animate-ping inline-block shrink-0" />
              <span>{schedulerMessage}</span>
            </div>
          )}

          {/* CHOOSE DAY SAGA SPREADING CONTROLS */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            
            {/* COLUMN 1: SAGA SCHEDULE CONFIGURATOR */}
            <div className="bg-slate-950 p-4 rounded-lg border border-slate-850 flex flex-col gap-3 select-none">
              <h4 className="font-extrabold text-slate-300 text-3xs tracking-widest border-b border-slate-900 pb-1.5 uppercase">
                ⚙️ Configuração do Ciclo
              </h4>

              <div>
                <label className="text-4xs text-slate-500 block mb-1">DIA DO CRONOGRAMA (SAGA):</label>
                <select
                  value={targetDayIdx}
                  onChange={(e) => handleChangeTargetDay(Number(e.target.value))}
                  disabled={isUpdatingState}
                  className="bg-slate-900 border border-slate-800 rounded px-2 py-1.5 text-xs text-slate-200 outline-none w-full focus:border-sky-400 font-mono"
                >
                  {Array.from({ length: 30 }).map((_, idx) => (
                    <option key={idx + 1} value={idx + 1}>
                      Dia {idx + 1} de 30 - Calendário
                    </option>
                  ))}
                </select>
                <span className="text-4xs text-slate-500 mt-1 block leading-normal">
                  Selecione o Dia de publicação para visualizar e controlar as inserções na timeline.
                </span>
              </div>

              <div className="bg-slate-900/50 p-2.5 rounded border border-slate-900 text-4xs text-slate-400 leading-normal">
                <span className="font-bold text-slate-200 block mb-0.5">ℹ️ Modelo de Transição:</span>
                O Selix monitora e dispara nos horários indicados. Quando todos os 3 blocos diários de um Dia são publicados, o índice avança automaticamente para o próximo dia.
              </div>
            </div>

            {/* COLUMN 2 & 3: DETAILS OF THE CURRENT SELECTED DAY POSTS */}
            <div className="bg-slate-950 p-4 rounded-lg border border-slate-850 md:col-span-2 flex flex-col gap-3">
              <h4 className="font-extrabold text-slate-300 text-3xs tracking-widest border-b border-slate-900 pb-1.5 uppercase flex items-center justify-between">
                <span>📋 Conteúdo Agendado — Dia {targetDayIdx}</span>
                <span className="text-4xs text-slate-500 font-normal">3 slots diários</span>
              </h4>

              <div className="space-y-2.5 max-h-[190px] overflow-y-auto pr-1">
                {currentDayPosts.map((slot, sIdx) => {
                  const wasPosted = schedulerState?.history?.some(
                    (h: any) => h.dayIndex === targetDayIdx && h.segmento === slot.segmento
                  );

                  return (
                    <div key={sIdx} className="bg-slate-900/40 p-2.5 rounded border border-slate-900 flex gap-2 relative">
                      <div className="flex flex-col items-center shrink-0 w-12 font-mono text-center">
                        <span className="text-4xs text-slate-500 uppercase block leading-none">HORÁRIO</span>
                        <strong className="text-3xs text-sky-400 font-extrabold mt-1 block">{slot.horario}</strong>
                        <span className="text-3xs text-slate-500 block leading-none mt-2 font-bold uppercase">{slot.segmento}</span>
                      </div>
                      
                      <div className="border-l border-slate-850 px-3 flex-1">
                        <p className="text-4xs text-slate-300 leading-relaxed italic whitespace-pre-wrap">
                          "{slot.texto}"
                        </p>
                      </div>

                      {/* Posted indicator decoration */}
                      {wasPosted && (
                        <span className="absolute top-2 right-2 text-4xs bg-emerald-950/50 text-emerald-400 border border-emerald-500/20 px-1 py-0.2 rounded font-bold">
                          DIRECIONADO
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

          </div>

          {/* HISTÓRICO DE DISPAROS REAL / SIMULADO */}
          <div className="bg-slate-950 p-4 rounded-lg border border-slate-850 flex flex-col gap-3 leading-normal">
            <h4 className="font-extrabold text-slate-300 text-3xs tracking-widest border-b border-slate-900 pb-1.5 uppercase flex items-center justify-between">
              <span>📜 Histórico Recente de Publicações Automáticas</span>
              <span className="text-4xs text-slate-500">{schedulerState?.history?.length || 0} registros enviados</span>
            </h4>

            {schedulerState?.history && schedulerState.history.length > 0 ? (
              <div className="space-y-2 max-h-[160px] overflow-y-auto pr-1">
                {schedulerState.history.slice(0, 10).map((h: any, hIdx: number) => {
                  const isMock = h.uri?.startsWith("mock_");
                  return (
                    <div key={hIdx} className="bg-slate-900/60 p-2 border border-slate-900 rounded flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 hover:bg-slate-900 transition-colors">
                      <div className="flex items-center gap-2">
                        <span className="text-4xs bg-slate-800 text-slate-300 px-1.5 py-0.5 rounded font-mono font-bold">
                          Dia {h.dayIndex}
                        </span>
                        <span className="text-4xs bg-sky-950 text-sky-400 px-1.5 py-0.5 rounded font-bold uppercase">
                          {h.segmento}
                        </span>
                        <p className="text-4xs text-slate-400 max-w-[200px] truncate">
                          {h.textSnippet}
                        </p>
                      </div>
                      
                      <div className="flex items-center gap-4 font-mono text-4xs">
                        <span className="text-slate-500">
                          {new Date(h.timestamp).toLocaleDateString()} {new Date(h.timestamp).toLocaleTimeString()}
                        </span>
                        
                        {isMock ? (
                          <span className="bg-slate-950 text-slate-500 px-1.5 py-0.5 rounded border border-slate-900 font-extrabold">
                            SIMULADO (LOCAL)
                          </span>
                        ) : (
                          <a
                            href={`https://bsky.app/profile/${schedulerState.username}/post/${h.uri?.split("/").pop()}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="bg-emerald-950/70 text-emerald-400 px-1.5 py-0.5 rounded border border-emerald-500/20 hover:border-emerald-500/40 font-extrabold flex items-center gap-0.5"
                          >
                            REAL (BLUESKY ↗)
                          </a>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-6 text-slate-500 text-2xs italic font-mono">
                Sem histórico de publicações automáticas registradas no banco de dados local. Use o botão "Forçar Post Atual" acima para testar!
              </div>
            )}
          </div>

        </div>
      )}
    </div>
  );
}
