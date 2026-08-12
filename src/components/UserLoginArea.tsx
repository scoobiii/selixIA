/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import { 
  User, LogIn, LogOut, Key, Mail, Shield, AlertCircle, 
  Sparkles, RefreshCw, Volume2, Database, Flame, Settings,
  CheckCircle, PlusCircle, Eye, EyeOff
} from "lucide-react";
import { speak } from "../utils/speech";
import {
  isFirebaseConfigured,
  getActiveFirebaseConfig,
  saveCustomFirebaseConfig,
  clearCustomFirebaseConfig,
  signInWithGoogleFirebase,
  loginWithEmailFirebase,
  signUpWithEmailFirebase,
  signOutFirebase,
  FirebaseConfigShape
} from "../utils/firebase";

interface UserLoginAreaProps {
  currentUser: any | null;
  onLoginSuccess: (user: any) => void;
  onLogout: () => void;
}

export default function UserLoginArea({ currentUser, onLoginSuccess, onLogout }: UserLoginAreaProps) {
  const [showModal, setShowModal] = useState(false);
  const [authProvider, setAuthProvider] = useState<"opensource" | "firebase">("opensource");
  
  // Local/OpenSource input State
  const [emailInput, setEmailInput] = useState("");
  
  // Firebase Auth input State
  const [fbEmail, setFbEmail] = useState("");
  const [fbPassword, setFbPassword] = useState("");
  const [fbMode, setFbMode] = useState<"login" | "signup">("login");
  const [showPassword, setShowPassword] = useState(false);

  // Custom Firebase configuration state (allows typing custom fields on the fly if needed)
  const [showConfigFields, setShowConfigFields] = useState(false);
  const [customCfg, setCustomCfg] = useState<FirebaseConfigShape>(() => getActiveFirebaseConfig());

  // Operations state
  const [isAuthLoading, setIsAuthLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const handleSpeakLoginIntro = () => {
    speak(
      "Central de Autenticação e Gestão de Chaves de Acesso Selix. Conecte sua conta de forma descomplicada para herdar automaticamente uma licença de uso do Gemini de trinta dias desenvolvida para faturamento das assinaturas. O sistema sincroniza de forma segura as suas preferências de taxas Selic e anotações financeiras no banco de dados local.",
      true
    );
  };

  // Restores profile customization values from our local Express server
  const loadUserFromServer = async (email: string, name?: string, picture?: string) => {
    try {
      const res = await fetch("/api/auth/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, name, picture }),
      });
      if (res.ok) {
        const data = await res.json();
        return data.user;
      }
    } catch (e) {
      console.error("Erro ao sincronizar perfil do servidor", e);
    }
    return null;
  };

  // Handle Google OAuth Popup (Open-Source API provider flow)
  const handleGoogleConnect = async () => {
    setIsAuthLoading(true);
    setErrorMessage("");
    setSuccessMessage("");
    try {
      const response = await fetch("/api/auth/url");
      if (!response.ok) {
        throw new Error("Não foi possível gerar a URL de autenticação.");
      }
      const { url } = await response.json();

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

  // Handle local database quick sign-in (Open-Source API)
  const handleLocalSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!emailInput || !emailInput.includes("@")) {
      setErrorMessage("Por favor, digite um e-mail válido.");
      return;
    }

    setIsAuthLoading(true);
    setErrorMessage("");
    setSuccessMessage("");
    try {
      const userProfile = await loadUserFromServer(emailInput);
      if (userProfile) {
        onLoginSuccess(userProfile);
        setShowModal(false);
        setEmailInput("");
        setSuccessMessage("Autenticado com sucesso via Open Source API!");
      } else {
        throw new Error("Erro ao carregar perfil de usuário do servidor.");
      }
    } catch (err: any) {
      setErrorMessage(err.message || "Falha no login com banco de dados.");
    } finally {
      setIsAuthLoading(false);
    }
  };

  // Handle Firebase Login/Register
  const handleFirebaseEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fbEmail || !fbEmail.includes("@")) {
      setErrorMessage("Por favor, digite um e-mail válido.");
      return;
    }
    if (fbPassword.length < 6) {
      setErrorMessage("A senha do Firebase deve conter no mínimo 6 caracteres.");
      return;
    }

    setIsAuthLoading(true);
    setErrorMessage("");
    setSuccessMessage("");
    try {
      let fbUser;
      if (fbMode === "login") {
        fbUser = await loginWithEmailFirebase(fbEmail, fbPassword);
      } else {
        fbUser = await signUpWithEmailFirebase(fbEmail, fbPassword);
      }

      // Synchronize/load customization preferences from Express DB utilizing Firebase email identity
      const serverUser = await loadUserFromServer(
        fbUser.email,
        fbUser.name,
        fbUser.picture
      );

      onLoginSuccess(serverUser || fbUser);
      setShowModal(false);
      setFbEmail("");
      setFbPassword("");
    } catch (err: any) {
      console.error("Firebase Auth Error:", err);
      // Friendly messages for standard Firebase Auth codes
      let msg = err.message || "Erro de autenticação Firebase.";
      if (msg.includes("auth/invalid-credential") || msg.includes("auth/wrong-password")) {
        msg = "Credenciais inválidas. Verifique seu e-mail e senha.";
      } else if (msg.includes("auth/email-already-in-use")) {
        msg = "Este e-mail já está cadastrado no projeto Firebase.";
      } else if (msg.includes("auth/invalid-email")) {
        msg = "Formato de e-mail inválido.";
      } else if (msg.includes("not initialized") || msg.includes("configurado")) {
        msg = "Chaves e credenciais do Firebase não estão prontas. Complete os campos abaixo ou clique em 'Provisionar'.";
      }
      setErrorMessage(msg);
    } finally {
      setIsAuthLoading(false);
    }
  };

  // Handle Firebase Google Sign-In
  const handleFirebaseGoogleSignIn = async () => {
    setIsAuthLoading(true);
    setErrorMessage("");
    setSuccessMessage("");
    try {
      const fbUser = await signInWithGoogleFirebase();
      
      // Synchronize details with JSON Server database to load customizations
      const serverUser = await loadUserFromServer(
        fbUser.email,
        fbUser.name,
        fbUser.picture
      );

      onLoginSuccess(serverUser || fbUser);
      setShowModal(false);
    } catch (err: any) {
      console.error("Firebase Google Sign-In Error:", err);
      setErrorMessage(err.message || "Erro de login com Google Firebase.");
    } finally {
      setIsAuthLoading(false);
    }
  };

  // Save custom credentials manually
  const handleSaveCustomConfig = () => {
    try {
      saveCustomFirebaseConfig(customCfg);
      setSuccessMessage("Configurações do Firebase salvas com sucesso!");
      setErrorMessage("");
    } catch (e: any) {
      setErrorMessage("Erro ao salvar dados de configuração.");
    }
  };

  const handleClearCustomConfig = () => {
    clearCustomFirebaseConfig();
    setCustomCfg(getActiveFirebaseConfig());
    setSuccessMessage("Limpado de volta para as chaves padrões!");
    setErrorMessage("");
  };

  const isCurrentFirebaseReady = isFirebaseConfigured(getActiveFirebaseConfig());

  // Listen for Open-Source OAuth callback message
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      const origin = event.origin;
      const isAllowedOrigin = 
        origin.endsWith(".run.app") || 
        origin.endsWith(".google.com") || 
        origin.endsWith(".google") || 
        origin.includes("localhost") || 
        origin.includes("127.0.0.1") ||
        origin.includes("aistudio");

      if (!isAllowedOrigin) return;

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

  // Handle secure log out
  const handleLogoutWithFirebase = async () => {
    try {
      await signOutFirebase();
    } catch (e) {
      console.error("Firebase Signout Error:", e);
    }
    onLogout();
  };

  return (
    <div id="user-auth-portal" className="inline-block font-sans">
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
            <span className="text-[8px] text-slate-500 font-mono block">
              {currentUser.email} ({currentUser.provider === "firebase" ? "Firebase" : "API Local"})
            </span>
          </div>
          <button
            onClick={handleLogoutWithFirebase}
            className="text-[9px] text-rose-400 hover:text-rose-300 font-bold ml-1.5 border border-rose-950/40 hover:border-rose-900 bg-rose-950/20 px-2 py-0.5 rounded transition-all cursor-pointer"
          >
            Sair
          </button>
        </div>
      ) : (
        <button
          onClick={() => {
            setShowModal(true);
            setSuccessMessage("");
            setErrorMessage("");
          }}
          className="bg-indigo-600 hover:bg-indigo-500 text-slate-100 p-2 px-3.5 rounded-lg text-xs font-bold transition-all shadow-md shadow-indigo-600/15 flex items-center gap-1.5 cursor-pointer leading-tight active:scale-95"
        >
          <LogIn className="w-3.5 h-3.5" />
          Área do Investidor
        </button>
      )}

      {/* LOGIN MODAL */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 w-full max-w-md shadow-2xl relative overflow-hidden animate-fade-in my-8">
            
            {/* Ambient Background Glow */}
            <div className="absolute top-0 right-0 w-36 h-36 bg-indigo-500/5 blur-3xl rounded-full" />

            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
              <div className="flex items-center gap-2">
                <span className="p-1.5 rounded-lg bg-indigo-950 text-indigo-400">
                  <User className="w-4 h-4" />
                </span>
                <div>
                  <div className="flex items-center gap-1.5">
                    <h3 className="font-bold text-slate-100 text-sm">Central de Autenticação</h3>
                    <button
                      type="button"
                      onClick={handleSpeakLoginIntro}
                      className="p-1 rounded hover:bg-slate-800 text-indigo-400 hover:text-indigo-300 transition-all cursor-pointer"
                      title="Ouvir explicação por voz"
                    >
                      <Volume2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <p className="text-[8px] text-slate-500 font-mono uppercase tracking-wider">Gestão Unificada de Provedores de Acesso</p>
                </div>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="text-slate-500 hover:text-slate-300 text-xs font-bold px-1.5 py-0.5 hover:bg-slate-850 rounded"
              >
                ✕
              </button>
            </div>

            {/* PROVIDER PICKER BUTTONS */}
            <div className="grid grid-cols-2 gap-2 p-1 bg-slate-950 border border-slate-850 rounded-lg mb-4 text-[10px] font-mono">
              <button
                type="button"
                onClick={() => {
                  setAuthProvider("opensource");
                  setErrorMessage("");
                  setSuccessMessage("");
                }}
                className={`py-1.5 rounded-md font-bold transition-all flex items-center justify-center gap-1.5 ${authProvider === "opensource" ? "bg-slate-850 text-indigo-400 border border-slate-800" : "text-slate-500 hover:text-slate-300"}`}
              >
                <Database className="w-3.5 h-3.5" />
                API OPEN SOURCE
              </button>
              <button
                type="button"
                onClick={() => {
                  setAuthProvider("firebase");
                  setErrorMessage("");
                  setSuccessMessage("");
                }}
                className={`py-1.5 rounded-md font-bold transition-all flex items-center justify-center gap-1.5 ${authProvider === "firebase" ? "bg-slate-850 text-amber-500 border border-slate-800" : "text-slate-500 hover:text-slate-300"}`}
              >
                <Flame className="w-3.5 h-3.5" />
                FIREBASE AUTH
              </button>
            </div>

            {/* Error Message */}
            {errorMessage && (
              <div className="bg-rose-950/40 border border-rose-900/50 rounded-lg p-2.5 mb-4 text-rose-450 text-[10.5px] leading-relaxed flex items-start gap-2">
                <AlertCircle className="w-4 h-4 mt-0.5 shrink-0 text-rose-400" />
                <span>{errorMessage}</span>
              </div>
            )}

            {/* Success Message */}
            {successMessage && (
              <div className="bg-emerald-950/40 border border-emerald-900/50 rounded-lg p-2.5 mb-4 text-emerald-450 text-[10.5px] leading-relaxed flex items-start gap-2">
                <CheckCircle className="w-4 h-4 mt-0.5 shrink-0 text-emerald-400" />
                <span>{successMessage}</span>
              </div>
            )}

            {/* ==================== PROVIDER 1: OPEN SOURCE LOCAL API ==================== */}
            {authProvider === "opensource" && (
              <div className="space-y-4 animate-fade-in text-xs">
                <p className="text-slate-400 leading-relaxed text-[11px]">
                  Utilize o microsserviço embarcado de autenticação. Ele simula e sincroniza suas taxas táticas, notas e controle de WACC diretamente na tabela <code className="text-indigo-400 font-mono">users</code> de <code className="text-slate-300 font-mono">selix_db.json</code>.
                </p>

                {/* Simulated Google Button */}
                <button
                  type="button"
                  onClick={handleGoogleConnect}
                  disabled={isAuthLoading}
                  className="w-full bg-white hover:bg-slate-100 text-slate-900 p-2.5 px-4 rounded-lg font-bold flex items-center justify-center gap-2 transition-all cursor-pointer shadow relative"
                >
                  {isAuthLoading ? (
                    <RefreshCw className="w-4 h-4 animate-spin text-slate-600" />
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
                  <span>Vincular com Google (Simulador)</span>
                </button>

                <div className="flex items-center gap-2">
                  <div className="h-px bg-slate-800 flex-1" />
                  <span className="text-[9px] text-slate-500 font-mono">OU ACESSE COM SEU E-MAIL</span>
                  <div className="h-px bg-slate-800 flex-1" />
                </div>

                {/* Local Email Entry Form */}
                <form onSubmit={handleLocalSignIn} className="space-y-3 font-mono text-[10px]">
                  <div className="space-y-1">
                    <label className="text-slate-500 text-[8px] uppercase block">E-MAIL DO INVESTIDOR</label>
                    <div className="relative">
                      <Mail className="absolute left-2.5 top-2.5 w-3.5 h-3.5 text-slate-605" />
                      <input
                        type="email"
                        required
                        placeholder="sobrinhoSJ@gmail.com"
                        value={emailInput}
                        onChange={(e) => setEmailInput(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-850 rounded-lg p-2 pl-8.5 font-mono text-slate-200 placeholder-slate-700 focus:border-indigo-500/50 focus:outline-none"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={isAuthLoading}
                    className="w-full bg-slate-800 hover:bg-slate-750 text-indigo-400 border border-slate-750 p-2 rounded-lg font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <LogIn className="w-3.5 h-3.5" />
                    ENTRAR VIA E-MAIL (OPEN SOURCE)
                  </button>
                </form>

                <p className="text-[8.5px] text-slate-500 leading-normal font-mono border-t border-slate-850/50 pt-3">
                  💡 <strong>Sem API Keys necessárias:</strong> O simulador Google OAuth popup roda offline instantaneamente caso chaves externas fiquem vazias.
                </p>
              </div>
            )}

            {/* ==================== PROVIDER 2: FIREBASE AUTHENTICATION ==================== */}
            {authProvider === "firebase" && (
              <div className="space-y-4 animate-fade-in text-xs">
                <div className="flex items-start justify-between">
                  <p className="text-slate-400 leading-relaxed text-[11px] max-w-[80%]">
                    Autentique usando a infraestrutura do <strong>Google Firebase Auth</strong>. Esse fluxo permite registros no banco de dados e controle de sessão seguro.
                  </p>
                  
                  {/* Readiness badge */}
                  <span className={`text-[8px] font-bold font-mono px-1.5 py-0.5 rounded border ${isCurrentFirebaseReady ? "bg-emerald-950 text-emerald-400 border-emerald-900" : "bg-amber-950 text-amber-500 border-amber-900"}`}>
                    {isCurrentFirebaseReady ? "ONLINE" : "OFF-LINE"}
                  </span>
                </div>

                {isCurrentFirebaseReady ? (
                  <div className="space-y-4">
                    {/* Google Sign-in on Firebase */}
                    <button
                      type="button"
                      onClick={handleFirebaseGoogleSignIn}
                      disabled={isAuthLoading}
                      className="w-full bg-amber-600 hover:bg-amber-500 text-slate-950 p-2.5 px-4 rounded-lg font-bold flex items-center justify-center gap-2 transition-all cursor-pointer shadow-md"
                    >
                      {isAuthLoading ? (
                        <RefreshCw className="w-4 h-4 animate-spin text-slate-950" />
                      ) : (
                        <Sparkles className="w-4 h-4 text-slate-950" />
                      )}
                      <span>Google Sign-In @Firebase</span>
                    </button>

                    <div className="flex items-center gap-2">
                      <div className="h-px bg-slate-800 flex-1" />
                      <span className="text-[9px] text-slate-500 font-mono">OU EMAIL + SENHA DO PROJETO</span>
                      <div className="h-px bg-slate-800 flex-1" />
                    </div>

                    {/* Email / Password Form for Firebase */}
                    <form onSubmit={handleFirebaseEmailAuth} className="space-y-3 font-mono text-[10px]">
                      <div className="space-y-1">
                        <label className="text-slate-500 text-[8px] uppercase block">E-MAIL DO PROJETO</label>
                        <input
                          type="email"
                          required
                          placeholder="seunome@provedor.com"
                          value={fbEmail}
                          onChange={(e) => setFbEmail(e.target.value)}
                          className="w-full bg-slate-950 border border-slate-850 rounded-lg p-2 font-mono text-slate-200 focus:border-amber-500/50 focus:outline-none"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-slate-500 text-[8px] uppercase block">SENHA DE SEGURANÇA</label>
                        <div className="relative">
                          <input
                            type={showPassword ? "text" : "password"}
                            required
                            placeholder="......"
                            value={fbPassword}
                            onChange={(e) => setFbPassword(e.target.value)}
                            className="w-full bg-slate-950 border border-slate-850 rounded-lg p-2 pr-9.5 font-mono text-slate-200 focus:border-amber-500/50 focus:outline-none"
                          />
                          <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-2.5 top-2.5 text-slate-600 hover:text-slate-450"
                          >
                            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </button>
                        </div>
                      </div>

                      <div className="flex items-center justify-between text-[9px] text-slate-500 pt-1">
                        <label className="flex items-center gap-1.5 cursor-pointer select-none">
                          <input
                            type="checkbox"
                            checked={fbMode === "signup"}
                            onChange={(e) => setFbMode(e.target.checked ? "signup" : "login")}
                            className="rounded border-slate-800 bg-slate-950 text-amber-500 focus:ring-0 w-3 h-3"
                          />
                          <span>Criar nova conta (Cadastrar)</span>
                        </label>
                        <span className="text-slate-400 font-bold uppercase">
                          MODO: {fbMode === "login" ? "Entrar" : "Criar Conta"}
                        </span>
                      </div>

                      <button
                        type="submit"
                        disabled={isAuthLoading}
                        className={`w-full p-2 rounded-lg font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${fbMode === "login" ? "bg-slate-800 hover:bg-slate-750 text-amber-500 border border-slate-750" : "bg-amber-955 text-slate-950 hover:bg-amber-450 border border-amber-900"}`}
                      >
                        <LogIn className="w-3.5 h-3.5" />
                        {fbMode === "login" ? "ENTRAR NO FIREBASE" : "CADASTRAR NO FIREBASE"}
                      </button>
                    </form>
                  </div>
                ) : (
                  <div className="bg-slate-950/60 p-4 rounded-lg border border-slate-850 text-[10.5px] leading-relaxed text-slate-450 space-y-3.5">
                    <div className="flex items-start gap-1.5 text-amber-400 font-bold font-sans">
                      <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                      <span>Firebase Não Provisionado</span>
                    </div>
                    <p>
                      Sua workspace não foi provida de banco Firebase ou chaves ativas do Google Cloud no arquivo <code className="text-slate-300 font-mono">firebase-applet-config.json</code>.
                    </p>
                    <p className="font-sans text-[10px] text-slate-500">
                      Como o criador do Selix está em desenvolvimento, você pode usar o assistente de preenchimento ou as opções abaixo para inserir dados de testes.
                    </p>

                    <button
                      type="button"
                      onClick={() => {
                        setCustomCfg({
                          apiKey: "AIzaSyFakeKeyForAutenticacaoSelix12345",
                          authDomain: `${process.env.APP_URL ? process.env.APP_URL.replace(/https?:\/\//, "") : "selix-app.firebaseapp.com"}`,
                          projectId: "selix-project-local",
                          storageBucket: "selix-app.appspot.com",
                          messagingSenderId: "987654321012",
                          appId: "1:987654321012:web:abcdef123456",
                          measurementId: "G-DEMOMOLTBOOK",
                          firestoreDatabaseId: "(default)"
                        });
                        setSuccessMessage("Preenchido com credenciais demonstrativas! Clique em Salvar abaixo.");
                      }}
                      className="bg-amber-950/40 text-amber-500 hover:bg-amber-900/30 border border-amber-900/50 font-bold font-mono text-[9px] px-2.5 py-1.5 rounded-md transition-all cursor-pointer w-full text-center"
                    >
                      ⚡ AUTO-PREENCHER CREDECIAIS DE TESTE (DEMO)
                    </button>
                  </div>
                )}

                {/* MANUAL FIREBASE CONFIGURATION / OVERRIDES SECTION */}
                <div className="mt-2 border-t border-slate-850/60 pt-2.5">
                  <button
                    type="button"
                    onClick={() => setShowConfigFields(!showConfigFields)}
                    className="flex items-center gap-1.5 text-[10px] text-slate-500 hover:text-slate-350 font-mono font-bold font-sans transition-all"
                  >
                    <Settings className="w-3.5 h-3.5" />
                    {showConfigFields ? "Ocultar Painel de Conexão Customizado" : "Gerenciar Credenciais Customizadas do Firebase (Dev)..."}
                  </button>

                  {showConfigFields && (
                    <div className="mt-3 bg-slate-950 p-3 rounded-lg border border-slate-855 space-y-3 font-mono text-[10px]">
                      <p className="text-slate-500 text-[9px] leading-relaxed">
                        Insira as chaves oficiais para conectar seu próprio console do Firebase. Salva com segurança na sessão criptografada do navegador.
                      </p>

                      <div className="grid grid-cols-2 gap-2">
                        <div className="space-y-1">
                          <label className="text-slate-500 text-[7px] block uppercase">Firebase API Key</label>
                          <input
                            type="text"
                            placeholder="AIzaSy..."
                            value={customCfg.apiKey}
                            onChange={(e) => setCustomCfg({ ...customCfg, apiKey: e.target.value.trim() })}
                            className="w-full bg-slate-900 border border-slate-800 rounded p-1.5 font-mono text-slate-300 placeholder-slate-800 text-[9px]"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-slate-500 text-[7px] block uppercase">Auth Domain</label>
                          <input
                            type="text"
                            placeholder="exemplo.firebaseapp.com"
                            value={customCfg.authDomain}
                            onChange={(e) => setCustomCfg({ ...customCfg, authDomain: e.target.value.trim() })}
                            className="w-full bg-slate-900 border border-slate-800 rounded p-1.5 font-mono text-slate-300 placeholder-slate-800 text-[9px]"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <div className="space-y-1">
                          <label className="text-slate-500 text-[7px] block uppercase">Project ID</label>
                          <input
                            type="text"
                            placeholder="selix-123456"
                            value={customCfg.projectId}
                            onChange={(e) => setCustomCfg({ ...customCfg, projectId: e.target.value.trim() })}
                            className="w-full bg-slate-900 border border-slate-800 rounded p-1.5 font-mono text-slate-300 placeholder-slate-800 text-[9px]"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-slate-500 text-[7px] block uppercase">App ID</label>
                          <input
                            type="text"
                            placeholder="1:1234:web:ab34"
                            value={customCfg.appId || ""}
                            onChange={(e) => setCustomCfg({ ...customCfg, appId: e.target.value.trim() })}
                            className="w-full bg-slate-900 border border-slate-800 rounded p-1.5 font-mono text-slate-300 placeholder-slate-800 text-[9px]"
                          />
                        </div>
                      </div>

                      <div className="flex gap-2 pt-1.5">
                        <button
                          type="button"
                          onClick={handleSaveCustomConfig}
                          className="bg-emerald-950 hover:bg-emerald-900 text-emerald-400 px-3 py-1.5 rounded font-bold hover:scale-[1.02] active:scale-95 transition-all cursor-pointer flex-1 text-center"
                        >
                          Salvar Conexão
                        </button>
                        <button
                          type="button"
                          onClick={handleClearCustomConfig}
                          className="bg-slate-900 hover:bg-slate-850 hover:text-slate-300 text-slate-500 px-3 py-1.5 rounded font-black transition-all cursor-pointer flex-1 text-center border border-slate-800"
                        >
                          Usar Padrão
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Shield Footer badge info */}
            <div className="border-t border-slate-800/80 pt-3 mt-4 text-[9px] text-slate-500 font-mono leading-normal flex items-start gap-1">
              <Shield className="w-3.5 h-3.5 text-indigo-500/60 mt-0.5 shrink-0" />
              <span>
                {authProvider === "opensource" 
                  ? "Open Source local ativo. Persistência de preferências de faturamento gravando em selix_db.json."
                  : "Firebase Auth ativo. Token JWT gerado e renovado em tempo real contra as regras de segurança."
                }
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
