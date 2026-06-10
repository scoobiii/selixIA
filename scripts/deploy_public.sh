#!/bin/bash

# SelixIA - Script de Deploy Público Automatizado para Termux (Samsung A23)
# Este script automatiza o build, inicialização do servidor com PM2 e exposição via Cloudflare Tunnel.

echo "🚀 Iniciando deploy do SelixIA..."

# 1. Verificar dependências básicas
command -v node >/dev/null 2>&1 || { echo >&2 "❌ Node.js não encontrado. Instale com: pkg install nodejs"; exit 1; }
command -v pm2 >/dev/null 2>&1 || { echo >&2 "⚠️ PM2 não encontrado. Instalando globalmente..."; npm install -g pm2; }
command -v cloudflared >/dev/null 2>&1 || { echo >&2 "⚠️ Cloudflared não encontrado. Baixando binário para ARM64..."; 
    wget https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-arm64 -O cloudflared
    chmod +x cloudflared
    mv cloudflared $PREFIX/bin/
}

# 2. Instalar dependências do projeto
echo "📦 Instalando dependências do projeto..."
npm install

# 3. Build do Frontend
echo "🏗️ Gerando build do frontend (Vite)..."
npm run build

# 4. Inicializar Servidor com PM2 (para persistência e monitoramento de RAM)
echo "⚙️ Inicializando servidor backend com PM2..."
pm2 delete selix-daemon 2>/dev/null
pm2 start server.ts --interpreter tsx --name selix-daemon --max-memory-restart 350M

# 5. Expor via Cloudflare Tunnel
echo "🌐 Expondo serviço via Cloudflare Tunnel..."
echo "Aguarde o link público ser gerado..."

# Inicia o túnel em background e extrai a URL
cloudflared tunnel --url http://localhost:3000 > cloudflare.log 2>&1 &

# Aguarda alguns segundos para o túnel estabilizar e exibe a URL
sleep 10
PUBLIC_URL=$(grep -o 'https://[a-zA-Z0-9.-]*\.trycloudflare\.com' cloudflare.log | head -n 1)

if [ -z "$PUBLIC_URL" ]; then
    echo "❌ Falha ao gerar URL pública. Verifique cloudflare.log"
else
    echo "✅ SelixIA está ONLINE e PÚBLICO!"
    echo "🔗 URL Principal: $PUBLIC_URL"
    echo "🔗 URL Redundante (Local): http://$(ifconfig | grep -oE 'inet [0-9.]+' | grep -v '127.0.0.1' | awk '{print $2}'):3000"
    echo "--------------------------------------------------"
    echo "Monitoramento: pm2 monit"
    echo "Logs: pm2 logs selix-daemon"
fi
