import { useState } from 'react'
import { registrarUsuario } from '../api.js'

export default function Usuarios() {
  const [creado, setCreado] = useState('')
  const [error, setError] = useState('')
  const [guardando, setGuardando] = useState(false)

  async function onSubmit(e) {
    e.preventDefault()
    const form = e.currentTarget
    const d = Object.fromEntries(new FormData(form))
    setError('')
    setCreado('')
    setGuardando(true)
    try {
      const usuario = await registrarUsuario({ nombre: d.nombre.trim(), correo: d.correo.trim(), contrasena: d.contrasena })
      setCreado(usuario.correo)
      form.reset()
    } catch (err) {
      setError(err.message)
    } finally {
      setGuardando(false)
    }
  }

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1>Usuarios</h1>
          {/* TODO backend: no hay GET /usuarios para listar ni desactivar cuentas */}
          <p className="muted">Crea cuentas de vendedor. Por ahora el sistema no permite listar ni desactivar usuarios.</p>
        </div>
      </div>

      <section className="card card-form">
        <form className="stack" onSubmit={onSubmit}>
          <div>
            <h2>Nuevo Vendedor</h2>
            <p className="muted">Podrá registrar ventas y clientes, pero no modificar el catálogo ni el stock.</p>
          </div>
          <div className="form-grid">
            <label className="field span-2"><span>Nombre</span><input name="nombre" required autoComplete="off" /></label>
            <label className="field"><span>Correo</span><input name="correo" type="email" required autoComplete="off" /></label>
            <label className="field">
              <span>Contraseña inicial</span>
              {/* bcrypt solo usa los primeros 72 bytes */}
              <input name="contrasena" type="password" required minLength={8} maxLength={72} autoComplete="new-password" />
            </label>
          </div>
          {error && <p className="form-error" role="alert">{error}</p>}
          {creado && <p className="form-ok" role="status">Vendedor creado: {creado}. Ya puede iniciar sesión.</p>}
          <div className="modal-actions">
            <button className="btn btn-primary" disabled={guardando}>{guardando ? 'Creando…' : 'Crear vendedor'}</button>
          </div>
        </form>
      </section>
    </div>
  )
}
