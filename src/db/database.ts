import sqlite3Pkg from "sqlite3";
import path from "path";

const { Database } = sqlite3Pkg;
const dbPath = path.resolve(process.cwd(), "selix.db");

let dbInstance: any = null;

export function getDb() {
  if (!dbInstance) {
    dbInstance = new Database(dbPath);
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
}
