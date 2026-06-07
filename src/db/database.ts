import fs from "fs";
import path from "path";

class PureJSONDatabase {
  private filePath: string;
  private data: {
    prices: any[];
    waitlist: any[];
    users: any[];
  } = { prices: [], waitlist: [], users: [] };

  constructor(filePath: string) {
    this.filePath = filePath;
    this.loadData();
  }

  private loadData() {
    try {
      if (fs.existsSync(this.filePath)) {
        const fileContent = fs.readFileSync(this.filePath, "utf-8");
        this.data = JSON.parse(fileContent);
        if (!this.data.prices) this.data.prices = [];
        if (!this.data.waitlist) this.data.waitlist = [];
        if (!this.data.users) this.data.users = [];
      } else {
        this.saveDataToDisk();
      }
    } catch (err) {
      console.error("Failed to load Pure JSON database:", err);
      this.data = { prices: [], waitlist: [], users: [] };
    }
  }

  private saveDataToDisk() {
    try {
      const dir = path.dirname(this.filePath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      fs.writeFileSync(this.filePath, JSON.stringify(this.data, null, 2), "utf-8");
    } catch (err) {
      console.error("Failed to save Pure JSON database to disk:", err);
    }
  }

  serialize(callback: () => void) {
    try {
      callback();
    } catch (err) {
      console.error("Error in serialize block:", err);
    }
  }

  run(sql: string, params: any[] | any, callback?: any) {
    let actualParams: any[] = [];
    let cb: any = null;

    if (typeof params === "function") {
      cb = params;
    } else if (Array.isArray(params)) {
      actualParams = params;
      cb = callback;
    } else if (params !== undefined) {
      actualParams = [params];
      cb = callback;
    }

    try {
      const canonicalSql = sql.trim().replace(/\s+/g, " ").toUpperCase();

      if (canonicalSql.includes("CREATE TABLE IF NOT EXISTS PRICES")) {
        if (cb) setTimeout(() => cb(null), 0);
        return this;
      }

      if (canonicalSql.includes("CREATE TABLE IF NOT EXISTS WAITLIST")) {
        if (cb) setTimeout(() => cb(null), 0);
        return this;
      }

      if (canonicalSql.includes("INSERT INTO WAITLIST")) {
        const [name, phone, handle, timestamp] = actualParams;
        const newEntry = {
          id: this.data.waitlist.length + 1,
          name,
          phone,
          handle,
          timestamp: timestamp || new Date().toISOString()
        };
        this.data.waitlist.push(newEntry);
        this.saveDataToDisk();
        if (cb) setTimeout(() => cb(null), 0);
        return this;
      }

      if (canonicalSql.includes("INSERT OR REPLACE INTO PRICES") || canonicalSql.includes("INSERT INTO PRICES")) {
        const [asset, price, timestamp] = actualParams;
        
        // Emulate UNIQUE(asset, timestamp) ON CONFLICT REPLACE
        const existingIdx = this.data.prices.findIndex(
          p => p.asset === asset && p.timestamp === timestamp
        );

        if (existingIdx !== -1) {
          this.data.prices[existingIdx].price = price;
        } else {
          const newPrice = {
            id: this.data.prices.length + 1,
            asset,
            price,
            timestamp
          };
          this.data.prices.push(newPrice);
        }
        
        this.saveDataToDisk();
        if (cb) setTimeout(() => cb(null), 0);
        return this;
      }

      console.warn("Unrecognized write query in JSON database:", sql);
      if (cb) setTimeout(() => cb(null), 0);
    } catch (err) {
      console.error("Error in database.run:", err);
      if (cb) setTimeout(() => cb(err), 0);
    }
    return this;
  }

  all(sql: string, params: any[] | any, callback?: any) {
    let actualParams: any[] = [];
    let cb: any = null;

    if (typeof params === "function") {
      cb = params;
    } else if (Array.isArray(params)) {
      actualParams = params;
      cb = callback;
    } else if (params !== undefined) {
      actualParams = [params];
      cb = callback;
    }

    try {
      const canonicalSql = sql.trim().replace(/\s+/g, " ").toUpperCase();

      if (canonicalSql.includes("SELECT * FROM WAITLIST")) {
        const sortedWaitlist = [...this.data.waitlist].sort((a, b) => b.id - a.id);
        if (cb) setTimeout(() => cb(null, sortedWaitlist), 0);
        return this;
      }

      if (canonicalSql.includes("SELECT PRICE, TIMESTAMP FROM PRICES")) {
        const asset = actualParams[0];
        const limit = actualParams[1] || 30;

        const filtered = this.data.prices
          .filter(p => p.asset === asset)
          .sort((a, b) => b.timestamp.localeCompare(a.timestamp))
          .slice(0, limit);

        if (cb) setTimeout(() => cb(null, filtered), 0);
        return this;
      }

      console.warn("Unrecognized read query in JSON database:", sql);
      if (cb) setTimeout(() => cb(null, []), 0);
    } catch (err) {
      console.error("Error in database.all:", err);
      if (cb) setTimeout(() => cb(err, []), 0);
    }
    return this;
  }
}

const dbPath = path.resolve(process.cwd(), "selix_db.json");
let dbInstance: PureJSONDatabase | null = null;

export function getDb() {
  if (!dbInstance) {
    dbInstance = new PureJSONDatabase(dbPath);
  }
  return dbInstance;
}

export function initDb(): Promise<void> {
  return new Promise((resolve, reject) => {
    const db = getDb();
    db.serialize(() => {
      // Create price history table
      db.run(
        `CREATE TABLE IF NOT EXISTS prices (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          asset TEXT NOT NULL,
          price REAL NOT NULL,
          timestamp TEXT NOT NULL,
          UNIQUE(asset, timestamp) ON CONFLICT REPLACE
        )`,
        (err: any) => {
          if (err) {
            console.error("SQLite initial schema table failure:", err);
            return reject(err);
          }
        }
      );

      // Create waitlist table for users wanting access when server is >90% busy
      db.run(
        `CREATE TABLE IF NOT EXISTS waitlist (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          name TEXT NOT NULL,
          phone TEXT NOT NULL,
          handle TEXT NOT NULL,
          timestamp TEXT NOT NULL
        )`,
        (err: any) => {
          if (err) {
            console.error("SQLite initial schema waitlist failure:", err);
            return reject(err);
          }
          resolve();
        }
      );
    });
  });
}

export function addWaitlistEntry(name: string, phone: string, handle: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const db = getDb();
    const timestamp = new Date().toISOString();
    db.run(
      `INSERT INTO waitlist (name, phone, handle, timestamp) VALUES (?, ?, ?, ?)`,
      [name, phone, handle, timestamp],
      (err: any) => {
        if (err) {
          console.error("SQLite failed to save waitlist entry:", err);
          return reject(err);
        }
        resolve();
      }
    );
  });
}

