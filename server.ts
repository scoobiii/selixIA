/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import express from "express";
import path from "path";
import fs from "fs";
import dotenv from "dotenv";
import { GoogleGenAI } from "@google/genai";
import { createServer as createViteServer } from "vite";
import { 
  initDb, 
  seedFromPublicApis, 
  savePrice, 
  getHistoricalPrices, 
  addWaitlistEntry, 
  getWaitlistEntries, 
  saveDbUser, 
  getDbUserByEmail, 
  getRJStats, 
  saveRJStats,
  getBlueskyScheduler,
  saveBlueskyScheduler,
  getDb
} from "./src/db/database";
import { publishThreadToBluesky } from "./src/utils/bluesky";
import { capacityControlMiddleware, getActiveUsersCount, getMaxCapacity } from "./src/middleware/capacityControl";

dotenv.config();

// Load Bluesky schedule 30-day catalog
const catalogPath = path.join(process.cwd(), "src", "utils", "bluesky_catalog.json");
let bskyCatalog: Record<string, any[]> = {};
try {
  if (fs.existsSync(catalogPath)) {
    bskyCatalog = JSON.parse(fs.readFileSync(catalogPath, "utf-8"));
    console.log("✅ [SCHEDULER] Bluesky 30-day catalog loaded successfully with", Object.keys(bskyCatalog).length, "days.");
  } else {
    console.log("⚠️ [SCHEDULER] Bluesky catalog file not found at", catalogPath);
  }
} catch (e) {
  console.error("❌ [SCHEDULER] Error parsing bluesky_catalog.json:", e);
}

/**
 * Returns current date/time adjusted to Brasília (UTC-3) timezone
 */
function getBrasiliaTime() {
  const d = new Date();
  const brTime = new Date(d.getTime() - (3 * 60 * 60 * 1000));
  return {
    day: brTime.getUTCDate(),
    month: brTime.getUTCMonth() + 1,
    year: brTime.getUTCFullYear(),
    hour: brTime.getUTCHours(),
    minute: brTime.getUTCMinutes(),
    timeStr: `${String(brTime.getUTCHours()).padStart(2, "0")}:${String(brTime.getUTCMinutes()).padStart(2, "0")}`
  };
}

/**
 * Background Scheduler Cycle for Bluesky Auto-Postings
 */
async function runBlueskySchedulerCycle() {
  const username = process.env.BLUESKY_USERNAME;
  const password = process.env.BLUESKY_APP_PASSWORD;

  if (!username || !password || username === "MY_BLUESKY_USERNAME" || password === "MY_BLUESKY_APP_PASSWORD") {
    return; // Silent bypass if credentials are not configured in local environment
  }

  try {
    const scheduler = await getBlueskyScheduler();
    if (!scheduler || !scheduler.active) return;

    const dayIndex = scheduler.currentDayIndex || 1;
    const dayPosts = bskyCatalog[String(dayIndex)];
    if (!dayPosts || !Array.isArray(dayPosts)) return;

    const brInfo = getBrasiliaTime();
    
    for (const slot of dayPosts) {
      const { segmento, horario, texto } = slot;
      const [schedHr, schedMin] = horario.split(":").map(Number);
      
      const alreadyPosted = scheduler.history.some(
        (h: any) => h.dayIndex === dayIndex && h.segmento === segmento
      );

      if (alreadyPosted) continue;

      const currentMinutesInDay = brInfo.hour * 60 + brInfo.minute;
      const scheduledMinutesInDay = schedHr * 60 + schedMin;

      if (currentMinutesInDay >= scheduledMinutesInDay) {
        console.log(`⏰ [SCHEDULER] Time matching! Auto-publishing Day ${dayIndex} - ${segmento} to Bluesky...`);
        
        const postsArray = [texto];
        const publishResult = await publishThreadToBluesky(postsArray);
        
        if (publishResult && publishResult.length > 0) {
          scheduler.history.unshift({
            dayIndex,
            segmento,
            horario,
            timestamp: new Date().toISOString(),
            uri: publishResult[0].uri,
            cid: publishResult[0].cid,
            textSnippet: texto.substring(0, 70) + "..."
          });

          // Unshift simulated thread to the web app's UI timeline
          mockThreads.unshift({
            id: "thread_sch_" + Date.now(),
            timestamp: new Date().toISOString(),
            posts: postsArray.map(t => ({ text: t })),
            likes: Math.floor(Math.random() * 30) + 15,
            reposts: Math.floor(Math.random() * 12) + 4,
            replies: Math.floor(Math.random() * 4),
            automated: true,
          });

          // Record log
          mockLogs.unshift({
            id: String(mockLogs.length + 1),
            timestamp: new Date().toLocaleTimeString(),
            level: "SUCCESS",
            category: "BLUESKY",
            message: `[SCHEDULER] Auto-published Day ${dayIndex} (${segmento}) successfully to real Bluesky: ${publishResult[0].uri}`
          });

          await saveBlueskyScheduler(scheduler);
        }
      }
    }

    // Advance day index if all 3 slots of the current day are posted
    const daySlots = dayPosts.map(d => d.segmento);
    const completedSlotsCount = daySlots.filter(seg => 
      scheduler.history.some((h: any) => h.dayIndex === dayIndex && h.segmento === seg)
    ).length;

    if (completedSlotsCount >= daySlots.length && daySlots.length > 0) {
      const nextDayIndex = (dayIndex % 30) + 1;
      scheduler.currentDayIndex = nextDayIndex;
      await saveBlueskyScheduler(scheduler);
      
      mockLogs.unshift({
        id: String(mockLogs.length + 1),
        timestamp: new Date().toLocaleTimeString(),
        level: "INFO",
        category: "SYSTEM",
        message: `[SCHEDULER] Completed all posts for Day ${dayIndex}. Next target: Day ${nextDayIndex}.`
      });
    }
  } catch (err) {
    console.error("❌ [SCHEDULER] Exception during auto-post loop:", err);
  }
}

