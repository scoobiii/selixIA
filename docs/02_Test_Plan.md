# Plano de Testes SelixIA - Padrão Big Four

## 1. Introdução
Este documento detalha a estratégia de testes para o projeto SelixIA, visando garantir a qualidade, robustez e performance do sistema, especialmente em seu ambiente de execução em dispositivos móveis com recursos limitados. O plano abrange testes unitários, de integração, de performance (incluindo stress test) e de segurança, com o objetivo de alcançar 100% de cobertura onde aplicável.

## 2. Metodologia de Testes
Adotaremos uma abordagem de testes em camadas, conforme as melhores práticas de engenharia de software, com foco em automação e reprodutibilidade.

### 2.1. Testes Unitários
- **Objetivo:** Validar o comportamento de unidades de código isoladas (funções, classes, módulos).
- **Ferramentas:** Jest (para TypeScript/JavaScript).
- **Cobertura:** 100% de cobertura de linhas, branches, funções e statements para o código de backend (`server.ts`, `src/db/database.ts`, `src/utils/*.ts`) e componentes React críticos.
- **Estratégia:** Mockar dependências externas (ex: chamadas de API para Yahoo Finance, BCB, Google Gemini) para garantir o isolamento e a velocidade dos testes.

### 2.2. Testes de Integração
- **Objetivo:** Verificar a interação entre diferentes módulos e componentes do sistema, incluindo a comunicação entre frontend e backend, e a persistência de dados.
- **Ferramentas:** Supertest (para APIs Express), React Testing Library (para componentes React).
- **Cenários:**
    - **API Backend:** Testar todos os endpoints (`/api/state`, `/api/state/update`, `/api/state/reload`, `/api/logs`, `/api/threads`, `/api/agent-query`) para verificar respostas corretas, tratamento de erros e validação de entrada.
    - **Persistência de Dados:** Testar as funções de `savePrice` e `getHistoricalPrices` para garantir que os dados sejam armazenados e recuperados corretamente do SQLite.
    - **Integração Gemini:** Testar o comportamento do endpoint `/api/agent-query` com e sem a `GEMINI_API_KEY` configurada, validando o fallback para respostas heurísticas quando a chave não está presente.

### 2.3. Testes de Performance e Stress
- **Objetivo:** Avaliar o desempenho do sistema sob diferentes cargas, identificar gargalos e determinar a capacidade máxima de usuários simultâneos no ambiente do Samsung A23.
- **Ferramentas:** Artillery.io ou k6 (para testes de carga de API), Lighthouse (para performance de frontend).
- **Cenários:**
    - **Carga de API:** Simular um número crescente de requisições simultâneas aos endpoints do backend, especialmente `/api/state` e `/api/agent-query`.
        - **Métricas:** Latência de resposta, taxa de erros, utilização de CPU e memória (via `top` ou `htop` no Termux).
        - **Stress Test:** Aumentar a carga até que o sistema atinja 90% de utilização de CPU ou memória, ou comece a apresentar degradação significativa de performance (latência > 500ms, taxa de erros > 1%).
    - **Simulação de Usuários:** Utilizar ferramentas de automação de navegador (ex: Selenium com Appium) para simular múltiplos usuários interagindo com a interface do usuário no dispositivo móvel.
        - **Métricas:** Tempo de carregamento da página, tempo de interação, fluidez da UI.
- **Ambiente:** Os testes de performance devem ser executados diretamente no dispositivo Samsung A23 com Termux, para refletir as condições reais de produção.

### 2.4. Testes de Segurança
- **Objetivo:** Identificar vulnerabilidades de segurança no sistema.
- **Ferramentas:** OWASP ZAP, Snyk (para análise de dependências).
- **Cenários:**
    - **Injeção de SQL:** Testar os endpoints que interagem com o SQLite para garantir que não são vulneráveis a injeção de SQL.
    - **XSS (Cross-Site Scripting):** Verificar se a aplicação frontend sanitiza corretamente as entradas do usuário para prevenir ataques XSS.
    - **Autenticação/Autorização:** Embora o sistema atual não possua autenticação, em futuras versões, este item deve cobrir testes de quebra de autenticação e escalonamento de privilégios.
    - **Análise de Dependências:** Escanear as dependências do projeto (`package.json`) em busca de vulnerabilidades conhecidas.

## 3. Cobertura de Testes
- **Código Backend:** 100% de cobertura de testes unitários para todas as funções e métodos.
- **APIs:** 100% de cobertura de testes de integração para todos os endpoints, incluindo casos de sucesso e falha.
- **Frontend:** Cobertura de testes de integração para os principais fluxos de usuário e componentes críticos.

## 4. Relatório de Testes
Após a execução dos testes, um relatório detalhado será gerado, contendo:
- Resultados de cada categoria de teste.
- Métricas de cobertura de código.
- Gráficos de performance (latência, throughput, utilização de recursos).
- Lista de defeitos encontrados e seu status.
- Recomendações para melhorias de performance e segurança.

## 5. Integração Contínua (CI)
Recomenda-se a integração dos testes automatizados em um pipeline de CI (ex: GitHub Actions) para garantir que cada nova alteração no código seja automaticamente testada, mantendo a qualidade do software ao longo do ciclo de desenvolvimento.
