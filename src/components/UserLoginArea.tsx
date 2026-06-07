/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import { User, LogIn, LogOut, Key, Mail, Shield, AlertCircle, Sparkles, RefreshCw } from "lucide-react";

interface UserLoginAreaProps {
  currentUser: any | null;
  onLoginSuccess: (user: any) => void;
  onLogout: () => void;
}

export default function UserLoginArea({ currentUser, onLoginSuccess, onLogout }: UserLoginAreaProps) {
  const [showModal, setShowModal] = useState(false);
  const [emailInput, setEmailInput] = useState("");
  const [isAuthLoading, setIsAuthLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  // Handle Google OAuth Popup
  const handleGoogleConnect = async () => {
    setIsAuthLoading(true);
    setErrorMessage("");
    try {
      // 1. Fetch OAuth URL from server
      const response = await fetch("/api/auth/url");
      if (!response.ok) {
        throw new Error("Não foi possível gerar a URL de autenticação.");
      }
      const { url } = await response.json();

      // 2. Open Google OAuth directly in popup (or simulate if sandbox)
      const width = 500;
      const height = 650;
      const left = window.screen.width / 2 - width / 2;
      const top = window.screen.height / 2 - height / 2;

      const authWindow = window.open(
        url,
        "google_oauth_popup",
        `width=${width},height=${height},top=${top},left=${left},resizable=yes,scrollbars=yes`
      );

      if (!authWindow) {
        setErrorMessage("O bloqueador de popups impediu o login. Por favor, permita popups para este site.");
        setIsAuthLoading(false);
      }
    } catch (err: any) {
      console.error("OAuth init error:", err);
      setErrorMessage(err.message || "Erro de inicialização OAuth.");
      setIsAuthLoading(false);
    }
  };

  // Handle local database quick sign-in
  const handleLocalSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!emailInput || !emailInput.includes("@")) {
      setErrorMessage("Por favor, digite um e-mail válido.");
      return;
    }

    setIsAuthLoading(true);
    setErrorMessage("");
    try {
      const res = await fetch("/api/auth/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: emailInput }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.user) {
          onLoginSuccess(data.user);
          setShowModal(false);
          setEmailInput("");
        }
      } else {
        throw new Error("Erro ao criar perfil no servidor.");
      }
    } catch (err: any) {
      setErrorMessage(err.message || "Falha no login com banco de dados.");
    } finally {
      setIsAuthLoading(false);
    }
  };

  // Listen for OAuth messages from the popup window
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      const origin = event.origin;
      // Allow AI Studio preview, localhost and 127.0.0.1 origins
      if (!origin.endsWith(".run.app") && !origin.includes("localhost") && !origin.includes("127.0.0.1")) {
        return;
      }

      if (event.data?.type === "OAUTH_AUTH_SUCCESS") {
        const loggedInUser = event.data.user;
        onLoginSuccess(loggedInUser);
        setShowModal(false);
        setIsAuthLoading(false);
      }
    };

    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, [onLoginSuccess]);

  return (
    <div id="user-auth-portal" className="inline-block">
      {currentUser ? (
        <div className="flex items-center gap-2 bg-slate-900 border border-slate-800 px-3 py-1.5 rounded-lg shadow-sm">
          {currentUser.picture ? (
            <img
              src={currentUser.picture}
              alt={currentUser.name}
              className="w-5 h-5 rounded-full border border-indigo-500/40"
              referrerPolicy="no-referrer"
            />
          ) : (
            <div className="w-5 h-5 rounded-full bg-indigo-950 border border-indigo-500/40 flex items-center justify-center text-indigo-400 font-mono text-[9px] font-bold">
              {currentUser.name ? currentUser.name.charAt(0).toUpperCase() : "U"}
            </div>
          )}
          <div className="text-left leading-tight hidden xs:block">
            <span className="text-[10px] text-slate-100 font-bold block">{currentUser.name}</span>
            <span className="text-[8px] text-slate-500 font-mono block">{currentUser.email}</span>
          </div>
          <button
            onClick={onLogout}
            className="text-[9px] text-rose-400 hover:text-rose-300 font-bold ml-1.5 border border-rose-950/40 hover:border-rose-900 bg-rose-950/20 px-2 py-0.5 rounded transition-all cursor-pointer"
          >
            Sair
          </button>
        </div>
      ) : (
        <button
          onClick={() => setShowModal(true)}
          className="bg-indigo-600 hover:bg-indigo-500 text-slate-100 p-2 px-3.5 rounded-lg text-xs font-bold font-sans transition-all shadow-md shadow-indigo-600/15 flex items-center gap-1.5 cursor-pointer leading-tight active:scale-95"
        >
          <LogIn className="w-3.5 h-3.5" />
          Área do Investidor
        </button>
      )}

      {/* LOGIN MODAL */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 w-full max-w-sm shadow-2xl relative overflow-hidden animate-fade-in">
            {/* Glow effect */}
            <div className="absolute top-0 right-0 w-28 h-28 bg-indigo-500/5 blur-3xl rounded-full" />

            <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
              <div className="flex items-center gap-2">
                <span className="p-1 rounded bg-indigo-950 text-indigo-400">
                  <User className="w-4 h-4" />
                </span>
                <div>
                  <h3 className="font-bold text-slate-100 font-sans text-sm">Central de Autenticação</h3>
                  <p className="text-[8px] text-slate-500 font-mono uppercase tracking-wider">Acesso ao Banco de Dados JSON</p>
                </div>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="text-slate-500 hover:text-slate-300 text-xs font-bold px-1.5 py-0.5 hover:bg-slate-850 rounded"
              >
                ✕
              </button>
            </div>

            <p className="text-slate-400 text-xs leading-relaxed mb-4">
              Conecte sua conta para carregar preferências, programar taxa Selic alvo e arquivar suas anotações de cenário.
            </p>

            {/* BENEFITS CARD */}
            <div className="bg-indigo-950/40 border border-indigo-900/40 p-3 rounded-lg mb-4 space-y-2">
              <div className="flex items-center gap-1.5 text-xs text-indigo-400 font-bold">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Benefícios Exclusivos do Google Connect:</span>
              </div>
              <ul className="text-[10px] text-slate-300 list-disc list-inside space-y-1 font-mono leading-normal">
                <li><strong className="text-emerald-400 font-sans">🎁 Chave Gemini Libera Grátis:</strong> Teste livre da API do Gemini por 30 dias para análise.</li>
                <li><strong className="text-indigo-400 font-sans">💳 Assinatura Selix Premium:</strong> Apóie o autor (80%) e remunere os custos do Google Cloud Run (20%).</li>
              </ul>
            </div>

            {/* Error Message */}
            {errorMessage && (
              <div className="bg-rose-950/40 border border-rose-850 rounded-lg p-2.5 mb-4 text-rose-400 text-4xs leading-normal flex items-start gap-1.5">
                <AlertCircle className="w-3.5 h-3.5 mt-0.5 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            {/* GOOGLE AUTHENTICATION BTN */}
            <div className="space-y-4">
              <button
                type="button"
                onClick={handleGoogleConnect}
                disabled={isAuthLoading}
                className="w-full bg-white hover:bg-slate-100 text-slate-900 p-2.5 px-4 rounded-lg font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer shadow relative"
              >
                {isAuthLoading ? (
                  <RefreshCw className="w-4 h-4 animate-spin text-indigo-650" />
                ) : (
                  <svg className="w-4 h-4" viewBox="0 0 24 24">
                    <path
                      fill="#EA4335"
                      d="M12 5.04c1.66 0 3.2.57 4.38 1.69l3.27-3.27C17.67 1.54 14.98 1 12 1 7.35 1 3.37 3.54 1.3 7.31l3.92 3.04C6.18 7.39 8.87 5.04 12 5.04z"
                    />
                    <path
                      fill="#4285F4"
                      d="M23.49 12.27c0-.81-.07-1.59-.2-2.36H12v4.51h6.46c-.29 1.48-1.14 2.73-2.4 3.58l3.73 2.89c2.18-2.01 3.7-4.97 3.7-8.62z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.22 14.77c-.24-.72-.38-1.5-.38-2.31s.14-1.59.38-2.31L1.3 7.11C.47 8.79 0 10.64 0 12.5s.47 3.71 1.3 5.39l3.92-3.12z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 23c3.24 0 5.97-1.07 7.96-2.91l-3.73-2.89c-1.1.74-2.5 1.18-4.23 1.18-3.13 0-5.82-2.35-6.78-5.31L1.3 16.11C3.37 19.88 7.35 22.36 12 23z"
                    />
                  </svg>
                )}
                <span className="font-sans">Entrar com Google</span>
              </button>

              <div className="flex items-center gap-2">
                <div className="h-px bg-slate-800 flex-1" />
                <span className="text-[9px] text-slate-500 font-mono">OU QUER ASSINAR VIA E-MAIL</span>
                <div className="h-px bg-slate-800 flex-1" />
              </div>

              {/* QUICK EMAIL CONTAINER */}
              <form onSubmit={handleLocalSignIn} className="space-y-3 font-mono text-[10px]">
                <div className="space-y-1">
                  <label className="text-slate-500 text-3xs uppercase block">ENDEREÇO DE E-MAIL</label>
                  <div className="relative">
                    <Mail className="absolute left-2.5 top-2.5 w-3.5 h-3.5 text-slate-600" />
                    <input
                      type="email"
                      required
                      placeholder="sobrinhoSJ@gmail.com"
                      value={emailInput}
                      onChange={(e) => setEmailInput(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-850 rounded-lg p-2.5 pl-8.5 font-mono text-slate-200 placeholder-slate-700 focus:border-indigo-500/55 focus:outline-none focus:ring-0"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isAuthLoading}
                  className="w-full bg-slate-800 hover:bg-slate-750 text-indigo-400 border border-slate-750 hover:border-indigo-500/20 p-2 rounded-lg font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <LogIn className="w-3.5 h-3.5" />
                  ENTRAR VIA E-MAIL
                </button>
              </form>
            </div>

            <div className="border-t border-slate-800/80 pt-3 mt-4 text-[9px] text-slate-500 font-mono leading-normal flex items-start gap-1">
              <Shield className="w-3 h-3 text-indigo-500/60 mt-0.5 shrink-0" />
              <span>
                Gravação persistente ativa na tabela <code className="text-slate-400">users</code> do banco <code className="text-slate-400">selix_db.json</code>.
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
