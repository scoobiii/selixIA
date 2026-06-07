/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface PersonaConfig {
  id: string;
  name: string;
  role: string;
  emoji: string;
  accent: "indigo" | "emerald" | "sky" | "violet" | "rose" | "amber" | "teal";
  badgeText: string;
  slogan: string;
  voiceGuide: string;
  geminiFocusPrompt: string;
  focusHighlights: string[];
}

export const SELIX_PERSONAS: PersonaConfig[] = [
  {
    id: "jornalista",
    name: "Jornalista",
    role: "Imprensa & Redação",
    emoji: "📰",
    accent: "sky",
    badgeText: "PRESSE-REPUBLIQUE",
    slogan: "Fact-checking instantâneo, manchetes polidas e textos de rápida difusão prontos para publicação.",
    voiceGuide: "Olá profissional de comunicação! Painel configurado para modo imprensa. O foco é fact-checking exato, parágrafos objetivos e copiadore rápidos para ditar o ritmo de sua redação com zero de alucinações.",
    geminiFocusPrompt: "Adote a persona de um correspondente econômico sênior da Reuters/Bloomberg. Responda com fatos curtos, manchetes de impacto fáceis de twittar ou copiar, fontes oficiais, e destaque o impacto estatístico da Selic a 1 dígito no PIB geral.",
    focusHighlights: ["Manchete Pronta", "Fact-Check de Selic", "Copiar Press Release"]
  },
  {
    id: "economista",
    name: "Economia Crítica",
    role: "Análise Social & de Viés",
    emoji: "✊",
    accent: "indigo",
    badgeText: "CRITICAL PERSPECTIVE",
    slogan: "Gráficos distributivos, impactos e desigualdade fiscal decorrente de taxas reais de juros abusivas.",
    voiceGuide: "Olá colega acadêmico! Ativando modo Economia Crítica. Vamos examinar como a contração de investimentos e asfixia de crédito concentram renda pública nas mãos de credores, asfixiando o salário real.",
    geminiFocusPrompt: "Adote o tom de um economista focado em bem-estar social, distribuição de renda e economia crítica nacional. Destaque a injustiça dos juros reais abusivos sobre a desigualdade, e como o alívio para 1 dígito reverte a asfixia fiscal dos mais vulneráveis.",
    focusHighlights: ["Gráfico de Coeficiente Gini", "Painel de Concentração", "Rentismo vs Investimento"]
  },
  {
    id: "politico",
    name: "Política & Estado",
    role: "Estratégia Parlamentar",
    emoji: "🏛️",
    accent: "rose",
    badgeText: "GOVERNABILITY CORE",
    slogan: "Popularidade, custo fiscal do endividamento público, clima eleitoral e discursos prontos.",
    voiceGuide: "Saudações, estrategista! Modo governabilidade civil ativo. O painel agora foca em projetar os ganhos de aprovação com juros baixos e de que forma Selic de dois dígitos desgasta o capital eleitoral municipal.",
    geminiFocusPrompt: "Adote o linguajar refinado e diplomático de um estrategista político e assessor parlamentar sênior. Foque na narrativa de governabilidade, desgaste de votos por asfixia de crédito, e economia de orçamento público com juros baixos.",
    focusHighlights: ["Desgaste Eleitoral", "Ideias de Discursos", "Custo Orçamentário da Dívida"]
  },
  {
    id: "empresario",
    name: "Setor Produtivo",
    role: "Indústria & Comércio",
    emoji: "🏭",
    accent: "teal",
    badgeText: "HARD INDUSTRY",
    slogan: "WACC, custo de rolagem de debêntures, endividamento corporativo e margem de capital.",
    voiceGuide: "Olá operador do setor real de economia! Painel alinhado com custo de capital. Vamos calcular WACC médio, taxa de juros real implícita nas debêntures e amortização operacional para manter suas fábricas abertas.",
    geminiFocusPrompt: "Foque exclusivamente do ponto de vista do empresariado industrial e lojista nacional. Descreva em linguagem corporativa prática (WACC, CAPEX, EBITDA) o impacto destrutivo da Selic no crédito e o alívio que a taxa a 9% representa para as margens.",
    focusHighlights: ["Custo do Capital WACC", "Capex vs Opex", "Alavancagem de Balanço"]
  },
  {
    id: "ambientalista",
    name: "Energia & Clima",
    role: "Estratégia de Bio-transição",
    emoji: "🌿",
    accent: "emerald",
    badgeText: "BIO-SOVEREIGNTY",
    slogan: "Neutralização de choques petrolíferos por bio-blends Ex/Bx, metas verdes de rating e soberania ambiental.",
    voiceGuide: "Bem-vindo ecologista e estrategista verde! Visualização voltada a combustíveis sustentáveis. Exibindo de que forma os blends obrigatórios e bio-diesel nacional amortecem oscilações do Brent e salvam o rating do país.",
    geminiFocusPrompt: "Destaque apaixonadamente a bio-estratégia verde de blends compulsórios (Etanol/Biodiesel) do MME e MMA. Mostre como essa imunidade ecológica protege o país de flutuações de commodities, permitindo Selic estável de 9,25% e rating grau de investimento.",
    focusHighlights: ["Paridade Bio-Brent", "Pegada do Refino", "Rating Soberano Ecológico"]
  },
  {
    id: "trabalhador",
    name: "Trabalho & Finanças",
    role: "Economia Doméstica",
    emoji: "🛒",
    accent: "amber",
    badgeText: "SALÁRIO REAL",
    slogan: "Poder de compra familiar, rendimento real da poupança, parcelas, prestações de bens de consumo e PLR.",
    voiceGuide: "Olá para o trabalhador! Ativando modo bolso cidadão. O painel simplifica os dados para mostrar o impacto na feira, o custo da prestação da geladeira e o seu direito sobre a participação nos lucros da empresa.",
    geminiFocusPrompt: "Use de máxima honestidade econômica com o cidadão trabalhador. Escreva em linguagem muito simples, visualizadores domésticos e familiares. Explique por que juros de dois dígitos encarecem a mensalidade e corroem o salário na feira.",
    focusHighlights: ["Índice de Cesta Básica", "Mensalidade de Bens", "Garantia de PLR"]
  },
  {
    id: "investidor",
    name: "Mercado & Finanças",
    role: "Mesa de Operações",
    emoji: "📈",
    accent: "violet",
    badgeText: "MARKET ALPHA",
    slogan: "Valuation, spreads de títulos, curva futura de juros DI, prêmio de risco soberano e ativos distressed.",
    voiceGuide: "Prezado gestor de portfólio! Painel em modo Alpha Quantitativo. Vamos computar modelos de Gordon, spreads de ativos de risco, prêmio de risco inflacionário implícito e arbitragem em ativos judiciais e operando sob CDI.",
    geminiFocusPrompt: "Use linguagem estritamente quantitativa e técnica de mercado financeiro institucional (DI futuro, duration, Gordon, valuation descontado, arbitragem de spreads). Concentre-se nas equações de valuation corporativo se Selic atingir 9.00%.",
    focusHighlights: ["Modelo Gordon Valuation", "DI Futuro Curva", "Spreads de Títulos"]
  }
];

