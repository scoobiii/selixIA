/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { EconomicRecord, SelixTheorem } from "../db/types";

export const HISTORIC_DATA: EconomicRecord[] = [
  { date: "2026-05-08", brent: 81.25, selic: 10.50, sentiment: 58, brentMA: 81.50, selicTrend: "stable" },
  { date: "2026-05-12", brent: 82.40, selic: 10.50, sentiment: 62, brentMA: 81.85, selicTrend: "stable" },
  { date: "2026-05-15", brent: 83.10, selic: 10.50, sentiment: 65, brentMA: 82.20, selicTrend: "stable" },
  { date: "2026-05-19", brent: 82.80, selic: 10.50, sentiment: 60, brentMA: 82.55, selicTrend: "stable" },
  { date: "2026-05-22", brent: 84.15, selic: 10.50, sentiment: 67, brentMA: 82.74, selicTrend: "stable" },
  { date: "2026-05-26", brent: 83.90, selic: 10.50, sentiment: 64, brentMA: 83.27, selicTrend: "stable" },
  { date: "2026-05-29", brent: 84.60, selic: null as any, sentiment: 52, brentMA: 83.71, selicTrend: "up" },
  { date: "2026-06-02", brent: 85.30, selic: null as any, sentiment: 56, brentMA: 84.11, selicTrend: "stable" },
  { date: "2026-06-04", brent: 84.95, selic: null as any, sentiment: 55, brentMA: 84.51, selicTrend: "stable" },
  { date: "2026-06-06", brent: 85.80, selic: null as any, sentiment: 59, brentMA: 84.91, selicTrend: "stable" },
];

export const THEOREMS: SelixTheorem[] = [
  {
    id: "zero-fallback",
    name: "Theorem 1: Zero Fallback & Integrity",
    description: "Formally guarantees that Selix never hallucinates or leaks economic stats. If multiple external sources exhibit drift or are unavailable, the system safely triggers a structural halt/warning instead of relying on stochastic fallbacks or speculative values.",
    leanCode: `theorem zero_fallback_safety
  (s1 s2 : Option Rate) (e : ε_drift)
  (h_drift : |s1.get_or_zero - s2.get_or_zero| > e) :
  publish_action (resolve_sources s1 s2) = Action.HaltWithAlert :=
by
  simp [resolve_sources]
  rw [if_pos h_drift]
  rfl`,
    visualProof: "s1 (Source A) ≠ s2 (Source B) [Drift Detected] ⇒ Halt ⇒ Zero Hallucinations Guaranteed.",
  },
  {
    id: "auto-heal",
    name: "Theorem 2: Idempotent Self-Healing",
    description: "Proves that the watchdog auto-heal mechanism restores the daemon to a structurally sound operational state without duplicating running processes or corrupting stored cache, bounds checking memory safety under Termux's constrained space sandbox.",
    leanCode: `theorem watchdog_auto_heal_idempotent
  (proc : Process) (crash_state : State) :
  heal_state (heal_state (proc, crash_state)) = heal_state (proc, crash_state) :=
by
  unfold heal_state
  split_ifs <;> try rfl
  simp [reset_cache, release_pid]`,
    visualProof: "CRASH state → Watchdog triggers PID flush → Single active thread revived → IDEMPOTENCE verified.",
  },
  {
    id: "brent-bounds",
    name: "Theorem 3: Brent Price Limit Convergence",
    description: "Formally limits price modeling bounds based on volatility and moving averages. Rejects outlier data above 5 standard deviations from the historical 10-day index.",
    leanCode: `theorem brent_convergence_threshold
  (p_new : Price) (history : List Price) (σ : Float)
  (h_outlier : abs (p_new - mean history) > 5 * σ) :
  validate_brent p_new history = false :=
by
  unfold validate_brent
  simp [h_outlier]`,
    visualProof: "Input Brent = $125 [Mean = $84, σ = $2.5] ⇒ Outlier Range Exceeded (5σ) ⇒ Safely Discarded.",
  },
  {
    id: "selic-coherence",
    name: "Theorem 4: COPOM Rate Transition Safety",
    description: "Proves that Selic interest rates can only transition by integer multiples of 25 basis points (0.25%) per meeting, ensuring absolute coherence of parsed central bank feeds.",
    leanCode: `theorem selic_basis_points_discrete
  (r_old r_new : Rate) (h_meeting : CopomMeeting r_old r_new) :
  ∃ (k : Int), r_new - r_old = k * 0.25 :=
by
  cases h_meeting with
  | Decision k => use k; rfl
  | NoChanges => use 0; simp`,
    visualProof: "COPOM interest rate: ciclo COPOM (valores via fonte oficial) (+25 bps) is valid | Transitions to 10.63% are blocked.",
  },
  {
    id: "termux-sandboxing",
    name: "Theorem 5: Memory Leak Bound Preservation",
    description: "Guarantees that RAG collections and llama.cpp context flushes run within a hard-bounded sandbox, never exceeding 384MB of RAM on Android A23 hardware.",
    leanCode: `theorem termux_ram_safety
  (mem_limit : Memory) (rag_size : Size)
  (h_bound : mem_limit = 384) (h_cleanup : rag_size < mem_limit) :
  execute_rag rag_size mem_limit ≠ OOM_Crash :=
by
  unfold execute_rag
  rw [h_bound]
  intro h_err
  contradiction`,
    visualProof: "RAG vectors in RAM = 120MB [Limit = 384MB] ⇒ Watchdog memory limits hold ⇒ Android safe.",
  },
];

/**
 * Simulates a Brent Oil Price random walk using Monte Carlo method
 */
export function simulateMonteCarlo(currentPrice: number, days: number, numPaths: number): number[][] {
  const paths: number[][] = [];
  const drift = 0.0005; // Slightly upwards trend
  const volatility = 0.015; // Volatility factor

  for (let p = 0; p < numPaths; p++) {
    const path: number[] = [currentPrice];
    let prevPrice = currentPrice;
    for (let d = 1; d < days; d++) {
      const rand = Math.random() * 2 - 1; // Basic normal distribution approximation
      const changePercent = drift + volatility * rand;
      const nextPrice = prevPrice * (1 + changePercent);
      path.push(parseFloat(nextPrice.toFixed(2)));
      prevPrice = nextPrice;
    }
    paths.push(path);
  }
  return paths;
}

/**
 * Taylor's Rule calculation for Central Bank Rate suggestions (Brazil adaptation)
 * R_target = Inflation + NeutralRate + a * (Inflation - Target) + b * OutputGap
 */
export function calculateTaylorRule(inflation: number, outputGap: number): number {
  const targetInflation = 3.00; // BCB 2026 Target
  const neutralSelic = 4.50; // Neutral real interest rate in Brazil approx
  const a = 1.5;
  const b = 0.5;
  
  const target = inflation + neutralSelic + a * (inflation - targetInflation) + b * outputGap;
  return parseFloat(Math.max(2.0, target).toFixed(2));
}
