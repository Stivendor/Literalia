import { Bell, BookLock, BookOpen, Euro, House, LogOut, Search, Truck, Users, X } from 'lucide-react'
import { useState } from 'react'
import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { cerrarSesion, getUsuario } from '../api.js'
import Modal from './Modal.jsx'

// ponytail: solo Inventario tiene pantalla; el resto se activa cuando exista su backend
const NAV = [
  { to: '/dashboard', label: 'Dashboard', icon: House },
  { to: '/inventario', label: 'Inventario', icon: BookLock, listo: true },
  { to: '/ventas', label: 'Ventas', icon: Euro },
  { to: '/clientes', label: 'Clientes', icon: Users },
  { to: '/proveedores', label: 'Proveedores', icon: Truck },
]

const CONTACTOS = [
  ['📧 Correo:', 'soporte@literalia.com'],
  ['📞 Teléfono:', '+57 601 234 5678'],
  ['🕐 Horario:', 'Lun - Vie, 8:00 AM - 6:00 PM'],
  ['💬 Chat en vivo:', 'Disponible en horario laboral'],
]

export default function Layout() {
  const navigate = useNavigate()
  const usuario = getUsuario()
  const [busqueda, setBusqueda] = useState('')
  const [soporte, setSoporte] = useState(false)

  function salir() {
    cerrarSesion()
    navigate('/login', { replace: true })
  }

  return (
    <div className="app">
      <aside className="sidebar">
        <div className="brand">
          <span className="brand-icon"><BookOpen size={20} /></span>
          Literalia
        </div>

        <nav className="nav">
          {NAV.map(({ to, label, icon: Icon, listo }) =>
            listo ? (
              <NavLink key={to} to={to} className="nav-item">
                <Icon size={20} /> {label}
              </NavLink>
            ) : (
              <span key={to} className="nav-item" aria-disabled="true" title="Próximamente">
                <Icon size={20} /> {label}
              </span>
            ),
          )}
        </nav>

        <div className="help-card">
          <strong>¿Necesitas ayuda?</strong>
          <p>Accede a la documentación del sistema o contacta a soporte técnico.</p>
          <button className="btn btn-primary btn-sm" onClick={() => setSoporte(true)}>Ver Soporte</button>
        </div>
      </aside>

      <div className="main">
        <header className="topbar">
          <label className="topbar-search">
            <Search size={16} />
            <input
              type="search"
              placeholder="Buscar por ISBN, título, autor..."
              aria-label="Buscar libros"
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
            />
          </label>

          <div className="topbar-right">
            <button className="icon-btn" aria-label="Notificaciones"><Bell size={18} /></button>
            <span className="topbar-divider" />
            <div className="user">
              <span className="avatar">{usuario?.correo?.[0]?.toUpperCase()}</span>
              <div className="user-info">
                <strong>{usuario?.correo}</strong>
                <small>Administrador</small>{/* TODO backend: el usuario no tiene rol todavía */}
              </div>
              <button className="icon-btn" onClick={salir} aria-label="Cerrar sesión" title="Cerrar sesión">
                <LogOut size={18} />
              </button>
            </div>
          </div>
        </header>

        <Outlet context={busqueda} />
      </div>

      <Modal open={soporte} onClose={() => setSoporte(false)} className="modal-soporte" aria-labelledby="soporte-titulo">
        <div className="modal-header">
          <h2 id="soporte-titulo">Soporte Técnico</h2>
          <button className="icon-btn icon-btn--light" onClick={() => setSoporte(false)} aria-label="Cerrar"><X size={18} /></button>
        </div>
        <hr />
        <p className="muted">
          Si tienes problemas con el sistema Literalia, puedes contactar a nuestro equipo de soporte técnico a
          través de los siguientes canales:
        </p>
        <dl className="contactos">
          {CONTACTOS.map(([label, valor]) => (
            <div key={label}>
              <dt>{label}</dt>
              <dd>{valor}</dd>
            </div>
          ))}
        </dl>
      </Modal>
    </div>
  )
}
