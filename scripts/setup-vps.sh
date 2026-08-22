#!/bin/bash
# Ingenio Webs — instalación inicial en VPS (Ubuntu 22/24)
# Ejecutar como root en el servidor: bash setup-vps.sh

set -euo pipefail

APP_DIR="/var/www/ingeniowebs"
REPO_URL="${REPO_URL:-https://github.com/markiben/ingeniowebs.git}"
NODE_MAJOR=20

echo "==> Actualizando sistema..."
apt-get update -y
apt-get upgrade -y

echo "==> Instalando dependencias..."
apt-get install -y curl git nginx certbot python3-certbot-nginx ufw

echo "==> Instalando Node.js ${NODE_MAJOR}..."
curl -fsSL https://deb.nodesource.com/setup_${NODE_MAJOR}.x | bash -
apt-get install -y nodejs
npm install -g pm2

echo "==> Clonando repositorio..."
mkdir -p /var/www
if [ -d "$APP_DIR/.git" ]; then
  cd "$APP_DIR"
  git pull origin master
else
  git clone "$REPO_URL" "$APP_DIR"
  cd "$APP_DIR"
fi

echo "==> Instalando dependencias npm..."
npm ci

echo "==> Build de producción..."
npm run build

echo "==> Carpetas de datos persistentes..."
mkdir -p data/platform public/blog/uploads public/platform/live-chat
chmod -R 755 data public/blog/uploads public/platform

if [ ! -f .env.local ]; then
  cp .env.example .env.local 2>/dev/null || touch .env.local
  echo ""
  echo "!!! IMPORTANTE: editá $APP_DIR/.env.local con tus claves reales"
  echo "    nano $APP_DIR/.env.local"
  echo ""
fi

echo "==> Iniciando app con PM2..."
pm2 delete ingeniowebs 2>/dev/null || true
pm2 start npm --name ingeniowebs -- start
pm2 save
pm2 startup systemd -u root --hp /root | tail -1 | bash || true

echo "==> Configurando Nginx..."
cat > /etc/nginx/sites-available/ingeniowebs <<'NGINX'
server {
    listen 80;
    server_name ingeniowebs.com www.ingeniowebs.com;

    client_max_body_size 25M;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
NGINX

ln -sf /etc/nginx/sites-available/ingeniowebs /etc/nginx/sites-enabled/ingeniowebs
rm -f /etc/nginx/sites-enabled/default
nginx -t
systemctl reload nginx

echo "==> Firewall..."
ufw allow OpenSSH
ufw allow 'Nginx Full'
ufw --force enable

echo ""
echo "============================================"
echo " Instalación base lista."
echo " 1) Editá .env.local en $APP_DIR"
echo " 2) pm2 restart ingeniowebs"
echo " 3) Apuntá Namecheap DNS A -> IP de este VPS"
echo " 4) certbot --nginx -d ingeniowebs.com -d www.ingeniowebs.com"
echo "============================================"
