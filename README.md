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
$env:JWT_SECRET = "<32+ caracteres aleatorios>"   # bash: export JWT_SECRET=...
python -m uvicorn main:app --reload
```

`JWT_SECRET` es obligatorio: sin él, `/auth/login` responde 503. Se puede generar con `openssl rand -hex 32`.

Documentación interactiva de la API: http://localhost:8000/docs

Primer administrador (una sola vez por base de datos):

```bash
$env:ADMIN_EMAIL = "admin@ejemplo.com"
$env:ADMIN_PASSWORD = "<12+ caracteres>"
python crear_admin.py
```

### Roles

- **admin**: todo lo del vendedor, más crear y editar libros, registrar movimientos de stock y crear vendedores (pantalla Usuarios).
- **vendedor**: ver inventario, registrar ventas y gestionar clientes.

El front oculta lo que el rol no puede usar, pero quien valida es el backend (token JWT con el rol, vence a las 8 h).

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

Variables necesarias en Vercel (Settings → Environment Variables, Production y Preview):

- `DATABASE_URL`: la pone la integración de Neon.
- `JWT_SECRET`: aleatorio de 32+ caracteres. Sin ella nadie puede iniciar sesión en producción.

Para crear el admin de producción: `vercel env pull` y correr `python crear_admin.py` dentro de `backend/` con esa `DATABASE_URL` y `ADMIN_EMAIL`/`ADMIN_PASSWORD`.

> `requirements.txt` debe guardarse en UTF-8. En PowerShell usar `pip freeze | Out-File -Encoding utf8 requirements.txt` (con `>` queda en UTF-16).
