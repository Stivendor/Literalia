import {
  ArrowDown, ArrowUp, ArrowUpDown, ChartColumn, DollarSign, Download, Funnel, Plus, ShoppingBag, Users,
} from 'lucide-react'
import { useEffect, useState } from 'react'
import { useOutletContext } from 'react-router-dom'
import { crearLibro, getLibros } from '../api.js'
import Modal from '../components/Modal.jsx'
import { estadoLibro, formatoPrecio, normalizar, toCSV } from '../libros.js'

// ponytail: paginación en el cliente porque GET /libros devuelve todo; paginar en servidor si el catálogo crece mucho
const POR_PAGINA = 10

// TODO backend: no hay endpoints de ventas ni clientes; datos de ejemplo del Figma
const METRICAS_EJEMPLO = [
  { titulo: 'Ventas del Mes', valor: '$66.937.500', icono: DollarSign, cambio: '+8.4%', nota: 'vs mes anterior' },
  { titulo: 'Libros Vendidos', valor: '840', icono: ShoppingBag, cambio: '+15.2%', nota: 'ejemp. vendidos' },
  { titulo: 'Clientes Activos', valor: '312', icono: Users, cambio: '-1.8%', nota: 'activos esta sem.' },
]

const ORDEN_SIGUIENTE = { null: 'asc', asc: 'desc', desc: null }
const ORDEN_ICONO = { null: ArrowUpDown, asc: ArrowUp, desc: ArrowDown }

