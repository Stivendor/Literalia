import { Eye, Plus, Trash2, X } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link, useOutletContext } from 'react-router-dom'
import { crearVenta, getClientes, getLibros, getVenta, getVentas } from '../api.js'
import FilaMensaje from '../components/FilaMensaje.jsx'
import Modal from '../components/Modal.jsx'
import { usePaginacion } from '../components/usePaginacion.jsx'
import { formatoFecha, formatoPrecio, normalizar } from '../libros.js'

export default function Ventas() {
  const busqueda = useOutletContext()
  const [datos, setDatos] = useState({ ventas: [], clientes: [], libros: [] })
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState('')
  const [nueva, setNueva] = useState(false)
  const [detalle, setDetalle] = useState(null) // venta abierta

  function cargar() {
    return Promise.all([getVentas(), getClientes(), getLibros()])
      .then(([ventas, clientes, libros]) => {
        setDatos({ ventas, clientes, libros })
        setError('')
      })
      .catch((e) => setError(e.message))
      .finally(() => setCargando(false))
  }

  useEffect(() => {
    cargar()
  }, [])

  const { ventas, clientes, libros } = datos
  const clientePorId = Object.fromEntries(clientes.map((c) => [c.id, c]))
  const nombreCliente = (id) => clientePorId[id]?.nombre ?? `Cliente #${id}`

  const q = normalizar(busqueda.trim()).replace(/^#/, '')
  const filtrados = ventas.filter((v) => !q || String(v.id) === q || normalizar(nombreCliente(v.cliente_id)).includes(q))
  const { visibles, pie } = usePaginacion(filtrados, 'ventas')

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1>Ventas</h1>
          <p className="muted">Registra ventas; cada una resta del stock los libros vendidos.</p>
        </div>
        <div className="page-actions">
          <button className="btn btn-primary" onClick={() => setNueva(true)} disabled={cargando || !!error}>
            <Plus size={16} /> Nueva Venta
          </button>
        </div>
      </div>

      <section className="card">
        <div className="card-header">
          <div>
            <h2>Historial de Ventas</h2>
            <p className="muted">Las más recientes primero.</p>
          </div>
        </div>

        <div className="table-wrap">
          <table className="tabla">
            <thead>
              <tr>
                <th>#</th>
                <th>Fecha</th>
                <th>Cliente</th>
                <th className="num">Subtotal</th>
                <th className="num">Descuento</th>
                <th className="num">Total</th>
                <th><span className="sr-only">Acciones</span></th>
              </tr>
            </thead>
            <tbody>
              {cargando ? (
                <FilaMensaje columnas={7}>Cargando ventas…</FilaMensaje>
              ) : error ? (
                <FilaMensaje columnas={7} error>{error}</FilaMensaje>
              ) : !visibles.length ? (
                <FilaMensaje columnas={7}>{ventas.length ? 'Ninguna venta coincide con la búsqueda.' : 'Todavía no hay ventas registradas.'}</FilaMensaje>
              ) : (
                visibles.map((v) => (
                  <tr key={v.id}>
                    <td className="muted">#{v.id}</td>
                    <td className="muted">{formatoFecha(v.fecha)}</td>
                    <td className="strong truncate" title={nombreCliente(v.cliente_id)}>{nombreCliente(v.cliente_id)}</td>
                    <td className="num">{formatoPrecio(v.subtotal)}</td>
                    <td className="num">{Number(v.descuento) ? `−${formatoPrecio(v.descuento)}` : '—'}</td>
                    <td className="num strong">{formatoPrecio(v.total)}</td>
                    <td className="acciones">
                      <button className="btn btn-soft btn-sm" onClick={() => setDetalle(v)} aria-label={`Ver detalle de la venta ${v.id}`}>
                        <Eye size={14} /> Detalle
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

      <Modal open={nueva} onClose={() => setNueva(false)} className="modal-form modal-ancho" aria-labelledby="venta-titulo">
        {nueva && (
          <FormVenta
            clientes={clientes}
            libros={libros}
            onCancel={() => setNueva(false)}
            onGuardada={() => { setNueva(false); cargar() }}
          />
        )}
      </Modal>

      <Modal open={detalle !== null} onClose={() => setDetalle(null)} className="modal-form modal-ancho" aria-labelledby="detalle-titulo">
        {detalle && <DetalleVenta venta={detalle} cliente={nombreCliente(detalle.cliente_id)} libros={libros} onClose={() => setDetalle(null)} />}
      </Modal>
    </div>
  )
}

const ITEM_VACIO = { libro_id: '', cantidad: 1 }

function FormVenta({ clientes, libros, onCancel, onGuardada }) {
  const [items, setItems] = useState([ITEM_VACIO])
  const [descuento, setDescuento] = useState('0')
  const [error, setError] = useState('')
  const [guardando, setGuardando] = useState(false)

  const libroPorId = Object.fromEntries(libros.map((l) => [String(l.id), l]))
  const disponibles = libros.filter((l) => l.activo !== false && l.stock > 0).toSorted((a, b) => a.titulo.localeCompare(b.titulo))
  const elegidos = new Set(items.map((i) => i.libro_id))
  const importe = (i) => (libroPorId[i.libro_id]?.precio ?? 0) * (Number(i.cantidad) || 0)
  // ponytail: vista previa en el navegador; el total que vale es el que devuelve el backend (Strategy de descuentos)
  const subtotal = items.reduce((s, i) => s + importe(i), 0)
  const porcentaje = Math.min(100, Math.max(0, Number(descuento) || 0))
  const total = subtotal * (1 - porcentaje / 100)

  const cambiar = (idx, cambios) => setItems(items.map((it, i) => (i === idx ? { ...it, ...cambios } : it)))

  async function onSubmit(e) {
    e.preventDefault()
    const clienteId = Number(new FormData(e.currentTarget).get('cliente_id'))
    setError('')
    setGuardando(true)
    try {
      await crearVenta({
        cliente_id: clienteId,
        items: items.map((i) => ({ libro_id: Number(i.libro_id), cantidad: Number(i.cantidad) })),
        porcentaje_descuento: porcentaje,
      })
      onGuardada()
    } catch (err) {
      setError(err.message)
      setGuardando(false)
    }
  }

  if (!clientes.length || !disponibles.length) {
    return (
      <div className="stack">
        <h2 id="venta-titulo">Nueva Venta</h2>
        <p className="aviso">
          {!clientes.length
            ? <>Para vender necesitas al menos un cliente. <Link to="/clientes">Registra uno en Clientes</Link>.</>
            : 'No hay libros con stock disponible para vender.'}
        </p>
        <div className="modal-actions">
          <button type="button" className="btn btn-outline" onClick={onCancel}>Cerrar</button>
        </div>
      </div>
    )
  }

  return (
    <form onSubmit={onSubmit}>
      <h2 id="venta-titulo">Nueva Venta</h2>
      <p className="muted">El stock de cada libro se descuenta al guardar.</p>

      <label className="field">
        <span>Cliente</span>
        <select name="cliente_id" required defaultValue="">
          <option value="" disabled>Selecciona un cliente</option>
          {clientes.toSorted((a, b) => a.nombre.localeCompare(b.nombre)).map((c) => (
            <option key={c.id} value={c.id}>{c.nombre}{c.correo ? ` — ${c.correo}` : ''}</option>
          ))}
        </select>
      </label>

      <fieldset className="venta-items">
        <legend>Libros</legend>
        <div className="venta-fila venta-fila--head" aria-hidden="true">
          <span>Libro</span><span>Cantidad</span><span className="num">Importe</span><span />
        </div>
        {items.map((it, idx) => {
          const libro = libroPorId[it.libro_id]
          return (
            <div className="venta-fila" key={idx}>
              <select
                aria-label={`Libro ${idx + 1}`}
                required
                value={it.libro_id}
                onChange={(e) => cambiar(idx, { libro_id: e.target.value, cantidad: 1 })}
              >
                <option value="" disabled>Selecciona un libro</option>
                {disponibles
                  .filter((l) => String(l.id) === it.libro_id || !elegidos.has(String(l.id)))
                  .map((l) => (
                    <option key={l.id} value={l.id}>{l.titulo} — {formatoPrecio(l.precio)} (stock {l.stock})</option>
                  ))}
              </select>
              <input
                aria-label={`Cantidad del libro ${idx + 1}`}
                type="number"
                min="1"
                max={libro?.stock}
                step="1"
                required
                value={it.cantidad}
                onChange={(e) => cambiar(idx, { cantidad: e.target.value })}
              />
              <span className="num strong">{formatoPrecio(importe(it))}</span>
              <button
                type="button"
                className="icon-btn icon-btn--light"
                aria-label={`Quitar libro ${idx + 1}`}
                disabled={items.length === 1}
                onClick={() => setItems(items.filter((_, i) => i !== idx))}
              >
                <Trash2 size={16} />
              </button>
            </div>
          )
        })}
        <button
          type="button"
          className="btn btn-soft btn-sm"
          disabled={items.length >= disponibles.length}
          onClick={() => setItems([...items, ITEM_VACIO])}
        >
          <Plus size={14} /> Agregar libro
        </button>
      </fieldset>

      <div className="venta-resumen">
        <label className="field">
          <span>Descuento (%)</span>
          <input type="number" min="0" max="100" step="any" value={descuento} onChange={(e) => setDescuento(e.target.value)} />
        </label>
        <Totales subtotal={subtotal} descuento={subtotal - total} total={total} />
      </div>

      {error && <p className="form-error" role="alert">{error}</p>}
      <div className="modal-actions">
        <button type="button" className="btn btn-outline" onClick={onCancel}>Cancelar</button>
        <button className="btn btn-primary" disabled={guardando}>{guardando ? 'Registrando…' : 'Registrar venta'}</button>
      </div>
    </form>
  )
}

function DetalleVenta({ venta, cliente, libros, onClose }) {
  const [detalles, setDetalles] = useState(null)
  const [error, setError] = useState('')
  const tituloPorId = Object.fromEntries(libros.map((l) => [l.id, l.titulo]))

  useEffect(() => {
    getVenta(venta.id)
      .then((d) => setDetalles(d.detalles))
      .catch((e) => setError(e.message))
  }, [venta.id])

  return (
    <div className="stack">
      <div className="modal-header">
        <h2 id="detalle-titulo">Venta #{venta.id}</h2>
        <button className="icon-btn icon-btn--light" onClick={onClose} aria-label="Cerrar"><X size={18} /></button>
      </div>
      <p className="muted">{cliente} · {formatoFecha(venta.fecha)}</p>

      <div className="table-wrap">
        <table className="tabla">
          <thead>
            <tr>
              <th>Libro</th>
              <th className="num">Cantidad</th>
              <th className="num">Precio unitario</th>
              <th className="num">Importe</th>
            </tr>
          </thead>
          <tbody>
            {error ? (
              <FilaMensaje columnas={4} error>{error}</FilaMensaje>
            ) : !detalles ? (
              <FilaMensaje columnas={4}>Cargando detalle…</FilaMensaje>
            ) : (
              detalles.map((d) => (
                <tr key={d.id}>
                  <td className="strong truncate" title={tituloPorId[d.libro_id]}>{tituloPorId[d.libro_id] ?? `Libro #${d.libro_id}`}</td>
                  <td className="num">{d.cantidad}</td>
                  <td className="num">{formatoPrecio(d.precio_unitario)}</td>
                  <td className="num strong">{formatoPrecio(d.subtotal)}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <Totales subtotal={venta.subtotal} descuento={venta.descuento} total={venta.total} />
    </div>
  )
}

function Totales({ subtotal, descuento, total }) {
  return (
    <dl className="totales">
      <div><dt>Subtotal</dt><dd>{formatoPrecio(subtotal)}</dd></div>
      <div><dt>Descuento</dt><dd>{Number(descuento) ? `−${formatoPrecio(descuento)}` : '—'}</dd></div>
      <div className="totales-total"><dt>Total</dt><dd>{formatoPrecio(total)}</dd></div>
    </dl>
  )
}