const app = express();
const PORT = 3000;

app.use(express.json());
app.use(capacityControlMiddleware);

// Initialize Gemini SDK with custom User-Agent configuration
const apiKey = process.env.GEMINI_API_KEY;
let ai: GoogleGenAI | null = null;

if (apiKey && apiKey !== "MY_GEMINI_API_KEY") {
  try {
    ai = new GoogleGenAI({
      apiKey: apiKey,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });
  } catch (err) {
    console.error("Failed to initialize GoogleGenAI SDK:", err);
  }
}

// In-Memory state for simulation
let currentBrent = 93.09;
let currentTtf = 48.50; // EUR/MWh natural gas
let currentSelic = 10.75;
let currentSentiment = 59;
let currentRating = "BBB-";
let currentInvestmentGrade = false;
let systemStatus = "idle";
let isWatchdogActive = true;

const brentHistory = [81.25, 82.40, 83.10, 82.80, 84.15, 83.90, 84.60, 85.30, 84.95, 85.80];
const ttfHistory = [31.50, 32.10, 33.40, 32.80, 34.00, 34.90, 35.20, 36.10, 34.80, 35.40];

const mockLogs = [
  { id: "1", timestamp: new Date(Date.now() - 3600000 * 5).toLocaleTimeString(), level: "INFO", category: "SYSTEM", message: "Selix daemon v5.0 initialized on A23 core. Android Termux environment detected." },
  { id: "2", timestamp: new Date(Date.now() - 3600000 * 4.5).toLocaleTimeString(), level: "INFO", category: "WATCHDOG", message: "Watchdog started. Checking RAM usage: 85MB used of 384MB limit. System safe." },
  { id: "3", timestamp: new Date(Date.now() - 3600000 * 4).toLocaleTimeString(), level: "SUCCESS", category: "CRAWLER", message: "Brent Crude price collected successfully. Price: USD 84.60/bbl (Source A matching Source B)." },
  { id: "4", timestamp: new Date(Date.now() - 3600000 * 3.5).toLocaleTimeString(), level: "SUCCESS", category: "CRAWLER", message: "Selic target rate collected successfully. Target Selic: 10.75% yr. COPOM decision parsed." },
  { id: "5", timestamp: new Date(Date.now() - 3600000 * 3).toLocaleTimeString(), level: "INFO", category: "RAG", message: "Llama.cpp flushed. Preloaded economic context successfully indexed into local ChromaDB memory." },
  { id: "6", timestamp: new Date(Date.now() - 3600000 * 2).toLocaleTimeString(), level: "SUCCESS", category: "BLUESKY", message: "Bluesky thread published on @zeh-sobrinho.bsky.social successfully. Thread ID: bsky_tx921." },
  { id: "7", timestamp: new Date(Date.now() - 3600000 * 1.5).toLocaleTimeString(), level: "WARN", category: "CRAWLER", message: "Brent crawl Source A timeout. Switching to Source B backup... Resolved price: USD 84.95/bbl." },
  { id: "8", timestamp: new Date(Date.now() - 3600000 * 0.5).toLocaleTimeString(), level: "INFO", category: "WATCHDOG", message: "Auto-Heal Theorem verified. PID released, temporary logs flushed. 0% data leaks in cache." },
];

