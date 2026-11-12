// Llamadas al backend FastAPI. /api lo reescribe el proxy de Vite (vite.config.js).
async function api(path, options = {}) {
  const token = getUsuario()?.token
  let res
  try {
    res = await fetch(`/api${path}`, {
      ...options,
      headers: { 'Content-Type': 'application/json', ...(token && { Authorization: `Bearer ${token}` }) },
    })
  } catch {
    throw new Error('No se pudo conectar con el servidor.')
  }
  // token vencido (8 h) o inválido: a iniciar sesión otra vez. Sin token, el 401 es credencial incorrecta del login.
  if (res.status === 401 && token) {
    cerrarSesion()
    window.location.replace('/login')
  }
  const data = await res.json().catch(() => null)
  if (!res.ok) {
    const detail = data?.detail
    if (Array.isArray(detail)) throw new Error(detail.map((d) => d.msg).join('. ')) // 422 de FastAPI
    if (detail) throw new Error(detail)
    // "No se pudo conectar" queda solo para fallas de red (catch de arriba)
    throw new Error(res.status >= 500 ? `Error del servidor (${res.status}). Intenta de nuevo más tarde.` : `Error ${res.status}`)
  }
  return data
}

const enviar = (method, body) => ({ method, body: JSON.stringify(body) })

export const login = (correo, contrasena) => api('/auth/login', enviar('POST', { correo, contrasena }))

export const getLibros = () => api('/libros')
export const crearLibro = (libro) => api('/libros', enviar('POST', libro))
export const actualizarLibro = (id, libro) => api(`/libros/${id}`, enviar('PUT', libro))

export const registrarUsuario = (usuario) => api('/auth/registro', enviar('POST', usuario))

export const getMovimientos = () => api('/inventario/movimientos')
export const crearMovimiento = (movimiento) => api('/inventario/movimientos', enviar('POST', movimiento))

export const getClientes = () => api('/clientes')
export const crearCliente = (cliente) => api('/clientes', enviar('POST', cliente))
export const actualizarCliente = (id, cliente) => api(`/clientes/${id}`, enviar('PUT', cliente))

export const getVentas = () => api('/ventas')
export const getVenta = (id) => api(`/ventas/${id}`)
export const crearVenta = (venta) => api('/ventas', enviar('POST', venta))

// ponytail: JWT en localStorage (expuesto si hay XSS); pasar a cookie httpOnly si el backend la emite.
// Sesiones viejas sin token cuentan como no logueado.
export function getUsuario() {
  try {
    const usuario = JSON.parse(localStorage.getItem('usuario'))
    return usuario?.token ? usuario : null
  } catch {
    return null
  }
}

export const esAdmin = () => getUsuario()?.rol === 'admin'

export const guardarUsuario = (usuario) => localStorage.setItem('usuario', JSON.stringify(usuario))

export const cerrarSesion = () => localStorage.removeItem('usuario')
