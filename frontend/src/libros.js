export function estadoLibro({ stock, stock_minimo }) {
  if (stock <= 0) return 'Agotado'
  if (stock <= stock_minimo) return 'Bajo Stock'
  return 'Disponible'
}

// "marquez" encuentra "Márquez"
export const normalizar = (s) => String(s ?? '').normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase()

export const formatoPrecio = (n) => '$' + Number(n).toLocaleString('es-CO', { maximumFractionDigits: 0 })

const COLUMNAS = ['isbn', 'titulo', 'autor', 'categoria', 'precio', 'stock', 'stock_minimo']

// ';' + BOM: Excel en español abre bien columnas y tildes
export function toCSV(libros) {
  const celda = (v) => {
    const s = String(v ?? '')
    return /[";\n]/.test(s) ? `"${s.replaceAll('"', '""')}"` : s
  }
  const filas = libros.map((l) => [...COLUMNAS.map((c) => l[c]), estadoLibro(l)])
  return '﻿' + [[...COLUMNAS, 'estado'], ...filas].map((f) => f.map(celda).join(';')).join('\n')
}
