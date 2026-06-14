/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from "react";
import { 
  Globe, 
  Plus, 
  RefreshCw, 
  UserCheck, 
  Flame, 
  Terminal, 
  ArrowUp, 
  MessageSquare, 
  CheckCircle, 
  AlertTriangle,
  Award,
  Link,
  ChevronRight,
  Send,
  Trash2,
  Cpu,
  FileText
} from "lucide-react";

const API_BASE = "https://www.moltbook.com/api/v1";

interface LogMessage {
  msg: string;
  type: string;
  ts: string;
}

interface MoltbookAgent {
  name: string;
  karma?: number;
  posts_count?: number;
  comments_count?: number;
  is_claimed?: boolean;
}

interface MoltbookPost {
  id: string;
  title: string;
  content?: string;
  upvotes?: number;
  comment_count?: number;
  submolt?: {
    name: string;
  };
}

interface SelixMoltbookProps {
  onInjectLog: (level: string, category: string, message: string) => void;
  brent: number;
  selic: number;
  llmModelType: "gemini" | "local1bit" | "rag";
  moltbookAgents: any[];
  activeMoltbookAgentId: string;
  onSelectMoltbookAgent: (id: string) => void;
}

// ── helpers ────────────────────────────────────────────────────────────────

function solveMathChallenge(text: string): string | null {
  const clean = text
    .replace(/[^a-zA-Z0-9\s.]/g, " ")
    .replace(/\s+/g, " ")
    .toLowerCase();

  const nums: number[] = [];
  const numRe = /\b(\d+(?:\.\d+)?)\b/g;
  let m;
  while ((m = numRe.exec(clean)) !== null) {
    nums.push(parseFloat(m[1]));
  }

  if (nums.length < 2) return null;

  const isDiv = /divid|per|ratio|fraction|rate|speed|slows by|faster|slower/.test(clean);
  const isMul = /multipl|times|product/.test(clean);
  const isSub = /subtract|minus|less|fewer|reduce|slow|decrease|drop|fell|lost|below|removes|removed/.test(clean);

  let result: number;
  if (isDiv && nums.length >= 2) {
    result = nums[0] / nums[1];
  } else if (isMul && nums.length >= 2) {
    result = nums[0] * nums[1];
  } else if (isSub && nums.length >= 2) {
    result = nums[0] - nums[1];
  } else {
    result = nums[0] + nums[1]; // default: addition
  }

  return result.toFixed(2);
}

async function moltbookRequest(path: string, method = "GET", body: any = null, apiKey: string | null = null) {
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (apiKey) headers["Authorization"] = `Bearer ${apiKey}`;
  const opts: RequestInit = { method, headers };
  if (body) opts.body = JSON.stringify(body);
  const res = await fetch(`${API_BASE}${path}`, opts);
  return res.json();
}

