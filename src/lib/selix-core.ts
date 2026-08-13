/**
 * Fonte Única de Verdade do SELIX.
 * Nunca hardcode Selic ideal / diferencial / selic atual aqui.
 * Sempre lê do snapshot oficial.
 */

export type OfficialSnapshot = {
  selic_ideal: number;
  diferencial: number;
  selic_atual: number;
  fonte: string;
  versao: string;
  updated_at: string;
  disclaimer?: string;
};

const OFFICIAL_URL =
  "https://raw.githubusercontent.com/scoobiii/selix/main/public/selix-official.json";

export async function getOfficialSnapshot(): Promise<OfficialSnapshot> {
  const res = await fetch(OFFICIAL_URL, { cache: "no-store" });
  if (!res.ok) {
    throw new Error(`Falha ao carregar snapshot oficial: ${res.status}`);
  }
  return res.json();
}
