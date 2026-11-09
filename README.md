# Literalia

Sistema de gestión para librería: inventario, ventas, clientes y proveedores.

## Estructura

```
backend/            API FastAPI + SQLAlchemy (SQLite en desarrollo)
  main.py           endpoints
  app/              base de datos, modelos, schemas, seguridad y patrones GoF
  requirements.txt
frontend/           React + Vite
```

## Correr en local

Backend (puerto 8000):

```bash
cd backend
python -m venv venv
venv\Scripts\activate        # Linux/Mac: source venv/bin/activate
pip install -r requirements.txt
uvicorn main:app --reload
```

Documentación interactiva de la API: http://localhost:8000/docs

Frontend (otra terminal):

```bash
cd frontend
npm install
npm run dev
```

El front llama a `/api/*` y Vite lo reenvía al backend en `:8000`, así que en desarrollo no hace falta CORS.

## Despliegue (Vercel)

Un solo proyecto de Vercel con dos services, definidos en `vercel.json`:

- `frontend/` sirve la app de React.
- `backend/` atiende todo `/api/*` (Vercel quita el prefijo `/api`, igual que el proxy de Vite).

Cada push a una rama genera un preview y cada merge a `main` despliega a producción.

Base de datos: en Vercel el disco no persiste, así que en producción se usa Postgres (Neon, desde Vercel → Storage). Vercel inyecta `DATABASE_URL` y `backend/app/database.py` la usa. Si la variable no existe (local), se usa SQLite.

> `requirements.txt` debe guardarse en UTF-8. En PowerShell usar `pip freeze | Out-File -Encoding utf8 requirements.txt` (con `>` queda en UTF-16).
