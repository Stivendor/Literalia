import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import './index.css'
import { getUsuario } from './api.js'
import Layout from './components/Layout.jsx'
import Inventario from './pages/Inventario.jsx'
import Login from './pages/Login.jsx'

// ponytail: guard solo visual; sin token, la API no está protegida
function Protegida({ children }) {
  return getUsuario() ? children : <Navigate to="/login" replace />
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route element={<Protegida><Layout /></Protegida>}>
          <Route path="/inventario" element={<Inventario />} />
        </Route>
        <Route path="*" element={<Navigate to="/inventario" replace />} />
      </Routes>
    </BrowserRouter>
  </StrictMode>,
)