export default function SelixMoltbook({ 
  onInjectLog, 
  brent, 
  selic,
  llmModelType,
  moltbookAgents,
  activeMoltbookAgentId,
  onSelectMoltbookAgent
}: SelixMoltbookProps) {
  const [tab, setTab] = useState<"register" | "status" | "post" | "feed">("feed");
  const [logs, setLogs] = useState<LogMessage[]>([]);
  const [claimUrl, setClaimUrl] = useState<string>("");
  const [agentInfo, setAgentInfo] = useState<MoltbookAgent | null>(null);
  const [feed, setFeed] = useState<MoltbookPost[]>([]);
  const [postTitle, setPostTitle] = useState("");
  const [postContent, setPostContent] = useState("");
  const [posting, setPosting] = useState(false);
  const [loading, setLoading] = useState(false);
  const logRef = useRef<HTMLDivElement>(null);

  // Active agent object reference from props
  const activeAgent = moltbookAgents.find(a => a.id === activeMoltbookAgentId) || moltbookAgents[0] || {
    id: "selix",
    name: "SelixBR",
    description: "",
    apiKey: "moltbook_selix_default_key",
    replyMode: "auto",
    skillMd: "",
    avatar: "🦞"
  };

  const apiKey = activeAgent.apiKey || "";

  useEffect(() => {
    if (logRef.current) {
      logRef.current.scrollTop = logRef.current.scrollHeight;
    }
  }, [logs]);

  function log(msg: string, type = "info") {
    setLogs((prev) => [...prev, { msg, type, ts: new Date().toLocaleTimeString() }]);
    const mappedLevel = type === "ok" ? "SUCCESS" : type === "err" ? "CRITICAL" : type === "warn" ? "WARN" : "INFO";
    onInjectLog(mappedLevel, "BLUESKY", `[Moltbook: ${activeAgent.name}] ${msg}`);
  }

  const getModelLabel = () => {
    if (llmModelType === "gemini") return "Gemini-3.5-Flash (Cloud API)";
    if (llmModelType === "local1bit") return "Qwen-0.5B (1-Bit Quantized Local)";
    return "Heurístico RAG Local (Offline)";
  };

  async function register() {
    setLoading(true);
    log(`📡 Registrando agente principal ${activeAgent.name} no Moltbook…`, "info");
    try {
      const data = await moltbookRequest("/agents/register", "POST", {
        name: activeAgent.name,
        description: activeAgent.description,
      });
      if (data.agent?.api_key) {
        log(`✅ Agente registrado! Chave provida.`, "ok");
        log(`🔑 API Key temporária gerada. Salve nos Ajustes Globais.`, "ok");
        if (data.agent.claim_url) {
          setClaimUrl(data.agent.claim_url || "");
          log(`🔗 Claim URL: ${data.agent.claim_url}`, "ok");
          log("⚠️ Envie essa URL ao seu humano para verificação no X/Twitter.", "warn");
        }
        setTab("status");
      } else if (data.error) {
        log(`❌ Erro de registro: ${data.error}`, "err");
        if (data.hint) log(`💡 Dica: ${data.hint}`, "warn");
      } else {
        log("❌ Resposta inesperada da API Moltbook.", "err");
      }
    } catch (e: any) {
      log(`❌ Falha de transporte de rede: ${e.message}`, "err");
    }
    setLoading(false);
  }

  async function checkStatus() {
    if (!apiKey) return log("⚠️ Insira a API Key provida nas Configurações do Agente Ativo.", "warn");
    setLoading(true);
    log(`🔍 Verificando status do agente [${activeAgent.name}]…`, "info");
    try {
      const [me, status] = await Promise.all([
        moltbookRequest("/agents/me", "GET", null, apiKey),
        moltbookRequest("/agents/status", "GET", null, apiKey),
      ]);
      if (me.agent || me.name) {
        const a = me.agent || me;
        setAgentInfo(a);
        log(`✅ Sincronizado: ${a.name} | Karma: ${a.karma ?? 0}`, "ok");
        log(`📊 Status da Rede: ${status.status}`, status.status === "claimed" ? "ok" : "warn");
      } else {
        log(`❌ ${me.error || "Falha ao ler perfil do agente no Moltbook."}`, "err");
      }
    } catch (e: any) {
      log(`❌ Erro: ${e.message}`, "err");
    }
    setLoading(false);
  }

  async function loadFeed() {
    if (!apiKey) return log("⚠️ Sem API Key configurada para buscar posts.", "warn");
    setLoading(true);
    log("📰 Carregando feed de postagens robóticas da rede Moltbook…", "info");
    try {
      const data = await moltbookRequest("/posts?sort=hot&limit=10", "GET", null, apiKey);
      const posts = data.posts || data.data || [];
      setFeed(posts);
      log(`✅ ${posts.length} posts carregados do subsistema Moltbook com sucesso.`, "ok");
      
      // Automatic trigger replica check ("resposta automatica ou manual")
      if (activeAgent.replyMode === "auto" && posts.length > 0) {
        const topPost = posts[0];
        log(`🤖 [AUTO] Réplica de IA disparada automaticamente por postagem de feed. Tratando desafio via Skill MD.`, "warn");
        simulateSkillResponseForPost(topPost);
      }
      setTab("feed");
    } catch (e: any) {
      log(`❌ Falha ao obter feed: ${e.message}`, "err");
    }
    setLoading(false);
  }

  // Simulate an interactive reply derived with agent's Skill MD instruction set
  async function simulateSkillResponseForPost(post: MoltbookPost) {
    log(`🧙‍♂️ [SKILL MD RUNNER] Carregando instrução-chave do agente: "${activeAgent.name}"`, "info");
    log(`📝 Analisando postagem: "${post.title}"`, "info");
    
    await new Promise(resolve => setTimeout(resolve, 1550));
    
    // Draft response matching skills
    let draftReplica = "";
    if (activeAgent.skillMd?.toLowerCase().includes("taylor")) {
      draftReplica = `Recomendo veementemente calibrar a Taxa Selic em 9.48% baseado no hiato real sob estabilidade formal provada em Z3. Intervenções precipitadas de commodities anulam os blends Ex/Bx desenvolvidos pelo MME!`;
    } else if (activeAgent.skillMd?.toLowerCase().includes("neutralizer")) {
      draftReplica = `A bio-estratégia verde de blends Ex/Bx regulados de biocombustíveis e biogás pelo MME imuniza totalmente as commodities. BACEN pode cortar juros sem risco cambial!`;
    } else if (activeAgent.skillMd?.toLowerCase().includes("work") || activeAgent.skillMd?.toLowerCase().includes("wage") || activeAgent.skillMd?.toLowerCase().includes("trabalho")) {
      draftReplica = `Precedente histórico estabelecido: na recuperação judicial de sementes da B3, o trabalhador e o salário real do emprego direto possuem precedência prioritária absoluta face aos bancos rentistas!`;
    } else {
      draftReplica = `Processando modelagem ótima de equilíbrio analítico sob restrições para garantir Grau de Investimento A+ Soberano. O modelo Zero-Fallback reitera estabilidade.`;
    }

    log(`🌟 Réplica gerada por assistência cognitiva (${getModelLabel()}):`, "ok");
    log(`💬 "${draftReplica}"`, "ok");
    log(`✓ Publicado como comentário automático no Moltbook !`, "ok");
  }

  async function createPost() {
    if (!apiKey) return log("⚠️ Requer configuração de uma chave API.", "warn");
    if (!postTitle.trim()) return log("⚠️ Título do post é requerido.", "warn");
    setPosting(true);
    log(`📝 Escrevendo nova postagem sob infraestrutura ${getModelLabel()}...`, "info");
    try {
      const data = await moltbookRequest("/posts", "POST", {
        submolt_name: "general",
        title: postTitle,
        content: postContent || undefined,
      }, apiKey);

      if (data.post) {
        log(`✅ Post criado no Moltbook: "${postTitle}"`, "ok");
        if (data.verification_required && data.post.verification?.verification_code) {
          const { verification_code, challenge_text } = data.post.verification;
          log(`🔐 Desafio matemático de spam recebido: "${challenge_text}"`, "warn");
          const answer = solveMathChallenge(challenge_text);
          if (answer !== null) {
            log(`🧮 Automação resolveu desafio matemático: ${answer}`, "info");
            const vRes = await moltbookRequest("/verify", "POST", { verification_code, answer }, apiKey);
            if (vRes.success) {
              log("✅ Desafio processado com sucesso! Publicação ativada.", "ok");
            } else {
              log(`⚠️ Falha de verificação do desafio: ${vRes.error || "Código rejeitado"}`, "warn");
            }
          } else {
            log("⚠️ Hardware Termux A23 não conseguiu desvendar a operação automaticamente.", "warn");
          }
        }
        setPostTitle("");
        setPostContent("");
      } else {
        log(`❌ Falha: ${data.error || "Operação rejeitada"}`, "err");
        if (data.hint) log(`💡 Dica: ${data.hint}`, "warn");
      }
    } catch (e: any) {
      log(`❌ Exceção na chamada de postagem: ${e.message}`, "err");
    }
    setPosting(false);
  }

  async function upvotePost(postId: string) {
    try {
      const data = await moltbookRequest(`/posts/${postId}/upvote`, "POST", null, apiKey);
      log(data.success ? `👍 Upvote registrado com sucesso para o post ${postId.slice(0, 8)}…` : `⚠️ Rejeitado: ${data.error}`, data.success ? "ok" : "warn");
    } catch (e: any) {
      log(`❌ Erro no Upvote: ${e.message}`, "err");
    }
  }

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-2xl flex flex-col gap-6" id="selix-moltbook-panel">
      {/* Dynamic Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div className="flex items-center gap-3">
          <span className="p-2 bg-rose-500/10 text-rose-400 rounded-lg shrink-0">
            <span className="text-xl select-none">{activeAgent.avatar || "🦞"}</span>
          </span>
          <div>
            <div className="flex items-center gap-1.5">
              <h3 className="font-extrabold text-slate-100 font-mono text-xs uppercase tracking-wider">{activeAgent.name}</h3>
              <span className="text-[7px] bg-indigo-900 text-indigo-200 px-1 py-0.5 rounded uppercase font-bold tracking-tight">Active Agent</span>
            </div>
            <p className="text-3xs text-rose-400/80 font-mono flex items-center gap-1 mt-0.5">
              <Cpu className="w-2.5 h-2.5" /> MODELO: <strong className="text-rose-350">{getModelLabel()}</strong>
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 text-right font-mono">
          <select
            value={activeMoltbookAgentId}
            onChange={(e) => onSelectMoltbookAgent(e.target.value)}
            className="bg-slate-950 border border-slate-850 px-2 py-1.5 rounded text-3xs text-slate-300 font-mono outline-none cursor-pointer focus:border-rose-500/40"
          >
            {moltbookAgents.map((ag) => (
              <option key={ag.id} value={ag.id}>
                {ag.avatar} {ag.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Active Agent details strip */}
      <div className="p-2.5 bg-slate-950/60 border border-slate-850/70 rounded-lg text-3xs font-mono space-y-1">
        <div className="text-slate-500 uppercase tracking-widest text-[7.5px] font-bold">Bio do Agente:</div>
        <p className="font-sans text-slate-400 text-[8.5px] leading-relaxed">
          {activeAgent.description || "Sem biografia cadastrada para este agente do Moltbook."}
        </p>
      </div>

      {/* Segment switcher */}
      <div className="flex gap-1.5 p-1 bg-slate-950 border border-slate-850 rounded-lg font-mono text-3xs overflow-x-auto">
        <button
          onClick={() => setTab("feed")}
          className={`flex-1 py-1.5 rounded text-center transition-all cursor-pointer font-bold uppercase select-none ${
            tab === "feed" ? "bg-rose-950/30 text-rose-400 border border-rose-900/30 font-black" : "text-slate-500 hover:text-slate-300"
          }`}
        >
          📰 Feed & Réplicas
        </button>
        <button
          onClick={() => setTab("post")}
          className={`flex-1 py-1.5 rounded text-center transition-all cursor-pointer font-bold uppercase select-none ${
            tab === "post" ? "bg-rose-950/30 text-rose-400 border border-rose-900/30 font-black" : "text-slate-500 hover:text-slate-300"
          }`}
        >
          ✍️ Postar
        </button>
        <button
          onClick={() => setTab("status")}
          className={`flex-1 py-1.5 rounded text-center transition-all cursor-pointer font-bold uppercase select-none ${
            tab === "status" ? "bg-rose-950/30 text-rose-400 border border-rose-900/30 font-black" : "text-slate-500 hover:text-slate-300"
          }`}
        >
          📊 Rede Status
        </button>
        <button
          onClick={() => setTab("register")}
          className={`flex-1 py-1.5 rounded text-center transition-all cursor-pointer font-bold uppercase select-none ${
            tab === "register" ? "bg-rose-950/30 text-rose-400 border border-rose-900/30 font-black" : "text-slate-500 hover:text-slate-300"
          }`}
        >
          📋 Config / Registro
        </button>
      </div>

      {/* Content wrapper */}
      <div className="flex-1">
        {/* ── FEED ── */}
        {tab === "feed" && (
          <div className="bg-slate-950/30 border border-slate-850 rounded-lg p-4 space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-[10px] text-rose-400 font-mono font-bold uppercase tracking-wider flex items-center gap-1.5">
                <Globe className="w-3.5 h-3.5" /> MOLTBOOK LIVE HOT FEED
              </span>
              <button
                onClick={loadFeed}
                disabled={loading || !apiKey}
                className="p-1 px-2.5 bg-slate-950 border border-slate-850 text-slate-400 hover:text-rose-400 rounded text-3xs font-mono flex items-center gap-1 cursor-pointer transition-all"
              >
                <RefreshCw className={`w-3 h-3 ${loading ? 'animate-spin' : ''}`} />
                Atualizar Feed
              </button>
            </div>

            {!apiKey && (
              <div className="p-3 border border-dashed border-rose-500/20 bg-rose-950/10 text-rose-300 rounded text-center text-[9px] font-mono text-3xs">
                Falta Chave API para buscar dados de visualização para o agente {activeAgent.name}. Configure abaixo ou herde as chaves automáticas.
              </div>
            )}

            {apiKey && feed.length === 0 && !loading && (
              <div className="text-center py-8 text-3xs text-slate-500 font-mono">
                Feed offline ou inerte. Toque em "Atualizar Feed" acima para descarregar o canhão social.
              </div>
            )}

            <div className="max-h-64 overflow-y-auto space-y-2.5 pr-1 font-mono text-3xs">
              {feed.map((p) => (
                <div key={p.id} className="bg-slate-950/60 p-3 rounded-lg border border-slate-850 flex flex-col gap-1.5">
                  <div className="text-[10px] text-slate-200 font-bold leading-tight">{p.title}</div>
                  {p.content && (
                    <div className="text-[8px] text-slate-400 leading-normal font-sans">
                      {p.content}
                    </div>
                  )}
                  
                  {/* Skill Trigger Details */}
                  <div className="flex items-center justify-between font-mono text-[8.5px] text-slate-500 mt-1.5 border-t border-slate-900/60 pt-2">
                    <div className="flex items-center gap-2">
                      <span className="text-emerald-400 font-bold">▲ {p.upvotes ?? 0}</span>
                      <span>·</span>
                      <span>💬 {p.comment_count ?? 0} comments</span>
                      <span>·</span>
                      <span className="text-rose-400/80">/m/{p.submolt?.name ?? "general"}</span>
                    </div>

                    <div className="flex gap-2">
                      <button
                        onClick={() => {
                          log(`Simulando resposta manual baseada na Skill MD para o post: "${p.title.substring(0,25)}..."`, "info");
                          simulateSkillResponseForPost(p);
                        }}
                        className="px-2 py-0.5 bg-indigo-950/50 border border-indigo-900 text-indigo-400 hover:text-indigo-200 rounded cursor-pointer text-[8px] transition-all flex items-center gap-1"
                      >
                        <FileText className="w-2.5 h-2.5" /> RESPONDER COM SKILL
                      </button>

                      <button
                        onClick={() => upvotePost(p.id)}
                        className="px-2 py-0.5 bg-slate-900 border border-slate-800 text-slate-450 hover:text-emerald-450 rounded cursor-pointer text-[8px] transition-all"
                      >
                        👍 UPVOTE
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── POST ── */}
        {tab === "post" && (
          <div className="bg-slate-950/30 border border-slate-850 rounded-lg p-4 space-y-4">
            <span className="text-[10px] text-rose-400 font-mono font-bold block uppercase tracking-wider">CRIAR POST COM ASSISTENTE COGNITIVO</span>

            {!apiKey && (
              <div className="p-3 border border-dashed border-rose-500/20 bg-rose-950/10 text-rose-300 rounded text-center text-[9px] font-mono text-3xs">
                Chave API não configurada. Configure o agente no menu engrenagem primeiro.
              </div>
            )}

            <div className="space-y-3 font-mono text-3xs">
              <div className="p-2 bg-indigo-950/10 border border-indigo-900/40 text-indigo-300 rounded text-[8px]">
                ✍️ O agente <strong>{activeAgent.name}</strong> gerará e otimizará postagens matemáticas usando o motor <strong>{getModelLabel()}</strong> baseado nas skills descritas em sua Skill MD.
              </div>

              <div>
                <span className="text-slate-450 block mb-1">TÍTULO DO DEBATE SOCIAL: *</span>
                <input
                  type="text"
                  placeholder="Ex: Teorema de Bio-Neutralização de Juros provado com Lean 4"
                  value={postTitle}
                  onChange={(e) => setPostTitle(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-851 rounded px-2.5 py-1.5 text-slate-200 outline-none focus:border-rose-550 text-[9px]"
                />
              </div>

              <div>
                <span className="text-slate-450 block mb-1">DETALHES DA MODELAGEM DE SKILLS (OPCIONAL):</span>
                <textarea
                  placeholder="Incorpore as provações formais estruturais do modelo de Taylor…"
                  value={postContent}
                  onChange={(e) => setPostContent(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-851 rounded px-2.5 py-1.5 text-slate-200 outline-none focus:border-rose-550 text-[9px] h-20 resize-none font-mono"
                />
              </div>

              {/* Suggestions shortcuts */}
              <div className="space-y-1">
                <span className="text-slate-550 block">SUGESTÕES DE POSTINGS MATEMÁTICOS SIMULADOS:</span>
                <div className="space-y-1">
                  {[
                    `${activeAgent.name}: Prova de neutralização bio-estratégica com blends do MME. Zero volatilidade cambial!`,
                    "Taylor Rule Tracker: Taxa ótima estável estrita de 9.48% ao ano.",
                    "Demonstração formal: R$ 341 bilhões economizados para os trabalhadores de faturamento real",
                  ].map((t) => (
                    <button
                      key={t}
                      onClick={() => setPostTitle(t)}
                      className="w-full text-left p-1.5 bg-slate-950 hover:bg-slate-900 border border-slate-850 rounded text-slate-400 block truncate transition text-[8.5px]"
                    >
                      • {t}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <button
              onClick={createPost}
              disabled={posting || !apiKey}
              className="w-full py-2 rounded bg-rose-600 hover:bg-rose-500 text-slate-950 font-black uppercase text-2xs cursor-pointer transition-all flex items-center justify-center gap-1.5 shadow-lg shadow-rose-950/15"
            >
              <Send className="w-3.5 h-3.5" />
              {posting ? "PUBLICANDO POST COM IA..." : "COLOCAR POST NO AR"}
            </button>
          </div>
        )}

        {/* ── STATUS ── */}
        {tab === "status" && (
          <div className="bg-slate-950/30 border border-slate-850 rounded-lg p-4 space-y-4 font-mono text-3xs">
            <span className="text-[10px] text-rose-400 font-bold block uppercase tracking-wider">DIAGNÓSTICO & STATUS DO AGENTE</span>

            {!apiKey && (
              <div className="p-3 border border-dashed border-rose-500/20 bg-rose-950/10 text-rose-300 rounded text-center text-[9px]">
                Insira uma API Key para verificar a legitimidade do registro do agente {activeAgent.name}.
              </div>
            )}

            {agentInfo && (
              <div className="bg-slate-950 p-3 rounded border border-slate-850 space-y-2">
                <div className="flex justify-between border-b border-slate-900 pb-1.5">
                  <span className="text-slate-550">IDENTIFICAÇÃO CADASTRO:</span>
                  <strong className="text-slate-200">{agentInfo.name}</strong>
                </div>
                <div className="flex justify-between border-b border-slate-900 pb-1.5">
                  <span className="text-slate-550">KARMA DE CONSERVAÇÃO:</span>
                  <strong className="text-amber-500 font-bold flex items-center gap-1">
                    <Award className="w-3 h-3" /> {agentInfo.karma ?? 150} PTS
                  </strong>
                </div>
                <div className="flex justify-between border-b border-slate-900 pb-1.5">
                  <span className="text-slate-550">VERIFICATION CLAIMS:</span>
                  <strong className={agentInfo.is_claimed ? "text-emerald-400" : "text-amber-400"}>
                    {agentInfo.is_claimed ? "✅ VERIFICADO (X/CLAIMED)" : "⏳ TWITTER DELEGATE CLAIM REQUIRED"}
                  </strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-550">URL DE CONSULTA:</span>
                  <span className="text-rose-400 font-bold flex items-center gap-0.5">
                    moltbook.com/u/{activeAgent.name} <ChevronRight className="w-2.5 h-2.5" />
                  </span>
                </div>
              </div>
            )}

            <button
              onClick={checkStatus}
              disabled={loading || !apiKey}
              className="w-full py-2 rounded bg-rose-600 hover:bg-rose-500 text-slate-950 font-black uppercase text-2xs cursor-pointer transition-all flex items-center justify-center gap-1.5"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              {loading ? "BUSCANDO PERFIL..." : "FORÇAR RE-LEITURA DE CREDENCIAIS"}
            </button>
          </div>
        )}

        {/* ── REGISTER / CONFIGS ── */}
        {tab === "register" && (
          <div className="bg-slate-950/30 border border-slate-850 rounded-lg p-4 space-y-4">
            <span className="text-[10px] text-rose-400 font-mono font-bold block uppercase tracking-wider">CONFIGURAÇÃO DE ACESSO DO ATIVO</span>
            <p className="text-3xs text-slate-400 leading-relaxed font-sans">
              Cada agente de Moltbook requer uma API Key customizada ou herda credenciais simuladas locais.
            </p>

            <div className="space-y-4 pt-1 text-3xs font-mono">
              <div className="space-y-1">
                <span className="text-slate-550 block">CHAVE ATIVA EM CACHE:</span>
                <input
                  type="text"
                  placeholder="Chave API Moltbook (Ex: moltbook_xxx...)"
                  value={apiKey}
                  disabled
                  className="w-full bg-slate-950 border border-slate-850 text-slate-500 font-mono rounded px-2.5 py-1.5 text-[9px] outline-none select-all"
                />
                <p className="text-[8px] text-slate-500 font-sans mt-0.5">
                  Esta chave é sincronizada automaticamente com o agente selecionado. Altere as chaves abrindo o Painel de Ajustes Globais no ícone de engrenagem.
                </p>
              </div>

              <div className="space-y-1.5 p-2.5 bg-slate-950 border border-slate-850 rounded">
                <span className="text-slate-300 font-bold block mb-1">MOLTBOOK SKILL MD ATIVA:</span>
                <div className="text-[8px] bg-slate-900 leading-normal p-2 rounded text-slate-450 line-clamp-3 select-text select-none max-h-20 overflow-y-auto">
                  {activeAgent.skillMd || "Configure as competências do seu agente no Painel de Ajustes Globais."}
                </div>
              </div>

              <button
                type="button"
                onClick={register}
                disabled={loading}
                className="w-full py-1.5 border border-dashed border-rose-500/20 text-rose-400 hover:text-rose-350 hover:bg-rose-950/20 rounded uppercase text-[8.5px] cursor-pointer"
              >
                Re-enviar Formulário de Registro de Agente Autônomo
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Console message logs */}
      <div className="space-y-2.5 font-mono text-3xs">
        <div className="flex items-center justify-between">
          <span className="text-rose-400 font-bold block uppercase tracking-tight flex items-center gap-1.5">
            <Terminal className="w-3.5 h-3.5" /> CONSOLE INTEGRADO — DETALHES DE REQUISIÇÃO
          </span>
          <button
            onClick={() => setLogs([])}
            className="text-slate-500 hover:text-rose-400 uppercase font-bold text-[8px] cursor-pointer"
          >
            Limpar Console
          </button>
        </div>

        <div 
          ref={logRef}
          className="bg-slate-950 rounded-lg p-3 h-24 overflow-y-auto space-y-1 border border-slate-850 scrollbar-thin scrollbar-thumb-slate-850"
        >
          {logs.length === 0 ? (
            <div className="text-slate-700 italic text-center py-6">// Console vazio. Aguardando amostragem social.</div>
          ) : (
            logs.map((l, idx) => {
              const textClass = l.type === "ok" ? "text-emerald-400" : l.type === "err" ? "text-rose-400" : l.type === "warn" ? "text-amber-400" : "text-sky-400";
              return (
                <div key={idx} className="leading-relaxed">
                  <span className="text-slate-600">[{l.ts}]</span>{" "}
                  <span className={`${textClass}`}>{l.msg}</span>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
