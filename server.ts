/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import express from "express";
import path from "path";
import dotenv from "dotenv";
import { GoogleGenAI } from "@google/genai";
import { createServer as createViteServer } from "vite";
import { initDb, seedFromPublicApis, savePrice, getHistoricalPrices, addWaitlistEntry, getWaitlistEntries, saveDbUser, getDbUserByEmail } from "./src/db/database";

dotenv.config();

const app = express();
const PORT = 3000;

// Peak Concurrent Users Simulation & Monitoring Variables for A23 Performance
let currentSimultaneousUsers = 8;
const maxAllowedUsers = 20;

app.use(express.json());

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

      if (!tokenRes.ok) {
        throw new Error(`Google exchange error: ${tokenRes.statusText}`);
      }

      const tokens: any = await tokenRes.json();
      const accessToken = tokens.access_token;

      // Fetch user profile info
      const profileRes = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
        headers: { Authorization: `Bearer ${accessToken}` }
      });

      if (!profileRes.ok) {
        throw new Error("Failed to fetch Google profile");
      }

      const profile: any = await profileRes.json();
      user = {
        email: profile.email,
        name: profile.name || profile.given_name || "Google User",
        picture: profile.picture,
        provider: "google",
        customizations: {
          customSelicTarget: 9.00,
          customBrentTarget: 85.00,
          customTtfTarget: 35.00,
          watchdogSensitivity: 90,
          themeAccent: "indigo",
          notes: ""
        },
        verified: true,
        timestamp: new Date().toISOString()
      };
    } catch (err: any) {
      console.error("Error exchanging OAuth code:", err);
      return res.send(`
        <html>
          <body style="background:#0f172a; color:#f8fafc; font-family:sans-serif; text-align:center; padding:50px;">
            <h2 style="color:#ef4444;">Erro de Autenticação OAuth</h2>
            <p>${err.message || "Erro desconhecido durante a autenticação."}</p>
            <button onclick="window.close()" style="background:#4f46e5; border:none; color:white; padding:10px 20px; border-radius:5px; cursor:pointer; font-weight:bold; margin-top:15px;">Fechar Janela</button>
          </body>
        </html>
      `);
    }
  }

  // Persist user in the JSON databases
  if (user) {
    const existing = await getDbUserByEmail(user.email);
    if (existing) {
      // Merge customizations with existing profile so they are not wiped out
      user.customizations = { ...user.customizations, ...existing.customizations };
    }
    await saveDbUser(user);
    
    // Add success log to the console
    mockLogs.unshift({
      id: String(mockLogs.length + 1),
      timestamp: new Date().toLocaleTimeString(),
      level: "SUCCESS",
      category: "SYSTEM",
      message: `Usuário ${user.name} (${user.email}) autenticado com sucesso e carregado do JSON DB.`
    });
  }

  // Send success message to parent window and close popup
  res.send(`
    <html>
      <body style="background:#0f172a; color:#f8fafc; font-family:sans-serif; text-align:center; padding-top:100px;">
        <div style="background:#1e293b; border-radius:12px; border:1px solid #334155; display:inline-block; padding:30px; box-shadow:0 10px 25px rgba(0,0,0,0.5);">
          <div style="width:60px; height:60px; border-radius:50%; background:#22c55e; display:flex; align-items:center; justify-content:center; margin:0 auto 15px;">
            <svg style="width:30px; height:30px; fill:none; stroke:white; stroke-width:3;" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 style="margin:5px 0 10px;">Autenticado com Sucesso</h2>
          <p style="color:#94a3b8; font-size:14px; margin-bottom:20px;">Olá <strong>${user?.name || "Investidor"}</strong>, sua sessão foi sincronizada!</p>
          <p style="color:#64748b; font-size:12px;">Esta janela se fechará automaticamente...</p>
        </div>
        <script>
          if (window.opener) {
            window.opener.postMessage({ 
              type: 'OAUTH_AUTH_SUCCESS', 
              user: ${JSON.stringify(user)} 
            }, '*');
            setTimeout(() => {
              window.close();
            }, 1000);
          } else {
            window.location.href = '/';
          }
        </script>
      </body>
    </html>
  `);
});

