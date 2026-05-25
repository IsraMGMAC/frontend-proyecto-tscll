import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import api from '../services/api'
import { formatCurrency } from '../utils/currency'

const RentaDetailPage = ({ user }) => {
  const { id } = useParams()
  const navigate = useNavigate()
  const [renta, setRenta] = useState(null)
  const [pagos, setPagos] = useState([])
  const [resumen, setResumen] = useState(null)
  const [loading, setLoading] = useState(true)
  const [cancelMsg, setCancelMsg] = useState({ error: '', success: '' })

  const puedeCancelar = renta && renta.estado === 'Pendiente'

  const msPorDia = 1000 * 60 * 60 * 24
  const hoy = new Date(Date.UTC(
    new Date().getFullYear(),
    new Date().getMonth(),
    new Date().getDate()
  ))
  const inicio = renta ? new Date(renta.fechaInicio.slice(0, 10) + 'T00:00:00Z') : new Date()
  const diasParaInicio = Math.round((inicio.getTime() - hoy.getTime()) / msPorDia)
  const cancelacionValida = puedeCancelar && diasParaInicio > 2
  const reembolso = puedeCancelar
    ? diasParaInicio > 2 ? 100 : diasParaInicio >= 1 ? 50 : 0
    : 0

  useEffect(() => {
    const cargar = async () => {
      try {
        const [rentaRes, pagosRes, resumenRes] = await Promise.all([
          api.get(`/alquileres/${id}`),
          api.get(`/pagos/alquiler/${id}`),
          api.get(`/pagos/resumen/${id}`),
        ])
        setRenta(rentaRes.data)
        setPagos(pagosRes.data)
        setResumen(resumenRes.data)
      } catch {
        navigate('/mis-rentas')
      } finally {
        setLoading(false)
      }
    }
    cargar()
  }, [id, navigate])

  const badgeEstado = (estado) => {
    const map = {
      Pendiente: 'bg-warning text-dark',
      Entregado: 'bg-primary',
      Devuelto_Completo: 'bg-success',
      Devuelto_Con_Problemas: 'bg-danger',
      Cancelado: 'bg-secondary',
    }
    return `badge ${map[estado] || 'bg-secondary'}`
  }

  if (loading) {
    return (
      <div className="container py-5 text-center">
        <p className="small-muted">Cargando...</p>
      </div>
    )
  }

  if (!renta) return null

  const handleCancel = async () => {
    if (!window.confirm('Confirmas cancelar esta reserva?')) return
    setCancelMsg({ error: '', success: '' })
    try {
      await api.post(`/alquileres/${id}/cancelar`)
      setCancelMsg({ error: '', success: 'Reserva cancelada exitosamente.' })
      const rentaRes = await api.get(`/alquileres/${id}`)
      setRenta(rentaRes.data)
    } catch (error) {
      setCancelMsg({ error: error?.response?.data?.mensaje || 'No se pudo cancelar la reserva.', success: '' })
    }
  }

  return (
    <div className="container py-4">
      <button className="btn btn-outline-dark btn-sm mb-4" onClick={() => navigate('/mis-rentas')}>
        &larr; Volver a mis rentas
      </button>

      <div className="card-surface p-4 mb-4">
        <div className="d-flex justify-content-between align-items-start">
          <div>
            <h1 className="section-title mb-1">{renta.codigoReserva}</h1>
            <div className="small-muted">Cliente: {renta.clienteNombre}</div>
          </div>
          <span className={badgeEstado(renta.estado)}>{renta.estado.replace(/_/g, ' ')}</span>
        </div>
        {cancelacionValida ? (
          <>
          <button className="btn btn-outline-danger btn-sm mt-2" onClick={handleCancel}>
            Cancelar reserva
          </button>
          <div className="small-muted mt-1">Reembolso del 100% (mas de 48 hrs de anticipacion)</div>
          </>
        ) : null}
        {renta.estado === 'Pendiente' && diasParaInicio >= 1 && diasParaInicio <= 2 ? (
          <>
          <button className="btn btn-outline-danger btn-sm mt-2" onClick={handleCancel}>
            Cancelar reserva (50% reembolso)
          </button>
          <div className="small-muted mt-1">Entre 24 y 48 hrs de anticipacion — reembolso del 50%</div>
          </>
        ) : null}
        {renta.estado === 'Pendiente' && diasParaInicio < 1 ? (
          <div className="small-muted mt-2">No se puede cancelar. Menos de 24 hrs de anticipacion — no aplica reembolso.</div>
        ) : null}
        {cancelMsg.error ? <div className="alert alert-danger mt-2">{cancelMsg.error}</div> : null}
        {cancelMsg.success ? <div className="alert alert-success mt-2">{cancelMsg.success}</div> : null}
      </div>

      <div className="row g-4">
        <div className="col-12 col-lg-6">
          <div className="card-surface p-4">
            <h2 className="section-title">Detalles de la renta</h2>
            <div className="mt-3">
              <div className="d-flex justify-content-between mb-2">
                <span className="small-muted">Inicio</span>
                <span>{new Date(renta.fechaInicio).toLocaleDateString()}</span>
              </div>
              <div className="d-flex justify-content-between mb-2">
                <span className="small-muted">Fin esperado</span>
                <span>{new Date(renta.fechaFinEsperada).toLocaleDateString()}</span>
              </div>
              {renta.fechaDevolucionReal ? (
                <div className="d-flex justify-content-between mb-2">
                  <span className="small-muted">Devolucion real</span>
                  <span>{new Date(renta.fechaDevolucionReal).toLocaleDateString()}</span>
                </div>
              ) : null}
              <div className="d-flex justify-content-between mb-2">
                <span className="small-muted">Tipo de entrega</span>
                <span>{renta.tipoEntrega?.replace(/_/g, ' ')}</span>
              </div>
              {renta.direccionEnvio ? (
                <div className="d-flex justify-content-between mb-2">
                  <span className="small-muted">Direccion</span>
                  <span>{renta.direccionEnvio}</span>
                </div>
              ) : null}
              {renta.notasOperativas ? (
                <div className="mt-2">
                  <span className="small-muted">Notas:</span>
                  <p className="mb-0">{renta.notasOperativas}</p>
                </div>
              ) : null}
            </div>
          </div>

          <div className="card-surface p-4 mt-4">
            <h2 className="section-title">Resumen financiero</h2>
            {resumen ? (
              <div className="mt-3">
                <div className="d-flex justify-content-between mb-2">
                  <span className="small-muted">Total de la renta</span>
                  <span>{formatCurrency(resumen.totalAlquiler)}</span>
                </div>
                <div className="d-flex justify-content-between mb-2">
                  <span className="small-muted">Total pagado</span>
                  <span className="text-success">{formatCurrency(resumen.totalPagado)}</span>
                </div>
                <div className="d-flex justify-content-between mb-2">
                  <span className="small-muted">Saldo pendiente</span>
                  <span className={resumen.saldoPendiente > 0 ? 'text-danger' : ''}>
                    {formatCurrency(resumen.saldoPendiente)}
                  </span>
                </div>
                <div className="d-flex justify-content-between">
                  <span className="small-muted">Estado de pago</span>
                  <span className={resumen.pagadoCompletamente ? 'text-success fw-semibold' : 'text-warning fw-semibold'}>
                    {resumen.pagadoCompletamente ? 'Pagado' : 'Pendiente'}
                  </span>
                </div>
              </div>
            ) : (
              <p className="small-muted mt-3">No disponible.</p>
            )}

            {pagos.length > 0 ? (
              <div className="mt-3">
                <h5 className="fw-semibold">Pagos realizados</h5>
                {pagos.map((pago) => (
                  <div key={pago.id} className="d-flex justify-content-between align-items-center border-bottom py-2">
                    <div>
                      <div className="small-muted">{new Date(pago.fechaPago).toLocaleDateString()}</div>
                      <div className="small-muted">{pago.metodoPago}{pago.referencia ? ` · ${pago.referencia}` : ''}</div>
                    </div>
                    <span className="fw-semibold">{formatCurrency(pago.monto)}</span>
                  </div>
                ))}
              </div>
            ) : null}
          </div>
        </div>

        <div className="col-12 col-lg-6">
          <div className="card-surface p-4">
            <h2 className="section-title">Equipos rentados</h2>
            <div className="mt-3">
              {renta.detalles?.map((detalle) => (
                  <div key={detalle.id} className="border-bottom py-3" style={{ cursor: 'pointer' }} onClick={() => navigate(`/producto/${detalle.equipoId}`)}>
                  <div className="d-flex justify-content-between">
                    <div>
                      <div className="fw-semibold">{detalle.equipoNombre}</div>
                      <div className="small-muted">
                        {(() => {
                          const dias = detalle.precioRentaDia > 0 ? Math.round(detalle.precioUnitario / detalle.precioRentaDia) : 1
                          return `${detalle.cantidadRentada} × ${formatCurrency(detalle.precioRentaDia)} / dia × ${dias} ${dias === 1 ? 'dia' : 'dias'}`
                        })()}
                      </div>
                    </div>
                    <div className="text-end">
                      <div className="fw-semibold">{formatCurrency(detalle.subtotal)}</div>
                    </div>
                  </div>
                  {detalle.cantidadDevueltaBien > 0 || detalle.cantidadDanada > 0 || detalle.cantidadPerdida > 0 ? (
                    <div className="small-muted mt-1">
                      Devuelto: {detalle.cantidadDevueltaBien} bien, {detalle.cantidadDanada} danado{detalle.cantidadDanada !== 1 ? 's' : ''}, {detalle.cantidadPerdida} perdido{detalle.cantidadPerdida !== 1 ? 's' : ''}
                    </div>
                  ) : null}
                </div>
              ))}
            </div>
            <hr />
            <div className="d-flex justify-content-between fs-5">
              <span className="fw-bold">Total</span>
              <span className="fw-bold">{formatCurrency(renta.totalRenta)}</span>
            </div>
            {renta.costoEnvio > 0 ? (
              <div className="d-flex justify-content-between small-muted">
                <span>Incluye envio</span>
                <span>{formatCurrency(renta.costoEnvio)}</span>
              </div>
            ) : null}
            {renta.depositoGarantia > 0 ? (
              <div className="d-flex justify-content-between small-muted">
                <span>Deposito garantia</span>
                <span>{formatCurrency(renta.depositoGarantia)}</span>
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  )
}

export default RentaDetailPage
