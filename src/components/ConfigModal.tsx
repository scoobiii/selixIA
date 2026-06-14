/**
 * @license
 * SPDX-License-Identifier: Apache-2.5
 */

import React, { useState } from "react";
import { 
  X, 
  Settings, 
  Sliders, 
  Users, 
  Image as ImageIcon, 
  Globe, 
  Database, 
  UserPlus, 
  Play, 
  Flame, 
  Sparkles,
  Check,
  Smartphone,
  ShieldCheck,
  ShieldAlert,
  List
} from "lucide-react";
import { SELIX_PERSONAS } from "../utils/personas";
import { LocaleType } from "../utils/billingAndI18n";

interface ConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  
  // Market Variables
  brent: number;
  onUpdateBrent: (val: number) => void;
  ttf: number;
  onUpdateTtf: (val: number) => void;
  selic: number;
  onUpdateSelic: (val: number) => void;
  sentiment: number;
  onUpdateSentiment: (val: number) => void;
  
  // Design / Locales
  activeWallpaper: string;
  onWallpaperChange: (theme: string) => void;
  activeLocale: LocaleType;
  onLanguageChange: (locale: LocaleType) => void;
  
  // Persona
  activePersona: string;
  onChangePersona: (pId: string) => void;
  
  // Traffic / Waitlist
  simultaneousUsers: number;
  maxAllowedUsers: number;
  onUpdateUsers: (val: number) => void;
  
  // Waitlist Form State & Submission
  waitlistName: string;
  setWaitlistName: (val: string) => void;
  waitlistPhone: string;
  setWaitlistPhone: (val: string) => void;
  waitlistHandle: string;
  setWaitlistHandle: (val: string) => void;
  isWaitlistSubmitting: boolean;
  waitlistSuccess: boolean;
  onSubmitWaitlist: (e: React.FormEvent) => void;
  waitlistEntries: any[];
  
  // Special geopolitical scenario launcher
  onTriggerSpecialScenario: () => void;
}

