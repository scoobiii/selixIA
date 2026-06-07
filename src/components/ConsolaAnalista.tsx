/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { Send, Sparkles, Cpu, AlertTriangle, MessageSquare, CornerDownLeft, Volume2 } from "lucide-react";
import { speak, SPEECH_GUIDES } from "../utils/speech";
import SelixAvatar from "./SelixAvatar";

interface Message {
  role: "user" | "assistant";
  content: string;
}

interface ConsolaAnalistaProps {
  onSendMessage: (msg: string) => Promise<{ result: string; apiKeyMissing?: boolean }>;
  isPending: boolean;
}

export default function ConsolaAnalista({ onSendMessage, isPending }: ConsolaAnalistaProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content: "🧠 [SELIX Flex-AI v5.0] RAG de Inteligência Econômica Online. Aguardando instrução analítica sobre a taxa Selic ou cotação do Barril Brent.",
    },
  ]);
  const [inputText, setInputText] = useState("");
  const [apiKeyMissingNotice, setApiKeyMissingNotice] = useState(false);

  const presetPrompts = [
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
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-2xl flex flex-col gap-4 relative overflow-hidden h-[680px]" id="financial-copilot">
      <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/5 blur-3xl rounded-full" />
      
      <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
        <span className="p-1.5 rounded bg-amber-950 text-amber-400">
          <MessageSquare className="w-5 h-5 animate-pulse" />
        </span>
        <div>
          <div className="flex items-center gap-1.5">
            <h3 className="font-semibold text-slate-100 font-mono text-sm">RAG Econômico & Assistente Analítico</h3>
            <button
              type="button"
              onClick={() => speak(SPEECH_GUIDES.rag_assistant, true)}
              className="p-0.5 rounded text-slate-500 hover:text-amber-400 hover:bg-amber-950/45 transition-colors cursor-pointer"
              title="Ouvir explicação por voz do assistente RAG"
            >
              <Volume2 className="w-3.5 h-3.5" />
            </button>
          </div>
          <p className="text-3xs text-slate-500 font-mono">SUPORTE COGNITIVO COM MOTOR GEMINI 3.5-FLASH</p>
        </div>
      </div>

      {/* Selix Interactive Robot Avatar */}
      <SelixAvatar />

      {apiKeyMissingNotice && (
        <div className="bg-amber-950/40 border border-amber-500/30 rounded p-2.5 text-3xs font-mono text-amber-300 flex items-start gap-2 select-none" id="api-key-notice">
          <AlertTriangle className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
          <div>
            <span className="font-bold">Aviso de Configuração:</span> O chaveamento do Gemini (process.env.GEMINI_API_KEY) está omitido ou padrão. Ativação do modo heurístico simulado de inteligência local integrado com os Teoremas de Lean. Adicione uma chave no painel Secrets para habilitar a rede neuro-línguistica integral.
          </div>
        </div>
      )}

      {/* Bubble Dialog Stream */}
      <div className="flex-1 overflow-y-auto bg-slate-950/80 border border-slate-850 rounded-lg p-4 font-mono text-2xs space-y-4 flex flex-col" id="chatbot-message-container">
        {messages.map((msg, idx) => (
          <div
            key={idx}
            className={`flex flex-col max-w-[85%] ${
              msg.role === "user" ? "self-end items-end" : "self-start items-start"
            }`}
          >
            <div className="flex w-full items-center justify-between text-3xs text-slate-500 mb-1 select-none font-mono gap-4 min-w-[120px]">
              <span>{msg.role === "user" ? "USUÁRIO" : "SELIX AGENT"}</span>
              <button
                type="button"
                onClick={() => speak(msg.content, true)}
                className="p-0.5 px-1 hover:text-amber-400 rounded hover:bg-slate-800 transition-colors cursor-pointer flex items-center gap-1 text-[9px]"
                title="Narrar mensagem por voz"
              >
                <Volume2 className="w-2.5 h-2.5" />
                <span>Narrar</span>
              </button>
            </div>
            <div
              className={`rounded-lg p-3 whitespace-pre-wrap leading-relaxed ${
                msg.role === "user"
                  ? "bg-slate-800 text-slate-100 border border-slate-700"
                  : "bg-slate-900 text-slate-300 border border-amber-500/10"
              }`}
            >
              {msg.content}
            </div>
          </div>
        ))}
        {isPending && (
          <div className="self-start flex flex-col items-start max-w-[85%] animate-pulse font-mono text-2xs">
            <span className="text-3xs text-slate-500 mb-1">SELIX PROCESSOR ANALISANDO...</span>
            <div className="bg-slate-900 text-amber-400 border border-amber-500/10 rounded-lg p-3 flex items-center gap-2">
              <Cpu className="w-3.5 h-3.5 animate-spin" />
              Sincronizando vetores RAG e calculando regressão...
            </div>
          </div>
        )}
      </div>

      {/* Presets suggestions select-clicks */}
      <div className="flex flex-wrap gap-1.5" id="presets-container">
        {presetPrompts.map((p, i) => (
          <button
            key={i}
            onClick={() => handleSend(p.text)}
            disabled={isPending}
            className="text-4xs font-mono bg-slate-950 hover:bg-slate-850 hover:text-slate-300 border border-slate-850 px-2.5 py-1.5 rounded transition-all text-slate-400 text-left select-none"
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
          placeholder="Peça ao Selix para analisar taxa Selic ou petróleo..."
          disabled={isPending}
          className="bg-slate-950 text-slate-200 border border-slate-850 rounded px-3 py-2 text-xs flex-1 outline-none focus:border-amber-500 transition-colors disabled:opacity-60"
        />
        <button
          type="submit"
          disabled={isPending || !inputText.trim()}
          className="bg-amber-500 text-slate-950 hover:bg-amber-400 disabled:bg-slate-800 disabled:text-slate-500 font-bold px-4 py-2 rounded text-xs transition-all flex items-center gap-1 cursor-pointer"
        >
          <Send className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">PROCESSAR</span>
        </button>
      </form>
    </div>
  );
}
