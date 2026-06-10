# SelixIA - Sprint Implementation Makefile
# Automatiza as tarefas de desenvolvimento, testes e deploy.

.PHONY: help install build test dev deploy-public clean

help:
	@echo "SelixIA - Comandos Disponíveis:"
	@echo "  install         - Instala dependências do Node.js"
	@echo "  build           - Gera o build de produção (Vite + Server)"
	@echo "  test            - Executa a suíte de testes (Jest)"
	@echo "  dev             - Inicia o ambiente de desenvolvimento"
	@echo "  deploy-public   - Executa o script de deploy público com Cloudflare"
	@echo "  clean           - Remove arquivos de build e logs"

install:
	npm install

build:
	npm run build

test:
	npm test

dev:
	npm run dev

deploy-public:
	bash scripts/deploy_public.sh

clean:
	rm -rf dist
	rm -f cloudflare.log
	pm2 delete selix-daemon || true
