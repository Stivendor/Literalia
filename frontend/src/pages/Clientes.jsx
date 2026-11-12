import { Pencil, Plus } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useOutletContext } from 'react-router-dom'
import { actualizarCliente, crearCliente, getClientes, getVentas } from '../api.js'
import FilaMensaje from '../components/FilaMensaje.jsx'
import Modal from '../components/Modal.jsx'
import { usePaginacion } from '../components/usePaginacion.jsx'
import { formatoPrecio, normalizar } from '../libros.js'

export default function Clientes() {
  const busqueda = useOutletContext()
  const [datos, setDatos] = useState({ clientes: [], ventas: [] })
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState('')
  const [editando, setEditando] = useState(null) // null cerrado | {} nuevo | cliente a editar

  function cargar() {
    return Promise.all([getClientes(), getVentas()])
      .then(([clientes, ventas]) => {
        setDatos({ clientes, ventas })
        setError('')
      })
      .catch((e) => setError(e.message))
      .finally(() => setCargando(false))
  }

  useEffect(() => {
    cargar()
  }, [])

  const { clientes, ventas } = datos
  const compras = {}
  for (const v of ventas) {
    const c = (compras[v.cliente_id] ??= { cantidad: 0, total: 0 })
    c.cantidad += 1
    c.total += Number(v.total)
  }

  const q = normalizar(busqueda.trim())
  const filtrados = clientes
    .filter((c) => !q || [c.nombre, c.correo, c.telefono].some((v) => normalizar(v).includes(q)))
    .toSorted((a, b) => a.nombre.localeCompare(b.nombre))
  const { visibles, pie } = usePaginacion(filtrados, 'clientes')

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1>Clientes</h1>
          <p className="muted">Registro de clientes y su historial de compras.</p>
        </div>
        <div className="page-actions">
          <button className="btn btn-primary" onClick={() => setEditando({})}>
            <Plus size={16} /> Nuevo Cliente
          </button>
        </div>
      </div>

      <section className="card">
        <div className="card-header">
          <div>
            <h2>Listado de Clientes</h2>
            <p className="muted">Clientes activos ordenados por nombre.</p>
          </div>
        </div>

        <div className="table-wrap">
          <table className="tabla">
            <thead>
              <tr>
                <th>Nombre</th>
                <th>Correo</th>
                <th>Teléfono</th>
                <th className="num">Compras</th>
                <th className="num">Total comprado</th>
                <th><span className="sr-only">Acciones</span></th>
              </tr>
            </thead>
            <tbody>
              {cargando ? (
                <FilaMensaje columnas={6}>Cargando clientes…</FilaMensaje>
              ) : error ? (
                <FilaMensaje columnas={6} error>{error}</FilaMensaje>
              ) : !visibles.length ? (
                <FilaMensaje columnas={6}>{clientes.length ? 'Ningún cliente coincide con la búsqueda.' : 'No hay clientes registrados.'}</FilaMensaje>
              ) : (
                visibles.map((c) => (
                  <tr key={c.id}>
                    <td className="strong truncate" title={c.nombre}>{c.nombre}</td>
                    <td className="muted">{c.correo ?? '—'}</td>
                    <td className="muted">{c.telefono ?? '—'}</td>
                    <td className="num">{compras[c.id]?.cantidad ?? 0}</td>
                    <td className="num strong">{formatoPrecio(compras[c.id]?.total ?? 0)}</td>
                    <td className="acciones">
                      <button className="btn btn-soft btn-sm" onClick={() => setEditando(c)} aria-label={`Editar ${c.nombre}`}>
                        <Pencil size={14} /> Editar
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {pie}
      </section>

      <Modal open={editando !== null} onClose={() => setEditando(null)} className="modal-form" aria-labelledby="cliente-titulo">
        {editando && (
          <FormCliente
            cliente={editando}
            onCancel={() => setEditando(null)}
            onGuardado={() => { setEditando(null); cargar() }}
          />
        )}
      </Modal>
    </div>
  )
}

function FormCliente({ cliente, onCancel, onGuardado }) {
  const nuevo = !cliente.id
  const [error, setError] = useState('')
  const [guardando, setGuardando] = useState(false)

  async function onSubmit(e) {
    e.preventDefault()
    const d = Object.fromEntries(new FormData(e.currentTarget))
    // el backend valida correo como EmailStr: vacío debe ir como null
    const datos = { nombre: d.nombre.trim(), correo: d.correo.trim() || null, telefono: d.telefono.trim() || null }
    setError('')
    setGuardando(true)
    try {
      await (nuevo ? crearCliente(datos) : actualizarCliente(cliente.id, datos))
      onGuardado()
    } catch (err) {
      setError(err.message)
      setGuardando(false)
    }
  }

  return (
    <form onSubmit={onSubmit}>
      <h2 id="cliente-titulo">{nuevo ? 'Nuevo Cliente' : 'Editar Cliente'}</h2>
      <p className="muted">{nuevo ? 'Registra un cliente para asociarlo a sus ventas.' : 'Actualiza los datos de contacto del cliente.'}</p>
      <div className="form-grid">
        <label className="field span-2">
          <span>Nombre</span>
          <input name="nombre" required maxLength={150} defaultValue={cliente.nombre} />
        </label>
        <label className="field">
          <span>Correo (opcional)</span>
          <input name="correo" type="email" maxLength={255} defaultValue={cliente.correo ?? ''} />
        </label>
        <label className="field">
          <span>Teléfono (opcional)</span>
          <input name="telefono" type="tel" maxLength={30} defaultValue={cliente.telefono ?? ''} />
        </label>
      </div>
      {error && <p className="form-error" role="alert">{error}</p>}
      <div className="modal-actions">
        <button type="button" className="btn btn-outline" onClick={onCancel}>Cancelar</button>
        <button className="btn btn-primary" disabled={guardando}>{guardando ? 'Guardando…' : nuevo ? 'Guardar cliente' : 'Guardar cambios'}</button>
      </div>
    </form>
  )
}
