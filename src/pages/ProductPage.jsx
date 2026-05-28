import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import api from '../services/api'
import { formatCurrency } from '../utils/currency'
import ProductCalendar from '../components/ProductCalendar'

const ProductPage = ({ user, addToCarrito, fechasRenta, setFechasRenta, showToast }) => {
  const { slug } = useParams()
  const navigate = useNavigate()
  const isCliente = user?.tipo === 'cliente'
  const [equipo, setEquipo] = useState(null)
  const [cantidad, setCantidad] = useState(1)
  const [loading, setLoading] = useState(true)
  const [errorMsg, setErrorMsg] = useState('')
  const [imgActiva, setImgActiva] = useState(0)

  useEffect(() => {
    const ini = fechasRenta?.fechaInicio
    const fecFin = fechasRenta?.fechaFin
    const isNum = /^\d+$/.test(slug)
    const basePath = isNum ? `/equipos/${slug}` : `/equipos/slug/${slug}`
    if (ini && fecFin) {
      api.get(basePath, {
        params: { fechaInicio: ini + 'T00:00:00', fechaFin: fecFin + 'T23:59:59' },
      })
        .then((res) => setEquipo(res.data))
        .catch(() => navigate('/'))
        .finally(() => setLoading(false))
    } else {
      api.get(basePath)
        .then((res) => setEquipo(res.data))
        .catch(() => navigate('/'))
        .finally(() => setLoading(false))
    }
  }, [slug, navigate, fechasRenta?.fechaInicio, fechasRenta?.fechaFin])

  if (loading) {
    return (
      <div className="container py-5 text-center">
        <p className="small-muted">Cargando...</p>
      </div>
    )
  }

  if (!equipo) return null

  const iconoCategoria = () => {
    const iconos = { 1: '🎤', 2: '🎙', 3: '💡', 4: '💺' }
    return iconos[equipo.categoriaId] || '📦'
  }

  const handleAdd = () => {
    if (!isCliente) {
      navigate('/login')
      return
    }
    if (!fechasRenta?.fechaInicio || !fechasRenta?.fechaFin) {
      setErrorMsg('Selecciona las fechas de renta antes de agregar al carrito.')
      return
    }
    setErrorMsg('')
    addToCarrito(equipo, cantidad, fechasRenta?.fechaInicio, fechasRenta?.fechaFin, equipo.disponibleActual ?? equipo.cantidadTotalRentable ?? 1)
    showToast?.('Producto agregado al carrito')
  }

  return (
    <div className="container py-4">
      <button className="btn btn-outline-dark btn-sm mb-4" onClick={() => navigate('/')}>
        &larr; Volver al catálogo
      </button>

      <div className="row g-4">
        <div className="col-12 col-lg-7">
          {equipo.imagenes && equipo.imagenes.length > 1 ? (
            <>
            <div className="card-surface overflow-hidden position-relative" style={{ height: 360 }}>
              <img src={equipo.imagenes[imgActiva]} alt={equipo.nombre} className="w-100 h-100" style={{ objectFit: 'contain' }} />
              <button className="btn btn-dark btn-sm position-absolute top-50 start-0 translate-middle-y ms-2 opacity-75" onClick={() => setImgActiva((prev) => (prev === 0 ? equipo.imagenes.length - 1 : prev - 1))}>&lt;</button>
              <button className="btn btn-dark btn-sm position-absolute top-50 end-0 translate-middle-y me-2 opacity-75" onClick={() => setImgActiva((prev) => (prev === equipo.imagenes.length - 1 ? 0 : prev + 1))}>&gt;</button>
            </div>
            <div className="d-flex gap-2 mt-2 flex-wrap">
              {equipo.imagenes.map((url, i) => (
                <img key={i} src={url} alt={`${equipo.nombre} miniatura ${i + 1}`}
                  className="rounded border"
                  style={{ width: 64, height: 48, objectFit: 'cover', cursor: 'pointer', opacity: i === imgActiva ? 1 : 0.5 }}
                  onClick={() => setImgActiva(i)}
                  onMouseEnter={(e) => e.target.style.opacity = '1'}
                  onMouseLeave={(e) => e.target.style.opacity = i === imgActiva ? '1' : '0.5'} />
              ))}
            </div>
            </>
          ) : (
            <div className="card-surface d-flex align-items-center justify-content-center overflow-hidden" style={{ height: 360 }}>
              {equipo.imagenUrl ? (
                <img src={equipo.imagenUrl} alt={equipo.nombre} className="w-100 h-100" style={{ objectFit: 'contain' }} />
              ) : (
                <span className="display-1 text-muted">{['🎤', '🎙', '💡', '💺'][(equipo.categoriaId || 1) - 1] || '📦'}</span>
              )}
            </div>
          )}
        </div>
        <div className="col-12 col-lg-5">
          <div className="card-surface p-3">
            <ProductCalendar
              equipoId={equipo.id}
              fechaInicio={fechasRenta?.fechaInicio || ''}
              fechaFin={fechasRenta?.fechaFin || ''}
              onChange={(f) => setFechasRenta?.(f)}
            />
          </div>
        </div>
        <div className="col-12 mt-4">
          <div className="card-surface p-4">
            <div className="d-flex align-items-center gap-2 mb-2">
              <span className="badge badge-olive">{equipo.categoriaNombre || 'Equipo'}</span>
              <span className="small-muted">SKU: {equipo.sku}</span>
            </div>
            <h1 className="section-title mb-2">{equipo.nombre}</h1>
            <p className="small-muted">{equipo.descripcion}</p>
            <div className="d-flex flex-wrap align-items-center gap-4 mt-3">
              <div>
                <span className="display-6 price-tag">{formatCurrency(equipo.precioRentaDia)}</span>
                <span className="small-muted"> por día</span>
              </div>
              <div>
                <div className="small-muted">Disponibles</div>
                <div className="fw-semibold fs-5">{equipo.disponibleActual ?? equipo.cantidadTotalRentable ?? 0}</div>
              </div>
              <div className="d-flex align-items-center gap-2">
                <label className="fw-semibold">Cant:</label>
                <input className="form-control input-cream" type="number" min="1"
                  max={equipo.disponibleActual ?? equipo.cantidadTotalRentable ?? 1}
                  value={cantidad}
                  onChange={(e) => setCantidad(Math.min(Number(e.target.value), equipo.disponibleActual ?? equipo.cantidadTotalRentable ?? 1))}
                  style={{ width: 70 }} />
              </div>
              <span className="small-muted">Subtotal: {formatCurrency((equipo.precioRentaDia || 0) * cantidad)}</span>
            </div>
            {!equipo.visibleWeb ? (
              <div className="alert alert-warning mt-3 mb-0">Este equipo no esta disponible actualmente.</div>
            ) : (
              <div className="mt-3">
                {errorMsg ? <div className="alert alert-danger">{errorMsg}</div> : null}
                <button className="btn btn-terracotta w-100" onClick={handleAdd} disabled={!(equipo.disponibleActual ?? equipo.cantidadTotalRentable ?? 0)}>
                  {!isCliente ? 'Inicia sesión para rentar' : !(equipo.disponibleActual ?? equipo.cantidadTotalRentable ?? 0) ? 'Agotado' : 'Anadir al carrito'}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default ProductPage
