import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import api from '../services/api'
import { formatCurrency } from '../utils/currency'

const SUB_TABS = [
  { id: 'todos', label: 'Todos los pedidos' },
  { id: 'entregar', label: 'Entregar pedido' },
  { id: 'recibir', label: 'Recibir pedido' },
  { id: 'devueltos', label: 'Pedidos devueltos' },
  { id: 'cancelados', label: 'Pedidos cancelados' },
]

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
  const [subTab, setSubTab] = useState('todos')
  const [devolucionDetalles, setDevolucionDetalles] = useState([])
  const [pagoMonto, setPagoMonto] = useState('')
  const [pagoMetodo, setPagoMetodo] = useState('EFECTIVO')

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
    if (subTab === 'entregar' && p.estado !== 'Pendiente') return false
    if (subTab === 'recibir' && p.estado !== 'Entregado') return false
    if (subTab === 'devueltos' && p.estado !== 'Devuelto_Completo' && p.estado !== 'Devuelto_Con_Problemas') return false
    if (subTab === 'cancelados' && p.estado !== 'Cancelado') return false
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
      setPagoMonto('')
      setPagoMetodo('EFECTIVO')
      if (alq.data.estado === 'Entregado') {
        setDevolucionDetalles(alq.data.detalles?.map(d => ({
          detalleId: d.id,
          equipoId: d.equipoId,
          equipoNombre: d.equipoNombre,
          cantidadRentada: d.cantidadRentada,
          devueltaBien: d.cantidadRentada,
          danada: 0,
          perdida: 0,
        })) || [])
      } else {
        setDevolucionDetalles([])
      }
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
        if (Number(pagoMonto) > 0) {
          await api.post('/pagos', buildPagoPayload('entrega'))
        }
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

  const procesarDevolucion = async () => {
    if (!selected || !user?.id) return
    setUpdating(true)
    try {
      const detalles = devolucionDetalles.map(d => ({
        cantidadDevueltaBien: d.devueltaBien,
        cantidadDanada: d.danada,
        cantidadPerdida: d.perdida,
      }))

      await api.post(`/alquileres/${selected}/devolver?usuarioDevolucionId=${user.id}`, detalles)
      if (Number(pagoMonto) > 0) {
        await api.post('/pagos', buildPagoPayload('devolucion'))
      }

      for (const d of devolucionDetalles) {
        if (d.danada === 0 && d.perdida === 0) continue
        const res = await api.get(`/equipos/${d.equipoId}`)
        const e = res.data
        const updateData = {
          categoriaId: e.categoriaId,
          sku: e.sku,
          nombre: e.nombre,
          slug: e.slug,
          descripcion: e.descripcion || '',
          cantidadOptima: e.cantidadOptima || 0,
          cantidadConDetalles: e.cantidadConDetalles || 0,
          cantidadMantenimiento: e.cantidadMantenimiento || 0,
          cantidadInservible: e.cantidadInservible || 0,
          precioRentaDia: e.precioRentaDia || 0,
          visibleWeb: e.visibleWeb,
        }
        if (d.danada > 0) {
          updateData.cantidadOptima = Math.max(0, updateData.cantidadOptima - d.danada)
          updateData.cantidadConDetalles += d.danada
        }
        if (d.perdida > 0) {
          updateData.cantidadOptima = Math.max(0, updateData.cantidadOptima - d.perdida)
        }
        await api.put(`/equipos/${d.equipoId}`, updateData)
      }

      await loadDetalle(selected)
      const res = await api.get('/alquileres')
      setPedidos(res.data)
    } catch (err) {
      alert(err?.response?.data?.mensaje || 'Error al procesar devolución')
    } finally {
      setUpdating(false)
    }
  }

  const buildPagoPayload = (contexto) => {
    const hoy = new Date()
    const dd = String(hoy.getDate()).padStart(2, '0')
    const mm = String(hoy.getMonth() + 1).padStart(2, '0')
    const aa = String(hoy.getFullYear()).slice(-2)
    const fecha = `${dd}${mm}${aa}`
    const payload = {
      alquilerId: selected,
      monto: Number(pagoMonto),
      metodoPago: pagoMetodo,
      notas: contexto === 'entrega' ? 'pago al entregar pedido' : 'pago al recibir pedido',
    }
    if (pagoMetodo === 'PAYPAL') {
      payload.referencia = `PAYPAL-EVENTOS-${fecha}`
    } else if (pagoMetodo === 'TARJETA') {
      payload.referencia = `TARJETA-EVENTOS-${fecha}`
    }
    return payload
  }

  const badgeEstado = (estado) => {
    const map = { Pendiente: 'bg-warning text-dark', Entregado: 'bg-primary', Devuelto_Completo: 'bg-success', Devuelto_Con_Problemas: 'bg-danger', Cancelado: 'bg-secondary' }
    return `badge ${map[estado] || 'bg-secondary'}`
  }

  const estadosDisponibles = (estadoActual) => {
    if (estadoActual === 'Pendiente') return ['Entregado', 'Cancelado']
    return []
  }

  const diasRestantes = (fechaFinEsperada) => {
    const hoy = new Date()
    hoy.setHours(0, 0, 0, 0)
    const fin = new Date(fechaFinEsperada)
    fin.setHours(0, 0, 0, 0)
    const diff = fin.getTime() - hoy.getTime()
    return Math.ceil(diff / (1000 * 60 * 60 * 24))
  }

  const handleSubTabChange = (tabId) => {
    setSubTab(tabId)
    setSelected(null)
    setDetalle(null)
  }

  if (loading) return <p className="small-muted">Cargando...</p>
  if (error) return <div className="alert alert-danger">{error}</div>

  return (
    <div>
      <h2 className="section-title">Historial de pedidos</h2>

      <div className="d-flex gap-2 mb-3 flex-wrap">
        {SUB_TABS.map((t) => (
          <button
            key={t.id}
            className={`btn btn-sm ${subTab === t.id ? 'btn-dark' : 'btn-outline-dark'}`}
            onClick={() => handleSubTabChange(t.id)}
          >
            {t.label}
          </button>
        ))}
      </div>

      {pedidos.length === 0 ? (
        <p className="small-muted">No hay pedidos registrados.</p>
      ) : (
        <>
          <p className="small-muted mb-3">
            {pedidosFiltrados.length} pedidos
            {subTab === 'entregar' ? ' pendientes' : subTab === 'recibir' ? ' por recibir' : subTab === 'devueltos' ? ' devueltos' : subTab === 'cancelados' ? ' cancelados' : ''}
            {(filtroCliente || filtroFechaInicio || filtroFechaFin) ? ` (filtrados de ${pedidos.length})` : ''}
          </p>

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
              <thead>
                <tr>
                  <th>Código</th>
                  <th>Cliente</th>
                  <th>Fechas</th>
                  <th>Estado</th>
                  {subTab === 'recibir' && <th>Dias restantes</th>}
                  {(subTab === 'todos' || subTab === 'devueltos') && <th>Entrego</th>}
                  {(subTab === 'todos' || subTab === 'devueltos') && <th>Recibio</th>}
                  {subTab === 'recibir' && <th>Entrego</th>}
                  <th>Total</th>
                </tr>
              </thead>
              <tbody>
                {pedidosFiltrados.map((p) => {
                  const dias = subTab === 'recibir' ? diasRestantes(p.fechaFinEsperada) : null
                  return (
                    <tr
                      key={p.id}
                      style={{ cursor: 'pointer', background: selected === p.id ? 'rgba(180,90,60,0.08)' : '' }}
                      onClick={() => loadDetalle(p.id)}
                    >
                      <td className="fw-semibold">{p.codigoReserva}</td>
                      <td>{p.clienteNombre}</td>
                      <td className="small-muted">{new Date(p.fechaInicio).toLocaleDateString()} - {new Date(p.fechaFinEsperada).toLocaleDateString()}</td>
                      <td><span className={badgeEstado(p.estado)}>{p.estado?.replace(/_/g, ' ')}</span></td>
                      {subTab === 'recibir' && (
                        <td>
                          <span className={dias < 0 ? 'text-danger fw-semibold' : ''}>
                            {dias < 0 ? `Atrasado ${Math.abs(dias)} dias` : `${dias} dias`}
                          </span>
                        </td>
                      )}
                      {(subTab === 'todos' || subTab === 'devueltos') && <td className="small-muted">{p.usuarioEntregaNombre || '-'}</td>}
                      {(subTab === 'todos' || subTab === 'devueltos') && <td className="small-muted">{p.usuarioDevolucionNombre || '-'}</td>}
                      {subTab === 'recibir' && <td className="small-muted">{p.usuarioEntregaNombre || '-'}</td>}
                      <td>{formatCurrency((p.totalRenta || 0) + (p.costoEnvio || 0))}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          {selected ? createPortal(
            <div style={{
              position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh',
              zIndex: 9999, backgroundColor: 'rgba(0,0,0,0.5)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }} onClick={() => setSelected(null)}>
              <div onClick={(e) => e.stopPropagation()} style={{
                background: '#fff', borderRadius: 18, width: '100%', maxWidth: 900,
                maxHeight: '90vh', display: 'flex', flexDirection: 'column',
                margin: '1rem', boxShadow: '0 24px 60px rgba(30,26,22,0.18)',
              }}>
                <div style={{
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  padding: '1rem 1.5rem', borderBottom: '1px solid rgba(0,0,0,0.1)',
                }}>
                  <h5 style={{ margin: 0, fontWeight: 600 }}>Pedido {detalle?.alquiler?.codigoReserva || ''}</h5>
                  <button type="button" style={{
                    background: 'none', border: 'none', fontSize: '1.2rem', cursor: 'pointer',
                    color: '#6d625a', padding: '4px 8px', borderRadius: 8,
                  }} onClick={() => setSelected(null)}>✕</button>
                </div>
                <div style={{ padding: '1.5rem', overflowY: 'auto', flex: 1 }}>
                {!detalle ? (
                  <p className="small-muted">Cargando detalle...</p>
                ) : (
                  <div className="row g-4">
                    <div className="col-12 col-lg-6">
                      <h5 className="fw-semibold mb-3">Detalle del pedido</h5>
                      <div className="d-flex justify-content-between mb-2"><span className="small-muted">Código</span><span className="fw-semibold">{detalle.alquiler.codigoReserva}</span></div>
                      <div className="d-flex justify-content-between mb-2"><span className="small-muted">Cliente</span><span>{detalle.alquiler.clienteNombre}</span></div>
                      <div className="d-flex justify-content-between mb-2"><span className="small-muted">Inicio</span><span>{new Date(detalle.alquiler.fechaInicio).toLocaleDateString()}</span></div>
                      <div className="d-flex justify-content-between mb-2"><span className="small-muted">Fin esperado</span><span>{new Date(detalle.alquiler.fechaFinEsperada).toLocaleDateString()}</span></div>
                      {detalle.alquiler.fechaDevolucionReal ? <div className="d-flex justify-content-between mb-2"><span className="small-muted">Devolución real</span><span>{new Date(detalle.alquiler.fechaDevolucionReal).toLocaleDateString()}</span></div> : null}
                      <div className="d-flex justify-content-between mb-2"><span className="small-muted">Entrega</span><span>{detalle.alquiler.tipoEntrega?.replace(/_/g, ' ')}</span></div>
                      {detalle.alquiler.direccionEnvio ? <div className="d-flex justify-content-between mb-2"><span className="small-muted">Dirección</span><span>{detalle.alquiler.direccionEnvio}</span></div> : null}
                      <hr />
                      <h6 className="fw-semibold">Equipos</h6>
                      {detalle.alquiler.detalles?.map((d) => {
                        const dias = d.precioRentaDia > 0 ? Math.round(d.precioUnitario / d.precioRentaDia) : 1
                        return (
                        <div key={d.id} className="small mb-2 border-bottom pb-2">
                          <div className="fw-semibold">{d.equipoNombre}</div>
                          <div className="d-flex justify-content-between text-muted">
                            <span>{d.cantidadRentada} × {formatCurrency(d.precioRentaDia)} / día × {dias} {dias === 1 ? 'día' : 'días'}</span>
                            <span className="fw-semibold">{formatCurrency(d.subtotal)}</span>
                          </div>
                          {detalle.alquiler.estado?.startsWith('Devuelto') ? (
                            <div className="d-flex gap-3 mt-1 small">
                              <span className="text-success">Bien: {d.cantidadDevueltaBien || 0}</span>
                              <span className="text-danger">Dañado: {d.cantidadDanada || 0}</span>
                              <span className="text-danger">Perdido: {d.cantidadPerdida || 0}</span>
                            </div>
                          ) : null}
                        </div>
                        )
                      })}
                    </div>
                    <div className="col-12 col-lg-6">
                      <h5 className="fw-semibold mb-3">Resumen financiero</h5>
                      {detalle.resumen ? (
                        <>
                          <div className="d-flex justify-content-between mb-2"><span className="small-muted">Renta</span><span>{formatCurrency(detalle.resumen.totalAlquiler - (detalle.resumen.costoEnvio || 0))}</span></div>
                          {detalle.resumen.costoEnvio > 0 ? <div className="d-flex justify-content-between mb-2"><span className="small-muted">Envío</span><span>{formatCurrency(detalle.resumen.costoEnvio)}</span></div> : null}
                          <div className="d-flex justify-content-between mb-2 fw-semibold border-top pt-2"><span className="small-muted">Total</span><span>{formatCurrency(detalle.resumen.totalAlquiler)}</span></div>
                          <div className="d-flex justify-content-between mb-2"><span className="small-muted">Pagado</span><span className="text-success">{formatCurrency(detalle.resumen.totalPagado)}</span></div>
                          <div className="d-flex justify-content-between mb-2"><span className="small-muted">Saldo pendiente</span><span className={detalle.resumen.saldoPendiente > 0 ? 'text-danger' : ''}>{formatCurrency(detalle.resumen.saldoPendiente)}</span></div>
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

                      {detalle.alquiler.estado === 'Entregado' && devolucionDetalles.length > 0 ? (
                        <>
                          <h5 className="fw-semibold mt-4 mb-3">Registrar devolución</h5>
                          {devolucionDetalles.map((dd) => {
                            const suma = dd.devueltaBien + dd.danada + dd.perdida
                            const excede = suma > dd.cantidadRentada
                            return (
                            <div key={dd.detalleId} className="mb-2 p-2 border rounded">
                              <div className="fw-semibold small mb-1">{dd.equipoNombre} ({dd.cantidadRentada} {dd.cantidadRentada === 1 ? 'unidad' : 'unidades'})</div>
                              <div className="row g-1 small">
                                <div className="col-4">
                                  <label className="text-success small">Buen estado</label>
                                  <input className={`form-control form-control-sm ${excede ? 'is-invalid' : ''}`} type="number" min="0" max={dd.cantidadRentada} value={dd.devueltaBien}
                                    onChange={(e) => setDevolucionDetalles((prev) =>
                                      prev.map((item) => item.detalleId === dd.detalleId ? { ...item, devueltaBien: Math.max(0, Math.min(dd.cantidadRentada, Number(e.target.value) || 0)) } : item)
                                    )} />
                                </div>
                                <div className="col-4">
                                  <label className="text-warning small">Dañado</label>
                                  <input className={`form-control form-control-sm ${excede ? 'is-invalid' : ''}`} type="number" min="0" max={dd.cantidadRentada} value={dd.danada}
                                    onChange={(e) => setDevolucionDetalles((prev) =>
                                      prev.map((item) => item.detalleId === dd.detalleId ? { ...item, danada: Math.max(0, Math.min(dd.cantidadRentada, Number(e.target.value) || 0)) } : item)
                                    )} />
                                </div>
                                <div className="col-4">
                                  <label className="text-danger small">Perdido</label>
                                  <input className={`form-control form-control-sm ${excede ? 'is-invalid' : ''}`} type="number" min="0" max={dd.cantidadRentada} value={dd.perdida}
                                    onChange={(e) => setDevolucionDetalles((prev) =>
                                      prev.map((item) => item.detalleId === dd.detalleId ? { ...item, perdida: Math.max(0, Math.min(dd.cantidadRentada, Number(e.target.value) || 0)) } : item)
                                    )} />
                                </div>
                              </div>
                              {excede && <div className="text-danger small mt-1">La suma no puede superar {dd.cantidadRentada}</div>}
                            </div>
                          )})}
                          <div className="p-2 mb-2" style={{ background: 'rgba(255,255,255,0.5)', borderRadius: 10, border: '1px solid rgba(180,90,60,0.15)' }}>
                            <label className="small-muted mb-1">Registrar pago adicional (opcional)</label>
                            <div className="d-flex gap-2">
                              <input className="form-control form-control-sm" type="number" min="0" step="0.01" placeholder="Monto" value={pagoMonto} onChange={(e) => setPagoMonto(e.target.value.replace(/[^0-9.]/g, ''))} style={{ maxWidth: 140 }} />
                              <select className="form-select form-select-sm" value={pagoMetodo} onChange={(e) => setPagoMetodo(e.target.value)} style={{ maxWidth: 130 }}>
                                <option value="EFECTIVO">Efectivo</option>
                                <option value="TARJETA">Tarjeta</option>
                                <option value="PAYPAL">PayPal</option>
                              </select>
                            </div>
                          </div>
                          <button className="btn btn-sm btn-dark mt-2" disabled={updating || devolucionDetalles.some((dd) => dd.devueltaBien + dd.danada + dd.perdida > dd.cantidadRentada)} onClick={procesarDevolucion}>
                            {updating ? 'Procesando...' : 'Procesar devolución'}
                          </button>
                          <div className="mt-3">
                            <span className={badgeEstado(detalle.alquiler.estado)}>{detalle.alquiler.estado?.replace(/_/g, ' ')}</span>
                          </div>
                        </>
                      ) : (
                        <>
                          {estadosDisponibles(detalle.alquiler.estado).length > 0 && (
                            <>
                              <h5 className="fw-semibold mt-4 mb-3">Cambiar estado</h5>
                              <div className="p-2 mb-3" style={{ background: 'rgba(255,255,255,0.5)', borderRadius: 10, border: '1px solid rgba(180,90,60,0.15)' }}>
                                <label className="small-muted mb-1">Registrar pago adicional (opcional)</label>
                                <div className="d-flex gap-2">
                                  <input className="form-control form-control-sm" type="number" min="0" step="0.01" placeholder="Monto" value={pagoMonto} onChange={(e) => setPagoMonto(e.target.value.replace(/[^0-9.]/g, ''))} style={{ maxWidth: 140 }} />
                                  <select className="form-select form-select-sm" value={pagoMetodo} onChange={(e) => setPagoMetodo(e.target.value)} style={{ maxWidth: 130 }}>
                                    <option value="EFECTIVO">Efectivo</option>
                                    <option value="TARJETA">Tarjeta</option>
                                    <option value="PAYPAL">PayPal</option>
                                  </select>
                                </div>
                              </div>
                              <div className="d-flex flex-wrap gap-2">
                                {estadosDisponibles(detalle.alquiler.estado).map((est) => (
                                  <button key={est} className="btn btn-sm btn-outline-dark" disabled={updating} onClick={() => cambiarEstado(est)}>
                                    {updating ? '...' : est.replace(/_/g, ' ')}
                                  </button>
                                ))}
                              </div>
                            </>
                          )}
                          <div className="mt-3">
                            <span className={badgeEstado(detalle.alquiler.estado)}>{detalle.alquiler.estado?.replace(/_/g, ' ')}</span>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                )}
                </div>
                <div style={{
                  display: 'flex', justifyContent: 'flex-end', gap: 8,
                  padding: '1rem 1.5rem', borderTop: '1px solid rgba(0,0,0,0.1)',
                }}>
                  <button type="button" className="btn btn-sm btn-outline-dark" onClick={() => setSelected(null)}>Cerrar</button>
                </div>
              </div>
            </div>,
            document.body
          ) : null}
        </>
      )}
    </div>
  )
}

export default AdminPedidos
