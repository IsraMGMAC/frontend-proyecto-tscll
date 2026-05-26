import { useState, useMemo, useCallback, useEffect } from 'react'
import { Route, Routes, useNavigate } from 'react-router-dom'
import Navbar from './components/Navbar'
import CatalogPage from './pages/CatalogPage'
import LoginPage from './pages/LoginPage'
import AdminPage from './pages/AdminPage'
import ConditionsPage from './pages/ConditionsPage'
import AboutPage from './pages/AboutPage'
import FAQPage from './pages/FAQPage'
import ProductPage from './pages/ProductPage'
import CartPage from './pages/CartPage'
import MisRentasPage from './pages/MisRentasPage'
import RentaDetailPage from './pages/RentaDetailPage'
import ProfilePage from './pages/ProfilePage'

const CART_KEY = 'renta_eventos_carrito'
const USER_KEY = 'renta_eventos_user'
const FECHAS_KEY = 'renta_eventos_fechas'

function App() {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem(USER_KEY)
    return saved ? JSON.parse(saved) : null
  })
  const [carrito, setCarrito] = useState(() => {
    const saved = localStorage.getItem(CART_KEY)
    return saved ? JSON.parse(saved) : []
  })
  const [fechasRenta, setFechasRenta] = useState(() => {
    const saved = localStorage.getItem(FECHAS_KEY)
    return saved ? JSON.parse(saved) : { fechaInicio: '', fechaFin: '' }
  })
  const [toast, setToast] = useState({ show: false, message: '' })
  const navigate = useNavigate()

  const showToast = (message) => {
    setToast({ show: true, message })
    setTimeout(() => setToast({ show: false, message: '' }), 2500)
  }

  useEffect(() => {
    localStorage.setItem(CART_KEY, JSON.stringify(carrito))
  }, [carrito])

  useEffect(() => {
    localStorage.setItem(FECHAS_KEY, JSON.stringify(fechasRenta))
  }, [fechasRenta])

  useEffect(() => {
    if (user) {
      localStorage.setItem(USER_KEY, JSON.stringify(user))
    } else {
      localStorage.removeItem(USER_KEY)
    }
  }, [user])

  const handleLogin = (data) => {
    setUser(data)
    navigate('/')
  }

  const handleLogout = () => {
    setUser(null)
    navigate('/')
  }

  const addToCarrito = useCallback((equipo, cantidad = 1, fechaInicio = '', fechaFin = '', maxDisponible = 999) => {
    if (cantidad > maxDisponible) return
    setCarrito((prev) => {
      const existing = prev.find((item) => item.id === equipo.id)
      if (existing) {
        const nuevaCant = existing.cantidad + cantidad
        if (nuevaCant > maxDisponible) return prev
        return prev.map((item) =>
          item.id === equipo.id
            ? { ...item, cantidad: nuevaCant }
            : item,
        )
      }
      return [
        ...prev,
        {
          id: equipo.id,
          nombre: equipo.nombre,
          precio: Number(equipo.precioRentaDia || 0),
          cantidad,
          fechaInicio,
          fechaFin,
          maxDisponible,
        },
      ]
    })
  }, [])

  const updateCantidad = useCallback((id, cantidad) => {
    const value = Math.max(1, Number(cantidad))
    setCarrito((prev) =>
      prev.map((item) => (item.id === id ? { ...item, cantidad: value } : item)),
    )
  }, [])

  const removeItem = useCallback((id) => {
    setCarrito((prev) => prev.filter((item) => item.id !== id))
  }, [])

  const clearCarrito = useCallback(() => {
    setCarrito([])
  }, [])

  const totalCarrito = useMemo(() => {
    return carrito.reduce((sum, item) => sum + item.precio * item.cantidad, 0)
  }, [carrito])

  const cartProps = {
    carrito, addToCarrito, updateCantidad, removeItem, clearCarrito, totalCarrito,
    fechasRenta, setFechasRenta, showToast,
  }

  return (
    <div className="app-shell">
      <div className="container">
        <Navbar user={user} onLogout={handleLogout} carritoCount={carrito.length} />
      </div>
      {toast.show ? (
        <div className="position-fixed top-0 start-50 translate-middle-x mt-5" style={{ zIndex: 9999 }}>
          <div className="alert alert-success shadow-lg d-flex align-items-center gap-2 px-4 py-3 rounded-4 mb-0">
            <span>{toast.message}</span>
          </div>
        </div>
      ) : null}
      <Routes>
        <Route path="/" element={<CatalogPage user={user} {...cartProps} />} />
        <Route path="/producto/:slug" element={<ProductPage user={user} {...cartProps} />} />
        <Route path="/carrito" element={<CartPage user={user} {...cartProps} />} />
        <Route path="/mis-rentas" element={<MisRentasPage user={user} />} />
        <Route path="/renta/:id" element={<RentaDetailPage user={user} />} />
        <Route path="/perfil" element={<ProfilePage user={user} />} />
        <Route path="/login" element={<LoginPage onLogin={handleLogin} />} />
        <Route path="/admin" element={<AdminPage user={user} />} />
        <Route path="/condiciones" element={<ConditionsPage />} />
        <Route path="/nosotros" element={<AboutPage />} />
        <Route path="/faq" element={<FAQPage />} />
      </Routes>
      <footer className="container py-4">
        <div className="footer-note text-center">
          Renta Eventos &copy; {new Date().getFullYear()} &mdash; Alquiler de equipo para eventos
        </div>
      </footer>
    </div>
  )
}

export default App
