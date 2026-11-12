import { Bookmark, Check, CircleUser, Lock, Mail } from 'lucide-react'
import { useState } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { getUsuario, guardarUsuario, login } from '../api.js'
import Modal from '../components/Modal.jsx'

export default function Login() {
  const navigate = useNavigate()
  const [error, setError] = useState('')
  const [cargando, setCargando] = useState(false)
  const [modal, setModal] = useState(null) // 'recuperar' | 'enviado'

  if (getUsuario()) return <Navigate to="/inventario" replace />

  async function onSubmit(e) {
    e.preventDefault()
    const { correo, contrasena } = Object.fromEntries(new FormData(e.currentTarget))
    setError('')
    setCargando(true)
    try {
      const res = await login(correo, contrasena)
      guardarUsuario({ correo: res.correo, rol: res.rol, token: res.access_token })
      navigate('/inventario', { replace: true })
    } catch (err) {
      setError(err.message)
      setCargando(false)
    }
  }

  function enviarEnlace(e) {
    e.preventDefault()
    // TODO backend: no existe endpoint de recuperar contraseña
    setModal('enviado')
  }

  return (
    <main className="login">
      <div className="login-blob login-blob--1" />
      <div className="login-blob login-blob--2" />

      <form className="login-card" onSubmit={onSubmit}>
        <span className="login-logo"><Bookmark size={20} /></span>
        <h1>Literalia</h1>
        <p className="login-sub">Sistema de Gestión Bibliotecaria</p>

        <label className="field">
          <span>Usuario</span>
          <span className="input-icon">
            <CircleUser size={16} />
            <input name="correo" type="email" placeholder="Ingrese su correo" autoComplete="username" required />
          </span>
        </label>

        <label className="field">
          <span>Contraseña</span>
          <span className="input-icon">
            <Lock size={16} />
            <input name="contrasena" type="password" placeholder="••••••••••••" autoComplete="current-password" required />
          </span>
        </label>

        {error && <p className="form-error" role="alert">{error}</p>}

        <button className="btn btn-primary btn-block btn-lg" disabled={cargando}>
          {cargando ? 'Ingresando…' : 'Iniciar Sesión'}
        </button>
        <button type="button" className="link" onClick={() => setModal('recuperar')}>
          ¿Olvidaste tu contraseña?
        </button>
      </form>

      <Modal open={modal === 'recuperar'} onClose={() => setModal(null)} className="modal-center" aria-labelledby="recuperar-titulo">
        <form onSubmit={enviarEnlace}>
          <span className="icon-badge"><Mail size={20} /></span>
          <h2 id="recuperar-titulo">Recuperar Contraseña</h2>
          <p className="muted">Ingresa tu correo electrónico y te enviaremos un enlace para restablecer tu contraseña.</p>
          <label className="field">
            <span>Correo electrónico</span>
            <span className="input-icon">
              <Mail size={16} />
              <input name="correo" type="email" placeholder="ejemplo@correo.com" required />
            </span>
          </label>
          <button className="btn btn-primary btn-block btn-lg">Enviar enlace</button>
          <button type="button" className="link" onClick={() => setModal(null)}>Volver al inicio de sesión</button>
        </form>
      </Modal>

      <Modal open={modal === 'enviado'} onClose={() => setModal(null)} className="modal-center" aria-labelledby="enviado-titulo">
        <span className="icon-badge icon-badge--ok"><Check size={22} /></span>
        <h2 id="enviado-titulo">¡Enlace enviado!</h2>
        <p className="muted">Hemos enviado un enlace de recuperación a tu correo electrónico</p>
        <button className="btn btn-primary btn-block btn-lg" onClick={() => setModal(null)}>Aceptar</button>
      </Modal>
    </main>
  )
}
