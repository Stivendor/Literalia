import { Bell, BookLock, BookOpen, Euro, House, LogOut, Search, Truck, UserPlus, Users, X } from 'lucide-react'
import { useState } from 'react'
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { cerrarSesion, esAdmin, getUsuario } from '../api.js'
import Modal from './Modal.jsx'

// ponytail: Dashboard y Proveedores sin pantalla hasta que exista su backend.
// `buscar` = placeholder del buscador; sin él, la sección no tiene lista y el buscador se deshabilita.
const NAV = [
  { to: '/dashboard', label: 'Dashboard', icon: House },
  { to: '/inventario', label: 'Inventario', icon: BookLock, listo: true, buscar: 'Buscar por ISBN, título, autor...' },
  { to: '/ventas', label: 'Ventas', icon: Euro, listo: true, buscar: 'Buscar por # de venta o cliente...' },
  { to: '/clientes', label: 'Clientes', icon: Users, listo: true, buscar: 'Buscar por nombre, correo o teléfono...' },
  { to: '/proveedores', label: 'Proveedores', icon: Truck },
  { to: '/usuarios', label: 'Usuarios', icon: UserPlus, listo: true, soloAdmin: true },
]

const CONTACTOS = [
  ['📧 Correo:', 'soporte@literalia.com'],
  ['📞 Teléfono:', '+57 601 234 5678'],
  ['🕐 Horario:', 'Lun - Vie, 8:00 AM - 6:00 PM'],
  ['💬 Chat en vivo:', 'Disponible en horario laboral'],
]

export default function Layout() {
  const navigate = useNavigate()
  const { pathname } = useLocation()
  const usuario = getUsuario()
  // la búsqueda pertenece a la sección donde se escribió; al cambiar de sección arranca vacía
  const [busqueda, setBusqueda] = useState({ ruta: pathname, texto: '' })
  const texto = busqueda.ruta === pathname ? busqueda.texto : ''
  const seccion = NAV.find((n) => n.to === pathname)
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
          {NAV.filter((n) => !n.soloAdmin || esAdmin()).map(({ to, label, icon: Icon, listo }) =>
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
              placeholder={seccion?.buscar ?? 'Buscar...'}
              aria-label="Buscar"
              disabled={!seccion?.buscar}
              value={texto}
              onChange={(e) => setBusqueda({ ruta: pathname, texto: e.target.value })}
            />
          </label>

          <div className="topbar-right">
            <button className="icon-btn" aria-label="Notificaciones"><Bell size={18} /></button>
            <span className="topbar-divider" />
            <div className="user">
              <span className="avatar">{usuario?.correo?.[0]?.toUpperCase()}</span>
              <div className="user-info">
                <strong>{usuario?.correo}</strong>
                <small>{usuario?.rol === 'admin' ? 'Administrador' : 'Vendedor'}</small>
              </div>
              <button className="icon-btn" onClick={salir} aria-label="Cerrar sesión" title="Cerrar sesión">
                <LogOut size={18} />
              </button>
            </div>
          </div>
        </header>

        <Outlet context={texto} />
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