export default function Inventario() {
  const busqueda = useOutletContext()
  const [libros, setLibros] = useState([])
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState('')
  const [categoria, setCategoria] = useState('')
  const [orden, setOrden] = useState(null)
  const [pagina, setPagina] = useState(0)
  const [nuevo, setNuevo] = useState(false)

  function cargar() {
    return getLibros()
      .then((data) => { setLibros(data); setError('') })
      .catch((e) => setError(e.message))
      .finally(() => setCargando(false))
  }

  useEffect(() => {
    cargar()
  }, [])

  const categorias = [...new Set(libros.map((l) => l.categoria))].sort()
  const q = normalizar(busqueda.trim())
  let filtrados = libros.filter(
    (l) =>
      (!categoria || l.categoria === categoria) &&
      (!q || [l.isbn, l.titulo, l.autor].some((v) => normalizar(v).includes(q))),
  )
  if (orden) filtrados = filtrados.toSorted((a, b) => (orden === 'asc' ? a.stock - b.stock : b.stock - a.stock))

  const totalPaginas = Math.max(1, Math.ceil(filtrados.length / POR_PAGINA))
  const actual = Math.min(pagina, totalPaginas - 1)
  const desde = actual * POR_PAGINA
  const visibles = filtrados.slice(desde, desde + POR_PAGINA)

  function exportar() {
    const url = URL.createObjectURL(new Blob([toCSV(filtrados)], { type: 'text/csv;charset=utf-8' }))
    Object.assign(document.createElement('a'), { href: url, download: 'inventario-literalia.csv' }).click()
    URL.revokeObjectURL(url)
  }

  const OrdenIcono = ORDEN_ICONO[orden]

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1>Panel de Control</h1>
          <p className="muted">Gestión general del catálogo y rendimiento del inventario de libros.</p>
        </div>
        <div className="page-actions">
          <button className="btn btn-outline" onClick={exportar} disabled={!filtrados.length}>
            <Download size={16} /> Exportar CSV
          </button>
          <button className="btn btn-primary" onClick={() => setNuevo(true)}>
            <Plus size={16} /> Nuevo Libro
          </button>
        </div>
      </div>

      <section className="stats">
        <Tarjeta titulo="Total Libros" valor={cargando ? '—' : libros.length.toLocaleString('es-CO')} icono={ChartColumn} nota="títulos registrados" />
        {METRICAS_EJEMPLO.map((m) => <Tarjeta key={m.titulo} {...m} />)}
      </section>

      <section className="card">
        <div className="card-header">
          <div>
            <h2>Inventario de Catálogo</h2>
            <p className="muted">Mostrando todos los títulos registrados en sistema.</p>
          </div>
          <div className="toolbar">
            <label className="btn btn-soft btn-sm select-btn">
              <Funnel size={14} />
              <select
                aria-label="Filtrar categoría"
                value={categoria}
                onChange={(e) => { setCategoria(e.target.value); setPagina(0) }}
              >
                <option value="">Filtrar Categoría</option>
                {categorias.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </label>
            <button
              className="btn btn-soft btn-sm"
              aria-pressed={orden !== null}
              onClick={() => { setOrden(ORDEN_SIGUIENTE[orden]); setPagina(0) }}
            >
              <OrdenIcono size={14} /> Ordenar por Stock
            </button>
          </div>
        </div>

        <div className="table-wrap">
          <table className="tabla">
            <thead>
              <tr>
                <th>ISBN</th>
                <th>Título</th>
                <th>Autor</th>
                <th>Editorial</th>
                <th>Categoría</th>
                <th className="num">Stock</th>
                <th className="num">Precio</th>
                <th>Estado</th>
              </tr>
            </thead>
            <tbody>
              {cargando ? (
                <FilaMensaje>Cargando libros…</FilaMensaje>
              ) : error ? (
                <FilaMensaje error>{error}</FilaMensaje>
              ) : !visibles.length ? (
                <FilaMensaje>{libros.length ? 'Ningún libro coincide con la búsqueda.' : 'No hay libros registrados.'}</FilaMensaje>
              ) : (
                visibles.map((l) => {
                  const estado = estadoLibro(l)
                  return (
                    <tr key={l.id}>
                      <td className="muted">{l.isbn}</td>
                      <td className="strong truncate" title={l.titulo}>{l.titulo}</td>
                      <td>{l.autor}</td>
                      {/* TODO backend: LibroModel no tiene editorial */}
                      <td className="muted">{l.editorial ?? '—'}</td>
                      <td><span className="chip">{l.categoria}</span></td>
                      <td className="num">{l.stock}</td>
                      <td className="num strong">{formatoPrecio(l.precio)}</td>
                      <td><span className={`badge badge--${estado.replace(' ', '-').toLowerCase()}`}>{estado}</span></td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>

        <div className="card-footer">
          <span className="muted">
            {filtrados.length
              ? `Mostrando ${desde + 1}-${desde + visibles.length} de ${filtrados.length} libros`
              : 'Mostrando 0 libros'}
          </span>
          <div className="toolbar">
            <button className="btn btn-outline btn-sm" disabled={actual === 0} onClick={() => setPagina(actual - 1)}>Anterior</button>
            <button className="btn btn-primary btn-sm" disabled={actual >= totalPaginas - 1} onClick={() => setPagina(actual + 1)}>Siguiente</button>
          </div>
        </div>
      </section>

      <NuevoLibro
        open={nuevo}
        categorias={categorias}
        onClose={() => setNuevo(false)}
        onCreado={() => { setNuevo(false); cargar() }}
      />
    </div>
  )
}

function Tarjeta({ titulo, valor, icono: Icono, cambio, nota }) {
  const baja = cambio?.startsWith('-')
  return (
    <article className="stat">
      <div className="stat-top">
        <span className="stat-title">{titulo}</span>
        <span className="stat-icon"><Icono size={18} /></span>
      </div>
      <strong className="stat-value">{valor}</strong>
      <span className="stat-note">
        {cambio && (
          <b className={baja ? 'down' : 'up'}>
            {baja ? <ArrowDown size={12} /> : <ArrowUp size={12} />} {cambio}
          </b>
        )}{' '}
        {nota}
      </span>
    </article>
  )
}

function FilaMensaje({ error, children }) {
  return (
    <tr>
      <td colSpan={8} className={`table-msg ${error ? 'form-error' : 'muted'}`}>{children}</td>
    </tr>
  )
}

function NuevoLibro({ open, categorias, onClose, onCreado }) {
  const [error, setError] = useState('')
  const [guardando, setGuardando] = useState(false)

  async function onSubmit(e) {
    e.preventDefault()
    const form = e.currentTarget
    const d = Object.fromEntries(new FormData(form))
    setError('')
    setGuardando(true)
    try {
      await crearLibro({ ...d, precio: Number(d.precio), stock: Number(d.stock), stock_minimo: Number(d.stock_minimo) })
      form.reset()
      onCreado()
    } catch (err) {
      setError(err.message)
    } finally {
      setGuardando(false)
    }
  }

  function cerrar() {
    setError('')
    onClose()
  }

  return (
    <Modal open={open} onClose={cerrar} className="modal-form" aria-labelledby="nuevo-titulo">
      <form onSubmit={onSubmit}>
        <h2 id="nuevo-titulo">Nuevo Libro</h2>
        <p className="muted">Registra un título en el catálogo.</p>
        <div className="form-grid">
          <label className="field"><span>ISBN</span><input name="isbn" required placeholder="978-84-339-2008-0" /></label>
          <label className="field"><span>Categoría</span><input name="categoria" required list="categorias" /></label>
          <label className="field span-2"><span>Título</span><input name="titulo" required /></label>
          <label className="field span-2"><span>Autor</span><input name="autor" required /></label>
          <label className="field"><span>Precio</span><input name="precio" type="number" min="0" step="any" required /></label>
          <label className="field"><span>Stock</span><input name="stock" type="number" min="0" step="1" required /></label>
          <label className="field"><span>Stock mínimo</span><input name="stock_minimo" type="number" min="0" step="1" defaultValue="5" required /></label>
        </div>
        <datalist id="categorias">{categorias.map((c) => <option key={c} value={c} />)}</datalist>
        {error && <p className="form-error" role="alert">{error}</p>}
        <div className="modal-actions">
          <button type="button" className="btn btn-outline" onClick={cerrar}>Cancelar</button>
          <button className="btn btn-primary" disabled={guardando}>{guardando ? 'Guardando…' : 'Guardar libro'}</button>
        </div>
      </form>
    </Modal>
  )
}
