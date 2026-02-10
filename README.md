# MBJ-V3

Frontend estatico HTML/CSS/JS + Mini-API Node/Express para datos JSON privados.

## Arquitectura

- Frontend: archivos estaticos en web root (`index.html`, `blog.html`, etc.).
- API: `server/` escuchando en `127.0.0.1:3001`.
- Datos JSON privados: `DATA_DIR` (produccion: `/var/lib/mbj-v3/data`).

## Endpoints

Publicos:
- `GET /api/posts`
- `GET /api/projects`
- `GET /api/tech`

Admin (Bearer token):
- `PUT /api/admin/posts`
- `PUT /api/admin/projects`
- `PUT /api/admin/tech`

## Desarrollo local

1. Instalar y arrancar API:
```bash
cd server
cp .env.example .env
npm ci
npm start
```

2. Servir frontend estatico (ejemplo con Live Server o nginx local).

3. Abrir `index.html` y `blog.html`; ahora consumen `/api/*`.

## Configuracion `.env`

Archivo: `server/.env`

```bash
PORT=3001
API_TOKEN=change_me
DATA_DIR=/var/lib/mbj-v3/data
ALLOWED_ORIGIN=https://tu-dominio.com
```

Notas:
- En local puedes usar `DATA_DIR=./data` dentro de `server/`.
- La API hace escritura atomica (`.tmp` + `rename`).

## Deploy VPS

Ver guia completa en `deploy/README.md`.

Resumen:
1. `git pull` en `/var/www/mbj-v3`
2. `cd server && npm ci --omit=dev`
3. `pm2 startOrRestart ecosystem.config.js` o `systemctl restart mbj-v3`
4. Nginx con `deploy/nginx-mbj-v3.conf` (proxy `/api/` + headers + rate limit + bloqueo `admin.html`).

## Seguridad aplicada

- `admin.html` bloqueable desde Nginx (404 por defecto en config ejemplo).
- Admin API con `Authorization: Bearer <API_TOKEN>`.
- CORS restringido por `ALLOWED_ORIGIN`.
- Rate limiting en `/api/admin/*`.
- Body limit `1mb`.
- Sanitizacion HTML en blog mediante `vendor/dompurify.min.js`.
