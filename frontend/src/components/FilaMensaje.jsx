// Fila única de tabla para "cargando", error o lista vacía
export default function FilaMensaje({ columnas, error, children }) {
  return (
    <tr>
      <td colSpan={columnas} className={`table-msg ${error ? 'form-error' : 'muted'}`}>{children}</td>
    </tr>
  )
}
