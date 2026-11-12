import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import './index.css'
import { esAdmin, getUsuario } from './api.js'
import Layout from './components/Layout.jsx'
import Clientes from './pages/Clientes.jsx'
import Inventario from './pages/Inventario.jsx'
import Login from './pages/Login.jsx'
import Usuarios from './pages/Usuarios.jsx'
import Ventas from './pages/Ventas.jsx'

// guards visuales; la seguridad real la pone el backend validando el token y el rol
function Protegida({ children }) {
  return getUsuario() ? children : <Navigate to="/login" replace />
}

function SoloAdmin({ children }) {
  return esAdmin() ? children : <Navigate to="/inventario" replace />
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route element={<Protegida><Layout /></Protegida>}>
          <Route path="/inventario" element={<Inventario />} />
          <Route path="/ventas" element={<Ventas />} />
          <Route path="/clientes" element={<Clientes />} />
          <Route path="/usuarios" element={<SoloAdmin><Usuarios /></SoloAdmin>} />
        </Route>
        <Route path="*" element={<Navigate to="/inventario" replace />} />
      </Routes>
    </BrowserRouter>
  </StrictMode>,
)
