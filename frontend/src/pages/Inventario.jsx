import {
  ArrowDown, ArrowLeftRight, ArrowUp, ArrowUpDown, ChartColumn, DollarSign, Download, Funnel, Pencil, Plus, TriangleAlert, Users,
} from 'lucide-react'
import { useEffect, useState } from 'react'
import { useOutletContext } from 'react-router-dom'
import {
  actualizarLibro, crearLibro, crearMovimiento, esAdmin, getClientes, getLibros, getMovimientos, getVentas,
} from '../api.js'
import FilaMensaje from '../components/FilaMensaje.jsx'
import Modal from '../components/Modal.jsx'
import { usePaginacion } from '../components/usePaginacion.jsx'
import { esDelMes, estadoLibro, formatoFecha, formatoPrecio, normalizar, toCSV } from '../libros.js'

const ORDEN_SIGUIENTE = { null: 'asc', asc: 'desc', desc: null }
const ORDEN_ICONO = { null: ArrowUpDown, asc: ArrowUp, desc: ArrowDown }

export default function Inventario() {
  const busqueda = useOutletContext()
  const admin = esAdmin()
  const [datos, setDatos] = useState({ libros: [], movimientos: [], ventas: [], clientes: [] })
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState('')
  const [categoria, setCategoria] = useState('')
  const [orden, setOrden] = useState(null)
  const [modal, setModal] = useState(null) // 'libro' | 'movimiento' | libro a editar

  function cargar() {
    return Promise.all([getLibros(), getMovimientos(), getVentas(), getClientes()])
      .then(([libros, movimientos, ventas, clientes]) => {
        setDatos({ libros, movimientos, ventas, clientes })
        setError('')
      })
      .catch((e) => setError(e.message))
      .finally(() => setCargando(false))
  }

  useEffect(() => {
    cargar()
  }, [])

  function guardado() {
    setModal(null)
    cargar()
  }

  const { libros, movimientos, ventas, clientes } = datos
  const categorias = [...new Set(libros.map((l) => l.categoria))].sort()
  const tituloPorId = Object.fromEntries(libros.map((l) => [l.id, l.titulo]))
  const q = normalizar(busqueda.trim())
  let filtrados = libros.filter(
    (l) =>
      (!categoria || l.categoria === categoria) &&
      (!q || [l.isbn, l.titulo, l.autor].some((v) => normalizar(v).includes(q))),
  )
  if (orden) filtrados = filtrados.toSorted((a, b) => (orden === 'asc' ? a.stock - b.stock : b.stock - a.stock))

  const paginaLibros = usePaginacion(filtrados, 'libros')
  const paginaMovs = usePaginacion(movimientos, 'movimientos')

  const ventasMes = ventas.filter((v) => esDelMes(v.fecha))
  const mostrar = (valor) => (cargando ? '—' : valor)
  const metricas = [
    { titulo: 'Total Libros', valor: mostrar(libros.length.toLocaleString('es-CO')), icono: ChartColumn, nota: 'títulos registrados' },
    {
      titulo: 'Ventas del Mes',
      valor: mostrar(formatoPrecio(ventasMes.reduce((s, v) => s + Number(v.total), 0))),
      icono: DollarSign,
      nota: `${ventasMes.length} ${ventasMes.length === 1 ? 'venta' : 'ventas'} este mes`,
    },
    { titulo: 'Bajo Stock', valor: mostrar(libros.filter((l) => estadoLibro(l) !== 'Disponible').length), icono: TriangleAlert, nota: 'títulos por reponer' },
    { titulo: 'Clientes Activos', valor: mostrar(clientes.length.toLocaleString('es-CO')), icono: Users, nota: 'clientes registrados' },
  ]

  function exportar() {
    const url = URL.createObjectURL(new Blob([toCSV(filtrados)], { type: 'text/csv;charset=utf-8' }))
    Object.assign(document.createElement('a'), { href: url, download: 'inventario-literalia.csv' }).click()
    URL.revokeObjectURL(url)
  }

  const OrdenIcono = ORDEN_ICONO[orden]
  const columnas = admin ? 9 : 8
  const editando = typeof modal === 'object' ? modal : null // typeof null es 'object': null queda null
  const modalLibro = modal === 'libro' || editando !== null

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
          {admin && (
            <>
              <button className="btn btn-outline" onClick={() => setModal('movimiento')} disabled={!libros.length}>
                <ArrowLeftRight size={16} /> Movimiento de Stock
              </button>
              <button className="btn btn-primary" onClick={() => setModal('libro')}>
                <Plus size={16} /> Nuevo Libro
              </button>
            </>
          )}
        </div>
      </div>

      <section className="stats">
        {metricas.map((m) => <Tarjeta key={m.titulo} {...m} />)}
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
                onChange={(e) => { setCategoria(e.target.value); paginaLibros.reiniciar() }}
              >
                <option value="">Filtrar Categoría</option>
                {categorias.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </label>
            <button
              className="btn btn-soft btn-sm"
              aria-pressed={orden !== null}
              onClick={() => { setOrden(ORDEN_SIGUIENTE[orden]); paginaLibros.reiniciar() }}
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
                {admin && <th><span className="sr-only">Acciones</span></th>}
              </tr>
            </thead>
            <tbody>
              {cargando ? (
                <FilaMensaje columnas={columnas}>Cargando libros…</FilaMensaje>
              ) : error ? (
                <FilaMensaje columnas={columnas} error>{error}</FilaMensaje>
              ) : !paginaLibros.visibles.length ? (
                <FilaMensaje columnas={columnas}>{libros.length ? 'Ningún libro coincide con la búsqueda.' : 'No hay libros registrados.'}</FilaMensaje>
              ) : (
                paginaLibros.visibles.map((l) => {
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
                      {admin && (
                        <td className="acciones">
                          <button className="btn btn-soft btn-sm" onClick={() => setModal(l)} aria-label={`Editar ${l.titulo}`}>
                            <Pencil size={14} /> Editar
                          </button>
                        </td>
                      )}
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>

        {paginaLibros.pie}
      </section>

      <section className="card">
        <div className="card-header">
          <div>
            <h2>Movimientos de Inventario</h2>
            <p className="muted">Entradas y salidas de ejemplares, incluidas las generadas por ventas.</p>
          </div>
        </div>

        <div className="table-wrap">
          <table className="tabla">
            <thead>
              <tr>
                <th>Fecha</th>
                <th>Libro</th>
                <th>Tipo</th>
                <th className="num">Cantidad</th>
                <th>Motivo</th>
              </tr>
            </thead>
            <tbody>
              {cargando ? (
                <FilaMensaje columnas={5}>Cargando movimientos…</FilaMensaje>
              ) : error ? (
                <FilaMensaje columnas={5} error>{error}</FilaMensaje>
              ) : !movimientos.length ? (
                <FilaMensaje columnas={5}>Todavía no hay movimientos.</FilaMensaje>
              ) : (
                paginaMovs.visibles.map((m) => (
                  <tr key={m.id}>
                    <td className="muted">{formatoFecha(m.fecha)}</td>
                    <td className="strong truncate" title={tituloPorId[m.libro_id]}>{tituloPorId[m.libro_id] ?? `Libro #${m.libro_id}`}</td>
                    <td><span className={`badge badge--${m.tipo}`}>{m.tipo === 'entrada' ? 'Entrada' : 'Salida'}</span></td>
                    <td className="num strong">{m.tipo === 'entrada' ? '+' : '−'}{m.cantidad}</td>
                    <td className="truncate" title={m.motivo}>{m.motivo}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {paginaMovs.pie}
      </section>

      <Modal open={modalLibro} onClose={() => setModal(null)} className="modal-form" aria-labelledby="libro-titulo">
        {modalLibro && (
          <FormLibro
            libro={editando}
            categorias={categorias}
            onCancel={() => setModal(null)}
            onGuardado={guardado}
          />
        )}
      </Modal>

      <Modal open={modal === 'movimiento'} onClose={() => setModal(null)} className="modal-form" aria-labelledby="movimiento-titulo">
        {modal === 'movimiento' && <FormMovimiento libros={libros} onCancel={() => setModal(null)} onGuardado={guardado} />}
      </Modal>
    </div>
  )
}

function Tarjeta({ titulo, valor, icono: Icono, nota }) {
  return (
    <article className="stat">
      <div className="stat-top">
        <span className="stat-title">{titulo}</span>
        <span className="stat-icon"><Icono size={18} /></span>
      </div>
      <strong className="stat-value">{valor}</strong>
      <span className="stat-note">{nota}</span>
    </article>
  )
}

function FormMovimiento({ libros, onCancel, onGuardado }) {
  const [error, setError] = useState('')
  const [guardando, setGuardando] = useState(false)
  const activos = libros.filter((l) => l.activo !== false).toSorted((a, b) => a.titulo.localeCompare(b.titulo))

  async function onSubmit(e) {
    e.preventDefault()
    const d = Object.fromEntries(new FormData(e.currentTarget))
    setError('')
    setGuardando(true)
    try {
      await crearMovimiento({ libro_id: Number(d.libro_id), tipo: d.tipo, cantidad: Number(d.cantidad), motivo: d.motivo.trim() })
      onGuardado()
    } catch (err) {
      setError(err.message)
      setGuardando(false)
    }
  }

  return (
    <form onSubmit={onSubmit}>
      <h2 id="movimiento-titulo">Movimiento de Stock</h2>
      <p className="muted">Registra una entrada (compra, devolución) o una salida (daño, pérdida) de ejemplares.</p>
      <div className="form-grid">
        <label className="field span-2">
          <span>Libro</span>
          <select name="libro_id" required defaultValue="">
            <option value="" disabled>Selecciona un libro</option>
            {activos.map((l) => <option key={l.id} value={l.id}>{l.titulo} — stock {l.stock}</option>)}
          </select>
        </label>
        <label className="field">
          <span>Tipo</span>
          <select name="tipo" defaultValue="entrada">
            <option value="entrada">Entrada</option>
            <option value="salida">Salida</option>
          </select>
        </label>
        <label className="field"><span>Cantidad</span><input name="cantidad" type="number" min="1" step="1" required /></label>
        <label className="field span-2">
          <span>Motivo</span>
          <input name="motivo" required minLength={3} maxLength={255} placeholder="Ej: compra a proveedor" />
        </label>
      </div>
      {error && <p className="form-error" role="alert">{error}</p>}
      <div className="modal-actions">
        <button type="button" className="btn btn-outline" onClick={onCancel}>Cancelar</button>
        <button className="btn btn-primary" disabled={guardando}>{guardando ? 'Guardando…' : 'Registrar movimiento'}</button>
      </div>
    </form>
  )
}

// libro = null crea; con libro edita
function FormLibro({ libro, categorias, onCancel, onGuardado }) {
  const [error, setError] = useState('')
  const [guardando, setGuardando] = useState(false)

  async function onSubmit(e) {
    e.preventDefault()
    const d = Object.fromEntries(new FormData(e.currentTarget))
    // PUT ignora el stock (se mueve con Movimiento de Stock), pero LibroCreate lo exige
    const datos = { ...d, precio: Number(d.precio), stock: libro ? libro.stock : Number(d.stock), stock_minimo: Number(d.stock_minimo) }
    setError('')
    setGuardando(true)
    try {
      await (libro ? actualizarLibro(libro.id, datos) : crearLibro(datos))
      onGuardado()
    } catch (err) {
      setError(err.message)
      setGuardando(false)
    }
  }

  return (
    <form onSubmit={onSubmit}>
      <h2 id="libro-titulo">{libro ? 'Editar Libro' : 'Nuevo Libro'}</h2>
      <p className="muted">{libro ? 'El stock se ajusta con Movimiento de Stock.' : 'Registra un título en el catálogo.'}</p>
      <div className="form-grid">
        <label className="field"><span>ISBN</span><input name="isbn" required placeholder="978-84-339-2008-0" defaultValue={libro?.isbn} /></label>
        <label className="field"><span>Categoría</span><input name="categoria" required list="categorias" defaultValue={libro?.categoria} /></label>
        <label className="field span-2"><span>Título</span><input name="titulo" required defaultValue={libro?.titulo} /></label>
        <label className="field span-2"><span>Autor</span><input name="autor" required defaultValue={libro?.autor} /></label>
        <label className="field"><span>Precio</span><input name="precio" type="number" min="0" step="any" required defaultValue={libro?.precio} /></label>
        {!libro && <label className="field"><span>Stock</span><input name="stock" type="number" min="0" step="1" required /></label>}
        <label className="field">
          <span>Stock mínimo</span>
          <input name="stock_minimo" type="number" min="0" step="1" defaultValue={libro?.stock_minimo ?? 5} required />
        </label>
      </div>
      <datalist id="categorias">{categorias.map((c) => <option key={c} value={c} />)}</datalist>
      {error && <p className="form-error" role="alert">{error}</p>}
      <div className="modal-actions">
        <button type="button" className="btn btn-outline" onClick={onCancel}>Cancelar</button>
        <button className="btn btn-primary" disabled={guardando}>{guardando ? 'Guardando…' : libro ? 'Guardar cambios' : 'Guardar libro'}</button>
      </div>
    </form>
  )
}