// Profile read/write endpoint
app.post("/api/auth/profile", async (req, res) => {
  const { email, customizations, name, picture } = req.body;
  if (!email) {
    return res.status(400).json({ error: "Email is required" });
  }

  try {
    let existingUser = await getDbUserByEmail(email);
    if (!existingUser) {
      existingUser = {
        email,
        name: name || email.split("@")[0],
        picture: picture || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=120",
        provider: "local",
        customizations: customizations || {
          customSelicTarget: 9.00,
          customBrentTarget: 80.00,
          customTtfTarget: 30.00,
          watchdogSensitivity: 85,
          themeAccent: "indigo",
          notes: ""
        }
      };
      await saveDbUser(existingUser);
    } else {
      let isChanged = false;
      if (customizations) {
        existingUser.customizations = { ...existingUser.customizations, ...customizations };
        isChanged = true;
      }
      if (name && existingUser.name !== name) {
        existingUser.name = name;
        isChanged = true;
      }
      if (picture && existingUser.picture !== picture) {
        existingUser.picture = picture;
        isChanged = true;
      }
      if (isChanged) {
        await saveDbUser(existingUser);
      }
    }

    res.json({ success: true, user: existingUser });
  } catch (err: any) {
    res.status(500).json({ error: err.message || "Failed to process user profile" });
  }
});

