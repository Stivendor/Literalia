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

> `requirements.txt` debe guardarse en UTF-8. En PowerShell usar `pip freeze | Out-File -Encoding utf8 requirements.txt` (con `>` queda en UTF-16).