export default function ConfigModal({
  isOpen,
  onClose,
  brent,
  onUpdateBrent,
  ttf,
  onUpdateTtf,
  selic,
  onUpdateSelic,
  sentiment,
  onUpdateSentiment,
  activeWallpaper,
  onWallpaperChange,
  activeLocale,
  onLanguageChange,
  activePersona,
  onChangePersona,
  simultaneousUsers,
  maxAllowedUsers,
  onUpdateUsers,
  waitlistName,
  setWaitlistName,
  waitlistPhone,
  setWaitlistPhone,
  waitlistHandle,
  setWaitlistHandle,
  isWaitlistSubmitting,
  waitlistSuccess,
  onSubmitWaitlist,
  waitlistEntries,
  onTriggerSpecialScenario
}: ConfigModalProps) {
  const [activeTab, setActiveTab] = useState<"market" | "personas" | "traffic" | "appearance" | "geopolitical">("market");

  if (!isOpen) return null;

  const wallpapers = [
    { id: "brent_crisis", label: "Crise Brent (Vermelho)", emoji: "🌋" },
    { id: "brazil_recovery", label: "Recuperação Nacional (Ecológico)", emoji: "🌿" },
    { id: "us_elections", label: "Eleições EUA (Azul Profundo)", emoji: "🦅" },
    { id: "copom_1999", label: "Copom Histórico (Âmbar)", emoji: "📜" },
  ];

  const localesList: { id: LocaleType; label: string; flag: string }[] = [
    { id: "pt-BR", label: "Português (Brasil)", flag: "🇧🇷" },
    { id: "en-US", label: "English (United States)", flag: "🇺🇸" },
    { id: "es-ES", label: "Español (España)", flag: "🇪🇸" },
  ];

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-fade-in font-sans">
      <div 
        className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-3xl h-[90vh] md:h-[80vh] flex flex-col overflow-hidden shadow-2xl relative"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Ambient Top Glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-1/2 h-20 bg-indigo-505/10 blur-3xl rounded-full pointer-events-none" />

        {/* Modal Header */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/50">
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded bg-indigo-950 text-indigo-400">
              <Settings className="w-5 h-5 animate-spin-slow" />
            </span>
            <div>
              <h2 className="text-sm font-black text-slate-100 font-mono tracking-wider uppercase">Painel de Ajustes Globais</h2>
              <p className="text-[9px] text-indigo-400 font-mono">SIMULAÇÃO DE CENÁRIOS & CONFIGURAÇÕES GERAIS SELIX</p>
            </div>
          </div>
          <button 
            type="button" 
            onClick={onClose}
            className="p-1.5 rounded-lg bg-slate-950 hover:bg-slate-850 border border-slate-800 text-slate-400 hover:text-slate-100 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Navigation Tabs (Compact & Responsive) */}
        <div className="bg-slate-950 px-3 py-2 border-b border-slate-850 flex gap-1 overflow-x-auto scrollbar-none select-none text-2xs font-mono">
          {[
            { id: "market", label: "Mercado & Juros", icon: Sliders },
            { id: "personas", label: "Perfis (Persona)", icon: Users },
            { id: "traffic", label: "Tráfego & Fila SQL", icon: Database },
            { id: "appearance", label: "Design & Idioma", icon: ImageIcon },
            { id: "geopolitical", label: "Caso Geopolítico", icon: Flame },
          ].map((t) => {
            const Icon = t.icon;
            const active = activeTab === t.id;
            return (
              <button
                key={t.id}
                onClick={() => setActiveTab(t.id as any)}
                className={`px-3 py-1.5 rounded-lg border flex items-center gap-1.5 transition-all cursor-pointer whitespace-nowrap ${
                  active 
                    ? "bg-indigo-600 border-indigo-400 text-slate-100 font-black shadow-md shadow-indigo-600/15 scale-[1.01]" 
                    : "bg-slate-900/40 border-slate-850 text-slate-450 hover:text-slate-200 hover:bg-slate-900"
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{t.label}</span>
              </button>
            );
          })}
        </div>

        {/* Modal Body (Scrollable Container) */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5 custom-scrollbar text-slate-300">
          
          {/* TAB 1: MARKET & COMMODITIES SLIDERS */}
          {activeTab === "market" && (
            <div className="space-y-4 animate-fade-in">
              <div className="bg-slate-950/40 p-3 rounded-xl border border-slate-850 text-3xs space-y-1">
                <span className="text-amber-500 font-mono font-bold block">MODELAGEM DÍRAPIDA EM TEMPO REAL:</span>
                <p className="font-sans leading-relaxed text-slate-400">
                  Os valores simulados abaixo penetram diretamente nos algoritmos de cálculo de Taylor e no provador de teoremas Lean 4. Ajuste os sliders para observar as flutuações das métricas de rentismo e desvio macroeconômico.
                </p>
              </div>

              {/* Brent Slider */}
              <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-850 space-y-2">
                <div className="flex items-center justify-between text-2xs font-mono">
                  <span className="text-slate-400 font-bold uppercase tracking-wider flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-500" />
                    Petróleo Brent Crude (USD)
                  </span>
                  <span className="text-emerald-400 font-bold text-xs bg-emerald-950/40 px-2 py-0.5 rounded border border-emerald-900/40">
                    ${brent.toFixed(2)}
                  </span>
                </div>
                <input
                  type="range"
                  min="70"
                  max="110"
                  step="0.1"
                  value={brent}
                  onChange={(e) => onUpdateBrent(parseFloat(e.target.value))}
                  className="w-full accent-emerald-400 cursor-pointer"
                />
                <div className="flex justify-between text-[8px] text-slate-600 font-mono">
                  <span>$70.00 Mínimo Histórico</span>
                  <span>$90.00 Neutro</span>
                  <span>$110.00 Escassez/Crise</span>
                </div>
              </div>

              {/* TTF Slider */}
              <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-855 space-y-2">
                <div className="flex items-center justify-between text-2xs font-mono">
                  <span className="text-slate-400 font-bold uppercase tracking-wider flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-cyan-400" />
                    Gás Natural TTF Europeu (EUR/MWh)
                  </span>
                  <span className="text-cyan-400 font-bold text-xs bg-cyan-950/40 px-2 py-0.5 rounded border border-cyan-900/40">
                    €{ttf.toFixed(2)}
                  </span>
                </div>
                <input
                  type="range"
                  min="30"
                  max="70"
                  step="0.1"
                  value={ttf}
                  onChange={(e) => onUpdateTtf(parseFloat(e.target.value))}
                  className="w-full accent-cyan-400 cursor-pointer"
                />
                <div className="flex justify-between text-[8px] text-slate-600 font-mono">
                  <span>€30.00 Base Verde</span>
                  <span>€48.00 Estável</span>
                  <span>€70.00 Inverno/Crise Energética</span>
                </div>
              </div>

              {/* SELIC Slider */}
              <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-855 space-y-2">
                <div className="flex items-center justify-between text-2xs font-mono">
                  <span className="text-slate-400 font-bold uppercase tracking-wider flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-sky-400 animate-pulse" />
                    Taxa Básica Metálica SELIC (% a.a.)
                  </span>
                  <span className="text-sky-400 font-black text-xs bg-sky-955/40 px-2 py-0.5 rounded border border-sky-900/40">
                    {selic.toFixed(2)}%
                  </span>
                </div>
                <input
                  type="range"
                  min="7"
                  max="18"
                  step="0.25"
                  value={selic}
                  onChange={(e) => onUpdateSelic(parseFloat(e.target.value))}
                  className="w-full accent-sky-400 cursor-pointer"
                />
                <div className="flex justify-between text-[8px] text-slate-600 font-mono">
                  <span>7.00% Alvo Teórico MME</span>
                  <span>10.00% Zona de Equilíbrio</span>
                  <span>18.50% Estrangulamento Rentista</span>
                </div>
              </div>

              {/* Sentiment Slider */}
              <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-855 space-y-2">
                <div className="flex items-center justify-between text-2xs font-mono">
                  <span className="text-slate-400 font-bold uppercase tracking-wider flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-amber-500" />
                    Macroeconomic Sentiment Tracker
                  </span>
                  <span className="text-amber-400 font-bold text-xs bg-amber-950/40 px-2 py-0.5 rounded border border-amber-900/40">
                    {sentiment}/100
                  </span>
                </div>
                <input
                  type="range"
                  min="10"
                  max="100"
                  step="1"
                  value={sentiment}
                  onChange={(e) => onUpdateSentiment(parseInt(e.target.value))}
                  className="w-full accent-amber-500 cursor-pointer"
                />
                <div className="flex justify-between text-[8px] text-slate-600 font-mono">
                  <span>10 Panic / Crash</span>
                  <span>50 Neutro</span>
                  <span>100 Otimismo Superior</span>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: PORTADO PERSONAS SELECTION */}
          {activeTab === "personas" && (
            <div className="space-y-4 animate-fade-in">
              <div className="bg-slate-950/40 p-3 rounded-xl border border-slate-850 text-3xs space-y-1">
                <span className="text-indigo-400 font-mono font-bold block">PÚBLICO-ALVO INTEGRADO:</span>
                <p className="font-sans text-slate-400 leading-relaxed">
                  Selecione um dos perfis cognitivos federados abaixo. A ativação de um perfil atualiza as fórmulas de amostragem de dados e as heurísticas das respostas do conselheiro RAG.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {SELIX_PERSONAS.map((p) => {
                  const isSelected = activePersona === p.id;
                  return (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => onChangePersona(p.id)}
                      className={`p-3.5 rounded-xl border text-left transition-all hover:scale-[1.01] cursor-pointer flex items-center justify-between ${
                        isSelected
                          ? "bg-indigo-950/40 border-indigo-505 text-indigo-300 shadow-[0_0_12px_rgba(99,102,241,0.15)]"
                          : "bg-slate-950/60 border-slate-850 hover:bg-slate-850 text-slate-400"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-2xl select-none shrink-0">{p.emoji}</span>
                        <div>
                          <span className="font-extrabold text-2xs block text-slate-100">{p.name}</span>
                          <span className="text-[8px] text-slate-500 font-mono tracking-wide mt-0.5 block">{p.role}</span>
                        </div>
                      </div>
                      <div className="shrink-0 pl-2">
                        {isSelected ? (
                          <span className="p-1 rounded-full bg-indigo-500 text-slate-950 block">
                            <Check className="w-3 h-3 stroke-[3]" />
                          </span>
                        ) : (
                          <div className="w-4 h-4 rounded-full border border-slate-700" />
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 3: TRAFFIC & waitlist SQLLITE DIRECT REGISTRY */}
          {activeTab === "traffic" && (
            <div className="space-y-6 animate-fade-in">
              {/* Traffic Limits Slider */}
              <div className="bg-slate-950 p-4 rounded-xl border border-slate-850 space-y-3">
                <div className="flex items-center justify-between border-b border-slate-900 pb-2">
                  <span className="text-xs font-bold font-mono text-indigo-400 flex items-center gap-1.5 uppercase">
                    <Smartphone className="w-4 h-4 animate-pulse" />
                    Tráfego Simultâneo (Nó Termux)
                  </span>
                  <span className={`font-mono text-2xs font-extrabold ${simultaneousUsers >= 18 ? "text-amber-400" : "text-emerald-400"}`}>
                    {simultaneousUsers} / {maxAllowedUsers} Ativos
                  </span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="20"
                  value={simultaneousUsers}
                  onChange={(e) => onUpdateUsers(parseInt(e.target.value))}
                  className="w-full accent-indigo-500 cursor-pointer h-1.5 bg-slate-850 rounded-lg appearance-none"
                />
                <div className="flex justify-between text-[8px] text-slate-600 font-mono">
                  <span>0 (Estéril)</span>
                  <span>18 (Filtro Ativado)</span>
                  <span>20 (Carga Extrema)</span>
                </div>

                {simultaneousUsers >= 18 ? (
                  <div className="p-3 bg-amber-950/30 border border-amber-500/20 text-amber-300 rounded-lg flex items-start gap-2.5 text-3xs font-mono">
                    <ShieldAlert className="w-3.5 h-3.5 text-amber-500 shrink-0 mt-0.5 animate-pulse" />
                    <div>
                      <strong className="text-amber-400 block mb-0.5">FILTRO DE FILA ACTIVADO:</strong>
                      Limite seguro de hardware ultrapassado. Novos visitantes devem preencher o formulário abaixo para registrar slot redundante.
                    </div>
                  </div>
                ) : (
                  <div className="p-3 bg-emerald-950/10 border border-emerald-500/20 text-emerald-300 rounded-lg flex items-start gap-2.5 text-3xs font-mono">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                    <div>
                      <strong className="text-emerald-400 block mb-0.5">REDEMPRESA ESTÁVEL:</strong>
                      Equipamento rodando refrigerado a {Math.round(48 + simultaneousUsers * 0.8)}°C. Fila inativa.
                    </div>
                  </div>
                )}
              </div>

              {/* Waitlist SQLite entry Form */}
              <div className="bg-slate-950/40 p-4 rounded-xl border border-slate-850 space-y-3.5">
                <span className="text-xs font-bold font-mono text-indigo-400 flex items-center gap-1.5 uppercase">
                  <UserPlus className="w-4 h-4 text-indigo-450" />
                  Cadastrar Fila (SQLite local)
                </span>
                
                <form onSubmit={onSubmitWaitlist} className="space-y-3 font-mono text-3xs text-slate-200">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="space-y-1">
                      <label className="text-[8px] text-slate-500 block">NÕME DO STAKEHOLDER:</label>
                      <input
                        type="text"
                        required
                        placeholder="José Sobrinho"
                        value={waitlistName}
                        onChange={(e) => setWaitlistName(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-800 text-slate-300 rounded px-2.5 py-1.5 text-3xs outline-none focus:border-indigo-500"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[8px] text-slate-500 block">TELEFONE (SMS/WA):</label>
                      <input
                        type="tel"
                        required
                        placeholder="+55 (11) 99999"
                        value={waitlistPhone}
                        onChange={(e) => setWaitlistPhone(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-800 text-slate-300 rounded px-2.5 py-1.5 text-3xs outline-none focus:border-indigo-500"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[8px] text-slate-500 block">BLUESKY (@):</label>
                      <input
                        type="text"
                        required
                        placeholder="@zeh-sobrinho"
                        value={waitlistHandle}
                        onChange={(e) => setWaitlistHandle(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-800 text-slate-300 rounded px-2.5 py-1.5 text-3xs outline-none focus:border-indigo-500"
                      />
                    </div>
                  </div>

                  {waitlistSuccess && (
                    <div className="text-[10px] text-emerald-400 bg-emerald-950/20 border border-emerald-500/20 rounded px-2.5 py-1 px-3 mt-2 font-mono">
                      ✓ Sucesso: Salvaguardado na tabela SQLite local SQLite_waitlist!
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={isWaitlistSubmitting}
                    className="w-full bg-indigo-900 hover:bg-indigo-850 disabled:opacity-50 text-slate-100 font-bold border border-indigo-700 text-3xs px-4 py-2 rounded transition-colors cursor-pointer flex items-center justify-center gap-1.5 uppercase font-mono tracking-wider"
                  >
                    <UserPlus className="w-3.5 h-3.5" />
                    {isWaitlistSubmitting ? "Cadastrando..." : "Confirmar Pré-Inscrição Ativa"}
                  </button>
                </form>
              </div>

              {/* Stored waitlist rows preview widget */}
              <div className="bg-slate-950 p-4 rounded-xl border border-slate-850/65 space-y-3">
                <div className="flex items-center justify-between border-b border-slate-900 pb-2">
                  <span className="text-2xs font-bold font-mono text-slate-400 flex items-center gap-1.5 uppercase">
                    <List className="w-3.5 h-3.5" />
                    Tabela SQLite_waitlist
                  </span>
                  <span className="text-[8px] bg-slate-900 text-indigo-400 px-1.5 py-0.5 rounded font-mono border border-slate-800 font-bold">
                    {waitlistEntries.length} FILTRADOS
                  </span>
                </div>

                <div className="space-y-1.5 max-h-[140px] overflow-y-auto pr-1">
                  {waitlistEntries.length === 0 ? (
                    <div className="text-center py-6 text-slate-600 font-mono text-3xs">
                      Tabela SQLite inabitada. Cadastre acima para simular gatilho.
                    </div>
                  ) : (
                    waitlistEntries.map((row: any, i: number) => (
                      <div key={row.id || i} className="p-2 bg-slate-900/60 border border-slate-850 rounded text-3xs font-mono flex items-center justify-between">
                        <div>
                          <span className="text-indigo-400 font-black">ID #{row.id || i+1}</span>
                          <span className="text-slate-300 ml-2 font-sans">{row.name}</span>
                          <span className="text-slate-550 ml-2">({row.phone})</span>
                        </div>
                        <span className="text-indigo-450/85">{row.handle}</span>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: APPEARANCE & LOCALES SELECTOR */}
          {activeTab === "appearance" && (
            <div className="space-y-5 animate-fade-in">
              {/* Wallpaper picker */}
              <div className="bg-slate-950 p-4 rounded-xl border border-slate-850 space-y-3.5">
                <span className="text-xs font-bold font-mono text-indigo-400 flex items-center gap-1.5 uppercase">
                  <ImageIcon className="w-4 h-4 text-indigo-450" />
                  Tema do Papel de Parede Global
                </span>
                <p className="text-3xs text-slate-500 font-sans leading-relaxed">
                  Modifique a paleta de cores dominante e o gradiente dinâmico de fundo correspondente aos cenários clássicos de volatilidade.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 font-mono text-2xs">
                  {wallpapers.map((wp) => {
                    const isSelected = activeWallpaper === wp.id;
                    return (
                      <button
                        key={wp.id}
                        type="button"
                        onClick={() => onWallpaperChange(wp.id)}
                        className={`p-3 rounded-lg border text-left transition-all hover:scale-[1.01] cursor-pointer flex items-center justify-between ${
                          isSelected
                            ? "bg-slate-900 border-indigo-500 text-indigo-300 shadow-[0_0_12px_rgba(99,102,241,0.1)]"
                            : "bg-slate-955/40 border-slate-850 hover:bg-slate-850 text-slate-400"
                        }`}
                      >
                        <span className="flex items-center gap-2">
                          <span className="text-base select-none">{wp.emoji}</span>
                          <span className="font-bold">{wp.label}</span>
                        </span>
                        {isSelected && (
                          <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-ping" />
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Locales Selector */}
              <div className="bg-slate-950 p-4 rounded-xl border border-slate-851 space-y-3.5">
                <span className="text-xs font-bold font-mono text-indigo-400 flex items-center gap-1.5 uppercase">
                  <Globe className="w-4 h-4 text-indigo-405" />
                  Seletor Regional (Billing Locale)
                </span>
                <p className="text-3xs text-slate-500 font-sans leading-relaxed">
                  Adapte a moeda fictícia faturada e a indexação de faturamento regional (R$ no Brasil, € na Europa e $ internacional).
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 font-mono text-2xs">
                  {localesList.map((loc) => {
                    const isSelected = activeLocale === loc.id;
                    return (
                      <button
                        key={loc.id}
                        type="button"
                        onClick={() => onLanguageChange(loc.id)}
                        className={`p-3 rounded-lg border text-left transition-all hover:scale-[1.01] cursor-pointer flex items-center justify-between ${
                          isSelected
                            ? "bg-indigo-950/40 border-indigo-505 text-indigo-300"
                            : "bg-slate-955/40 border-slate-850 hover:bg-slate-850 text-slate-400"
                        }`}
                      >
                        <span className="flex items-center gap-1.5">
                          <span className="text-sm select-none">{loc.flag}</span>
                          <span className="font-bold truncate">{loc.label}</span>
                        </span>
                        {isSelected && (
                          <span className="w-1.5 h-1.5 rounded-full bg-indigo-455 animate-pulse" />
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* TAB 5: SPECIAL GEOPOLITICAL SCENARIO TRIGGER */}
          {activeTab === "geopolitical" && (
            <div className="space-y-4 animate-fade-in text-center p-3">
              <div className="max-w-md mx-auto space-y-4">
                <div className="w-16 h-16 rounded-full bg-red-950/80 text-red-400 border border-red-500/30 flex items-center justify-center mx-auto shadow-lg shadow-red-500/10">
                  <Flame className="w-8 h-8 animate-pulse" />
                </div>
                
                <h3 className="text-sm font-extrabold text-slate-100 font-mono text-center uppercase"> GATILHO GEOPOLÍTICO ADVERSO</h3>
                
                <p className="text-3xs text-slate-400 font-sans text-center leading-relaxed">
                  Dispare o algoritmo de simulação do <strong>Energy Crash pós Trump-Netanyahu</strong>. Esse cenário simula a elevação radical dos preços do refino e petróleo Brent, ativando instantaneamente a imunização de blends Ex/Bx e permitindo cortes contundentes de juros para patamares saudáveis de 1 dígito com rating Soberano rebaixado para <strong>Investment Grade (Grau de Investimento Soberano A+)</strong>.
                </p>

                <button
                  type="button"
                  onClick={() => {
                    onTriggerSpecialScenario();
                    onClose();
                  }}
                  className="w-full bg-gradient-to-r from-amber-500 to-rose-600 hover:from-amber-400 hover:to-rose-500 text-slate-950 font-black text-2xs px-5 py-3.5 rounded-xl transition-all hover:scale-[1.03] shadow-lg shadow-amber-500/15 cursor-pointer uppercase flex items-center justify-center gap-1.5 font-mono select-none"
                >
                  <Play className="w-4 h-4 fill-slate-950 stroke-none" />
                  <span>Simular Crash Trump-Netanyahu</span>
                </button>
                
                <p className="text-[8px] text-slate-500 font-mono uppercase">
                  *Atenção: A ação executará leituras narradas por voz artificial de forma imediata.
                </p>
              </div>
            </div>
          )}

        </div>

        {/* Modal Footer */}
        <div className="p-3.5 bg-slate-950 border-t border-slate-850 text-center font-mono text-[9px] text-slate-500">
          COMPILADOR NEURAL SELIX v5.1 — TRAMPOFORTE ENGINE ACTIVE
        </div>
      </div>
    </div>
  );
}
