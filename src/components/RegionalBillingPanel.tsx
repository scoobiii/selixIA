/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import { 
  Globe, Languages, CreditCard, CheckCircle, Flame, ShieldCheck, 
  Layers, AlertTriangle, ChevronRight, RefreshCw, FileText, 
  Building, Wallet, QrCode, Wifi, Clock, Sparkles, Copy, Trash2, Coins, Volume2
} from "lucide-react";
import { 
  LocaleType, TenantConfig, REGIONAL_TENANTS, TRANSLATIONS, 
  DynamicBillingOrchestrator, formatLocaleTimezone, autoDetectUserGeoLocale
} from "../utils/billingAndI18n";
import { speak } from "../utils/speech";

interface RegionalBillingPanelProps {
  onLanguageChange: (locale: LocaleType) => void;
  activeLocale: LocaleType;
  onAddLog: (message: string, level: "INFO" | "SUCCESS" | "WARNING" | "DANGER", category: "AI" | "MARKET" | "SYSTEM" | "WATCHDOG") => void;
  currentUser?: any;
  onUpgradeSuccess?: () => Promise<void>;
}

export default function RegionalBillingPanel({
  onLanguageChange,
  activeLocale,
  onAddLog,
  currentUser,
  onUpgradeSuccess
}: RegionalBillingPanelProps) {
  // Simulator configuration states
  const [langMode, setLangMode] = useState<"auto" | "manual">("auto");
  const [simulatedIp, setSimulatedIp] = useState<string>("BR");
  const [simulatedAcceptLang, setSimulatedAcceptLang] = useState<string>("pt-BR,pt;q=0.9");
  
  // Billing States
  const [billingPlanAmount] = useState<number>(149.00);
  const [selectedProvider, setSelectedProvider] = useState<string>("pix");
  const [checkoutResult, setCheckoutResult] = useState<any | null>(null);
  const [paymentStatus, setPaymentStatus] = useState<"none" | "pending" | "success" | "failed">("none");
  const [copyFeedback, setCopyFeedback] = useState<boolean>(false);
  
  // Dynamic scaling model based on 5% profit allocation
  const [totalRevenue, setTotalRevenue] = useState<number>(() => {
    const saved = localStorage.getItem("selix_simulated_revenue");
    return saved ? Number(saved) : 8940.00; // default starting simulated revenue
  });
  const [activeGooglePayTab, setActiveGooglePayTab] = useState<"pay" | "code">("pay");

  const handleSpeakBillingIntro = () => {
    speak(
      `Painel de Faturamento Regional Selix sob receita acumulada de ${totalRevenue.toFixed(2)} reais. Selecione um locatário de faturamento e configure seu meio de pagamento, incluindo PIX instantâneo nacional brasileiro, cartões Stripe ou Carteira Google, Google Pay para faturamento sob demanda. Veja abaixo em tempo real o cálculo matemático de alocação de cinco por cento da receita para expansão automatizada de memória RAM e expansão de capacidade hardware!`,
      true
    );
  };

  // Keep simulated revenue persisted in client storage
  useEffect(() => {
    localStorage.setItem("selix_simulated_revenue", String(totalRevenue));
  }, [totalRevenue]);
  
  // Credit card mockup inputs
  const [cardNumber, setCardNumber] = useState<string>("4000 1234 5678 9010");
  const [cardExpiry, setCardExpiry] = useState<string>("12/32");
  const [cardCvc, setCardCvc] = useState<string>("123");

  // Multi-tenant configuration
  const currentTenant: TenantConfig = REGIONAL_TENANTS[activeLocale];
  const t = TRANSLATIONS[activeLocale];

  // Instantiating billing orchestrator
  const orchestrator = new DynamicBillingOrchestrator();

  // Watch simulated variables to fire automatic translation updates if on auto detect
  useEffect(() => {
    if (langMode === "auto") {
      const detectedLocale = autoDetectUserGeoLocale(simulatedAcceptLang, simulatedIp);
      if (detectedLocale !== activeLocale) {
        onLanguageChange(detectedLocale);
        onAddLog(
          `i18n Autodetect: Mudando interface para ${detectedLocale.toUpperCase()} com base em GeoIP [${simulatedIp}] e Accept-Language [${simulatedAcceptLang.split(",")[0]}]`,
          "INFO",
          "SYSTEM"
        );
      }
    }
  }, [simulatedIp, simulatedAcceptLang, langMode, activeLocale]);

  // Handle manual selection
  const handleManualLocaleChange = (locale: LocaleType) => {
    setLangMode("manual");
    onLanguageChange(locale);
    onAddLog(
      `Alinhamento Manual: Idioma bloqueado em ${locale.toUpperCase()}. Interrompendo sensores GeoIP provisoriamente para persistência de sessão.`,
      "WARNING",
      "SYSTEM"
    );
  };

  // Launch simulated checkouts
  const handleInitiateCheckout = async (provider: string) => {
    setSelectedProvider(provider);
    setPaymentStatus("pending");
    
    const email = currentUser?.email || "sobrinhoSJ@gmail.com";
    const request = {
      amount: billingPlanAmount,
      currency: currentTenant.currency,
      customerEmail: email,
      metadata: {
        tenantId: currentTenant.id,
        regionalApiKey: currentTenant.regionalApiKey,
        taxAppliedPercent: currentTenant.taxRatePercent
      }
    };

    const result = await orchestrator.initiateCheckout(provider, request);
    setCheckoutResult(result);
    
    onAddLog(
      `Pagamento Iniciado: Canal ${result.providerName} disparou ID de faturamento ${result.transactionId} de ${currentTenant.currencySymbol} ${billingPlanAmount.toFixed(2)}`,
      "INFO",
      "SYSTEM"
    );

    // If real Stripe checkout session is generated, redirect
    if (result.isRealStripe && result.stripeSessionUrl) {
      onAddLog(
        `Redirecionando usuário para o gateway seguro checkout de Stripe em 1s...`,
        "INFO",
        "SYSTEM"
      );
      setTimeout(() => {
        window.location.href = result.stripeSessionUrl!;
      }, 1200);
    }
  };

  // Confirm payment completion
  const handleTriggerPaymentSuccess = async () => {
    const email = currentUser?.email || "sobrinhoSJ@gmail.com";
    const txId = checkoutResult?.transactionId || "GEN-39210";
    
    onAddLog(
      `Liquidando transação ${txId} e registrando licença Premium no servidor...`,
      "INFO",
      "SYSTEM"
    );

    const res = await orchestrator.confirmCheckout(txId, email);
    if (res.success) {
      setPaymentStatus("success");
      setTotalRevenue(prev => prev + billingPlanAmount);
      onAddLog(
        `Sucesso Fiscal: Transação ${txId} liquidada no Gateway ${checkoutResult?.providerName || "Selix Gateway"}. Plano PREMIUM PRO liberado com sucesso para ${email}!`,
        "SUCCESS",
        "SYSTEM"
      );
      if (onUpgradeSuccess) {
        await onUpgradeSuccess();
      }
    } else {
      setPaymentStatus("failed");
      onAddLog(
        `Erro de Faturamento: Falha ao validar liquidação fiscal no backend para a transação ${txId}.`,
        "DANGER",
        "SYSTEM"
      );
    }
  };

  const handleResetCheckout = () => {
    setCheckoutResult(null);
    setPaymentStatus("none");
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopyFeedback(true);
    setTimeout(() => setCopyFeedback(false), 2000);
  };

  return (
    <div className="bg-slate-900/40 border border-slate-900 rounded-xl p-5 space-y-6 backdrop-blur shadow-xl relative" id="regional-billing-layer">
      <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 blur-3xl rounded-full pointer-events-none" />
      
      {/* Panel header */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 border-b border-slate-850 pb-3">
        <div className="flex items-center gap-2">
          <span className="p-1.5 rounded bg-indigo-950 text-indigo-400">
            <Globe className="w-4 h-4 animate-spin-slow" />
          </span>
          <div>
            <div className="flex items-center gap-1.5">
              <h2 className="text-xs font-bold font-mono text-slate-100 uppercase tracking-wider block">
                {t["panelTitle"]}
              </h2>
              <button
                type="button"
                onClick={handleSpeakBillingIntro}
                className="p-1 rounded hover:bg-slate-800 text-indigo-400 hover:text-indigo-300 transition-all cursor-pointer"
                title="Ouvir explicação do faturamento regional por voz"
              >
                <Volume2 className="w-3 h-3" />
              </button>
            </div>
            <div className="text-4xs text-slate-500 font-mono">
              {t["panelSub"]}
            </div>
          </div>
        </div>
        <div className="text-3xs font-mono bg-emerald-950/40 text-emerald-450 border border-emerald-900/30 rounded px-2.5 py-1 flex items-center gap-1.5 shrink-0 select-none">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          {t["statusOnline"]}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* LEFT COLUMN: Sensing, Auto-detect and simulation overrides */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-slate-950/50 border border-slate-855 rounded-lg p-4 space-y-4">
            <div className="flex items-center gap-1.5 border-b border-slate-900 pb-2">
              <Languages className="w-3.5 h-3.5 text-indigo-400" />
              <h3 className="font-bold text-slate-200 text-3xs uppercase tracking-wider font-mono">
                {t["sectionDetectionTitle"]}
              </h3>
            </div>

            {/* Simulated Accept Language selection */}
            <div className="space-y-1.5">
              <label className="text-slate-400 text-4xs uppercase font-mono block">
                {t["browserLang"]}
              </label>
              <select
                value={simulatedAcceptLang}
                onChange={(e) => setSimulatedAcceptLang(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 rounded px-2 py-1 text-[10px] font-mono text-slate-350 focus:outline-none focus:border-indigo-500"
              >
                <option value="pt-BR,pt;q=0.9,en-US;q=0.8">Português do Brasil (pt-BR)</option>
                <option value="en-US,en;q=0.9">English (US) (en-US)</option>
                <option value="es-ES,es;q=0.9">Español de España (es-ES)</option>
              </select>
            </div>

            {/* Simulated IP Location selection */}
            <div className="space-y-1.5">
              <label className="text-slate-400 text-4xs uppercase font-mono block">
                {t["simulatedIp"]}
              </label>
              <div className="grid grid-cols-3 gap-1.5">
                {[
                  { code: "BR", name: "Brasil (São Paulo)" },
                  { code: "US", name: "EUA (Virginia)" },
                  { code: "ES", name: "Espanha (Madrid)" }
                ].map((country) => (
                  <button
                    key={country.code}
                    onClick={() => setSimulatedIp(country.code)}
                    className={`py-1 rounded font-mono text-[9px] border text-center transition-all cursor-pointer ${
                      simulatedIp === country.code
                        ? "bg-indigo-950/50 border-indigo-500 text-indigo-400 font-bold"
                        : "bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-300"
                    }`}
                  >
                    🇧🇷🇺🇸🇪🇸 {country.code}
                  </button>
                ))}
              </div>
            </div>

            {/* Hierarchical Priority Protocol visualization screen */}
            <div className="bg-slate-900/60 p-2.5 rounded border border-slate-855 text-[8px] font-mono space-y-2">
              <span className="text-indigo-400 font-bold uppercase tracking-wider block">
                {t["currentPriority"]}
              </span>
              <div className="space-y-1 text-slate-505">
                <div className={`flex items-center justify-between ${langMode === "manual" ? "text-amber-400 font-bold bg-amber-970/10 px-1 rounded" : ""}`}>
                  <span>{t["priority1"]}</span>
                  {langMode === "manual" ? (
                    <span className="text-[7px] text-amber-500 font-extrabold border border-amber-900/30 px-1 rounded uppercase animate-pulse">Ativo</span>
                  ) : <span className="text-slate-600">Off</span>}
                </div>
                <div className={`flex items-center justify-between ${langMode === "auto" && simulatedAcceptLang ? "text-indigo-400 font-bold" : ""}`}>
                  <span>{t["priority2"]}</span>
                  {langMode === "auto" ? <span className="text-[7px] text-indigo-500 uppercase font-black">Escaneando</span> : null}
                </div>
                <div className="flex items-center justify-between">
                  <span>{t["priority3"]}</span>
                  <span className="text-slate-600">GeoIP {simulatedIp}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>{t["priority4"]}</span>
                  <span className="text-slate-600">pt-BR</span>
                </div>
              </div>
            </div>
          </div>

          {/* Configuration overrides widget box */}
          <div className="bg-slate-950/50 border border-slate-855 rounded-lg p-4 space-y-3">
            <div className="flex items-center gap-1.5 border-b border-slate-900 pb-2">
              <Languages className="w-3.5 h-3.5 text-amber-500" />
              <h3 className="font-bold text-slate-200 text-3xs uppercase tracking-wider font-mono">
                {t["overrideSection"]}
              </h3>
            </div>

            <div className="grid grid-cols-2 gap-2 text-3xs font-mono text-slate-400">
              <button
                onClick={() => handleManualLocaleChange("pt-BR")}
                className={`p-2 rounded border transition-all text-left cursor-pointer flex items-center justify-between ${
                  activeLocale === "pt-BR" && langMode === "manual"
                    ? "bg-slate-900 border-indigo-500 text-indigo-300 font-bold"
                    : "bg-slate-900/40 border-slate-850 hover:bg-slate-850 text-slate-500"
                }`}
              >
                <span>🇧🇷 Português BR</span>
                <ChevronRight className="w-3 h-3 text-slate-600" />
              </button>
              <button
                onClick={() => handleManualLocaleChange("en-US")}
                className={`p-2 rounded border transition-all text-left cursor-pointer flex items-center justify-between ${
                  activeLocale === "en-US" && langMode === "manual"
                    ? "bg-slate-900 border-indigo-500 text-indigo-300 font-bold"
                    : "bg-slate-900/40 border-slate-850 hover:bg-slate-850 text-slate-500"
                }`}
              >
                <span>🇺🇸 English US</span>
                <ChevronRight className="w-3 h-3 text-slate-600" />
              </button>
              <button
                onClick={() => handleManualLocaleChange("es-ES")}
                className={`p-2 rounded border transition-all text-left cursor-pointer flex items-center justify-between ${
                  activeLocale === "es-ES" && langMode === "manual"
                    ? "bg-slate-900 border-indigo-500 text-indigo-300 font-bold"
                    : "bg-slate-900/40 border-slate-850 hover:bg-slate-850 text-slate-500"
                }`}
              >
                <span>🇪🇸 Español ES</span>
                <ChevronRight className="w-3 h-3 text-slate-600" />
              </button>

              <button
                onClick={() => setLangMode("auto")}
                className={`p-2 rounded border transition-all text-left cursor-pointer flex items-center justify-between uppercase font-extrabold ${
                  langMode === "auto"
                    ? "bg-indigo-950/40 border-emerald-500/40 text-emerald-450"
                    : "bg-slate-900/40 border-slate-850 hover:bg-slate-800 text-slate-500"
                }`}
              >
                <span>🔄 {t["autoDetectLabel"]}</span>
                <Wifi className="w-3 h-3 text-emerald-500 animate-pulse" />
              </button>
            </div>

            <div className="bg-slate-900/40 p-2.5 rounded border border-slate-850 text-[10px] space-y-1 font-mono text-slate-400">
              <div className="flex justify-between">
                <span>{t["activeLanguage"]}</span>
                <strong className="text-slate-200">{activeLocale.toUpperCase()}</strong>
              </div>
              <div className="flex justify-between">
                <span>{t["activeCurrency"]}</span>
                <strong className="text-emerald-400">{currentTenant.currency} ({currentTenant.currencySymbol})</strong>
              </div>
              <div className="flex justify-between">
                <span>{t["timezoneLabel"]}</span>
                <strong className="text-slate-305 text-[9px]">{formatLocaleTimezone(activeLocale)}</strong>
              </div>
            </div>

            <p className="text-[8px] text-slate-500 italic mt-1 font-sans">
              ℹ️ {t["manualLockNote"]}
            </p>
          </div>
        </div>

        {/* RIGHT COLUMN: Multi-Tenant Architecture Visualization & Dynamic regional checkout */}
        <div className="lg:col-span-7 space-y-4">
          <div className="bg-slate-950/50 border border-slate-855 rounded-lg p-4 space-y-4 font-mono text-3xs">
            
            {/* Header schema of multi-tenant model */}
            <div className="flex items-center justify-between border-b border-rose-955/20 pb-2.5">
              <div className="flex items-center gap-1.5">
                <Layers className="w-4 h-4 text-rose-455" />
                <h3 className="font-extrabold text-rose-405 uppercase tracking-wide">
                  {t["billingSchema"]} (Isolated Workspace)
                </h3>
              </div>
              <span className="text-[8px] bg-rose-950 text-rose-450 border border-rose-900 px-1.5 py-0.5 rounded uppercase font-black">
                Mecanismo Desacoplado Ativo
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
              <div className="space-y-1 bg-slate-900/80 p-2 rounded border border-slate-850">
                <span className="text-slate-500 block uppercase font-bold text-[7px]">{t["activeTenant"]}</span>
                <strong className="text-slate-200 text-2xs block truncate">{currentTenant.id}</strong>
              </div>
              <div className="space-y-1 bg-slate-900/80 p-2 rounded border border-slate-850">
                <span className="text-slate-500 block uppercase font-bold text-[7px]">{t["activeOrg"]}</span>
                <strong className="text-indigo-405 text-2xs block truncate">{currentTenant.orgName}</strong>
              </div>
              <div className="space-y-1 bg-slate-900/80 p-2 rounded border border-slate-850">
                <span className="text-slate-500 block uppercase font-bold text-[7px]">{t["taxGovernance"]}</span>
                <strong className="text-slate-200 text-2xs block truncate text-slate-350">{currentTenant.taxProfileName}</strong>
              </div>
              <div className="space-y-1 bg-slate-900/80 p-2 rounded border border-slate-850">
                <span className="text-slate-500 block uppercase font-bold text-[7px]">{t["apiKeyGenerated"]}</span>
                <strong className="text-rose-400 text-2xs block truncate font-black tracking-widest">{currentTenant.regionalApiKey}</strong>
              </div>
            </div>

            <div className="p-2 bg-slate-900/40 rounded border border-slate-880/85">
              <div className="flex items-center justify-between mb-1.5 text-[8px] text-slate-500">
                <span>{t["regionalEndpoint"]}</span>
                <span className="text-indigo-450 uppercase tracking-widest font-black text-[7px]">Edge SSL</span>
              </div>
              <div className="text-[10px] text-indigo-301 font-mono break-all font-bold">
                {currentTenant.serverUrl}
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2 pt-2 border-t border-slate-900 text-[10px] text-slate-500 font-sans">
              <div className="flex items-center gap-1 font-mono text-3xs">
                <FileText className="w-3.5 h-3.5 text-slate-500" />
                <span>{t["taxApplied"]}</span>
                <strong className="text-slate-300 font-mono">{currentTenant.taxRatePercent.toFixed(2)}%</strong>
              </div>
              <div className="flex items-center gap-1 font-mono text-3xs text-indigo-400">
                <Sparkles className="w-3.5 h-3.5 font-black shrink-0 animate-pulse" />
                <span>{t["workspaceStatus"]} <strong className="uppercase">{currentTenant.regionCode}</strong></span>
              </div>
            </div>
          </div>

          <div className="bg-slate-950/50 border border-slate-855 rounded-lg p-4 space-y-4">
            <div className="flex items-center justify-between border-b border-indigo-950 pb-2">
              <div className="flex items-center gap-1.5">
                <CreditCard className="w-4 h-4 text-indigo-400" />
                <h3 className="font-bold text-slate-200 text-3xs uppercase tracking-wider font-mono">
                  {t["sectionBillingTitle"]}
                </h3>
              </div>
              <span className="text-[9px] text-slate-500 font-mono">PRO PACK UPGRADE</span>
            </div>

            {paymentStatus === "none" ? (
              <div className="space-y-4 animate-fade-in">
                <div className="bg-slate-900/60 p-4 rounded-lg border border-slate-855/65 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                  <div>
                    <h4 className="text-slate-100 font-extrabold text-xs block font-sans">
                      {t["checkoutPro"]}
                    </h4>
                    <p className="text-[10px] text-slate-450 leading-relaxed font-sans mt-0.5">
                      {t["billingSubtitle"]}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="text-slate-500 text-[8px] font-mono block uppercase">{t["amountDue"]}</span>
                    <strong className="text-emerald-450 text-base font-mono font-black">
                      {currentTenant.currencySymbol} {billingPlanAmount.toFixed(2)}
                    </strong>
                    <span className="text-[8px] text-slate-500 block font-mono">/ ANUAL</span>
                  </div>
                </div>

                <div className="space-y-2">
                  <span className="text-slate-500 font-mono text-3xs uppercase block pl-1">
                    {t["selectPayment"]}
                  </span>
                  
                  {/* Real responsive multi gateway adapter list based on allowed providers */}
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                    {currentTenant.allowedProviders.includes("pix") && (
                      <button
                        onClick={() => handleInitiateCheckout("pix")}
                        className="p-2.5 rounded-lg bg-slate-900 border border-slate-800 hover:border-emerald-500/40 text-emerald-400 font-mono text-[9px] flex flex-col items-center justify-center gap-1 h-14 cursor-pointer text-center"
                      >
                        <QrCode className="w-4 h-4 text-emerald-500" />
                        <span>{t["pixButton"]}</span>
                      </button>
                    )}

                    {currentTenant.allowedProviders.includes("stripe") && (
                      <button
                        onClick={() => handleInitiateCheckout("stripe")}
                        className="p-2.5 rounded-lg bg-slate-900 border border-slate-800 hover:border-indigo-500/40 text-indigo-400 font-mono text-[9px] flex flex-col items-center justify-center gap-1 h-14 cursor-pointer text-center"
                      >
                        <CreditCard className="w-4 h-4 text-indigo-400" />
                        <span>{t["stripeButton"]}</span>
                      </button>
                    )}

                    {currentTenant.allowedProviders.includes("crypto") && (
                      <button
                        onClick={() => handleInitiateCheckout("crypto")}
                        className="p-2.5 rounded-lg bg-slate-900 border border-slate-800 hover:border-amber-500/40 text-amber-400 font-mono text-[9px] flex flex-col items-center justify-center gap-1 h-14 cursor-pointer text-center"
                      >
                        <Wallet className="w-4 h-4 text-amber-400" />
                        <span>{t["cryptoButton"]}</span>
                      </button>
                    )}

                    {currentTenant.allowedProviders.includes("google_pay") && (
                      <button
                        onClick={() => handleInitiateCheckout("google_pay")}
                        className="p-2.5 rounded-lg bg-slate-900 border border-slate-800 hover:border-violet-500/40 text-violet-400 font-mono text-[9px] flex flex-col items-center justify-center gap-1 h-14 cursor-pointer text-center"
                      >
                        <Wallet className="w-4 h-4 text-violet-400" />
                        <span>{t["googlePayButton"]}</span>
                      </button>
                    )}

                    {currentTenant.allowedProviders.includes("paypal") && (
                      <button
                        onClick={() => handleInitiateCheckout("paypal")}
                        className="p-2.5 rounded-lg bg-slate-900 border border-slate-800 hover:border-sky-500/40 text-sky-400 font-mono text-[9px] flex flex-col items-center justify-center gap-1 h-14 cursor-pointer text-center"
                      >
                        <Coins className="w-4 h-4 text-sky-400" />
                        <span>{t["paypalButton"]}</span>
                      </button>
                    )}

                    {currentTenant.allowedProviders.includes("mercado_pago") && (
                      <button
                        onClick={() => handleInitiateCheckout("mercado_pago")}
                        className="p-2.5 rounded-lg bg-slate-900 border border-slate-800 hover:border-sky-500/40 text-sky-300 font-mono text-[9px] flex flex-col items-center justify-center gap-1 h-14 cursor-pointer text-center"
                      >
                        <Globe className="w-4 h-4 text-sky-305" />
                        <span>{t["mpButton"]}</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              // ACTIVE CHECKOUT OR PAYMENT COMPLETION DISPLAY
              <div className="bg-slate-900/60 p-4 rounded-lg border border-slate-855 text-mono text-3xs space-y-4 animate-fade-in relative">
                
                {/* Transaction details banner */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 border-b border-slate-850 pb-3">
                  <div>
                    <h4 className="text-slate-200 font-bold uppercase tracking-wider text-[10px]">
                      {checkoutResult?.providerName || "Transação Multi-Inquilino"}
                    </h4>
                    <span className="text-[9px] text-slate-500 font-mono flex items-center gap-1 mt-0.5">
                      {t["transId"]} <strong className="text-slate-350">{checkoutResult?.transactionId}</strong>
                    </span>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="text-[8px] text-slate-450 block font-mono">DUE IN {currentTenant.currency}</span>
                    <strong className="text-emerald-450 text-sm font-bold">
                      {currentTenant.currencySymbol} {billingPlanAmount.toFixed(2)}
                    </strong>
                  </div>
                </div>

                {/* DYNAMIC DISPLAY BASED ON SELECTED PROVIDER */}
                {selectedProvider === "pix" && (
                  <div className="space-y-3 font-mono text-[10px] animate-fade-in">
                    <p className="text-[10px] text-slate-400">{t["pixQrDesc"]}</p>
                    <div className="flex flex-col items-center gap-3 bg-slate-950 p-4 rounded border border-slate-855 max-w-sm mx-auto">
                      {/* Live generated procedural scan block */}
                      <div className="bg-white p-2 rounded shadow-xl select-none">
                        <div className="w-32 h-32 bg-slate-900 rounded flex flex-col items-center justify-center relative">
                          {/* Simulated elegant matrix pixels QR code */}
                          <div className="absolute inset-2 grid grid-cols-5 grid-rows-5 gap-1.5 opacity-80">
                            {Array.from({ length: 25 }).map((_, i) => (
                              <div key={i} className={`rounded-[2px] ${i % 3 === 0 || i % 4 === 1 ? "bg-emerald-400" : "bg-slate-800"}`} />
                            ))}
                          </div>
                          <QrCode className="w-8 h-8 text-white z-10 animate-pulse" />
                        </div>
                      </div>
                      
                      <div className="w-full space-y-1 text-center">
                        <span className="text-slate-500 uppercase font-bold text-[7px] block">PIX COPIA E COLA PROTOCOLO</span>
                        <div className="flex items-center gap-1.5 bg-slate-900 border border-slate-800 rounded p-1.5 text-slate-400 select-none">
                          <span className="truncate block text-[8px] text-left grow font-mono leading-none tracking-tight">
                            {checkoutResult?.visualPayload?.qrCodeBase64}
                          </span>
                          <button
                            onClick={() => copyToClipboard(checkoutResult?.visualPayload?.qrCodeBase64 || "")}
                            className="p-1 rounded bg-slate-950 border border-slate-800 hover:text-white cursor-pointer select-none"
                          >
                            {copyFeedback ? "OK" : <Copy className="w-2.5 h-2.5 text-emerald-400" />}
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {selectedProvider === "stripe" && (
                  <div className="space-y-3 font-sans text-[10px] animate-fade-in text-slate-400">
                    <p>{t["stripeCardDesc"]}</p>
                    <div className="bg-slate-950/85 p-4 rounded-lg border border-slate-855 max-w-md mx-auto space-y-3.5">
                      {/* High-fidelity responsive cards credentials input box */}
                      <div className="space-y-1">
                        <label className="text-slate-500 text-[8.5px] font-mono uppercase block font-bold">Número de Cartão Arbitrado:</label>
                        <input
                          type="text"
                          value={cardNumber}
                          onChange={(e) => setCardNumber(e.target.value)}
                          className="w-full bg-slate-900 border border-slate-800 rounded p-1.5 font-mono text-[11px] text-slate-350 focus:outline-none focus:border-indigo-500"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-3.5">
                        <div className="space-y-1">
                          <label className="text-slate-500 text-[8.5px] font-mono uppercase block font-bold">Expiração:</label>
                          <input
                            type="text"
                            value={cardExpiry}
                            onChange={(e) => setCardExpiry(e.target.value)}
                            className="w-full bg-slate-900 border border-slate-800 rounded p-1.5 font-mono text-[11px] text-slate-350 focus:outline-none"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-slate-500 text-[8.5px] font-mono uppercase block font-bold">CVC / CVV:</label>
                          <input
                            type="text"
                            value={cardCvc}
                            onChange={(e) => setCardCvc(e.target.value)}
                            className="w-full bg-slate-900 border border-slate-800 rounded p-1.5 font-mono text-[11px] text-slate-350 focus:outline-none"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {selectedProvider === "crypto" && (
                  <div className="space-y-3 font-mono text-[10px] animate-fade-in">
                    <p className="text-slate-400">{t["cryptoWalletDesc"]}</p>
                    <div className="bg-slate-950 p-4 rounded border border-slate-855 max-w-sm mx-auto space-y-3 text-center">
                      <Wallet className="w-8 h-8 text-amber-500 mx-auto animate-bounce-slow" />
                      <div className="space-y-1.5">
                        <span className="text-slate-550 text-[7px] uppercase block font-bold">CONTA COFRE DE ARRECADAÇÃO (WEB3 VAULT Address)</span>
                        <div className="flex items-center gap-1.5 bg-slate-900 border border-slate-800 rounded p-1.5 text-slate-400 select-none">
                          <span className="truncate block text-[9.5px] text-slate-300 font-mono text-left grow">
                            {checkoutResult?.visualPayload?.cryptoAddress}
                          </span>
                          <button
                            onClick={() => copyToClipboard(checkoutResult?.visualPayload?.cryptoAddress || "")}
                            className="p-1 rounded bg-slate-950 border border-slate-800 hover:text-white cursor-pointer"
                          >
                            {copyFeedback ? "Copiado!" : <Copy className="w-2.5 h-2.5 text-amber-400" />}
                          </button>
                        </div>
                      </div>
                      <div className="text-[8px] text-slate-505 leading-relaxed font-sans mt-1">
                        🔒 Transação monitorada via hash de rede descentralizada. A segurança é ratificada de forma síncrona.
                      </div>
                    </div>
                  </div>
                )}

                {selectedProvider === "google_pay" && (
                  <div className="space-y-4 font-sans text-xs animate-fade-in text-slate-350">
                    <div className="bg-slate-950 p-3 rounded border border-slate-850 flex items-center justify-between gap-2.5">
                      <div className="flex items-center gap-1.5 font-mono text-3xs">
                        <Wallet className="w-4 h-4 text-violet-400 font-bold animate-pulse" />
                        <span className="uppercase text-slate-200">Google Pay & Google Wallet API</span>
                      </div>
                      <div className="flex gap-1 bg-slate-905 p-0.5 rounded border border-slate-800 font-mono text-[8px]">
                        <button
                          type="button"
                          onClick={() => setActiveGooglePayTab("pay")}
                          className={`px-1.5 py-0.5 rounded transition ${activeGooglePayTab === "pay" ? "bg-violet-950 text-violet-355 font-bold border border-violet-900/40" : "text-slate-500 hover:text-slate-300"}`}
                        >
                          📱 SIMULAÇÃO
                        </button>
                        <button
                          type="button"
                          onClick={() => setActiveGooglePayTab("code")}
                          className={`px-1.5 py-0.5 rounded transition ${activeGooglePayTab === "code" ? "bg-violet-950 text-violet-355 font-bold border border-violet-900/40" : "text-slate-500 hover:text-slate-300"}`}
                        >
                          📋 CODIGO EXEMPLO
                        </button>
                      </div>
                    </div>

                    {activeGooglePayTab === "pay" ? (
                      <div className="space-y-3">
                        <p className="text-3xs text-slate-400 leading-relaxed font-sans">
                          Para receber dos assinantes usando a **Google Wallet (Carteira Google)**, seu frontend invoca o SDK do Google Pay. O usuário aprova com biometria no celular e o Google disponibiliza um token criptográfico seguro que é liquidado em segundos pela sua adquirente credenciada (Stripe, MercadoPago, Adyen ou outra).
                        </p>
                        
                        <div className="bg-slate-950 p-4 rounded-lg border border-slate-855 max-w-sm mx-auto text-center space-y-3.5">
                          <span className="text-[7px] font-mono text-slate-550 block uppercase tracking-widest">GOOGLE PAY SECURE COMPLIANCE ENVIRONMENT</span>
                          
                          {/* Standard high-fidelity mock Google Pay Button inside simulated app */}
                          <button
                            type="button"
                            onClick={() => {
                              onAddLog("Google Pay: Autenticação de biometria / FaceID requisitada...", "INFO", "SYSTEM");
                              setTimeout(() => {
                                onAddLog("Google Pay: Token criptográfico (PaymentData) gerado com sucesso por secure-enclave do Android.", "SUCCESS", "SYSTEM");
                                onAddLog("Google Pay: Token enviado de forma segura para faturamento.", "INFO", "SYSTEM");
                                handleTriggerPaymentSuccess();
                              }, 1200);
                            }}
                            className="w-full bg-black hover:bg-slate-900 text-white font-sans font-bold py-2 px-3 rounded-lg flex items-center justify-center gap-2 border border-slate-800 transition-all cursor-pointer shadow-lg active:scale-95"
                          >
                            <span className="text-xs tracking-tight font-extrabold uppercase">PAGAR COM O</span>
                            <span className="font-mono text-sm tracking-tighter bg-gradient-to-r from-red-400 via-yellow-400 to-green-400 bg-clip-text text-transparent font-black">Google Pay</span>
                          </button>
                          
                          <div className="text-[8px] text-slate-500 leading-normal font-sans">
                            Clique acima para simular a biometria do dispositivo do usuário e receber o pagamento instantaneamente.
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-2 animate-fade-in">
                        <p className="text-3xs text-slate-400 font-sans leading-relaxed">
                          Abaixo está o trecho oficial de código TypeScript React para renderizar o botão e escutar a emissão de tokens. Use este bloco em seu app real para integrar a Carteira Google:
                        </p>
                        <div className="bg-slate-950 p-3 rounded font-mono text-[8px] border border-slate-855 text-slate-300 overflow-x-auto whitespace-pre leading-normal max-h-[190px]">
{`// Código React - Google Pay Integration
import GooglePayButton from '@google-pay/button-react';

export function GoogleWalletPayment() {
  return (
    <GooglePayButton
      environment="TEST" // Troque para "PRODUCTION" em produção
      buttonColor="black"
      buttonType="subscribe" // Otimizado para assinaturas recorrentes
      paymentRequest={{
        apiVersion: 2,
        apiVersionMinor: 0,
        allowedPaymentMethods: [{
          type: 'CARD',
          parameters: {
            allowedAuthMethods: ['PAN_ONLY', 'CRYPTOGRAM_3D_S'],
            allowedCardNetworks: ['MASTERCARD', 'VISA', 'AMEX']
          },
          tokenizationSpecification: {
            type: 'PAYMENT_GATEWAY',
            parameters: {
              'gateway': 'stripe', // Seu gateway de pagamentos
              'stripe:version': '2018-08-23',
              'stripe:publishableKey': 'pk_live_...'
            }
          }
        }],
        merchantInfo: {
          merchantId: 'BCR2DN6TVW5...', // ID do Console Google Pay
          merchantName: 'Selix Bio-Tech'
        },
        transactionInfo: {
          totalPriceStatus: 'FINAL',
          totalPriceLabel: 'Assinatura Anual Selix PRO',
          totalPrice: '149.00',
          currencyCode: 'BRL',
          countryCode: 'BR'
        }
      }}
      onLoadPaymentData={paymentRequest => {
        console.log('Token do Google Pay gerado:', paymentRequest.paymentMethodData);
        // Envie o token formatado para o seu backend (/api/billing/confirm)
      }}
    />
  );
}`}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {selectedProvider === "paypal" && (
                  <div className="space-y-3 font-sans text-[10px] animate-fade-in text-slate-400">
                    <p>Você é redirecionado para a carteira eletrônica direta do PayPal (PayPal Express Sandbox Link para {currentTenant.currency}):</p>
                    <div className="bg-slate-950 p-4 rounded border border-slate-850 text-center max-w-sm mx-auto space-y-3">
                      <Coins className="w-8 h-8 text-sky-400 mx-auto animate-pulse" />
                      <div className="text-slate-300 font-mono text-[11px] font-bold">
                        Redirecionando de forma abstrata para paypal.com...
                      </div>
                      <span className="text-[8px] text-slate-500 font-mono bg-slate-900 px-2 py-0.5 rounded uppercase font-black">
                        SANDBOX IS REAL-TIME EMULATED
                      </span>
                    </div>
                  </div>
                )}

                {selectedProvider === "mercado_pago" && (
                  <div className="space-y-3 font-sans text-[10px] animate-fade-in text-slate-400">
                    <p>Mercado Pago é altamente otimizado para o Pix e Cartões Virtuais locais da América Latina.</p>
                    <div className="bg-slate-950 p-4 rounded border border-slate-855 text-center max-w-sm mx-auto space-y-3">
                      <Globe className="w-8 h-8 text-sky-305 mx-auto" />
                      <div className="text-slate-300 font-mono text-[11px] font-bold">
                        Integração Mercado Pago Checkout Pro Ativa
                      </div>
                      <span className="text-[8px] bg-sky-955/20 text-sky-300 border border-sky-900 px-2 py-0.5 rounded font-mono font-bold uppercase block max-w-xs mx-auto">
                        AGUARDANDO LIQUIDAÇÃO GATEWAY
                      </span>
                    </div>
                  </div>
                )}

                {/* STATUS BAR AND ACTIONS */}
                <div className="border-t border-slate-850 pt-3 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 font-sans">
                  <div className="flex items-center gap-1.5 font-mono text-[9px] select-none text-slate-400">
                    <span>{t["paymentStatus"]}</span>
                    {paymentStatus === "pending" ? (
                      <span className="text-amber-400 font-bold animate-pulse flex items-center gap-1 uppercase">
                        <RefreshCw className="w-3 h-3 text-amber-400 animate-spin" />
                        {t["statusPending"]}
                      </span>
                    ) : (
                      <span className="text-emerald-450 font-black flex items-center gap-1 uppercase bg-emerald-955/20 border border-emerald-900/10 rounded px-1.5 py-0.5">
                        <CheckCircle className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                        {t["statusSuccess"]}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    {paymentStatus === "pending" && (
                      <button
                        onClick={handleTriggerPaymentSuccess}
                        className="px-3.5 py-1.5 rounded bg-emerald-600 hover:bg-emerald-500 text-white font-bold font-mono text-[10px] uppercase transition-all shadow-md flex items-center gap-1 cursor-pointer"
                      >
                        <ShieldCheck className="w-3.5 h-3.5" />
                        {t["simulatePayBtn"]}
                      </button>
                    )}
                    
                    <button
                      onClick={handleResetCheckout}
                      className="px-2.5 py-1.5 rounded bg-slate-950 hover:bg-slate-850 text-slate-450 font-mono border border-slate-800 text-[10px] uppercase transition-all cursor-pointer flex items-center gap-1"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      {t["tenantReset"]}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* SECTION 4: 5% REINVESTMENT AUTO-SCALING ALIGNMENT MODEL */}
      <div className="border-t border-slate-800 pt-5 mt-5 space-y-4 font-mono text-3xs rounded-xl bg-slate-950/40 p-4 border border-indigo-950/20" id="infra-profit-tracker">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-indigo-950/30 pb-2">
          <div className="flex items-center gap-2">
            <RefreshCw className="w-4 h-4 text-emerald-400 animate-spin-slow animate-spin" />
            <div>
              <h3 className="font-extrabold text-slate-100 uppercase tracking-widest text-3xs">
                📈 MODELO FINANCEIRO DE REINVESTIMENTO (5% DO LUCRO EM AUTO-SCALING)
              </h3>
              <p className="text-[9px] text-slate-500 font-sans mt-0.5 leading-none">
                Alocação contínua de margem de receita de assinaturas para fomento de hardware dedicado e escalabilidade do Core Selix.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            <span className="text-[9px] text-slate-400 uppercase">Fundo de Infra (5%):</span>
            <strong className="text-sm text-emerald-400 font-black">
              R$ {(totalRevenue * 0.05).toFixed(2)}
            </strong>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-left">
          {/* Item 1: Watchdog Memory Bounds */}
          <div className="bg-slate-900/60 p-3 rounded border border-slate-800 space-y-1.5">
            <div className="flex justify-between items-center text-slate-500 text-[8px] uppercase font-bold">
              <span>Capacidade de RAM Watchdog</span>
              <span className="text-emerald-400 font-bold">Auto-Scale</span>
            </div>
            <div className="flex items-baseline gap-1.5">
              <strong className="text-base text-slate-200">
                {(384 + Math.round((totalRevenue * 0.05) * 0.15))} MB
              </strong>
              <span className="text-slate-550 line-through text-[9px] ml-1.5">384 MB</span>
            </div>
            <p className="text-[8.5px] text-slate-500 font-sans leading-tight">
              Aumento dinâmico do limite de RAM do container/Termux para prevenção de incidentes de OOM (Out Of Memory) sob regime de estresse de dados.
            </p>
          </div>

          {/* Item 2: Background Browser Nodes */}
          <div className="bg-slate-900/60 p-3 rounded border border-slate-800 space-y-1.5">
            <div className="flex justify-between items-center text-slate-500 text-[8px] uppercase font-bold">
              <span>Browser Nodes em Paralelo</span>
              <span className="text-sky-400 font-bold">Auto-Scale</span>
            </div>
            <div className="flex items-baseline gap-1.5">
              <strong className="text-base text-slate-200">
                {1 + Math.floor((totalRevenue * 0.05) / 25)} nodes
              </strong>
              <span className="text-slate-550 line-through text-[9px] ml-1.5">1 node</span>
            </div>
            <p className="text-[8.5px] text-slate-500 font-sans leading-tight">
              Sessões simultâneas ativas com headless chromium para raspagem autônoma de mercado (Brent Oil e COPOM) sem enfileiramento ou latência.
            </p>
          </div>

          {/* Item 3: Concurrent API Requests */}
          <div className="bg-slate-900/60 p-3 rounded border border-slate-800 space-y-1.5">
            <div className="flex justify-between items-center text-slate-500 text-[8px] uppercase font-bold">
              <span>Requisições Simultâneas</span>
              <span className="text-violet-400 font-bold">Auto-Scale</span>
            </div>
            <div className="flex items-baseline gap-1.5">
              <strong className="text-base text-slate-200">
                {(150 + Math.round((totalRevenue * 0.05) * 0.8))} req/s
              </strong>
              <span className="text-slate-550 line-through text-[9px] ml-1.5">150/s</span>
            </div>
            <p className="text-[8.5px] text-slate-500 font-sans leading-tight">
              Capacidade do balanceador de rede regional para absorver alta concorrência de acessos aos endpoints de RAG e threads sem degradação do TTFB.
            </p>
          </div>
        </div>

        {/* Action simulators to test live scaling */}
        <div className="bg-slate-900/40 p-3.5 rounded border border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3 text-[10px]">
          <div className="flex items-center gap-2 text-slate-400 font-sans">
            <span className="p-1 rounded bg-slate-950 font-mono text-[9px] text-emerald-400 border border-emerald-900/30">
              📊 RECEITA ACUMULADA: R$ {totalRevenue.toFixed(2)}
            </span>
            <span>Simule novos cadastros para ver as metas de crescimento financeiro expandirem os limites físicos de hardware.</span>
          </div>
          
          <div className="flex items-center gap-2 shrink-0 w-full sm:w-auto">
            <button
              type="button"
              onClick={() => {
                setTotalRevenue(prev => prev + 149.00);
                onAddLog(`Simulação Interna: Nova assinatura agregada (+ R$ 149,00). 5% (R$ 7,45) direcionado a fundos de capacidade hardware.`, "SUCCESS", "SYSTEM");
              }}
              className="px-3.5 py-1.5 rounded bg-indigo-600 hover:bg-indigo-500 text-slate-100 font-bold font-mono text-[9px] uppercase transition-all flex items-center gap-1 cursor-pointer select-none grow sm:grow-0 text-center justify-center border border-indigo-500/25 active:scale-95"
            >
              ➕ SIMULAR CADASTRO (+R$149)
            </button>
            <button
              type="button"
              onClick={() => {
                setTotalRevenue(8940.00);
                onAddLog(`Simulação Interna: Reservas de infraestrutura reiniciadas para o patamar nominal pré-autônomo.`, "WARNING", "SYSTEM");
              }}
              className="p-1.5 rounded bg-slate-950 border border-slate-800 hover:text-white cursor-pointer select-none"
              title="Reiniciar faturamento simulado"
            >
              <RefreshCw className="w-3.5 h-3.5 text-slate-500 hover:text-slate-300 animate-spin" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
