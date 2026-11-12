import { useState } from 'react'

// ponytail: paginación en el cliente porque la API devuelve listas completas; paginar en servidor si crecen mucho
const POR_PAGINA = 10

export function usePaginacion(items, nombre) {
  const [pagina, setPagina] = useState(0)
  const totalPaginas = Math.max(1, Math.ceil(items.length / POR_PAGINA))
  const actual = Math.min(pagina, totalPaginas - 1)
  const desde = actual * POR_PAGINA
  const visibles = items.slice(desde, desde + POR_PAGINA)

  const pie = (
    <div className="card-footer">
      <span className="muted">
        {items.length ? `Mostrando ${desde + 1}-${desde + visibles.length} de ${items.length} ${nombre}` : `Mostrando 0 ${nombre}`}
      </span>
      <div className="toolbar">
        <button className="btn btn-outline btn-sm" disabled={actual === 0} onClick={() => setPagina(actual - 1)}>Anterior</button>
        <button className="btn btn-primary btn-sm" disabled={actual >= totalPaginas - 1} onClick={() => setPagina(actual + 1)}>Siguiente</button>
      </div>
    </div>
  )

  return { visibles, pie, reiniciar: () => setPagina(0) }
}
