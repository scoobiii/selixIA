/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { 
  Send, 
  Sparkles, 
  Cpu, 
  AlertTriangle, 
  MessageSquare, 
  CornerDownLeft, 
  Volume2, 
  Globe, 
  Activity, 
  Layers 
} from "lucide-react";
import { speak, SPEECH_GUIDES } from "../utils/speech";
import SelixAvatar from "./SelixAvatar";
import SelixMoltbook from "./SelixMoltbook";

interface Message {
  role: "user" | "assistant";
  content: string;
}

interface ConsolaAnalistaProps {
  onSendMessage: (msg: string) => Promise<{ result: string; apiKeyMissing?: boolean }>;
  isPending: boolean;
  onInjectLog: (level: string, category: string, message: string) => void;
  brent: number;
  selic: number;
  activeCompanionTab?: "selix" | "moltbook";
  onChangeCompanionTab?: (tab: "selix" | "moltbook") => void;
  llmModelType: "gemini" | "local1bit" | "rag";
  moltbookAgents: any[];
  activeMoltbookAgentId: string;
  onSelectMoltbookAgent: (id: string) => void;
}

export default function ConsolaAnalista({ 
  onSendMessage, 
  isPending,
  onInjectLog,
  brent,
  selic,
  activeCompanionTab,
  onChangeCompanionTab,
  llmModelType,
  moltbookAgents,
  activeMoltbookAgentId,
  onSelectMoltbookAgent
}: ConsolaAnalistaProps) {
  // Use outer state if provided, otherwise fallback to local state
  const [localTab, setLocalTab] = useState<"selix" | "moltbook">("selix");
  const activeTab = activeCompanionTab || localTab;
  
  const handleTabChange = (tab: "selix" | "moltbook") => {
    if (onChangeCompanionTab) {
      onChangeCompanionTab(tab);
    } else {
      setLocalTab(tab);
    }
    
    // Aesthetic voice response or log
    if (tab === "selix") {
      speak("Modo co piloto Selix RAG ativo de volta. Pronto para realizar consultas macroeconômicas.", true);
      onInjectLog("INFO", "SYSTEM", "Navegação: Retornou ao console Selix RAG.");
    } else {
      speak("Modo moltbook ativado. Conexão imediata com a rede descentralizada de agentes de inteligência artificial.", true);
      onInjectLog("INFO", "SYSTEM", "Navegação: Alternou para Moltbook Central.");
    }
  };

  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content: "🧠 [SELIX Flex-AI v5.0] RAG de Inteligência Econômica Online. Aguardando instrução analítica sobre a taxa Selic ou cotação do Barril Brent.",
    },
  ]);
  const [inputText, setInputText] = useState("");
  const [apiKeyMissingNotice, setApiKeyMissingNotice] = useState(false);

  const presetPrompts = [
    { label: "⚡ Choque Trump-Netanyahu & Selic 1 dígito", text: "Estude o cenário onde o choque de energia e o Brent disparando pós escalada Trump-Netanyahu são neutralizados pela bio-estratégia de blends Ex/Bx do MME, mantendo Selic a 1 dígito (9.25% a.a.) e recuperando o Investment Grade soberano brasileiro." },
    { label: "Análise: Brent a $85 e Inflação", text: "Qual o impacto direto do petróleo Brent cotado a USD 85 nos custos de refino e consequentemente no IPCA brasileiro?" },
    { label: "Estudo MME: Mistura Ex e Bx", text: "Explique o cenário de neutralização onde o Brent está alto, mas é aniquilado pelo Ministério de Minas e Energia com a mistura especial Ex e Bx, aliviando a Selic para 1 dígito sem intervenção do BC." },
    { label: "Avaliar Selic sob Regra de Taylor", text: "Com a Selic a 10.75%, inflação de 3.8% e hiato do produto em -0.7%, explique a recomendação da regra de Taylor e sua aderência às atas do COPOM." },
    { label: "Explicar Teorema Zero-Fallback", text: "Como o Teorema 1 garante matematicamente a segurança anticongelamento e anticorrupção de dados ao monitorar Brent de múltiplas fontes?" },
    { label: "Auditar RAM de 384MB no Termux", text: "Como o Selix consegue rodar embeddings de RAG e um daemon de monitoramento sem exceder a restrição de hardware de 384MB de RAM no Android A23?" },
  ];

  const handleSend = async (textToSend: string) => {
    if (!textToSend.trim() || isPending) return;

    // Append user message
    const userMsg: Message = { role: "user", content: textToSend };
    setMessages((prev) => [...prev, userMsg]);
    setInputText("");

    try {
      const response = await onSendMessage(textToSend);
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: response.result },
      ]);
      if (response.apiKeyMissing) {
        setApiKeyMissingNotice(true);
      } else {
        setApiKeyMissingNotice(false);
      }
    } catch (err: any) {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: `❌ Erro crítico no motor analítico do Selix: ${err.message || "Conexão interrompida"}` },
      ]);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleSend(inputText);
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-2xl flex flex-col gap-4 relative overflow-hidden h-[690px]" id="financial-copilot">
      <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 blur-3xl rounded-full" />
      
      {/* ── HIGH FIDELITY UX TABS SELECTOR ── */}
      <div className="bg-slate-950 p-1 rounded-xl border border-slate-850 flex items-stretch gap-1.5 font-mono text-3xs select-none">
        <button
          onClick={() => handleTabChange("selix")}
          className={`flex-1 py-2 rounded-lg text-center font-black uppercase tracking-wider transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
            activeTab === "selix"
              ? "bg-amber-500 text-slate-950 shadow-md shadow-amber-500/10 font-black scale-[1.02]"
              : "text-slate-500 hover:text-slate-350 hover:bg-slate-900"
          }`}
        >
          <MessageSquare className="w-3.5 h-3.5" />
          <span>💬 CO-PILOTO SELIX</span>
        </button>
        <button
          onClick={() => handleTabChange("moltbook")}
          className={`flex-1 py-2 rounded-lg text-center font-black uppercase tracking-wider transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
            activeTab === "moltbook"
              ? "bg-rose-600 text-slate-100 shadow-md shadow-rose-650/10 font-bold scale-[1.02]"
              : "text-slate-500 hover:text-slate-350 hover:bg-slate-900"
          }`}
        >
          <Globe className="w-3.5 h-3.5" />
          <span>🦞 MOLTBOOK AGENTE</span>
        </button>
      </div>

      {activeTab === "selix" ? (
        <div className="flex-1 flex flex-col gap-4 animate-fade-in">
          <div className="flex items-center gap-2 border-b border-slate-850 pb-2">
            <span className="p-1 rounded bg-amber-950 text-amber-400">
              <Sparkles className="w-4 h-4 animate-pulse" />
            </span>
            <div>
              <div className="flex items-center gap-1.5">
                <h3 className="font-bold text-slate-200 font-mono text-2xs">RAG Econômico & Assistente Analítico</h3>
                <button
                  type="button"
                  onClick={() => speak(SPEECH_GUIDES.rag_assistant, true)}
                  className="p-0.5 rounded text-slate-500 hover:text-amber-400 hover:bg-amber-950/45 transition-colors cursor-pointer"
                  title="Ouvir explicação por voz do assistente RAG"
                >
                  <Volume2 className="w-3 h-3" />
                </button>
              </div>
              <p className="text-4xs text-slate-550 font-mono">SUPORTE COGNITIVO COM MOTOR GEMINI 3.5-FLASH</p>
            </div>
          </div>

          {/* Selix Interactive Robot Avatar */}
          <SelixAvatar />

          {apiKeyMissingNotice && (
            <div className="bg-amber-950/40 border border-amber-500/30 rounded p-2 text-3xs font-mono text-amber-300 flex items-start gap-1.5 select-none" id="api-key-notice">
              <AlertTriangle className="w-3.5 h-3.5 text-amber-400 flex-shrink-0 mt-0.5" />
              <div>
                <span className="font-bold">Aviso:</span> Modo de IA local heurística integrado. Para inteligência neural ilimitada, adicione sua chave de API do Gemini nas configurações de Secrets.
              </div>
            </div>
          )}

          {/* Bubble Dialog Stream */}
          <div className="flex-1 overflow-y-auto bg-slate-950/80 border border-slate-850 rounded-lg p-3 font-mono text-2xs space-y-3.5 flex flex-col" id="chatbot-message-container">
            {messages.map((msg, idx) => (
              <div
                key={idx}
                className={`flex flex-col max-w-[90%] ${
                  msg.role === "user" ? "self-end items-end" : "self-start items-start"
                }`}
              >
                <div className="flex w-full items-center justify-between text-[7.5px] text-slate-500 mb-1 select-none font-mono gap-4 min-w-[100px]">
                  <span>{msg.role === "user" ? "USUÁRIO" : "SELIX AGENT"}</span>
                  <button
                    type="button"
                    onClick={() => speak(msg.content, true)}
                    className="p-0.5 px-1 hover:text-amber-400 rounded hover:bg-slate-800 transition-colors cursor-pointer flex items-center gap-1 text-[8px]"
                    title="Narrar mensagem por voz"
                  >
                    <Volume2 className="w-2.5 h-2.5" />
                    <span>Narrar</span>
                  </button>
                </div>
                <div
                  className={`rounded-lg p-2.5 whitespace-pre-wrap leading-relaxed ${
                    msg.role === "user"
                      ? "bg-slate-800 text-slate-100 border border-slate-750"
                      : "bg-slate-900 text-slate-300 border border-amber-500/5 text-slate-250 font-sans"
                  }`}
                >
                  {msg.content}
                </div>
              </div>
            ))}
            {isPending && (
              <div className="self-start flex flex-col items-start max-w-[85%] animate-pulse font-mono text-2xs">
                <span className="text-3xs text-slate-500 mb-0.5">SELIX PROCESSOR ANALISANDO...</span>
                <div className="bg-slate-900 text-amber-400 border border-amber-500/10 rounded-lg p-2 flex items-center gap-2">
                  <Cpu className="w-3.5 h-3.5 animate-spin" />
                  Sincronizando vetores RAG...
                </div>
              </div>
            )}
          </div>

          {/* Presets suggestions select-clicks */}
          <div className="flex flex-wrap gap-1" id="presets-container">
            {presetPrompts.map((p, i) => (
              <button
                key={i}
                onClick={() => handleSend(p.text)}
                disabled={isPending}
                className="text-[7.5px] font-mono bg-slate-950 hover:bg-slate-850 hover:text-slate-300 border border-slate-850 px-2 py-1 rounded transition-all text-slate-450 text-left select-none cursor-pointer"
              >
                {p.label}
              </button>
            ))}
          </div>

          {/* Input Submit form */}
          <form onSubmit={handleSubmit} className="flex gap-2 font-mono" id="chatbot-submit-form">
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="Perguntar sobre juros, Brent ou Teoremas..."
              disabled={isPending}
              className="bg-slate-950 text-slate-200 border border-slate-850 rounded px-2.5 py-1.5 text-xs flex-1 outline-none focus:border-amber-500 transition-colors disabled:opacity-60"
            />
            <button
              type="submit"
              disabled={isPending || !inputText.trim()}
              className="bg-amber-500 text-slate-950 hover:bg-amber-400 disabled:bg-slate-800 disabled:text-slate-500 font-extrabold px-3 py-1.5 rounded text-xs transition-all flex items-center gap-1 cursor-pointer"
            >
              <Send className="w-3 h-3" />
              <span>OK</span>
            </button>
          </form>
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto h-[610px] pr-0.5 animate-fade-in custom-scrollbar">
          {/* Render Moltbook directly inside are for superb multi-chat UX selection */}
          <SelixMoltbook
            onInjectLog={onInjectLog}
            brent={brent}
            selic={selic}
            llmModelType={llmModelType}
            moltbookAgents={moltbookAgents}
            activeMoltbookAgentId={activeMoltbookAgentId}
            onSelectMoltbookAgent={onSelectMoltbookAgent}
          />
        </div>
      )}
    </div>
  );
}
