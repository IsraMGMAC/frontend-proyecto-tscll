import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../services/api'
import { formatCurrency } from '../utils/currency'
import { toApiDateTime, diasEntre } from '../utils/date'

const CartPage = ({ user, carrito, updateCantidad, removeItem, clearCarrito, fechasRenta, setFechasRenta }) => {
  const navigate = useNavigate()
  const isCliente = user?.tipo === 'cliente'
  const [tipoEntrega, setTipoEntrega] = useState('Recoleccion_Sucursal')
  const [direccionEnvio, setDireccionEnvio] = useState('')
  const [pagoMetodo, setPagoMetodo] = useState('TARJETA')
  const [checkoutStatus, setCheckoutStatus] = useState({ loading: false, error: '', message: '' })

  const hoy = new Date().toISOString().slice(0, 10)
  const fechaInicio = fechasRenta?.fechaInicio || ''
  const fechaFin = fechasRenta?.fechaFin || ''

  const totalDias = diasEntre(fechaInicio, fechaFin)

  const totalConDias = useMemo(() => {
    return carrito.reduce((sum, item) => sum + item.precio * item.cantidad * totalDias, 0)
  }, [carrito, totalDias])

  const totalItems = useMemo(() => {
    return carrito.reduce((sum, item) => sum + item.cantidad, 0)
  }, [carrito])

  const costoEnvio = tipoEntrega === 'Recoleccion_Sucursal' ? 0 : (totalItems > 20 ? 0 : 500)
  const depositoGarantia = totalConDias * 0.5
  const totalFinal = totalConDias + costoEnvio

  const hayFechas = fechaInicio && fechaFin

  if (!isCliente) {
    return (
      <div className="container py-5">
        <div className="card-surface p-4 text-center">
          <h2 className="section-title">Acceso restringido</h2>
          <p className="small-muted">Inicia sesion como cliente para ver tu carrito.</p>
          <button className="btn btn-terracotta mt-2" onClick={() => navigate('/login')}>Iniciar sesion</button>
        </div>
      </div>
    )
  }

  if (carrito.length === 0) {
    return (
      <div className="container py-5">
        <div className="card-surface p-4 text-center">
          <h2 className="section-title">Carrito vacio</h2>
          <p className="small-muted">Agrega equipos desde el catalogo para continuar.</p>
          <button className="btn btn-terracotta mt-2" onClick={() => navigate('/')}>Ir al catalogo</button>
        </div>
      </div>
    )
  }

  const handleCheckout = async () => {
    if (!hayFechas) {
      setCheckoutStatus({ loading: false, error: 'Selecciona las fechas de renta.', message: '' })
      return
    }

    setCheckoutStatus({ loading: true, error: '', message: '' })
    try {
      const alquilerPayload = {
        clienteId: user.id,
        codigoReserva: `WEB-${Date.now()}`,
        fechaInicio: toApiDateTime(fechaInicio),
        fechaFinEsperada: toApiDateTime(fechaFin, true),
        tipoEntrega,
        direccionEnvio: tipoEntrega === 'Envio_Domicilio' ? direccionEnvio : null,
        costoEnvio: Number(costoEnvio || 0),
        depositoGarantia: Number(depositoGarantia || 0),
        detalles: carrito.map((item) => ({
          equipoId: item.id,
          cantidadRentada: item.cantidad,
          precioUnitario: item.precio * totalDias,
        })),
      }

      const alquilerRes = await api.post('/alquileres', alquilerPayload)
      clearCarrito()
      navigate(`/renta/${alquilerRes.data.id}`)
    } catch (error) {
      const message = error?.response?.data?.mensaje || 'No se pudo completar el pago.'
      setCheckoutStatus({ loading: false, error: message, message: '' })
    }
  }

  return (
    <div className="container py-4">
      <div className="app-hero">
        <h1 className="app-title fade-in">Carrito y pago</h1>
        <p className="app-subtitle fade-in-delay">Revisa tus equipos, selecciona las fechas de renta y completa tu reserva.</p>
      </div>

      <div className="row g-4">
        <div className="col-12 col-lg-8">
          <div className="card-surface p-4 mb-4">
            <h2 className="section-title">Fechas de renta</h2>
            <div className="row g-2 mt-2">
              <div className="col-6">
                <label className="form-label small-muted">Inicio</label>
                <input className="form-control input-cream" type="date" min={hoy} max={fechaFin || ''} value={fechaInicio} onChange={(e) => setFechasRenta?.((prev) => ({ ...prev, fechaInicio: e.target.value }))} />
              </div>
              <div className="col-6">
                <label className="form-label small-muted">Fin</label>
                <input className="form-control input-cream" type="date" min={fechaInicio || hoy} value={fechaFin} onChange={(e) => setFechasRenta?.((prev) => ({ ...prev, fechaFin: e.target.value }))} />
              </div>
            </div>
            {hayFechas ? <div className="small-muted mt-2">{totalDias} {totalDias === 1 ? 'dia' : 'dias'} de renta</div> : null}
          </div>

          <div className="card-surface p-4">
            <h2 className="section-title">Equipos seleccionados</h2>
            <div className="d-grid gap-3 mt-3">
              {carrito.map((item) => {
                const subtotal = item.precio * item.cantidad * totalDias
                return (
                  <div key={item.id} className="d-flex align-items-center justify-content-between border rounded-3 p-3 bg-white">
                    <div>
                      <div className="fw-semibold">{item.nombre}</div>
                      <div className="small-muted">{formatCurrency(item.precio)} / dia</div>
                    </div>
                    <div className="d-flex align-items-center gap-2">
                      <input className="form-control input-cream" type="number" min="1" max={item.maxDisponible || 999} value={item.cantidad} onChange={(e) => updateCantidad(item.id, Math.min(Number(e.target.value), item.maxDisponible || 999))} style={{ width: 70 }} />
                      <button className="btn btn-outline-danger btn-sm" onClick={() => removeItem(item.id)}>Quitar</button>
                    </div>
                    <div className="text-end">
                      <div className="fw-semibold">{formatCurrency(subtotal)}</div>
                      <div className="small-muted">{item.cantidad} × {formatCurrency(item.precio)} × {totalDias} {totalDias === 1 ? 'dia' : 'dias'}</div>
                    </div>
                  </div>
                )
              })}
            </div>
            <hr />
            <div className="d-flex justify-content-between fs-5">
              <span>Subtotal renta</span>
              <span className="fw-bold">{formatCurrency(totalConDias)}</span>
            </div>
          </div>
        </div>

        <div className="col-12 col-lg-4">
          <div className="card-surface p-4">
            <h2 className="section-title">Confirmar reserva</h2>
            <div className="mb-3 mt-3">
              <label className="form-label">Tipo de entrega</label>
              <select className="form-select input-cream" value={tipoEntrega} onChange={(e) => setTipoEntrega(e.target.value)}>
                <option value="Recoleccion_Sucursal">Recoleccion en sucursal</option>
                <option value="Envio_Domicilio">Envio a domicilio</option>
              </select>
            </div>
            {tipoEntrega === 'Envio_Domicilio' ? (
              <div className="mb-3">
                <label className="form-label">Direccion de envio</label>
                <textarea className="form-control input-cream" rows={2} value={direccionEnvio} onChange={(e) => setDireccionEnvio(e.target.value)} />
              </div>
            ) : null}
            <div className="mb-3">
              <label className="form-label">Costo de envio</label>
              <div className="fw-semibold">{costoEnvio === 0 ? (tipoEntrega === 'Recoleccion_Sucursal' ? 'Sin costo' : 'Gratis') : formatCurrency(costoEnvio)}</div>
              <div className="small-muted">{totalItems} producto{totalItems !== 1 ? 's' : ''}</div>
            </div>
            <div className="mb-3">
              <label className="form-label">Deposito garantia (50%)</label>
              <div className="fw-semibold">{formatCurrency(depositoGarantia)}</div>
              <div className="small-muted">Reembolsable al devolver el equipo</div>
            </div>
            <div className="mb-3">
              <label className="form-label">Metodo de pago</label>
              <select className="form-select input-cream" value={pagoMetodo} onChange={(e) => setPagoMetodo(e.target.value)}>
                <option value="TARJETA">Tarjeta</option>
                <option value="EFECTIVO">Efectivo</option>
                <option value="PAYPAL">Paypal</option>
              </select>
            </div>
            <hr />
            <div className="d-flex justify-content-between mb-2"><span>Renta</span><span>{formatCurrency(totalConDias)}</span></div>
            <div className="d-flex justify-content-between mb-2"><span>Envio</span><span>{costoEnvio === 0 ? 'Gratis' : formatCurrency(costoEnvio)}</span></div>
            <div className="d-flex justify-content-between mb-2 small-muted"><span>Deposito garantia (50%)</span><span>{formatCurrency(depositoGarantia)} *</span></div>
            <div className="d-flex justify-content-between fs-5 mb-3"><span className="fw-bold">Total a pagar</span><span className="fw-bold">{formatCurrency(totalFinal)}</span></div>
            <button className="btn btn-terracotta w-100" onClick={handleCheckout} disabled={checkoutStatus.loading || !hayFechas}>
              {!hayFechas
                ? 'Selecciona las fechas de renta'
                : checkoutStatus.loading
              ? 'Procesando...'
              : `Alquilar ${formatCurrency(totalFinal)}`}
            </button>
            {checkoutStatus.error ? <div className="alert alert-danger mt-3">{checkoutStatus.error}</div> : null}
          </div>
        </div>
      </div>
    </div>
  )
}

export default CartPage
