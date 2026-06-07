/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface EconomicRecord {
  date: string;
  brent: number;       // USD / barrel
  selic: number;       // Annual percentage rate %
  sentiment: number;   // 0 (Extreme Pessimism) to 100 (Extreme Optimism)
  brentMA?: number;    // Brent Moving Average (e.g. 5-day)
  selicTrend?: "stable" | "up" | "down";
}

export type LogLevel = "INFO" | "WARN" | "SUCCESS" | "CRITICAL";
export type LogCategory = "WATCHDOG" | "CRAWLER" | "RAG" | "BLUESKY" | "SYSTEM";

export interface LogEntry {
  id: string;
  timestamp: string;
  level: LogLevel;
  category: LogCategory;
  message: string;
}

export interface BlueskyPost {
  text: string;
  uri?: string;
  cid?: string;
}

export interface BlueskyThread {
  id: string;
  timestamp: string;
  posts: BlueskyPost[];
  likes: number;
  reposts: number;
  replies: number;
  automated: boolean;
}

export interface WatchdogState {
  isActive: boolean;
  status: "idle" | "running" | "healing" | "alert";
  lastCheck: string;
  hardware: {
    processor: string;
    ramTotal: string;
    ramUsed: number; // MB
    cpuTemp: number; // °C
    os: string;
  };
  zeroFallbackStats: {
    dataRequests: number;
    fallbackActivations: number;
    validatedMatches: number;
  };
}

export interface SelixTheorem {
  id: string;
  name: string;
  description: string;
  leanCode: string;
  visualProof: string;
}