export function calculatePersonaSpecificMetrics(
  personaId: string,
  currentBrent: number,
  currentSelic: number,
  currentTtf: number
) {
  switch (personaId) {
    case "trabalhador":
      const basicBasketCost = (220 * (1 + (currentSelic / 22) - 0.1));
      const minimumWagesRequired = basicBasketCost / 45; 
      const realWageIndex = 110.2 / (1 + (currentSelic / 100));
      const installmentRateFactor = (1 + (currentSelic / 140)) ** 12;
      return {
        basicBasketCost,
        minimumWagesRequired,
        realWageIndex,
        installmentRateFactor
      };

    case "empresario":
      const genericWacc = currentSelic + 4.5;
      const reprojectedWacc = 9.0 + 3.2;
      const genericEbitdaMargin = 18.4 - (currentSelic * 0.4);
      const interestCoverageRatio = genericEbitdaMargin / (currentSelic * 0.8);
      return {
        genericWacc,
        reprojectedWacc,
        genericEbitdaMargin,
        interestCoverageRatio
      };

    case "economista":
      const giniSimulated = 0.518 + (currentSelic * 0.0016);
      const dividendSurtaxPercent = (currentSelic * 0.8) + 1.25;
      const rentismTransferBillions = currentSelic * 12.8; 
      return {
        giniSimulated,
        dividendSurtaxPercent,
        rentismTransferBillions
      };

    case "politico":
      const popularApprovalPercent = Math.max(28, 72 - (currentSelic * 3.2));
      const congressionalCoalitionResistance = Math.max(40, 88 - (currentSelic * 2.8));
      const publicDebtInterestCostBillions = currentSelic * 15.6;
      return {
        popularApprovalPercent,
        congressionalCoalitionResistance,
        publicDebtInterestCostBillions
      };

    case "ambientalista":
      const ethanolGasParityRatio = 0.68 + (currentBrent * 0.0003);
      const biodieselMandatoryBlendPercent = 14 + Math.round(currentBrent / 28);
      const decarbonizationCreditPriceUSD = 18.5 + (currentBrent * 0.04);
      return {
        ethanolGasParityRatio,
        biodieselMandatoryBlendPercent,
        decarbonizationCreditPriceUSD
      };

    case "investidor":
      const discountRate = currentSelic + 3.0;
      const genericTerminalMultiple = 1 / (discountRate / 100);
      const countryRiskCds = 130 + (currentSelic * 8);
      return {
        discountRate,
        genericTerminalMultiple,
        countryRiskCds
      };

    case "jornalista":
    default:
      const pressReadinessHeadline = `COM SELIC EM ${currentSelic.toFixed(2)}% E BRENT ESTÁVEL EM $${currentBrent.toFixed(2)}, BRASIL FORTALECE META RATING INDEPENDENTE DE PRESSÃO EURO-GASÍSTERA`;
      const factCheckTruthRating = 100 - (currentSelic * 0.1); 
      return {
        pressReadinessHeadline,
        factCheckTruthRating
      };
  }
}
