import { useEffect, useRef } from 'react'

// <dialog> nativo: Esc, foco y fondo oscuro sin librerías
export default function Modal({ open, onClose, className = '', children, ...props }) {
  const ref = useRef(null)

  useEffect(() => {
    const dialog = ref.current
    if (open && !dialog.open) dialog.showModal()
    if (!open && dialog.open) dialog.close()
  }, [open])

  return (
    <dialog
      ref={ref}
      className={`modal ${className}`}
      // el evento 'close' llega después del render; solo avisar si seguía abierto (Esc / clic afuera)
      onClose={() => open && onClose()}
      onClick={(e) => e.target === ref.current && onClose()}
      {...props}
    >
      <div className="modal-body">{children}</div>
    </dialog>
  )
}
