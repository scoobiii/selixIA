export interface SelixOfficialSnapshot {
  selic_ideal: number;
  diferencial: number;
  selic_atual: number;
  fonte: string;
  versao?: string;
  updated_at?: string;
  disclaimer?: string;
}

const OFFICIAL_URL =
  process.env.SELIX_OFFICIAL_URL ||
  "https://raw.githubusercontent.com/scoobiii/selix/main/public/selix-official.json";

export async function getOfficialSnapshot(): Promise<SelixOfficialSnapshot | null> {
  try {
    const res = await fetch(OFFICIAL_URL, { cache: "no-store" });
    if (!res.ok) return null;
    const data = await res.json();
    if (typeof data.selic_ideal !== "number" || typeof data.diferencial !== "number" || typeof data.selic_atual !== "number") {
      return null;
    }
    return {
      selic_ideal: data.selic_ideal,
      diferencial: data.diferencial,
      selic_atual: data.selic_atual,
      fonte: data.fonte || "src.selix.config",
      versao: data.versao,
      updated_at: data.updated_at,
      disclaimer: data.disclaimer || "Ferramenta de apoio à decisão — não substitui o COPOM.",
    };
  } catch {
    return null;
  }
}
