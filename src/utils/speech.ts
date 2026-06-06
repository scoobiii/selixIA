/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

let isMutedGlobal = false;

export function setMuteState(muted: boolean) {
  isMutedGlobal = muted;
  if (muted && typeof window !== "undefined" && window.speechSynthesis) {
    window.speechSynthesis.cancel();
  }
}

export function getMuteState(): boolean {
  return isMutedGlobal;
}

export function speak(text: string, force = false, onStart?: () => void, onEnd?: () => void) {
  if (typeof window === "undefined" || !window.speechSynthesis) {
    return;
  }

  if (isMutedGlobal && !force) {
    return;
  }

  // Cancel any ongoing speaking to prevent stacked queue issues
  window.speechSynthesis.cancel();

  const utterance = new SpeechSynthesisUtterance(text);
  
  // Set language to Brazilian Portuguese primarily, look for suitable voices if available
  utterance.lang = "pt-BR";
  
  // Give it a tech/AI personality (slightly higher pitch, standard rate)
  utterance.rate = 1.05;
  utterance.pitch = 1.0;

  if (onStart) {
    utterance.onstart = () => onStart();
  }
  if (onEnd) {
    utterance.onend = () => onEnd();
    utterance.onerror = () => onEnd();
  }

  // Try to find a nice female/male Portuguese assistant voice
  const voices = window.speechSynthesis.getVoices();
  const ptVoice = voices.find(v => v.lang.startsWith("pt") || v.lang.includes("PT"));
  if (ptVoice) {
    utterance.voice = ptVoice;
  }

  window.speechSynthesis.speak(utterance);
}

export function cancelSpeech() {
  if (typeof window !== "undefined" && window.speechSynthesis) {
    window.speechSynthesis.cancel();
  }
}

export const SPEECH_GUIDES = {
  welcome: "Bem-vindo ao Selix! Sistema inteligente autônomo monitorando preços globais de petróleo Brent, gás natural europeu TTF, taxas Selic, sentimento de mercado e rating soberano com provador formal Lean quatro.",
  brent: (value: number) => `Visualizando monitor do Brent Crude Oil. Cotação atualizada em ${value.toFixed(2)} dólares por barril. Gráfico interativo com escala convexa padrão e estimativas estatísticas de Monte Carlo integradas.`,
  ttf: (value: number) => `Monitoramento do indexador de Gás Natural europeu TTF. Cotação em ${value.toFixed(2)} Euros por megawatt-hora. Crucial para rastrear choques energéticos globais que desafiam as economias emergentes.`,
  rating: (level: string, isGrade: boolean) => `Avaliação de crédito soberano nacional. Atualmente em nível ${level}. O status de grau de investimento é ${isGrade ? "ativado com sucesso graças ao amortecedor verde de preços do MME" : "procurado através de estratégias estruturais do Ministério de Minas e Energia"} com atração em massa de liquidez internacional.`,
  selic: (value: number) => `Visualizando taxa Selic a ${value.toFixed(2)} por cento ao ano. Painel inclui simulador interativo baseado na regra de Taylor para calcular a taxa de juros sugerida frente à inflação e hiato do produto.`,
  sentiment: (value: number) => `Monitorando índice de sentimento do mercado em ${value} de cem. Valor computado a partir do analisador linguístico do Selix que analisa notícias fiscais e correlação de commodities domésticas.`,
  watchdog: (status: string, ram: number) => `Console de logs do Termux em hardware limitado. Watchdog de auto-recuperação ativo no estado ${status}, consumindo atualmente ${ram} megabytes de um limite severo de trezentos e oitenta e quatro megas.`,
  theorem: (name: string, description: string) => `Apresentando Teorema matemático provado formalmente: ${name}. Esta prova matemática impede falhas lógicas e garante que o Selix nunca inventará dados na falta de fontes reais.`,
  rag_assistant: "Painel analítico integrado ao Gemini 3.5 flash. Digite perguntas econômicas ou utilize as sugestões rápidas para que o assistente cognitivo processe relatórios em tempo real.",
  bluesky: "Módulo simulador de rede social Bluesky. Componha threads de forma manual ou chame o Gemini para consolidar automaticamente novas postagens analíticas na timeline.",
  mme_scenario: "Cenário especial MME ativo. O Brent de noventa e seis dólares e o gás TTF alto são totalmente anulados pelo Ministério de Minas e Energia e Meio Ambiente via misturas Ex e Bx de biocombustíveis e gestão estratégica de biogás. O Banco Central não precisa queimar reservas cambiais ou elevar juros. Isso alivia a taxa Selic para nove vírgula vinte e cinco por cento, mantendo-a em um dígito com sucesso, alcançando o cobiçado rating de prestígio internacional A mais e consolidando o grau de investimento soberano brasileiro!",
};
