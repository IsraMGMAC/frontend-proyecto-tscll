import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../services/api'
import { formatCurrency } from '../utils/currency'

const MisRentasPage = ({ user }) => {
  const navigate = useNavigate()
  const isCliente = user?.tipo === 'cliente'
  const [rentas, setRentas] = useState([])
  const [loading, setLoading] = useState(true)
  const [pagina, setPagina] = useState(0)
  const porPagina = 5

  useEffect(() => {
    if (!isCliente) {
      setLoading(false)
      return
    }
    api.get(`/alquileres/cliente/${user.id}`)
      .then((res) => { setRentas(res.data.sort((a, b) => new Date(b.fechaInicio) - new Date(a.fechaInicio))); setPagina(0) })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [user, isCliente])

  if (!isCliente) {
    return (
      <div className="container py-5">
        <div className="card-surface p-4 text-center">
          <h2 className="section-title">Acceso restringido</h2>
          <p className="small-muted">Inicia sesión como cliente para ver tus rentas.</p>
          <button className="btn btn-terracotta mt-2" onClick={() => navigate('/login')}>
            Iniciar sesión
          </button>
        </div>
      </div>
    )
  }

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

  const cancelar = async (id, onOk) => {
    if (!window.confirm('Confirmas cancelar esta reserva?')) return
    try {
      await api.post(`/alquileres/${id}/cancelar`)
      onOk()
    } catch {
      alert('No se pudo cancelar la reserva.')
    }
  }

  const puedeCancelar = (renta) => {
    if (renta.estado !== 'Pendiente') return null
    const ms = 1000 * 60 * 60 * 24
    const hoy = new Date(Date.UTC(new Date().getFullYear(), new Date().getMonth(), new Date().getDate()))
    const inicio = new Date(renta.fechaInicio.slice(0, 10) + 'T00:00:00Z')
    const dias = Math.round((inicio.getTime() - hoy.getTime()) / ms)
    return dias
  }

  const diasCancelar = (renta) => puedeCancelar(renta)

  const totalPaginas = Math.ceil(rentas.length / porPagina)
  const rentasPagina = rentas.slice(pagina * porPagina, (pagina + 1) * porPagina)
  const botonesPagina = []
  for (let i = 0; i < totalPaginas; i++) {
    botonesPagina.push(
      <button key={i} className={`btn btn-sm ${i === pagina ? 'btn-dark' : 'btn-outline-dark'}`} onClick={() => setPagina(i)}>{i + 1}</button>
    )
  }

  return (
    <div className="container py-4">
      <div className="app-hero">
        <h1 className="app-title fade-in">Mis rentas</h1>
        <p className="app-subtitle fade-in-delay">
          Historial de todas tus reservas realizadas.
        </p>
      </div>

      {loading ? (
        <p className="small-muted text-center">Cargando...</p>
      ) : rentas.length === 0 ? (
        <div className="card-surface p-4 text-center">
          <p className="small-muted">No tienes rentas registradas.</p>
          <button className="btn btn-terracotta mt-2" onClick={() => navigate('/')}>
            Ir al catálogo
          </button>
        </div>
      ) : (
        <>
        <div className="d-grid gap-3">
          {rentasPagina.map((renta) => (
            <div
              key={renta.id}
              className="card-surface p-3"
              style={{ cursor: 'pointer' }}
              onClick={() => navigate(`/renta/${renta.id}`)}
            >
              <div className="d-flex justify-content-between align-items-start">
                <div>
                  <h5 className="mb-1">{renta.codigoReserva}</h5>
                  <div className="small-muted">
                    {new Date(renta.fechaInicio).toLocaleDateString()} - {new Date(renta.fechaFinEsperada).toLocaleDateString()}
                  </div>
                </div>
                <span className={badgeEstado(renta.estado)}>{renta.estado.replace(/_/g, ' ')}</span>
              </div>
              <div className="d-flex justify-content-between mt-2">
                <span className="small-muted">{renta.tipoEntrega?.replace(/_/g, ' ')}</span>
                <span className="fw-bold">{formatCurrency(renta.totalRenta)}</span>
              </div>
              {renta.detalles?.length > 0 ? (
                <div className="small-muted mt-1">
                  {renta.detalles.map((d) => `${d.equipoNombre} x${d.cantidadRentada}`).join(', ')}
                </div>
              ) : null}
              {(() => {
                const dias = puedeCancelar(renta)
                if (dias === null) return null
                if (dias > 2) return (
                  <button className="btn btn-outline-danger btn-sm mt-2" onClick={(e) => { e.stopPropagation(); cancelar(renta.id, () => setRentas((prev) => prev.map((r) => r.id === renta.id ? { ...r, estado: 'Cancelado' } : r))) }}>
                    Cancelar (100% reembolso)
                  </button>
                )
                if (dias >= 1) return (
                  <button className="btn btn-outline-danger btn-sm mt-2" onClick={(e) => { e.stopPropagation(); cancelar(renta.id, () => setRentas((prev) => prev.map((r) => r.id === renta.id ? { ...r, estado: 'Cancelado' } : r))) }}>
                    Cancelar (50% reembolso)
                  </button>
                )
                return <div className="small-muted mt-2">No aplica reembolso (menos de 24 hrs)</div>
              })()}
            </div>
          ))}
        </div>
        {totalPaginas > 1 ? (
          <div className="d-flex justify-content-center gap-2 mt-4">
            <button className="btn btn-sm btn-outline-dark" disabled={pagina === 0} onClick={() => setPagina((p) => p - 1)}>Anterior</button>
            {botonesPagina}
            <button className="btn btn-sm btn-outline-dark" disabled={pagina >= totalPaginas - 1} onClick={() => setPagina((p) => p + 1)}>Siguiente</button>
          </div>
        ) : null}
        </>
      )}
    </div>
  )
}

export default MisRentasPage
