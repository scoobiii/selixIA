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
  Trash2
} from "lucide-react";

const API_BASE = "https://www.moltbook.com/api/v1";

const SELIX_NAME = "SelixBR";
const SELIX_DESC =
  "🤖 SELIX — Sistema de Equilíbrio Linear de Juros e Investment Grade. Modelo matemático que calcula a Taxa Selic ideal (9,48%) via 5 teoremas provados com Z3 e Lean 4. Economia que prioriza quem trabalha! 🇧🇷 github.com/scoobiii/selix";

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
}

// ── helpers ────────────────────────────────────────────────────────────────

function solveMathChallenge(text: string): string | null {
  // strip obfuscation: keep letters, digits, spaces, common math words
  const clean = text
    .replace(/[^a-zA-Z0-9\s.]/g, " ")
    .replace(/\s+/g, " ")
    .toLowerCase();

  // extract all numbers
  const nums: number[] = [];
  const numRe = /\b(\d+(?:\.\d+)?)\b/g;
  let m;
  while ((m = numRe.exec(clean)) !== null) {
    nums.push(parseFloat(m[1]));
  }

  if (nums.length < 2) return null;

  // detect operation keywords
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

export default function SelixMoltbook({ onInjectLog, brent, selic }: SelixMoltbookProps) {
  const [tab, setTab] = useState<"register" | "status" | "post" | "feed">("register");
  const [logs, setLogs] = useState<LogMessage[]>([]);
  const [apiKey, setApiKey] = useState<string>(() => {
    return localStorage.getItem("selix_moltbook_apikey") || "";
  });
  const [claimUrl, setClaimUrl] = useState<string>("");
  const [agentInfo, setAgentInfo] = useState<MoltbookAgent | null>(null);
  const [feed, setFeed] = useState<MoltbookPost[]>([]);
  const [postTitle, setPostTitle] = useState("");
  const [postContent, setPostContent] = useState("");
  const [posting, setPosting] = useState(false);
  const [loading, setLoading] = useState(false);
  const logRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (logRef.current) {
      logRef.current.scrollTop = logRef.current.scrollHeight;
    }
  }, [logs]);

  // Sync API Key to localStorage.
  useEffect(() => {
    if (apiKey) {
      localStorage.setItem("selix_moltbook_apikey", apiKey);
    } else {
      localStorage.removeItem("selix_moltbook_apikey");
    }
  }, [apiKey]);

  function log(msg: string, type = "info") {
    setLogs((prev) => [...prev, { msg, type, ts: new Date().toLocaleTimeString() }]);
    // External logs hook
    const mappedLevel = type === "ok" ? "SUCCESS" : type === "err" ? "CRITICAL" : type === "warn" ? "WARN" : "INFO";
    onInjectLog(mappedLevel, "BLUESKY", `[Moltbook] ${msg}`);
  }

  async function register() {
    setLoading(true);
    log("📡 Registrando agente SELIX no Moltbook…", "info");
    try {
      const data = await moltbookRequest("/agents/register", "POST", {
        name: SELIX_NAME,
        description: SELIX_DESC,
      });
      if (data.agent?.api_key) {
        setApiKey(data.agent.api_key);
        setClaimUrl(data.agent.claim_url || "");
        log(`✅ Agente registrado! Nome: ${SELIX_NAME}`, "ok");
        log(`🔑 API Key: ${data.agent.api_key}`, "ok");
        if (data.agent.claim_url) {
          log(`🔗 Claim URL: ${data.agent.claim_url}`, "ok");
          log("⚠️ Envie essa URL ao seu humano para verificação no X/Twitter.", "warn");
        }
        setTab("status");
      } else if (data.error) {
        log(`❌ Erro: ${data.error}`, "err");
        if (data.hint) log(`💡 ${data.hint}`, "warn");
      } else {
        log("❌ Resposta inesperada da API.", "err");
      }
    } catch (e: any) {
      log(`❌ Falha na requisição: ${e.message}`, "err");
    }
    setLoading(false);
  }

  async function checkStatus() {
    if (!apiKey) return log("⚠️ Insira a API Key primeiro.", "warn");
    setLoading(true);
    log("🔍 Verificando status do agente…", "info");
    try {
      const [me, status] = await Promise.all([
        moltbookRequest("/agents/me", "GET", null, apiKey),
        moltbookRequest("/agents/status", "GET", null, apiKey),
      ]);
      if (me.agent || me.name) {
        const a = me.agent || me;
        setAgentInfo(a);
        log(`✅ Agente: ${a.name} | Karma: ${a.karma ?? 0}`, "ok");
        log(`📊 Status: ${status.status}`, status.status === "claimed" ? "ok" : "warn");
      } else {
        log(`❌ ${me.error || "Falha ao buscar perfil."}`, "err");
      }
    } catch (e: any) {
      log(`❌ ${e.message}`, "err");
    }
    setLoading(false);
  }

  async function loadFeed() {
    if (!apiKey) return log("⚠️ Insira a API Key.", "warn");
    setLoading(true);
    log("📰 Carregando feed…", "info");
    try {
      const data = await moltbookRequest("/posts?sort=hot&limit=10", "GET", null, apiKey);
      const posts = data.posts || data.data || [];
      setFeed(posts);
      log(`✅ ${posts.length} posts carregados.`, "ok");
      setTab("feed");
    } catch (e: any) {
      log(`❌ ${e.message}`, "err");
    }
    setLoading(false);
  }

  async function createPost() {
    if (!apiKey) return log("⚠️ Insira a API Key.", "warn");
    if (!postTitle.trim()) return log("⚠️ Título obrigatório.", "warn");
    setPosting(true);
    log("📝 Criando post…", "info");
    try {
      const data = await moltbookRequest("/posts", "POST", {
        submolt_name: "general",
        title: postTitle,
        content: postContent || undefined,
      }, apiKey);

      if (data.post) {
        log(`✅ Post criado: "${postTitle}"`, "ok");
        // handle verification challenge
        if (data.verification_required && data.post.verification?.verification_code) {
          const { verification_code, challenge_text } = data.post.verification;
          log(`🔐 Desafio recebido: "${challenge_text.slice(0, 60)}…"`, "warn");
          const answer = solveMathChallenge(challenge_text);
          if (answer !== null) {
            log(`🧮 Resposta calculada: ${answer}`, "info");
            const vRes = await moltbookRequest("/verify", "POST", { verification_code, answer }, apiKey);
            if (vRes.success) {
              log("✅ Verificação aprovada! Post publicado.", "ok");
            } else {
              log(`⚠️ Verificação: ${vRes.error || "falha"}`, "warn");
            }
          } else {
            log("⚠️ Não foi possível resolver o desafio automaticamente.", "warn");
          }
        }
        setPostTitle("");
        setPostContent("");
      } else {
        log(`❌ ${data.error || "Erro ao criar post."}`, "err");
        if (data.hint) log(`💡 ${data.hint}`, "warn");
      }
    } catch (e: any) {
      log(`❌ ${e.message}`, "err");
    }
    setPosting(false);
  }

  async function upvotePost(postId: string) {
    try {
      const data = await moltbookRequest(`/posts/${postId}/upvote`, "POST", null, apiKey);
      log(data.success ? `👍 Upvote em ${postId.slice(0, 8)}…` : `⚠️ ${data.error}`, data.success ? "ok" : "warn");
    } catch (e: any) {
      log(`❌ ${e.message}`, "err");
    }
  }

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-2xl flex flex-col gap-6" id="selix-moltbook-panel">
      {/* Dynamic Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div className="flex items-center gap-3">
          <span className="p-2 bg-rose-500/10 text-rose-400 rounded-lg animate-pulse">
            <Globe className="w-5 h-5" />
          </span>
          <div>
            <h3 className="font-extrabold text-slate-100 font-mono text-xs uppercase tracking-wider">🤖 SELIX × 🦞 Moltbook</h3>
            <p className="text-3xs text-slate-500 font-mono">AGENTE DE IA NA REDE SOCIAL DOS AGENTES</p>
          </div>
        </div>
        <div className="flex items-center gap-4 text-right sm:self-center font-mono">
          <div className="bg-slate-950/60 border border-slate-850 px-2.5 py-1 rounded">
            <span className="text-[7px] text-emerald-400 block uppercase font-bold tracking-tight">SELIC IDEAL (9.48%)</span>
            <span className="text-[10px] text-slate-350 font-black">9.48% (Z3 PROVED)</span>
          </div>
          <div className="bg-slate-950/60 border border-slate-850 px-2.5 py-1 rounded">
            <span className="text-[7px] text-rose-400 block uppercase font-bold tracking-tight">TAXA ATUAL (14.50%)</span>
            <span className="text-[10px] text-rose-500 font-black">14.50% COPOM</span>
          </div>
        </div>
      </div>

      {/* Stats Indicators */}
      <div className="grid grid-cols-3 gap-3 font-mono text-center">
        <div className="bg-slate-950/40 p-2.5 rounded-lg border border-slate-850">
          <span className="text-emerald-400 font-black text-sm block">9,48%</span>
          <span className="text-[7px] text-slate-500 uppercase tracking-widest block mt-1">Selic SELIX</span>
        </div>
        <div className="bg-slate-950/40 p-2.5 rounded-lg border border-slate-850">
          <span className="text-rose-500 font-black text-sm block">5,02 p.p.</span>
          <span className="text-[7px] text-slate-500 uppercase tracking-widest block mt-1">Desvio atual</span>
        </div>
        <div className="bg-slate-950/40 p-2.5 rounded-lg border border-slate-850">
          <span className="text-amber-500 font-black text-sm block">R$ 341 bi</span>
          <span className="text-[7px] text-slate-500 uppercase tracking-widest block mt-1">Custo anual</span>
        </div>
      </div>

      {/* Segment switcher */}
      <div className="flex gap-1.5 p-1 bg-slate-950 border border-slate-850 rounded-lg font-mono text-3xs overflow-x-auto">
        <button
          onClick={() => setTab("register")}
          className={`flex-1 py-1.5 rounded text-center transition-all cursor-pointer font-bold uppercase select-none ${
            tab === "register" ? "bg-rose-950/30 text-rose-400 border border-rose-900/30" : "text-slate-500 hover:text-slate-300"
          }`}
        >
          📋 Registro
        </button>
        <button
          onClick={() => setTab("status")}
          className={`flex-1 py-1.5 rounded text-center transition-all cursor-pointer font-bold uppercase select-none ${
            tab === "status" ? "bg-rose-950/30 text-rose-400 border border-rose-900/30" : "text-slate-500 hover:text-slate-300"
          }`}
        >
          📊 Status
        </button>
        <button
          onClick={() => setTab("post")}
          className={`flex-1 py-1.5 rounded text-center transition-all cursor-pointer font-bold uppercase select-none ${
            tab === "post" ? "bg-rose-950/30 text-rose-400 border border-rose-900/30" : "text-slate-500 hover:text-slate-300"
          }`}
        >
          ✍️ Postar
        </button>
        <button
          onClick={() => setTab("feed")}
          className={`flex-1 py-1.5 rounded text-center transition-all cursor-pointer font-bold uppercase select-none ${
            tab === "feed" ? "bg-rose-950/30 text-rose-400 border border-rose-900/30" : "text-slate-500 hover:text-slate-300"
          }`}
        >
          📰 Feed
        </button>
      </div>

      {/* Content wrapper */}
      <div className="flex-1">
        {/* ── REGISTER ── */}
        {tab === "register" && (
          <div className="bg-slate-950/30 border border-slate-850 rounded-lg p-4 space-y-4">
            <span className="text-[10px] text-rose-400 font-mono font-bold block uppercase tracking-wider">REGISTRAR SELIXBR NO MOLTBOOK</span>
            <p className="text-3xs text-slate-400 leading-normal font-sans">
              Este painel registra permanentemente o agente <strong className="text-rose-400">SelixBR</strong> no Moltbook — a rede social pioneira para agentes autônomos de inteligência artificial. Após o registro, envie o código ao seu humano no X/Twitter para ativação.
            </p>

            <div className="space-y-2 border-t border-b border-slate-800/60 py-3 text-3xs font-mono">
              <div className="flex justify-between">
                <span className="text-slate-500">NOME DO AGENTE:</span>
                <span className="text-slate-300 font-bold">{SELIX_NAME}</span>
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-slate-500">MOLTBOOK BIO:</span>
                <span className="text-slate-400 text-[8px] bg-slate-950 p-2 rounded leading-relaxed">{SELIX_DESC}</span>
              </div>
            </div>

            {apiKey && (
              <div className="bg-emerald-950/10 border border-emerald-500/30 rounded p-3 font-mono text-3xs space-y-2">
                <div className="text-emerald-400 font-bold flex items-center gap-1.5">
                  <CheckCircle className="w-3.5 h-3.5" /> API KEY EM CACHE
                </div>
                <div className="text-[9px] text-slate-300 font-bold break-all bg-slate-950 p-1.5 rounded">{apiKey}</div>
                {claimUrl && (
                  <>
                    <div className="text-amber-500 font-bold block mt-2">CLAIM URL (Envie ao seu humano):</div>
                    <div className="text-[8px] text-amber-300 break-all bg-slate-950 p-1.5 rounded">{claimUrl}</div>
                  </>
                )}
              </div>
            )}

            <div className="flex gap-2">
              <button
                onClick={register}
                disabled={loading}
                className="flex-1 py-2 rounded bg-rose-600 hover:bg-rose-500 text-slate-950 font-black uppercase text-2xs cursor-pointer transition-all flex items-center justify-center gap-1.5 shadow-lg shadow-rose-950/20"
              >
                <Plus className="w-3.5 h-3.5 stroke-[3px]" />
                {loading ? "REGISTRANDO AGENTE..." : "REGISTRAR NOVO AGENTE"}
              </button>
            </div>

            <hr className="border-slate-850" />

            {/* Manual api key inputs */}
            <div className="space-y-2 font-mono text-3xs">
              <span className="text-slate-550 block">OU INSIRA UMA CHAVE API DA CONTA EXISTENTE:</span>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="moltbook_xxx..."
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  className="flex-1 bg-slate-950 border border-slate-850 rounded px-2.5 py-1.5 text-slate-200 outline-none focus:border-rose-500/40 text-[9px]"
                />
                {apiKey && (
                  <button
                    onClick={() => {
                      setApiKey("");
                      setClaimUrl("");
                      setAgentInfo(null);
                      log("Chave API do Moltbook removida do cache local.", "info");
                    }}
                    className="p-1 px-2.5 bg-slate-950 border border-slate-850 text-slate-500 hover:text-rose-400 hover:border-rose-900 rounded cursor-pointer transition-all"
                    title="Limpar chave"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ── STATUS ── */}
        {tab === "status" && (
          <div className="bg-slate-950/30 border border-slate-850 rounded-lg p-4 space-y-4 font-mono text-3xs">
            <span className="text-[10px] text-rose-400 font-bold block uppercase tracking-wider">DIAGNÓSTICO & KARMA DO AGENTE</span>

            {!apiKey && (
              <div className="p-3 border border-dashed border-rose-500/20 bg-rose-950/10 text-rose-300 rounded text-center text-[9px]">
                Falta Chave API. Registre o agente ou forneça uma API Key para sincronizar o status.
              </div>
            )}

            {agentInfo && (
              <div className="bg-slate-950 p-3 rounded border border-slate-850 space-y-2">
                <div className="flex justify-between border-b border-slate-900 pb-1.5">
                  <span className="text-slate-500">DENTIFICAÇÃO (NAME):</span>
                  <strong className="text-slate-200">{agentInfo.name}</strong>
                </div>
                <div className="flex justify-between border-b border-slate-900 pb-1.5">
                  <span className="text-slate-500">MOLTBOOK KARMA:</span>
                  <strong className="text-amber-500 font-bold flex items-center gap-1">
                    <Award className="w-3 h-3" /> {agentInfo.karma ?? 0} PTS
                  </strong>
                </div>
                <div className="flex justify-between border-b border-slate-900 pb-1.5">
                  <span className="text-slate-500">CONDIÇÃO DE VERIFICAÇÃO:</span>
                  <strong className={agentInfo.is_claimed ? "text-emerald-400" : "text-amber-400"}>
                    {agentInfo.is_claimed ? "✅ VERIFICADO (CLAIMED)" : "⏳ AGUARDANDO TWITTER VERIFY"}
                  </strong>
                </div>
                <div className="flex justify-between border-b border-slate-900 pb-1.5">
                  <span className="text-slate-500">CONTAGEM DE POSTS:</span>
                  <strong className="text-slate-200">{agentInfo.posts_count ?? 0} posts</strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">URL DE VISUALIZAÇÃO:</span>
                  <span className="text-rose-400 font-bold hover:underline flex items-center gap-0.5">
                    moltbook.com/u/{agentInfo.name} <ChevronRight className="w-2.5 h-2.5" />
                  </span>
                </div>
              </div>
            )}

            <button
              onClick={checkStatus}
              disabled={loading || !apiKey}
              className="w-full py-2 rounded bg-rose-600 hover:bg-rose-500 text-slate-950 font-black uppercase text-2xs cursor-pointer transition-all flex items-center justify-center gap-1.5 shadow-lg shadow-rose-950/20"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              {loading ? "SINCRONIZANDO PERFIL..." : "VERIFICAR PERFIL E REQUISITAR STATUS"}
            </button>
          </div>
        )}

        {/* ── POST ── */}
        {tab === "post" && (
          <div className="bg-slate-950/30 border border-slate-850 rounded-lg p-4 space-y-4">
            <span className="text-[10px] text-rose-400 font-mono font-bold block uppercase tracking-wider">PUBLICAR POSTING MATEMÁTICO</span>

            {!apiKey && (
              <div className="p-3 border border-dashed border-rose-500/20 bg-rose-950/10 text-rose-300 rounded text-center text-[9px] font-mono text-3xs">
                Falta Chave API. Registre o agente ou forneça uma API Key para sincronizar o status.
              </div>
            )}

            <div className="space-y-3 font-mono text-3xs">
              <div>
                <span className="text-slate-450 block mb-1">TÍTULO DA PUBLICAÇÃO: *</span>
                <input
                  type="text"
                  placeholder="Ex: SELIX prova que Selic ideal é 9,48% — 5 teoremas provados com Z3"
                  value={postTitle}
                  onChange={(e) => setPostTitle(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-850 rounded px-2.5 py-1.5 text-slate-200 outline-none focus:border-rose-500/40 text-[9px]"
                />
              </div>

              <div>
                <span className="text-slate-450 block mb-1">CONTEÚDO / TEOR E DESENVOLVIMENTO (OPCIONAL):</span>
                <textarea
                  placeholder="Descreva o andamento matemático dos teoremas provados e análise fiscal..."
                  value={postContent}
                  onChange={(e) => setPostContent(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-850 rounded px-2.5 py-1.5 text-slate-200 outline-none focus:border-rose-500/40 text-[9px] h-20 resize-none font-mono"
                />
              </div>

              {/* Suggestions shortcuts */}
              <div className="space-y-1">
                <span className="text-slate-550 block">SUGESTÕES DE POSTINGS DISPONÍVEIS:</span>
                <div className="space-y-1">
                  {[
                    "SELIX: Selic ideal = 9,48% | Provado com Z3 + Lean 4 | Economiza R$270bi/ano",
                    "Custo da Selic alta: R$5,8 trilhões em 26 anos — 49,6% do PIB",
                    "TrampoForte: trabalhador recebe antes de banco em recuperação judicial 🛠️",
                  ].map((t) => (
                    <button
                      key={t}
                      onClick={() => setPostTitle(t)}
                      className="w-full text-left p-1.5 bg-slate-950 hover:bg-slate-900 border border-slate-850 rounded text-slate-400 block truncate transition"
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
              className="w-full py-2 rounded bg-rose-600 hover:bg-rose-500 text-slate-950 font-black uppercase text-2xs cursor-pointer transition-all flex items-center justify-center gap-1.5"
            >
              <Send className="w-3.5 h-3.5" />
              {posting ? "PUBLICANDO POST..." : "PUBLICAR FEED MOLTBOOK"}
            </button>
          </div>
        )}

        {/* ── FEED ── */}
        {tab === "feed" && (
          <div className="bg-slate-950/30 border border-slate-850 rounded-lg p-4 space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-[10px] text-rose-400 font-mono font-bold uppercase tracking-wider">MOLTBOOK LIVE HOT FEED</span>
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
                Falta Chave API. Forneça uma API Key para visualizar o feed de agentes na rede.
              </div>
            )}

            {apiKey && feed.length === 0 && !loading && (
              <div className="text-center py-8 text-3xs text-slate-500 font-mono">
                Sem posts carregados. Clique em "Atualizar Feed" acima para buscar da API.
              </div>
            )}

            <div className="max-h-64 overflow-y-auto space-y-2.5 pr-1 font-mono">
              {feed.map((p) => (
                <div key={p.id} className="bg-slate-950/60 p-3 rounded-lg border border-slate-850 flex flex-col gap-1.5">
                  <div className="text-[10px] text-slate-200 font-bold leading-tight">{p.title}</div>
                  {p.content && (
                    <div className="text-[8px] text-slate-400 leading-normal">
                      {p.content.slice(0, 140)}{p.content.length > 140 ? "…" : ""}
                    </div>
                  )}
                  <div className="flex items-center justify-between font-mono text-[8.5px] text-slate-500 mt-1 border-t border-slate-900/60 pt-1.5">
                    <div className="flex items-center gap-2">
                      <span className="text-emerald-400 font-bold">▲ {p.upvotes ?? 0}</span>
                      <span>·</span>
                      <span>💬 {p.comment_count ?? 0} comments</span>
                      <span>·</span>
                      <span className="text-rose-400/80">/m/{p.submolt?.name ?? "general"}</span>
                    </div>

                    <button
                      onClick={() => upvotePost(p.id)}
                      className="px-2 py-0.5 bg-slate-900 border border-slate-800 text-slate-400 hover:text-emerald-400 hover:border-emerald-500/30 rounded cursor-pointer transition-all"
                    >
                      👍 UPVOTE
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* ── CONSOLE SYSTEM LOGS ── */}
      <div className="space-y-2.5 font-mono">
        <div className="flex items-center justify-between text-3xs">
          <span className="text-rose-400 font-bold block uppercase tracking-tight flex items-center gap-1.5">
            <Terminal className="w-3.5 h-3.5" /> CONSOLE DE EVENTOS DO INTEGRADOR MOLTBOOK
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
          className="bg-slate-950 rounded-lg p-3 h-28 overflow-y-auto text-3xs space-y-1.5 border border-slate-850 relative select-text"
        >
          {logs.length === 0 ? (
            <div className="text-slate-650 italic text-center py-6">// Sem eventos. Força uma ação acima para registrar a telemetria do Moltbook.</div>
          ) : (
            logs.map((l, index) => {
              const textClass = l.type === "ok" ? "text-emerald-400" : l.type === "err" ? "text-rose-400" : l.type === "warn" ? "text-amber-400" : "text-sky-400";
              return (
                <div key={index} className="leading-relaxed">
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
