# Documentação SelixIA - Padrão Big Four

## 1. Guia do Usuário Final

### 1.1. Visão Geral do Sistema
O **SelixIA** é um painel de inteligência macroeconômica projetado para monitorar indicadores globais (Petróleo Brent, Gás Natural TTF, Taxa Selic, Sentimento de Mercado e Rating Soberano). O sistema foi otimizado para rodar em ambientes de recursos extremamente limitados, como o Termux em um dispositivo móvel Samsung A23.

### 1.2. Como a Inteligência "Gemini" Cabe no Mobile?
A inteligência do sistema opera em um modelo híbrido (Zero-Fallback Theorem):
1. **Modo Conectado (API Key):** Quando a chave da API do Gemini (`GEMINI_API_KEY`) está configurada no arquivo `.env`, o processamento pesado (inferência do LLM) **não ocorre no celular**. O dispositivo móvel atua apenas como um cliente leve que envia os dados de contexto (preços, taxas) para os servidores do Google via API, recebendo a resposta processada.
2. **Modo Offline/Heurístico (Sem API Key):** Se o sistema for executado sem a chave da API (ou offline), ele ativa um mecanismo de *fallback* local. Em vez de rodar um LLM pesado que excederia a memória do A23 (limitada a 384MB no Termux), o sistema utiliza regras determinísticas, árvores de decisão e respostas pré-compiladas baseadas nos dados do SQLite local. Isso garante 100% de disponibilidade sem estourar a memória (OOM).

### 1.3. Funcionalidade de Voz
A funcionalidade de voz de alta performance não exige processamento de áudio pesado no servidor. Ela utiliza a **Web Speech API** nativa do navegador do dispositivo (`window.speechSynthesis`). O sistema apenas envia o texto para o motor de TTS (Text-to-Speech) do próprio Android/Navegador, garantindo latência zero e consumo mínimo de bateria.

### 1.4. Acesso Público, Lista de Espera e Tempo Promocional
*Nota de Auditoria: As funcionalidades abaixo foram solicitadas como requisitos de negócio, mas a análise do código-fonte atual (`App.tsx`, `server.ts`) revela que elas **ainda não estão implementadas** no repositório. O guia abaixo descreve a arquitetura proposta para implementação.*

- **Acesso Público e Redundância:** Para tornar o `localhost:3000` do seu celular público, recomenda-se o uso de túneis reversos como **Cloudflare Tunnels** (`cloudflared`) ou **Ngrok**. Para redundância, você pode rodar duas instâncias do Termux em celulares diferentes, conectadas a um balanceador de carga na nuvem (ex: AWS API Gateway ou Cloudflare Load Balancer).
- **Capacidade de Usuários Simultâneos:** Devido às limitações do Node.js/Express no A23 (CPU ARM e 384MB RAM alocada), estima-se que o sistema suporte de **15 a 30 usuários simultâneos** em navegação ativa antes de apresentar degradação de performance.
- **Tempo Promocional e Lista de Espera:** A arquitetura proposta para a próxima sprint inclui um *middleware* no Express que:
  1. Monitora o número de conexões ativas (WebSockets ou Sessões).
  2. Limita o tempo de sessão a **15 minutos promocionais** por IP.
  3. Ao atingir 90% da capacidade (ex: 25 usuários), redireciona novos acessos para uma rota `/waitlist`, onde o usuário insere Nome, Telefone e @ (Bluesky/Telegram) para ser notificado via webhook quando uma vaga abrir.

---

## 2. Guia DevOps e Infraestrutura

### 2.1. Arquitetura de Implantação (Mobile Edge)
- **Hardware Target:** Samsung A23 (Arquitetura ARM64).
- **OS/Environment:** Android com Termux (Proot-distro opcional para isolamento).
- **Runtime:** Node.js (v22+) via `tsx` para execução direta de TypeScript.
- **Frontend:** React 19 + Vite + TailwindCSS.
- **Backend:** Express.js atuando como BFF (Backend for Frontend).

### 2.2. Persistência de Dados
A persistência é garantida por um banco de dados **SQLite** (`selix.db`) rodando localmente no armazenamento do Termux.
- **Tabela Principal:** `prices` (id, asset, price, timestamp).
- **Estratégia de Ingestão:** O script `seedFromPublicApis()` no `database.ts` atua como um *crawler* que busca dados históricos do Yahoo Finance (Brent, TTF) e do Banco Central do Brasil (Selic) na inicialização, garantindo que o banco local esteja sempre populado mesmo após reinicializações.

### 2.3. Monitoramento e Watchdog
O sistema possui um painel de logs (`ConsolaLog.tsx`) que simula um *Watchdog*. Em um ambiente de produção real no Termux, recomenda-se o uso do **PM2** (`npm install -g pm2`) para garantir que o processo Node.js seja reiniciado automaticamente em caso de falha ou exaustão de memória (OOM).

Comando de deploy recomendado:
```bash
pm2 start server.ts --interpreter tsx --name selix-daemon --max-memory-restart 300M
```
