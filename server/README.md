# MBJ-V3 Mini API

Servicio Node + Express para exponer y actualizar `posts`, `projects` y `tech` desde una carpeta privada.

## Endpoints

- `GET /api/posts`
- `GET /api/projects`
- `GET /api/tech`
- `PUT /api/admin/posts`
- `PUT /api/admin/projects`
- `PUT /api/admin/tech`

Los endpoints `/api/admin/*` requieren:

- Header `Authorization: Bearer <API_TOKEN>`

## Configuración

1. Copia `.env.example` a `.env`.
2. Ajusta valores:
   - `PORT`
   - `API_TOKEN`
   - `DATA_DIR`
   - `ALLOWED_ORIGIN`

## Arranque local

```bash
cd server
npm ci
npm start
```

Si `DATA_DIR` no existe, usa `server/data/` y crea archivos iniciales desde los JSON del root.

## Escritura atómica

Cada `PUT` escribe primero `*.tmp` y luego renombra a `*.json`.