export function getWaitlistEntries(): Promise<any[]> {
  return new Promise((resolve, reject) => {
    const db = getDb();
    db.all(`SELECT * FROM waitlist ORDER BY id DESC`, (err: any, rows: any[]) => {
      if (err) {
        console.error("SQLite failed to query waitlist:", err);
        return reject(err);
      }
      resolve(rows || []);
    });
  });
}

export function savePrice(asset: string, price: number, timestamp?: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const db = getDb();
    const ts = timestamp || new Date().toISOString().split("T")[0]; // YYYY-MM-DD
    db.run(
      `INSERT OR REPLACE INTO prices (asset, price, timestamp) VALUES (?, ?, ?)`,
      [asset, parseFloat(price.toFixed(4)), ts],
      (err: any) => {
        if (err) {
          console.error(`SQLite SAVE failed for ${asset}:`, err);
          return reject(err);
        }
        resolve();
      }
    );
  });
}

export function getHistoricalPrices(asset: string, limit = 30): Promise<{ price: number; timestamp: string }[]> {
  return new Promise((resolve, reject) => {
    const db = getDb();
    db.all(
      `SELECT price, timestamp FROM prices WHERE asset = ? ORDER BY timestamp DESC LIMIT ?`,
      [asset, limit],
      (err: any, rows: any[]) => {
        if (err) {
          console.error(`SQLite query failing for asset ${asset}:`, err);
          return reject(err);
        }
        // Return sorted chronologically (ascending list)
        const sorted = (rows || []).map(row => ({
          price: row.price,
          timestamp: row.timestamp
        })).reverse();
        resolve(sorted);
      }
    );
  });
}

