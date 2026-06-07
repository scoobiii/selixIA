/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import { Sliders, Save, Palette, RefreshCw, CheckCircle, SlidersHorizontal, BookOpen, AlertCircle, Sparkles, CreditCard, Heart } from "lucide-react";

interface PremiumControlPanelProps {
  currentUser: any;
  onUpdateCustomizations: (newCusts: any) => Promise<void>;
}

export default function PremiumControlPanel({ currentUser, onUpdateCustomizations }: PremiumControlPanelProps) {
  const custs = currentUser.customizations || {};

  const [projectedSelic, setProjectedSelic] = useState(custs.customSelicTarget || 9.00);
  const [themeAccent, setThemeAccent] = useState(custs.themeAccent || "indigo");
  const [notes, setNotes] = useState(custs.notes || "");
  const [watchdogSensitivity, setWatchdogSensitivity] = useState(custs.watchdogSensitivity || 85);
  const [subscribed, setSubscribed] = useState(custs.subscribed !== false);
  
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Sync state with incoming user object changes
  useEffect(() => {
    const freshCusts = currentUser.customizations || {};
    setProjectedSelic(freshCusts.customSelicTarget || 9.00);
    setThemeAccent(freshCusts.themeAccent || "indigo");
    setNotes(freshCusts.notes || "");
    setWatchdogSensitivity(freshCusts.watchdogSensitivity || 85);
    setSubscribed(freshCusts.subscribed !== false);
  }, [currentUser]);

  const handleSave = async () => {
    setIsSaving(true);
    setSaveSuccess(false);
    try {
      await onUpdateCustomizations({
        customSelicTarget: parseFloat(projectedSelic.toString()),
        themeAccent,
        notes,
        watchdogSensitivity: parseInt(watchdogSensitivity.toString()),
        subscribed: subscribed
      });
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err) {
      console.error("Failed to save investments customizations:", err);
    } finally {
      setIsSaving(false);
    }
  };

  const accentsList = [
    { value: "indigo", label: "Midnight Blue", bg: "bg-indigo-650" },
    { value: "violet", label: "Neon Amethyst", bg: "bg-violet-600" },
    { value: "emerald", label: "Green Bio-Seed", bg: "bg-emerald-500" },
    { value: "sky", label: "Aether Skies", bg: "bg-sky-400" },
    { value: "gray", label: "Monochrome Sleek", bg: "bg-slate-600" }
  ];

  return (
    <div className="bg-slate-900 border border-indigo-500/10 rounded-xl p-5 shadow-2xl relative overflow-hidden" id="premium-control-dashboard">
      {/* Laser banner on the left edge */}
      <div className={`absolute top-0 left-0 w-1.5 h-full ${themeAccent === "indigo" ? "bg-indigo-500" : themeAccent === "violet" ? "bg-violet-500" : themeAccent === "emerald" ? "bg-emerald-500" : themeAccent === "sky" ? "bg-sky-400" : "bg-slate-500"}`} />

      {/* Glow asset */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 blur-3xl pointer-events-none rounded-full" />

      {/* Header section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-800 pb-3 mb-4 gap-2">
        <div className="flex items-center gap-2.5">
          <span className="p-1.5 rounded bg-indigo-950 text-indigo-400">
            <Sliders className="w-5 h-5 text-indigo-400 animate-pulse" />
          </span>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-semibold text-slate-100 font-sans text-sm">Painel do Investidor: Configurações Premium</h3>
              <span className="text-[8px] bg-indigo-950 text-indigo-400 border border-indigo-500/20 px-2 py-0.5 rounded-full font-mono font-bold uppercase tracking-wider">
                Membro Sincronizado
              </span>
            </div>
            <p className="text-3xs text-slate-550 font-mono">DASHBOARD CUSTOMIZADA PARALELA | PREFERÊNCIAS DO PROFILE</p>
          </div>
        </div>

        <button
          onClick={handleSave}
          disabled={isSaving}
          className="bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-800 text-slate-100 p-1.5 px-3.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer leading-none"
        >
          {isSaving ? (
            <RefreshCw className="w-3.5 h-3.5 animate-spin" />
          ) : saveSuccess ? (
            <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
          ) : (
            <Save className="w-3.5 h-3.5" />
          )}
          {isSaving ? "GRAVANDO..." : saveSuccess ? "PREFERÊNCIAS SALVAS!" : "SALVAR CUSTS"}
        </button>
      </div>

      <p className="text-slate-400 text-xs mb-4 leading-relaxed">
        Bem-vindo, <strong>{currentUser.name}</strong>! As preferências editadas abaixo serão persistidas de forma exclusiva para o e-mail {currentUser.email} no banco de dados. Elas alteram os parâmetros do simulador do RJ, o watchdog e o estilo visual global.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5 font-mono text-2xs text-left">
        {/* Column 1: Sliders customization section */}
        <div className="space-y-4 bg-slate-950/40 p-3.5 rounded-lg border border-slate-850 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-1.5 text-slate-350 border-b border-slate-900 pb-1.5 mb-2">
              <SlidersHorizontal className="w-3.5 h-3.5 text-indigo-400" />
              <span className="font-bold">METAS DE TAXAS</span>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-slate-500 uppercase">SELIC ALVO PADRÃO:</span>
                <span className="text-indigo-400 font-bold">{projectedSelic}% A.A.</span>
              </div>
              <input
                type="range"
                min="5.00"
                max="9.75"
                step="0.25"
                value={projectedSelic}
                onChange={(e) => setProjectedSelic(parseFloat(e.target.value))}
                className="w-full h-1 bg-slate-800 rounded appearance-none cursor-pointer accent-indigo-500"
              />
              <span className="text-slate-500 text-[8px] leading-relaxed block">
                *Atualiza o default do simulador de empresas do Rio.
              </span>
            </div>
          </div>

          <div className="space-y-2 pt-2 border-t border-slate-900">
            <div className="flex justify-between">
              <span className="text-slate-500 uppercase">ALERTA WATCHDOG CPU:</span>
              <span className="text-indigo-400 font-bold">{watchdogSensitivity}°C</span>
            </div>
            <input
              type="range"
              min="40"
              max="95"
              step="5"
              value={watchdogSensitivity}
              onChange={(e) => setWatchdogSensitivity(parseInt(e.target.value))}
              className="w-full h-1 bg-slate-800 rounded appearance-none cursor-pointer accent-indigo-500"
            />
          </div>
        </div>

        {/* Column 2: Notebook de cenarios section */}
        <div className="space-y-4 bg-slate-950/40 p-3.5 rounded-lg border border-slate-850 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-1.5 text-slate-350 border-b border-slate-900 pb-1.5 mb-2">
              <BookOpen className="w-3.5 h-3.5 text-indigo-400" />
              <span className="font-bold">NOTEBOOK DE CENÁRIOS</span>
            </div>
            <p className="text-slate-500 text-[8px] leading-relaxed mb-2 uppercase">
              ANOTAÇÕES PERSISTIDAS NO BANCO DE DADOS LOCAL
            </p>
            <textarea
              rows={4}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Ex: Simular alavancagem tática para ELET3 sabendo que o WACC cai expressivamente com juros de 1 dígito..."
              className="w-full bg-slate-950 border border-slate-850 rounded p-2 text-slate-200 placeholder-slate-700 font-mono text-[9px] focus:outline-none focus:border-indigo-500/50 resize-none h-[110px]"
            />
          </div>
        </div>

        {/* Column 3: SaaS Monetization & Value Split */}
        <div className="space-y-4 bg-slate-950/40 p-3.5 rounded-lg border border-slate-850 flex flex-col justify-between" id="saas-monetization-widget">
          <div>
            <div className="flex items-center gap-1.5 text-slate-350 border-b border-slate-900 pb-1.5 mb-2">
              <CreditCard className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
              <span className="font-bold uppercase">Assinatura Selix Premium</span>
            </div>

            <div className="space-y-1 bg-slate-950 p-2 rounded border border-slate-850 text-[9px] leading-relaxed">
              <div className="flex justify-between items-center text-slate-400 mb-1">
                <span>PLANO MENSAL:</span>
                <span className="text-amber-400 font-bold">R$ 24,90/mês</span>
              </div>
              <div className="h-px bg-slate-850 my-1" />
              <div className="flex items-start gap-1 text-slate-400">
                <Heart className="w-3 h-3 text-rose-400 shrink-0 mt-0.5" />
                <div>
                  <strong className="text-slate-100">80% Monitização Autor (R$ 19,92):</strong> Remunera o desenvolvimento do sistema.
                </div>
              </div>
              <div className="flex items-start gap-1 text-slate-400 mt-1">
                <Sparkles className="w-3 h-3 text-indigo-400 shrink-0 mt-0.5" />
                <div>
                  <strong className="text-slate-100">20% Infra Google (R$ 4,98):</strong> Custeia o hosting estável no Google Cloud (GCloud).
                </div>
              </div>
            </div>
          </div>

          <div className="pt-2 border-t border-slate-900 flex flex-col gap-1.5">
            <div className="flex justify-between items-center text-[10px]">
              <span className="text-slate-500 text-[8px] uppercase">STATUS ASSINATURA:</span>
              <span className={`font-bold px-1.5 py-0.5 rounded text-[8px] uppercase leading-none ${subscribed ? "bg-emerald-950 border border-emerald-800 text-emerald-400" : "bg-slate-950 border border-slate-800 text-slate-500"}`}>
                {subscribed ? "Ativo" : "Cancelado"}
              </span>
            </div>
            <button
              type="button"
              onClick={() => setSubscribed(!subscribed)}
              className={`w-full py-1 rounded text-center text-[8px] font-bold cursor-pointer transition-all ${subscribed ? "bg-slate-800 hover:bg-slate-750 text-slate-300 border border-slate-750" : "bg-amber-600 hover:bg-amber-500 text-slate-950 font-extrabold"}`}
            >
              {subscribed ? "CANCELAR ASSINATURA" : "ASSINAR PLATAFORMA PREMIUM"}
            </button>
          </div>
        </div>

        {/* Column 4: Free Gemini API & Design Theme Customizer */}
        <div className="space-y-4 bg-slate-950/40 p-3.5 rounded-lg border border-slate-850 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-1.5 text-slate-350 border-b border-slate-900 pb-1.5 mb-2">
              <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
              <span className="font-bold">GIFT: 30 DIAS GEMINI FREE</span>
            </div>
            
            <div className="bg-slate-950 p-2 rounded border border-slate-850 space-y-1 text-[9px] leading-relaxed">
              <div className="flex justify-between">
                <span className="text-slate-500">PROVEDOR DA CHAVE:</span>
                <span className="text-emerald-400 font-bold font-mono">GOOGLE CONNECT</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">DIAS RESTANTES:</span>
                <span className="text-indigo-400 font-bold font-mono">30 DIAS</span>
              </div>
              <div className="text-[8px] text-slate-500 leading-normal">
                🔑 Chave Gemini gratuita ativa! Desfrute de geração ilimitada de posts corporativos e assistente RAG.
              </div>
            </div>
          </div>

          {/* Color accents chooser */}
          <div className="border-t border-slate-900 pt-2 flex flex-wrap items-center justify-between gap-1.5">
            <div className="flex items-center gap-1">
              <Palette className="w-3 h-3 text-indigo-400" />
              <span className="text-slate-500 uppercase font-bold text-[8px]">TEMA ACCENT:</span>
            </div>
            <div className="flex gap-1.5">
              {accentsList.map((acc) => (
                <button
                  key={acc.value}
                  type="button"
                  onClick={() => setThemeAccent(acc.value)}
                  className={`w-3.5 h-3.5 rounded-full border cursor-pointer flex items-center justify-center transition-all ${
                    themeAccent === acc.value
                      ? "border-slate-100 ring-2 ring-indigo-505 shrink-0 scale-110"
                      : "border-slate-900 focus:outline-none shrink-0"
                  } ${acc.bg}`}
                  title={acc.label}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
