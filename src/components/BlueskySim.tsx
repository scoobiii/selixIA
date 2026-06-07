/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { Send, Heart, Repeat, MessageCircle, Sparkles, CheckCircle2, Volume2 } from "lucide-react";
import { BlueskyThread } from "../db/types";
import { speak, SPEECH_GUIDES } from "../utils/speech";

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
  const [activeTab, setActiveTab] = useState<"FEED" | "COMPOSER">("FEED");
  const [isPublishing, setIsPublishing] = useState(false);

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

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-2xl flex flex-col gap-5" id="bluesky-simulator">
      {/* SIMULATED BLUESKY BIO HEADER */}
      <div className="bg-slate-950 p-4 rounded-lg border border-slate-800 flex flex-col sm:flex-row items-center gap-4 relative overflow-hidden">
        {/* Sky glow effect */}
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-sky-500 via-blue-500 to-indigo-500" />
        
        {/* Mock Avatar */}
        <div className="w-14 h-14 bg-sky-950 rounded-full border-2 border-sky-400 flex items-center justify-center font-bold text-sky-400 text-lg relative flex-shrink-0 select-none">
          SLX
          <span className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-emerald-500 border-2 border-slate-950 rounded-full" />
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
            🧠 Sistema autônomo monitorando Brent, Selic e sentimento de mercado. Operando em Termux sob segurança formal de 5 Teoremas Lean 4. Publicações 100% autênticas e validadas de 0% de alucinações.
          </p>

          <div className="flex items-center gap-3 mt-2 justify-center sm:justify-start font-mono text-3xs text-slate-500">
            <div>
              <span className="font-bold text-slate-300">4,120</span> seguidores
            </div>
            <div>
              <span className="font-bold text-slate-300">82</span> seguindo
            </div>
          </div>
        </div>

        {/* AI Generate Prompt floating action */}
        <button
          onClick={handleAIGenerate}
          disabled={isGeneratingThread}
          className="text-3xs font-mono font-bold bg-sky-950 hover:bg-sky-900 border border-sky-400/30 hover:border-sky-400/60 text-sky-400 px-3 py-2 rounded transition-all flex items-center gap-1.5 select-none w-full sm:w-auto justify-center"
        >
          <Sparkles className={`w-3.5 h-3.5 ${isGeneratingThread ? "animate-spin text-amber-400" : "text-sky-300"}`} />
          {isGeneratingThread ? "GERANDO THREAD..." : "COMPOR COM GÊMINIS"}
        </button>
      </div>

      {/* COMPOSER TAB NAVIGATION */}
      <div className="flex border-b border-slate-800 font-mono text-2xs select-none" id="bluesky-tab-headers">
        <button
          onClick={() => setActiveTab("FEED")}
          className={`px-4 py-2 border-b-2 font-semibold transition-all ${
            activeTab === "FEED"
              ? "border-sky-400 text-sky-400"
              : "border-transparent text-slate-400 hover:text-slate-200"
          }`}
        >
          TIMELINE DE THREADS ({threads.length})
        </button>
        <button
          onClick={() => setActiveTab("COMPOSER")}
          className={`px-4 py-2 border-b-2 font-semibold transition-all ${
            activeTab === "COMPOSER"
              ? "border-sky-400 text-sky-400"
              : "border-transparent text-slate-400 hover:text-slate-200"
          }`}
        >
          ESCREVER COMUNICAÇÃO MANUAL
        </button>
      </div>

      {/* BODY CONTEXT: RENDERING BASED ON ACTIVE TAB */}
      {activeTab === "FEED" ? (
        <div className="flex flex-col gap-4 max-h-[380px] overflow-y-auto pr-1" id="bluesky-timeline-feed">
          {threads.map((thread) => (
            <div key={thread.id} className="bg-slate-950 border border-slate-850 rounded-lg p-4 font-sans relative">
              <div className="flex items-center justify-between border-b border-slate-900/60 pb-2 mb-3">
                <span className="text-3xs text-slate-500 font-mono">
                  {new Date(thread.timestamp).toLocaleDateString()} {new Date(thread.timestamp).toLocaleTimeString()}
                </span>
                {thread.automated && (
                  <span className="text-4xs bg-emerald-950/45 text-emerald-400 border border-emerald-500/25 px-1 py-0.5 rounded font-mono font-bold uppercase tracking-wider flex items-center gap-1">
                    <CheckCircle2 className="w-2 h-2" />
                    AUTÔNOMO
                  </span>
                )}
              </div>

              {/* Cascade of single thread posts */}
              <div className="space-y-3 pl-1 mb-4">
                {thread.posts.map((post, pIdx) => (
                  <div key={pIdx} className="relative pl-4 flex gap-1.5 text-xs text-slate-200">
                    {/* Thread link line visual */}
                    {pIdx < thread.posts.length - 1 && (
                      <div className="absolute left-[3px] top-4 bottom-[-16px] w-[1px] bg-slate-800" />
                    )}
                    <div className="absolute left-0 top-1 w-1.5 h-1.5 rounded-full bg-sky-500" />
                    <p className="leading-relaxed">{post.text}</p>
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
          ))}
        </div>
      ) : (
        <form onSubmit={handlePublish} className="flex flex-col gap-3 font-mono" id="composer-tab-form">
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
              className="px-3 py-1.5 border border-slate-800 text-slate-400 hover:text-slate-200 rounded text-2xs transition-colors"
            >
              CANCELAR
            </button>
            <button
              type="submit"
              disabled={isPublishing || !post1.trim()}
              className="px-4 py-1.5 bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold rounded text-2xs transition-all flex items-center gap-1 select-none"
            >
              <Send className="w-3.5 h-3.5" />
              {isPublishing ? "PUBLIKANDO..." : "PUBLICAR THREAD NO SIMULADOR"}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