// Fetch historical data from public APIs and load them into SQLite
export async function seedFromPublicApis(): Promise<void> {
  console.log("⚡ SELIX seeding service started. Querying real-time public assets...");
  
  const userAgent = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";

  // 1. Brent Crude Oil (BZ=F)
  try {
    const res = await fetch(`https://query1.finance.yahoo.com/v8/finance/chart/BZ=F?interval=1d&range=3mo`, {
      headers: { "User-Agent": userAgent }
    });
    if (res.ok) {
      const data: any = await res.json();
      const chartResult = data.chart?.result?.[0];
      if (chartResult) {
        const timestamps = chartResult.timestamp || [];
        const closes = chartResult.indicators?.quote?.[0]?.close || [];
        let seedCount = 0;
        for (let i = 0; i < timestamps.length; i++) {
          const price = closes[i];
          const ts = timestamps[i];
          if (price !== null && price !== undefined && ts) {
            const dateStr = new Date(ts * 1000).toISOString().split("T")[0];
            await savePrice("brent", price, dateStr);
            seedCount++;
          }
        }
        console.log(`✅ SQLite: Brent successfully seeded with ${seedCount} real price ticks.`);
      }
    } else {
      console.warn("⚠️ Brent fetch status not OK from Yahoo Finance:", res.status);
    }
  } catch (err) {
    console.error("❌ Failed to query/seed Brent Crude Oil:", err);
  }

  // 2. Dutch TTF Natural Gas (TTF=F)
  try {
    const res = await fetch(`https://query1.finance.yahoo.com/v8/finance/chart/TTF=F?interval=1d&range=3mo`, {
      headers: { "User-Agent": userAgent }
    });
    if (res.ok) {
      const data: any = await res.json();
      const chartResult = data.chart?.result?.[0];
      if (chartResult) {
        const timestamps = chartResult.timestamp || [];
        const closes = chartResult.indicators?.quote?.[0]?.close || [];
        let seedCount = 0;
        for (let i = 0; i < timestamps.length; i++) {
          const price = closes[i];
          const ts = timestamps[i];
          if (price !== null && price !== undefined && ts) {
            const dateStr = new Date(ts * 1000).toISOString().split("T")[0];
            await savePrice("ttf", price, dateStr);
            seedCount++;
          }
        }
        console.log(`✅ SQLite: TTF Gas successfully seeded with ${seedCount} real price ticks.`);
      }
    } else {
      console.warn("⚠️ TTF Gas fetch status not OK from Yahoo Finance:", res.status);
    }
  } catch (err) {
    console.error("❌ Failed to query/seed TTF Gas:", err);
  }

  // 3. Brazil Selic Rate (COPOM meta - Series 432)
  try {
    const res = await fetch(`https://api.bcb.gov.br/dados/serie/bcdata.sgs.432/dados/ultimos/45?formato=json`, {
      headers: { "User-Agent": userAgent }
    });
    if (res.ok) {
      const rows: any = await res.json();
      if (Array.isArray(rows)) {
        let seedCount = 0;
        for (const row of rows) {
          if (row.data && row.valor) {
            const p = row.data.split("/");
            if (p.length === 3) {
              const dateStr = `${p[2]}-${p[1]}-${p[0]}`;
              const val = parseFloat(row.valor);
              await savePrice("selic", val, dateStr);
              seedCount++;
            }
          }
        }
        console.log(`✅ SQLite: Selic rate successfully seeded with ${seedCount} historic points.`);
      }
    } else {
      console.warn("⚠️ BCB Selic fetch status not OK:", res.status);
    }
  } catch (err) {
    console.error("❌ Failed to query/seed Selic rates:", err);
  }

  // 4. B3 listed distressed assets under Judicial Recovery (Recuperação Judicial - R.J.) via Yahoo Finance
  const rjTickers = ["AMER3.SA", "LIGT3.SA", "OIBR3.SA", "GOLL4.SA", "PMAM3.SA", "BHIA3.SA", "RAIZ4.SA"];
  console.log("⚡ Indexing official Yahoo Finance for Judicial Recovery (R.J.) stock prices...");
  for (const ticker of rjTickers) {
    try {
      const dbKey = ticker.replace(".SA", "").toLowerCase(); // "amer3", "ligt3", etc.
      const res = await fetch(`https://query1.finance.yahoo.com/v8/finance/chart/${ticker}?interval=1d&range=5d`, {
        headers: { "User-Agent": userAgent }
      });
      if (res.ok) {
        const data: any = await res.json();
        const chartResult = data.chart?.result?.[0];
        if (chartResult) {
          const closes = chartResult.indicators?.quote?.[0]?.close || [];
          const timestamps = chartResult.timestamp || [];
          // Find the last valid non-null close price
          let latestPrice: number | null = null;
          let latestDateStr = new Date().toISOString().split("T")[0];

          for (let i = closes.length - 1; i >= 0; i--) {
            if (closes[i] !== null && closes[i] !== undefined) {
              latestPrice = closes[i];
              if (timestamps[i]) {
                latestDateStr = new Date(timestamps[i] * 1000).toISOString().split("T")[0];
              }
              break;
            }
          }

          if (latestPrice !== null) {
            await savePrice(dbKey, latestPrice, latestDateStr);
            console.log(`✅ SQLite: Recuperação Judicial stock ${ticker} updated to R$ ${latestPrice.toFixed(2)} on ${latestDateStr}.`);
          }
        }
      } else {
        console.warn(`⚠️ RJ Ticker ${ticker} fetch status not OK from Yahoo Finance: ${res.status}`);
      }
    } catch (err) {
      console.error(`❌ Failed to query/seed ${ticker} daily price:`, err);
    }
  }
}

export function saveDbUser(user: any): Promise<void> {
  return new Promise((resolve) => {
    const db = getDb() as any;
    if (!db.data.users) db.data.users = [];
    const idx = db.data.users.findIndex((u: any) => u.email === user.email);
    if (idx !== -1) {
      db.data.users[idx] = { ...db.data.users[idx], ...user };
    } else {
      db.data.users.push(user);
    }
    db.saveDataToDisk();
    resolve();
  });
}

export function getDbUserByEmail(email: string): Promise<any | null> {
  return new Promise((resolve) => {
    const db = getDb() as any;
    if (!db.data.users) db.data.users = [];
    const found = db.data.users.find((u: any) => u.email === email);
    resolve(found || null);
  });
}