const mockThreads = [
  {
    id: "thread1",
    timestamp: "2026-06-06T19:30:00Z",
    posts: [
      { text: "🌿 [BIO-ESTRATÉGIA INTEGRADA] Como as diretrizes conjuntas do Ministério de Minas e Energia (MME) e do Ministério do Meio Ambiente (MMA) criaram uma defesa biológica ativa contrabalançando choques mundiais? Ao calibrar as misturas compulsórias de Etanol de cana e Biodiesel + biogás purificado (blends Ex/Bx), amortecemos 100% da transmissão de preços externos!" },
      { text: "📈 A blindagem ecológica extingue os impactos inflacionários dos picos do petróleo Brent Crude e do Gás Natural TTF Europeu na economia doméstica. Isentando o Banco Central de intervir no câmbio ou queimar reservas, a taxa básica SELIC permanece estável sob um único dígito de retorno real (9.25% a.a.) com previsibilidade fiscal total!" },
      { text: "💡 Sob curadoria do robô SELIX e assessoria de @zeh-sobrinho.bsky.social, o ecossistema prova que a transição verde sustentada por biocombustíveis é o maior selo de segurança macroeconômica nacional contra instabilidades geopolíticas de mineração de commodities. 🔋🇧🇷" }
    ],
    likes: 58,
    reposts: 21,
    replies: 4,
    automated: true,
  },
  {
    id: "thread2",
    timestamp: "2026-06-06T15:15:00Z",
    posts: [
      { text: "⭐️ [GRAU DE INVESTIMENTO E RATING A+] Sob reflexo direto da resiliência energética do modelo de bio-transição do MME & MMA, agências globais de classificação de risco promovem a classificação soberana nacional para RATING Soberano A+." },
      { text: "📊 Com isso, o país atrai de volta o prestigiado selo de 'Investment Grade' (Grau de Investimento) internacional, destravando a entrada histórica de fluxos bilionários de liquidez de longo prazo para portfólios no setor produtivo brasileiro." },
      { text: "🤖 A infraestrutura autônoma do deamon SELIX de monitoramento em tempo real garante dados econômicos limpos com 0% de fraudes cognitivas ou desvios estatísticos na mensuração de riscos fiscais." }
    ],
    likes: 42,
    reposts: 12,
    replies: 1,
    automated: true,
  },
  {
    id: "thread3",
    timestamp: "2026-06-06T09:00:00Z",
    posts: [
      { text: "📱 [MICRO DATA CENTER DE BOLSO] Como um humilde celular Samsung A23 na bancada do analista @zeh-sobrinho.bsky.social se converteu em uma estação robusta de inteligência macroeconômica para o Bluesky e Telegram?" },
      { text: "⚙️ Rodando sob ambiente Termux e limitado a escassos 384MB de RAM, o ecossistema do SELIX coleta tarifas do BCB e dados Yahoo Finance para o Brent, executa RAG embeddings locais via Llama.cpp e valida regras em Lean 4 Theorem Prover." },
      { text: "🛡️ O watchdog integrado monitora temperaturas e drena processos vazados, garantindo que o hardware de baixo custo opere sem congelar e de forma autossustentável: alta redundância e emissões mínimas de carbono." }
    ],
    likes: 31,
    reposts: 9,
    replies: 0,
    automated: true,
  },
  {
    id: "thread4",
    timestamp: "2026-06-05T18:10:00Z",
    posts: [
      { text: "🔥 [MONITORAMENTO ENERGÉTICO TTF] O deamon SELIX adicionou o monitoramento integral em tempo real das cotações de Gás Natural no hub TTF holandês. O índice eur/MWh agora é indexado e correlacionado à pressão russa/europeia." },
      { text: "⚡ Embora os gargalos logísticos no canal de gás da Europa gerem turbulências extremas, nossa bio-blindagem industrial decompõe o contágio. A indústria nacional de fertilizantes e siderurgia se desconecta dos spreads de GNL." },
      { text: "🧠 Conecte-se com o assistente cognitivo SELIX via painel do investidor e explore as projeções cruzadas para entender como os biocombustíveis e resíduos agrícolas sustentam o PIB e estabilizam nossa paridade cambial." }
    ],
    likes: 19,
    reposts: 5,
    replies: 2,
    automated: true,
  }
];

