export function estadoLibro({ stock, stock_minimo }) {
  if (stock <= 0) return 'Agotado'
  if (stock <= stock_minimo) return 'Bajo Stock'
  return 'Disponible'
}

// "marquez" encuentra "Márquez"
export const normalizar = (s) => String(s ?? '').normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase()

export const formatoPrecio = (n) => '$' + Number(n).toLocaleString('es-CO', { maximumFractionDigits: 0 })

// SQLite devuelve la fecha en UTC sin zona ("2026-11-12T14:08:54"); Postgres la trae con offset
export const parseFecha = (s) => new Date(/(Z|[+-]\d\d:?\d\d)$/i.test(s) ? s : s + 'Z')

export const formatoFecha = (s) => parseFecha(s).toLocaleString('es-CO', { dateStyle: 'medium', timeStyle: 'short' })

export function esDelMes(s, hoy = new Date()) {
  const f = parseFecha(s)
  return f.getFullYear() === hoy.getFullYear() && f.getMonth() === hoy.getMonth()
}

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
