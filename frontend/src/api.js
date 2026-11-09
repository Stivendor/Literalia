// Llamadas al backend FastAPI. /api lo reescribe el proxy de Vite (vite.config.js).
async function api(path, options = {}) {
  let res
  try {
    res = await fetch(`/api${path}`, {
      headers: { 'Content-Type': 'application/json' },
      ...options,
    })
  } catch {
    throw new Error('No se pudo conectar con el servidor.')
  }
  const data = await res.json().catch(() => null)
  if (!res.ok) {
    const detail = data?.detail
    if (Array.isArray(detail)) throw new Error(detail.map((d) => d.msg).join('. ')) // 422 de FastAPI
    if (detail) throw new Error(detail)
    throw new Error(res.status >= 500 ? 'No se pudo conectar con el servidor.' : `Error ${res.status}`)
  }
  return data
}

export const login = (correo, contrasena) =>
  api('/auth/login', { method: 'POST', body: JSON.stringify({ correo, contrasena }) })

export const getLibros = () => api('/libros')

export const crearLibro = (libro) =>
  api('/libros', { method: 'POST', body: JSON.stringify(libro) })

// ponytail: sesión solo en localStorage, el backend no emite token. Agregar JWT cuando exista.
export function getUsuario() {
  try {
    return JSON.parse(localStorage.getItem('usuario'))
  } catch {
    return null
  }
}

export const guardarUsuario = (usuario) => localStorage.setItem('usuario', JSON.stringify(usuario))

export const cerrarSesion = () => localStorage.removeItem('usuario')