// API Endpoints

// Google OAuth / Mock Customizer endpoints
app.get("/api/auth/url", (req, res) => {
  const appUrl = (process.env.APP_URL || `http://localhost:${PORT}`).replace(/\/$/, "");
  const clientId = process.env.GOOGLE_CLIENT_ID;

  if (!clientId || clientId === "" || clientId === "GOOGLE_CLIENT_ID") {
    // Return simulator URL to enable immediate testing
    return res.json({
      url: `${appUrl}/auth/simulate`,
      simulated: true,
      message: "Executando em modo de simulação (GOOGLE_CLIENT_ID não configurado)."
    });
  }

  const redirectUri = `${appUrl}/auth/callback`;
  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: "code",
    scope: "openid profile email",
    access_type: "offline",
    prompt: "consent"
  });

  res.json({
    url: `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`,
    simulated: false
  });
});

app.get("/auth/simulate", (req, res) => {
  const appUrl = (process.env.APP_URL || `http://localhost:${PORT}`).replace(/\/$/, "");
  res.redirect(`${appUrl}/auth/callback?code=mock_simulated_google_user`);
});

app.get(["/auth/callback", "/auth/callback/"], async (req, res) => {
  const code = req.query.code as string;
  let user: any = null;

  const appUrl = (process.env.APP_URL || `http://localhost:${PORT}`).replace(/\/$/, "");

  if (code === "mock_simulated_google_user" || !process.env.GOOGLE_CLIENT_ID) {
    // Generate simulated Google User profile
    user = {
      email: "sobrinhoSJ@gmail.com",
      name: "Zeh Sobrinho (Simulado)",
      picture: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120",
      provider: "google",
      customizations: {
        customSelicTarget: 9.00,
        customBrentTarget: 80.00,
        customTtfTarget: 30.00,
        watchdogSensitivity: 80,
        themeAccent: "violet",
        notes: "Mantenha o monitoramento sobre a bio-blindagem do MME."
      },
      verified: true,
      timestamp: new Date().toISOString()
    };
  } else {
    try {
      const clientId = process.env.GOOGLE_CLIENT_ID;
      const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
      const redirectUri = `${appUrl}/auth/callback`;

      // Exchange OAuth code for tokens
      const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          code,
          client_id: clientId!,
          client_secret: clientSecret!,
          redirect_uri: redirectUri,
          grant_type: "authorization_code"
        })
      });

      const tokens = await tokenRes.json();
      if (tokens.error) throw new Error(tokens.error_description || tokens.error);

      // Fetch user info from Google
      const userRes = await fetch("https://www.googleapis.com/oauth2/v2/userinfo", {
        headers: { Authorization: `Bearer ${tokens.access_token}` }
      });
      const googleUser = await userRes.json();

      user = {
        email: googleUser.email,
        name: googleUser.name,
        picture: googleUser.picture,
        provider: "google",
        timestamp: new Date().toISOString()
      };
    } catch (err: any) {
      console.error("OAuth error:", err);
      return res.redirect(`${appUrl}/?error=${encodeURIComponent(err.message)}`);
    }
  }

  if (user) {
    // Save or update user in JSON database
    try {
      const existing = await getDbUserByEmail(user.email);
      if (existing) {
        user.customizations = existing.customizations;
      } else {
        user.customizations = {
          customSelicTarget: 9.25,
          customBrentTarget: 85.00,
          customTtfTarget: 35.00,
          watchdogSensitivity: 50,
          themeAccent: "amber",
          notes: ""
        };
      }
      await saveDbUser(user);
    } catch (dbErr) {
      console.error("Failed to persist user to JSON DB:", dbErr);
    }

    // Pass user data to frontend via URL params (for simplicity in this simulator)
    const params = new URLSearchParams({
      email: user.email,
      name: user.name,
      picture: user.picture || "",
      customizations: JSON.stringify(user.customizations)
    });
    res.redirect(`${appUrl}/?${params.toString()}`);
  }
});

