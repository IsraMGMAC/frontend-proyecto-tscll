import { useEffect, useState } from 'react'
import api from '../services/api'
import { formatCurrency } from '../utils/currency'

const AdminPedidos = ({ user }) => {
  const [pedidos, setPedidos] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [selected, setSelected] = useState(null)
  const [detalle, setDetalle] = useState(null)
  const [updating, setUpdating] = useState(false)
  const [clientes, setClientes] = useState([])
  const [filtroCliente, setFiltroCliente] = useState('')
  const [filtroFechaInicio, setFiltroFechaInicio] = useState('')
  const [filtroFechaFin, setFiltroFechaFin] = useState('')

  useEffect(() => {
    api.get('/alquileres')
      .then((res) => setPedidos(res.data))
      .catch((err) => setError(err?.response?.data?.mensaje || 'Error al cargar pedidos'))
      .finally(() => setLoading(false))
    api.get('/clientes')
      .then((res) => setClientes(res.data))
      .catch(() => {})
  }, [])

  const pedidosFiltrados = pedidos.filter((p) => {
    if (filtroCliente && p.clienteId !== Number(filtroCliente)) return false
    if (filtroFechaInicio && new Date(p.fechaInicio) < new Date(filtroFechaInicio)) return false
    if (filtroFechaFin && new Date(p.fechaInicio) > new Date(filtroFechaFin + 'T23:59:59')) return false
    return true
  })

  const loadDetalle = async (id) => {
    setSelected(id)
    setDetalle(null)
    try {
      const [alq, pagos, resumen] = await Promise.all([
        api.get(`/alquileres/${id}`),
        api.get(`/pagos/alquiler/${id}`),
        api.get(`/pagos/resumen/${id}`),
      ])
      setDetalle({ alquiler: alq.data, pagos: pagos.data, resumen: resumen.data })
    } catch {
      setDetalle(null)
    }
  }

  const cambiarEstado = async (nuevoEstado) => {
    if (!selected || !user?.id) return
    setUpdating(true)
    try {
      if (nuevoEstado === 'Cancelado') {
        await api.post(`/alquileres/${selected}/cancelar`)
      } else if (nuevoEstado === 'Entregado') {
        await api.post(`/alquileres/${selected}/entregar?usuarioEntregaId=${user.id}`)
      } else if (nuevoEstado === 'Devuelto_Completo' || nuevoEstado === 'Devuelto_Con_Problemas') {
        const detalles = detalle?.alquiler?.detalles?.map((d) => ({
          cantidadDevueltaBien: nuevoEstado === 'Devuelto_Completo' ? d.cantidadRentada : 0,
          cantidadDanada: nuevoEstado === 'Devuelto_Con_Problemas' ? d.cantidadRentada : 0,
          cantidadPerdida: 0,
        })) || []
        await api.post(`/alquileres/${selected}/devolver?usuarioDevolucionId=${user.id}`, detalles)
      }
      await loadDetalle(selected)
      const res = await api.get('/alquileres')
      setPedidos(res.data)
    } catch (err) {
      alert(err?.response?.data?.mensaje || 'Error al cambiar estado')
    } finally {
      setUpdating(false)
    }
  }

  const badgeEstado = (estado) => {
    const map = { Pendiente: 'bg-warning text-dark', Entregado: 'bg-primary', Devuelto_Completo: 'bg-success', Devuelto_Con_Problemas: 'bg-danger', Cancelado: 'bg-secondary' }
    return `badge ${map[estado] || 'bg-secondary'}`
  }

  const estadosDisponibles = (estadoActual) => {
    if (estadoActual === 'Pendiente') return ['Entregado', 'Cancelado']
    if (estadoActual === 'Entregado') return ['Devuelto_Completo', 'Devuelto_Con_Problemas']
    return []
  }

  if (loading) return <p className="small-muted">Cargando...</p>
  if (error) return <div className="alert alert-danger">{error}</div>

  return (
    <div>
      <h2 className="section-title">Historial de pedidos</h2>
      {pedidos.length === 0 ? (
        <p className="small-muted">No hay pedidos registrados.</p>
      ) : (
        <>
          <p className="small-muted mb-3">{pedidosFiltrados.length} pedidos {filtroCliente || filtroFechaInicio || filtroFechaFin ? `(filtrados de ${pedidos.length})` : ''}</p>

          <div className="card-surface p-3 mb-3 d-flex flex-wrap gap-3 align-items-end">
            <div>
              <label className="small-muted">Cliente</label>
              <select className="form-select form-select-sm input-cream" value={filtroCliente} onChange={(e) => setFiltroCliente(e.target.value)}>
                <option value="">Todos</option>
                {clientes.map((c) => <option key={c.id} value={c.id}>{c.nombre} {c.apellidoPaterno}</option>)}
              </select>
            </div>
            <div>
              <label className="small-muted">Desde</label>
              <input className="form-control form-control-sm input-cream" type="date" max={filtroFechaFin || ''} value={filtroFechaInicio} onChange={(e) => setFiltroFechaInicio(e.target.value)} />
            </div>
            <div>
              <label className="small-muted">Hasta</label>
              <input className="form-control form-control-sm input-cream" type="date" min={filtroFechaInicio || ''} value={filtroFechaFin} onChange={(e) => setFiltroFechaFin(e.target.value)} />
            </div>
            {(filtroCliente || filtroFechaInicio || filtroFechaFin) ? (
              <button className="btn btn-sm btn-outline-dark" onClick={() => { setFiltroCliente(''); setFiltroFechaInicio(''); setFiltroFechaFin('') }}>Limpiar</button>
            ) : null}
          </div>

          <div className="table-responsive">
            <table className="table align-middle">
              <thead><tr><th>Codigo</th><th>Cliente</th><th>Fechas</th><th>Estado</th><th>Total</th></tr></thead>
              <tbody>
                {pedidosFiltrados.map((p) => (
                  <tr key={p.id} style={{ cursor: 'pointer', background: selected === p.id ? 'rgba(180,90,60,0.08)' : '' }} onClick={() => loadDetalle(p.id)}>
                    <td className="fw-semibold">{p.codigoReserva}</td>
                    <td>{p.clienteNombre}</td>
                    <td className="small-muted">{new Date(p.fechaInicio).toLocaleDateString()} - {new Date(p.fechaFinEsperada).toLocaleDateString()}</td>
                    <td><span className={badgeEstado(p.estado)}>{p.estado?.replace(/_/g, ' ')}</span></td>
                    <td>{formatCurrency(p.totalRenta)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {selected ? (
            <>
            <div className="modal-backdrop fade show" style={{ zIndex: 1040 }} onClick={() => setSelected(null)}></div>
            <div className="modal d-block" tabIndex="-1" style={{ zIndex: 1050 }}>
              <div className="modal-dialog modal-lg modal-dialog-scrollable">
                <div className="modal-content">
                  <div className="modal-header">
                    <h5 className="modal-title">Pedido {detalle?.alquiler?.codigoReserva || ''}</h5>
                    <button type="button" className="btn-close" onClick={() => setSelected(null)}></button>
                  </div>
                  <div className="modal-body">
                  {!detalle ? (
                    <p className="small-muted">Cargando detalle...</p>
                  ) : (
                    <div className="row g-4">
                      <div className="col-12 col-lg-6">
                        <h5 className="fw-semibold mb-3">Detalle del pedido</h5>
                        <div className="d-flex justify-content-between mb-2"><span className="small-muted">Codigo</span><span className="fw-semibold">{detalle.alquiler.codigoReserva}</span></div>
                        <div className="d-flex justify-content-between mb-2"><span className="small-muted">Cliente</span><span>{detalle.alquiler.clienteNombre}</span></div>
                        <div className="d-flex justify-content-between mb-2"><span className="small-muted">Inicio</span><span>{new Date(detalle.alquiler.fechaInicio).toLocaleDateString()}</span></div>
                        <div className="d-flex justify-content-between mb-2"><span className="small-muted">Fin esperado</span><span>{new Date(detalle.alquiler.fechaFinEsperada).toLocaleDateString()}</span></div>
                        {detalle.alquiler.fechaDevolucionReal ? <div className="d-flex justify-content-between mb-2"><span className="small-muted">Devolucion real</span><span>{new Date(detalle.alquiler.fechaDevolucionReal).toLocaleDateString()}</span></div> : null}
                        <div className="d-flex justify-content-between mb-2"><span className="small-muted">Entrega</span><span>{detalle.alquiler.tipoEntrega?.replace(/_/g, ' ')}</span></div>
                        {detalle.alquiler.direccionEnvio ? <div className="d-flex justify-content-between mb-2"><span className="small-muted">Direccion</span><span>{detalle.alquiler.direccionEnvio}</span></div> : null}
                        <hr />
                        <h6 className="fw-semibold">Equipos</h6>
                        {detalle.alquiler.detalles?.map((d) => {
                          const dias = d.precioRentaDia > 0 ? Math.round(d.precioUnitario / d.precioRentaDia) : 1
                          return (
                          <div key={d.id} className="small mb-2 border-bottom pb-2">
                            <div className="fw-semibold">{d.equipoNombre}</div>
                            <div className="d-flex justify-content-between text-muted">
                              <span>{d.cantidadRentada} × {formatCurrency(d.precioRentaDia)} / dia × {dias} {dias === 1 ? 'dia' : 'dias'}</span>
                              <span className="fw-semibold">{formatCurrency(d.subtotal)}</span>
                            </div>
                          </div>
                          )
                        })}
                      </div>
                      <div className="col-12 col-lg-6">
                        <h5 className="fw-semibold mb-3">Resumen financiero</h5>
                        {detalle.resumen ? (
                          <>
                            <div className="d-flex justify-content-between mb-2"><span className="small-muted">Total renta</span><span>{formatCurrency(detalle.resumen.totalAlquiler)}</span></div>
                            <div className="d-flex justify-content-between mb-2"><span className="small-muted">Pagado</span><span className="text-success">{formatCurrency(detalle.resumen.totalPagado)}</span></div>
                            <div className="d-flex justify-content-between mb-2"><span className="small-muted">Saldo</span><span className={detalle.resumen.saldoPendiente > 0 ? 'text-danger' : ''}>{formatCurrency(detalle.resumen.saldoPendiente)}</span></div>
                          </>
                        ) : null}

                        {detalle.pagos?.length > 0 ? (
                          <div className="mt-3">
                            <h6 className="fw-semibold">Pagos realizados</h6>
                            {detalle.pagos.map((p) => (
                              <div key={p.id} className="d-flex justify-content-between small mb-1">
                                <span>{new Date(p.fechaPago).toLocaleDateString()} - {p.metodoPago}</span>
                                <span>{formatCurrency(p.monto)}</span>
                              </div>
                            ))}
                          </div>
                        ) : null}

                        <h5 className="fw-semibold mt-4 mb-3">Cambiar estado</h5>
                        <div className="d-flex flex-wrap gap-2">
                          {estadosDisponibles(detalle.alquiler.estado).map((est) => (
                            <button key={est} className="btn btn-sm btn-outline-dark" disabled={updating} onClick={() => cambiarEstado(est)}>
                              {updating ? '...' : est.replace(/_/g, ' ')}
                            </button>
                          ))}
                          {estadosDisponibles(detalle.alquiler.estado).length === 0 ? (
                            <span className="small-muted">No hay cambios disponibles.</span>
                          ) : null}
                        </div>
                        <div className="mt-3">
                          <span className={badgeEstado(detalle.alquiler.estado)}>{detalle.alquiler.estado?.replace(/_/g, ' ')}</span>
                        </div>
                      </div>
                    </div>
                  )}
                  </div>
                  <div className="modal-footer">
                    <button type="button" className="btn btn-sm btn-outline-dark" onClick={() => setSelected(null)}>Cerrar</button>
                  </div>
                </div>
              </div>
            </div>
            </>
          ) : null}
        </>
      )}
    </div>
  )
}

export default AdminPedidos