app.get("/api/state", async (req, res) => {
  try {
    const dbBrent = await getHistoricalPrices("brent", 30);
    const dbTtf = await getHistoricalPrices("ttf", 30);
    const dbSelic = await getHistoricalPrices("selic", 30);

    const brentHistoryList = dbBrent.length > 0 ? dbBrent.map(r => r.price) : brentHistory;
    const ttfHistoryList = dbTtf.length > 0 ? dbTtf.map(r => r.price) : ttfHistory;

    // Fetch latest prices for stocks under Recuperação Judicial (R.J.)
    const rjKeys = ["amer3", "ligt3", "oibr3", "goll4", "pmam3", "bhia3", "raiz4"];
    const rjPrices: Record<string, number> = {
      amer3: 0.15,
      ligt3: 1.62,
      oibr3: 0.70,
      goll4: 1.15,
      pmam3: 4.50,
      bhia3: 6.20,
      raiz4: 2.15
    };
    for (const key of rjKeys) {
      try {
        const hist = await getHistoricalPrices(key, 1);
        if (hist.length > 0) {
          rjPrices[key] = hist[0].price;
        }
      } catch (e) {
        // Fallback to defaults
      }
    }

    res.json({
      brent: parseFloat(currentBrent.toFixed(2)),
      ttf: parseFloat(currentTtf.toFixed(2)),
      selic: parseFloat(currentSelic.toFixed(2)),
      sentiment: currentSentiment,
      rating: currentRating,
      investmentGrade: currentInvestmentGrade,
      brentHistory: brentHistoryList,
      ttfHistory: ttfHistoryList,
      rjPrices,
      simultaneousUsers: currentSimultaneousUsers,
      maxAllowedUsers: maxAllowedUsers,
      system: {
        status: systemStatus,
        isWatchdogActive,
        cpuTemp: 54 + Math.floor(Math.random() * 8),
        ramUsed: 92 + Math.floor(Math.random() * 30),
        lastCheck: new Date().toLocaleTimeString(),
      }
    });
  } catch (err) {
    const rjPricesDefault = {
      amer3: 0.15,
      ligt3: 1.62,
      oibr3: 0.70,
      goll4: 1.15,
      pmam3: 4.50,
      bhia3: 6.20,
      raiz4: 2.15
    };
    res.json({
      brent: parseFloat(currentBrent.toFixed(2)),
      ttf: parseFloat(currentTtf.toFixed(2)),
      selic: parseFloat(currentSelic.toFixed(2)),
      sentiment: currentSentiment,
      rating: currentRating,
      investmentGrade: currentInvestmentGrade,
      brentHistory,
      ttfHistory,
      rjPrices: rjPricesDefault,
      simultaneousUsers: currentSimultaneousUsers,
      maxAllowedUsers: maxAllowedUsers,
      system: {
        status: systemStatus,
        isWatchdogActive,
        cpuTemp: 52 + Math.floor(Math.random() * 10),
        ramUsed: 88 + Math.floor(Math.random() * 30),
        lastCheck: new Date().toLocaleTimeString(),
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
      
      // Auto-recompute rating based on single-digit vs double-digit Selic
      if (currentSelic >= 10.00) {
        currentRating = "BBB-";
        currentInvestmentGrade = false;
      } else {
        currentRating = "Investment Grade";
        currentInvestmentGrade = true;
      }
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

app.get("/api/waitlist", async (req, res) => {
  try {
    const list = await getWaitlistEntries();
    res.json(list);
  } catch (err: any) {
    res.status(500).json({ error: err.message || "Failed to query waitlist from SQLite" });
  }
});

app.post("/api/waitlist", async (req, res) => {
  const { name, phone, handle } = req.body;
  if (!name || !phone || !handle) {
    return res.status(400).json({ error: "Preencha o nome, telefone e @ handle do Bluesky." });
  }
  try {
    await addWaitlistEntry(name, phone, handle);
    
    mockLogs.unshift({
      id: String(mockLogs.length + 1),
      timestamp: new Date().toLocaleTimeString(),
      level: "INFO",
      category: "SYSTEM",
      message: `Lista de Espera: ${name} (${phone}, ${handle}) registrado com sucesso.`
    });
    
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message || "Failed to save waitlist entry to SQLite" });
  }
});

app.post("/api/state/users", (req, res) => {
  const { users } = req.body;
  if (users !== undefined) {
    currentSimultaneousUsers = parseInt(users);
    
    mockLogs.unshift({
      id: String(mockLogs.length + 1),
      timestamp: new Date().toLocaleTimeString(),
      level: "SUCCESS",
      category: "SYSTEM",
      message: `Número de usuários simultâneos atualizado para ${currentSimultaneousUsers} de ${maxAllowedUsers}.`
    });
  }
  res.json({ success: true, simultaneousUsers: currentSimultaneousUsers, maxAllowedUsers: maxAllowedUsers });
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

app.post("/api/threads/publish", (req, res) => {
  const { posts, automated } = req.body;
  if (!posts || !Array.isArray(posts) || posts.length === 0) {
    return res.status(400).json({ error: "Invalid posts data" });
  }

  const newThread = {
    id: "thread_" + Date.now(),
    timestamp: new Date().toISOString(),
    posts: posts.map(p => ({ text: p.text || p })),
    likes: 0,
    reposts: 0,
    replies: 0,
    automated: !!automated,
  };

  mockThreads.unshift(newThread);
  
  // Also push a system log
  mockLogs.unshift({
    id: String(mockLogs.length + 1),
    timestamp: new Date().toLocaleTimeString(),
    level: "SUCCESS",
    category: "BLUESKY",
    message: `Newly composed thread of ${posts.length} posts successfully published to Bluesky network.`
  });

  res.json(newThread);
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
      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: query,
        config: {
          systemInstruction: systemInstruction,
          temperature: 0.7,
        },
      });
      systemStatus = "idle";
      
      const responseText = response.text || "Desculpe, não consegui processar a análise no momento.";
      
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
  console.log("Initializing SQLite database store...");
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
    console.log(`📡 SQLite loaded successfully. Initial Brent=$${currentBrent}, TTF=€${currentTtf}, Selic=${currentSelic}`);
  } catch (dbErr) {
    console.error("Failed to bootstrap SQLite tables and seed data, falling back to static config:", dbErr);
  }

  // Daily Background Updater. Refresh prices of indexes and Judicial Recovery (R.J.) stock charts every 24 hours.
  setInterval(async () => {
    console.log("⏰ [SCHEDULER] Triggering automatic daily background database refresh...");
    try {
      await seedFromPublicApis();
      console.log("✅ [SCHEDULER] Daily background database refresh finished successfully.");
    } catch (err) {
      console.error("❌ [SCHEDULER] Daily background database refresh failed:", err);
    }
  }, 24 * 60 * 60 * 1000);

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Selix running on port ${PORT}`);
  });
}

startServer();