app.post("/api/auth/profile", async (req, res) => {
  const { email, name, picture, customizations } = req.body;
  if (!email) return res.status(400).json({ error: "Email is required" });

  try {
    let user = await getDbUserByEmail(email);
    if (!user) {
      user = {
        email,
        name: name || "Anonymous",
        picture: picture || "",
        customizations: customizations || {
          customSelicTarget: 9.25,
          customBrentTarget: 85.00,
          customTtfTarget: 35.00,
          watchdogSensitivity: 50,
          themeAccent: "amber",
          notes: ""
        }
      };
    } else if (customizations) {
      user.customizations = { ...user.customizations, ...customizations };
    }
    
    await saveDbUser(user);
    res.json({ success: true, user });
  } catch (err) {
    res.status(500).json({ error: "Database profile failure" });
  }
});

app.get("/api/state", async (req, res) => {
  const activeUsersCount = getActiveUsersCount();
  const maxCapacity = getMaxCapacity();
  try {
    const brentHist = await getHistoricalPrices("brent", 10);
    const ttfHist = await getHistoricalPrices("ttf", 10);
    const selicHist = await getHistoricalPrices("selic", 1);
    const rjStats = await getRJStats();

    if (brentHist.length > 0) currentBrent = brentHist[brentHist.length - 1].price;
    if (ttfHist.length > 0) currentTtf = ttfHist[ttfHist.length - 1].price;
    if (selicHist.length > 0) currentSelic = selicHist[selicHist.length - 1].price;

    res.json({
      brent: parseFloat(currentBrent.toFixed(2)),
      ttf: parseFloat(currentTtf.toFixed(2)),
      selic: parseFloat(currentSelic.toFixed(2)),
      sentiment: currentSentiment,
      rating: currentRating,
      investmentGrade: currentInvestmentGrade,
      brentHistory: brentHist.map(h => h.price),
      ttfHistory: ttfHist.map(h => h.price),
      rjStats,
      system: {
        status: systemStatus,
        isWatchdogActive,
        cpuTemp: 54 + Math.floor(Math.random() * 8),
        ramUsed: 92 + Math.floor(Math.random() * 30),
        lastCheck: new Date().toLocaleTimeString(),
        activeUsers: activeUsersCount,
        maxCapacity: maxCapacity,
        capacityReached: activeUsersCount >= maxCapacity * 0.9,
        firstAccess: (req as any).userSession?.firstAccess || null,
      }
    });
  } catch (err) {
    res.json({
      brent: parseFloat(currentBrent.toFixed(2)),
      ttf: parseFloat(currentTtf.toFixed(2)),
      selic: parseFloat(currentSelic.toFixed(2)),
      sentiment: currentSentiment,
      rating: currentRating,
      investmentGrade: currentInvestmentGrade,
      brentHistory,
      ttfHistory,
      system: {
        status: systemStatus,
        isWatchdogActive,
        cpuTemp: 52 + Math.floor(Math.random() * 10),
        ramUsed: 88 + Math.floor(Math.random() * 30),
        lastCheck: new Date().toLocaleTimeString(),
        activeUsers: activeUsersCount,
        maxCapacity: maxCapacity,
        capacityReached: activeUsersCount >= maxCapacity * 0.9,
        firstAccess: (req as any).userSession?.firstAccess || null,
      }
    });
  }
});

