# Deploy VPS (GitHub -> VPS)

## 1) Preparación inicial

```bash
sudo mkdir -p /var/www/mbj-v3
cd /var/www/mbj-v3
# clonar repo

sudo mkdir -p /var/lib/mbj-v3/data
sudo cp /var/www/mbj-v3/posts.json /var/lib/mbj-v3/data/posts.json
sudo cp /var/www/mbj-v3/projects.json /var/lib/mbj-v3/data/projects.json
sudo cp /var/www/mbj-v3/tech.json /var/lib/mbj-v3/data/tech.json

sudo chown -R www-data:www-data /var/lib/mbj-v3/data
```

## 2) API

```bash
cd /var/www/mbj-v3/server
cp .env.example .env
# editar .env
npm ci --omit=dev
```

### PM2

```bash
pm2 startOrRestart ecosystem.config.js
pm2 save
```

### Systemd (alternativa)

```bash
sudo cp /var/www/mbj-v3/deploy/mbj-v3.service /etc/systemd/system/mbj-v3.service
sudo systemctl daemon-reload
sudo systemctl enable --now mbj-v3
```

## 3) Nginx

```bash
sudo cp /var/www/mbj-v3/deploy/nginx-mbj-v3.conf /etc/nginx/sites-available/mbj-v3.conf
sudo ln -s /etc/nginx/sites-available/mbj-v3.conf /etc/nginx/sites-enabled/mbj-v3.conf
sudo nginx -t
sudo systemctl reload nginx
```

## 4) Deploy continuo manual

```bash
bash /var/www/mbj-v3/deploy/deploy.sh
```