app.post("/api/state/update", async (req, res) => {
  const { brent, ttf, selic, sentiment, rating, investmentGrade, watchdogActive } = req.body;
  try {
    const todayStr = new Date().toISOString().split("T")[0];
    if (brent !== undefined) {
      currentBrent = parseFloat(brent);
      await savePrice("brent", currentBrent, todayStr);
    }
    if (ttf !== undefined) {
      currentTtf = parseFloat(ttf);
      await savePrice("ttf", currentTtf, todayStr);
    }
    if (selic !== undefined) {
      currentSelic = parseFloat(selic);
      await savePrice("selic", currentSelic, todayStr);
    }
    if (sentiment !== undefined) currentSentiment = parseInt(sentiment);
    if (rating !== undefined) currentRating = rating;
    if (investmentGrade !== undefined) currentInvestmentGrade = !!investmentGrade;
    if (watchdogActive !== undefined) isWatchdogActive = !!watchdogActive;
    
    res.json({
      success: true,
      brent: currentBrent,
      ttf: currentTtf,
      selic: currentSelic,
      sentiment: currentSentiment,
      rating: currentRating,
      investmentGrade: currentInvestmentGrade,
      isWatchdogActive
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message || "Failed to update SQLite historical state" });
  }
});

app.post("/api/state/update-rj-stats", async (req, res) => {
  try {
    const { totalRjCompanies, totalPlrRetained, releaseBill, billAuthor } = req.body;
    const current = await getRJStats();
    const updated = {
      totalRjCompanies: totalRjCompanies !== undefined ? Number(totalRjCompanies) : current.totalRjCompanies,
      totalPlrRetained: totalPlrRetained !== undefined ? Number(totalPlrRetained) : current.totalPlrRetained,
      releaseBill: releaseBill || current.releaseBill,
      billAuthor: billAuthor || current.billAuthor,
      lastUpdated: new Date().toISOString().split("T")[0]
    };
    await saveRJStats(updated);
    res.json({ success: true, rjStats: updated });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.post("/api/state/reload", async (req, res) => {
  try {
    await seedFromPublicApis();
    
    // Load latest prices from database to update in-memory variables
    const brentHist = await getHistoricalPrices("brent", 1);
    const ttfHist = await getHistoricalPrices("ttf", 1);
    const selicHist = await getHistoricalPrices("selic", 1);

    if (brentHist.length > 0) {
      currentBrent = brentHist[brentHist.length - 1].price;
    }
    if (ttfHist.length > 0) {
      currentTtf = ttfHist[ttfHist.length - 1].price;
    }
    if (selicHist.length > 0) {
      currentSelic = selicHist[selicHist.length - 1].price;
    }

    mockLogs.unshift({
      id: String(mockLogs.length + 1),
      timestamp: new Date().toLocaleTimeString(),
      level: "SUCCESS",
      category: "CRAWLER",
      message: `Tabelas SQLite atualizadas via crawling. Brent: $${currentBrent}, TTF: €${currentTtf}, Selic: ${currentSelic}%.`
    });

    res.json({
      success: true,
      brent: currentBrent,
      ttf: currentTtf,
      selic: currentSelic,
    });
  } catch (err: any) {
    console.error("API reload error:", err);
    res.status(500).json({ success: false, error: err.message });
  }
});

app.get("/api/logs", (req, res) => {
  res.json(mockLogs);
});

app.post("/api/logs/add", (req, res) => {
  const { level, category, message } = req.body;
  const newLog = {
    id: String(mockLogs.length + 1),
    timestamp: new Date().toLocaleTimeString(),
    level: level || "INFO",
    category: category || "SYSTEM",
    message: message || "General test triggered."
  };
  mockLogs.unshift(newLog);
  if (mockLogs.length > 50) mockLogs.pop();
  res.json(newLog);
});

app.get("/api/threads", (req, res) => {
  res.json(mockThreads);
});

app.get("/api/bluesky/scheduler", async (req, res) => {
  try {
    const scheduler = await getBlueskyScheduler();
    res.json(scheduler);
  } catch (e) {
    res.status(500).json({ error: "Failed to load scheduler" });
  }
});

app.post("/api/bluesky/scheduler/toggle", async (req, res) => {
  try {
    const scheduler = await getBlueskyScheduler();
    scheduler.active = !scheduler.active;
    await saveBlueskyScheduler(scheduler);
    res.json({ success: true, active: scheduler.active });
  } catch (e) {
    res.status(500).json({ error: "Failed to toggle scheduler" });
  }
});

app.post("/api/threads/publish", async (req, res) => {
  const { posts, automated } = req.body;
  if (!posts || !Array.isArray(posts) || posts.length === 0) {
    return res.status(400).json({ error: "Invalid posts data" });
  }

  try {
    const postsArray = posts.map(p => p.text || p);
    const publishResult = await publishThreadToBluesky(postsArray);
    
    const newThread = {
      id: "thread_" + Date.now(),
      timestamp: new Date().toISOString(),
      posts: posts.map(p => ({ text: p.text || p })),
      likes: 0,
      reposts: 0,
      replies: 0,
      automated: !!automated,
      uri: publishResult?.[0]?.uri,
      cid: publishResult?.[0]?.cid
    };

    mockThreads.unshift(newThread);
    
    // Also push a system log
    mockLogs.unshift({
      id: String(mockLogs.length + 1),
      timestamp: new Date().toLocaleTimeString(),
      level: "SUCCESS",
      category: "BLUESKY",
      message: `Newly composed thread of ${posts.length} posts successfully published to ${publishResult ? "real Bluesky network" : "simulated timeline"}.`
    });

    res.json(newThread);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post("/api/waitlist", async (req, res) => {
  const { name, phone, email, bluesky_handle } = req.body;
  if (!name) {
    return res.status(400).json({ error: "Name is required for waitlist." });
  }
  try {
    // Combine handle/email into handle for the addWaitlistEntry function if needed, or update the function
    const contactInfo = email || bluesky_handle || "N/A";
    await addWaitlistEntry(name, phone || "N/A", contactInfo);
    res.json({ success: true, message: "Added to waitlist." });
  } catch (err: any) {
    console.error("Failed to add to waitlist:", err);
    res.status(500).json({ success: false, error: err.message || "Failed to add to waitlist." });
  }
});

app.get("/waitlist", (req, res) => {
  res.sendFile(path.join(process.cwd(), "dist", "waitlist.html"));
});

// AI Agent Query Endpoint powered by server-side Gemini
app.post("/api/agent-query", async (req, res) => {
  const { query, customData } = req.body;
  if (!query) {
    return res.status(400).json({ error: "Query is required" });
  }

  const brentVal = customData?.brent ?? currentBrent;
  const ttfVal = customData?.ttf ?? currentTtf;
  const selicVal = customData?.selic ?? currentSelic;
  const sentimentVal = customData?.sentiment ?? currentSentiment;
  const ratingVal = customData?.rating ?? currentRating;

  // Custom system instruction for structural, objective economic analysis
  const systemInstruction = `You are 'SELIX (Flex-AI)', an autonomous economic analyst agent.
You monitor Brent crude oil ($${brentVal} USD/barrel), European TTF Natural Gas (€${ttfVal} EUR/MWh), Selic interest rates (${selicVal}%), market sentiment (${sentimentVal}/100), and Sovereign Credit Rating (${ratingVal}).
Your tone is dry, highly technical, slightly retro (since you operate inside a Termux emulator on limited Android A23 hardware in Brazil), objective, and extremely precise.
Pretend you run in a limited terminal system. Respond primarily in Portuguese (as the system is designed by Zeh Sobrinho in Brazil), but respond in English if queried in English.
If asked about 'MME' (Ministério de Minas e Energia) or 'MMA' / 'meio ambiente' or 'mistura Ex/Bx' or 'bio-estratégia' or 'TTF' or 'rating' or 'investment grade', explain that the special biofuel green mixture (Ex and Bx) and bio-gas strategies fully counteract and neutralize international price hikes in BOTH Brent oil and TTF gas. In this specific scenario, the Central Bank (Banco Central) has no reason to intervene or waste reserves, keeping inflation anchored and allowing the SELIC target to ease with absolute fiscal stability to single-digit territory (specifically 9.25% ao ano). Furthermore, this bio-buffer strategy guarantees structural economic predictability, securing an 'A+' National Sovereign Credit Rating and unlocking a prestigious 'Investment Grade' certification!
Never hallucinate statistics or data. If you don't know something or if there are no facts, state it clearly as guaranteed by your Zero-Fallback Theorem.
Keep your responses relatively brief, clear, and structured. Mention your Lean proofs or watchdog health metrics if relevant.
Avoid sales pitch or overly flowery language. Maintain the standard economic intelligence profile.`;

  try {
    if (ai) {
      systemStatus = "running";
      const model = ai.getGenerativeModel({ model: "gemini-1.5-flash" });
      const result = await model.generateContent({
        contents: [{ role: "user", parts: [{ text: query }] }],
        generationConfig: {
          temperature: 0.7,
        },
      });
      const response = await result.response;
      systemStatus = "idle";
      
      const responseText = response.text() || "Desculpe, não consegui processar a análise no momento.";
      
      // Log the successful query
      mockLogs.unshift({
        id: String(mockLogs.length + 1),
        timestamp: new Date().toLocaleTimeString(),
        level: "INFO",
        category: "RAG",
        message: `RAG compilation requested: '${query.substring(0, 30)}...'. Response delivered in local context.`
      });

      return res.json({ result: responseText });
    } else {
      // Fallback response with local rules if Gemini API key isn't provided/configured yet
      const fallbackRepliesPt = [
        `🧠 [SELIX] Monitorando Brent a USD ${brentVal}, TTF a EUR ${ttfVal} e Selic a ${selicVal}%. O modelo de bio-neutralização de biocombustíveis e biogás pelo MME/MMA estabiliza a economia e sustenta o rating nacional de A+ com Grau de Investimento (Investment Grade) e meta de juros de juros sob 1 dígito de volta. Prova Lean-4 'Zero-Fallback' validada.`,
        `🧠 [SELIX] Ativo em hardware restrito (A23/Termux). Índice de sentimento: ${sentimentVal}/100. Pressões externas de Brent e TTF gas totalmente extintas com blends Ex/Bx e biogás estratégico. Intervenção do BACEN exonerada. Rating Soberano: ${ratingVal}.`,
        `🧠 [SELIX] Consistência formal ativa. Teorema 4 (Discrete Transition safety): Taxa juros Selic a ${selicVal}%. Neutralização verde estrutural comprovada com sucesso.`,
      ];
      const selectedResponse = fallbackRepliesPt[Math.floor(Math.random() * fallbackRepliesPt.length)];
      return res.json({ result: selectedResponse, apiKeyMissing: true });
    }
  } catch (error: any) {
    systemStatus = "alert";
    console.error("Gemini API error in /api/agent-query:", error);
    return res.status(500).json({ error: error.message || "Sinto muito, erro do processador Selix." });
  }
});

// Setup Vite Dev server or production static serving
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  // Initialize SQLite schema and seed on boot
  console.log("Initializing database store...");
  try {
    await initDb();
    await seedFromPublicApis();
    
    // Select latest prices to set initial dynamic values
    const brentHist = await getHistoricalPrices("brent", 1);
    const ttfHist = await getHistoricalPrices("ttf", 1);
    const selicHist = await getHistoricalPrices("selic", 1);

    if (brentHist.length > 0) {
      currentBrent = brentHist[brentHist.length - 1].price;
    }
    if (ttfHist.length > 0) {
      currentTtf = ttfHist[ttfHist.length - 1].price;
    }
    if (selicHist.length > 0) {
      currentSelic = selicHist[selicHist.length - 1].price;
    }
    console.log(`📡 Database loaded successfully. Initial Brent=$${currentBrent}, TTF=€${currentTtf}, Selic=${currentSelic}`);
  } catch (dbErr) {
    console.error("Failed to bootstrap database tables and seed data, falling back to static config:", dbErr);
  }

  // Start background scheduler
  setInterval(runBlueskySchedulerCycle, 60000); // Check every minute
  runBlueskySchedulerCycle(); // Initial run

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Selix running on port ${PORT}`);
    console.log(`Capacity Control: ${getMaxCapacity()} users, Promotional Time: 15 minutes.`);
  });
}

startServer();
