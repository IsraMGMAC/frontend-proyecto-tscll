import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../services/api'
import { formatCurrency } from '../utils/currency'
import { toApiDateTime } from '../utils/date'

const CatalogPage = ({ user, addToCarrito, fechasRenta, setFechasRenta, showToast }) => {
  const navigate = useNavigate()
  const isCliente = user?.tipo === 'cliente'
  const [categorias, setCategorias] = useState([])
  const [categoriaActiva, setCategoriaActiva] = useState(null)
  const [productos, setProductos] = useState([])
  const [todosEquipos, setTodosEquipos] = useState([])
  const [filtroActivo, setFiltroActivo] = useState(!!(fechasRenta?.fechaInicio && fechasRenta?.fechaFin))
  const [orden, setOrden] = useState('')

  useEffect(() => {
    api.get('/categorias').then((res) => setCategorias(res.data)).catch(() => {})
    if (fechasRenta?.fechaInicio && fechasRenta?.fechaFin) {
      buscarDisponibilidad(fechasRenta.fechaInicio, fechasRenta.fechaFin)
    } else {
      api.get('/equipos').then((res) => {
        const visibles = res.data.filter((e) => e.visibleWeb)
        setTodosEquipos(visibles)
        setProductos(visibles)
      }).catch(() => {})
    }
  }, [])

  const aplicarFiltros = (equipos, catId) => {
    if (catId === null) {
      setProductos(equipos)
    } else {
      setProductos(equipos.filter((e) => e.categoriaId === catId))
    }
  }

  const buscarDisponibilidad = async (fInicio, fFin) => {
    try {
      const res = await api.post('/equipos/disponibilidad', {
        fechaInicio: toApiDateTime(fInicio),
        fechaFin: toApiDateTime(fFin, true),
      })
      const disponibles = res.data.filter((e) => e.visibleWeb)
      setTodosEquipos(disponibles)
      aplicarFiltros(disponibles, categoriaActiva)
      setFiltroActivo(true)
    } catch {
      setFiltroActivo(false)
    }
  }

  const consultarDisponibilidad = () => {
    if (!fechasRenta.fechaInicio || !fechasRenta.fechaFin) return
    const inicio = fechasRenta.fechaInicio
    const fin = fechasRenta.fechaFin
    if (inicio > fin) {
      setFechasRenta({ fechaInicio: fin, fechaFin: inicio })
      buscarDisponibilidad(fin, inicio)
      return
    }
    buscarDisponibilidad(inicio, fin)
  }

  const limpiarFechas = () => {
    setFechasRenta({ fechaInicio: '', fechaFin: '' })
    setFiltroActivo(false)
    api.get('/equipos').then((res) => {
      const visibles = res.data.filter((e) => e.visibleWeb)
      setTodosEquipos(visibles)
      aplicarFiltros(visibles, categoriaActiva)
    }).catch(() => {})
  }

  const filtrarPorCategoria = (catId) => {
    setCategoriaActiva(catId)
    aplicarFiltros(todosEquipos, catId)
  }

  const handleAdd = (equipo) => {
    if (!isCliente) { navigate('/login'); return }
    const disp = filtroActivo ? (equipo.disponibleActual ?? equipo.cantidadTotalRentable ?? 0) : (equipo.cantidadTotalRentable || 0)
    addToCarrito(equipo, 1, fechasRenta?.fechaInicio, fechasRenta?.fechaFin, disp)
    showToast?.('Producto agregado al carrito')
  }

  const sortedProductos = useMemo(() => {
    if (!orden) return productos
    const copia = [...productos]
    if (orden === 'nombre-asc') copia.sort((a, b) => a.nombre.localeCompare(b.nombre))
    if (orden === 'nombre-desc') copia.sort((a, b) => b.nombre.localeCompare(a.nombre))
    if (orden === 'precio-asc') copia.sort((a, b) => (a.precioRentaDia || 0) - (b.precioRentaDia || 0))
    if (orden === 'precio-desc') copia.sort((a, b) => (b.precioRentaDia || 0) - (a.precioRentaDia || 0))
    return copia
  }, [productos, orden])

  const tieneFiltro = fechasRenta.fechaInicio || fechasRenta.fechaFin

  return (
    <div className="container py-4">
      <div className="app-hero">
        <h1 className="app-title fade-in">Catalogo de equipos</h1>
        <p className="app-subtitle fade-in-delay">
          Explora nuestro inventario de bocinas, microfonos, iluminacion y mobiliario para eventos.
        </p>
      </div>

      <div className="row g-4">
        <div className="col-12 col-lg-3">
          <div className="position-sticky" style={{ top: '1rem' }}>
          <div className="card-surface p-3 mb-3">
            <h5 className="fw-semibold mb-3">Fechas</h5>
            <div className="mb-2">
              <label className="small-muted">Inicio</label>
              <input className="form-control input-cream form-control-sm" type="date" min={new Date().toISOString().slice(0, 10)} max={fechasRenta.fechaFin || ''} value={fechasRenta.fechaInicio} onChange={(e) => setFechasRenta((prev) => ({ ...prev, fechaInicio: e.target.value }))} />
            </div>
            <div className="mb-2">
              <label className="small-muted">Fin</label>
              <input className="form-control input-cream form-control-sm" type="date" min={fechasRenta.fechaInicio || new Date().toISOString().slice(0, 10)} value={fechasRenta.fechaFin} onChange={(e) => setFechasRenta((prev) => ({ ...prev, fechaFin: e.target.value }))} />
            </div>
            <div className="d-flex gap-2 mt-3">
              <button className="btn btn-dark btn-sm flex-grow-1" onClick={consultarDisponibilidad} disabled={!tieneFiltro}>
                Buscar
              </button>
              {filtroActivo ? (
                <button className="btn btn-outline-dark btn-sm" onClick={limpiarFechas}>
                  Limpiar
                </button>
              ) : null}
            </div>
            {filtroActivo ? (
              <div className="small-muted mt-2">Mostrando equipos disponibles en esas fechas.</div>
            ) : !tieneFiltro ? (
              <div className="small-muted mt-2">Usa el filtro de fechas para ver disponibilidad.</div>
            ) : null}
          </div>

          <div className="card-surface p-3">
            <h5 className="fw-semibold mb-3">Categorias</h5>
            <div className="d-flex flex-column gap-1">
              <button className={`btn btn-sm text-start ${categoriaActiva === null ? 'btn-dark' : 'btn-outline-dark'}`} onClick={() => filtrarPorCategoria(null)}>Todos</button>
              {categorias.map((cat) => (
                <button key={cat.id} className={`btn btn-sm text-start ${categoriaActiva === cat.id ? 'btn-dark' : 'btn-outline-dark'}`} onClick={() => filtrarPorCategoria(cat.id)}>{cat.nombre}</button>
              ))}
            </div>
          </div>
          </div>
        </div>

        <div className="col-12 col-lg-9">
          <div className="d-flex align-items-center justify-content-between mb-3">
            <h2 className="section-title mb-0">
              {categoriaActiva ? categorias.find((c) => c.id === categoriaActiva)?.nombre || 'Equipos' : 'Todos los equipos'}
            </h2>
            <span className="badge badge-olive">{productos.length} equipos</span>
          </div>
          <div className="d-flex gap-2 mb-3 flex-wrap">
            <select className="form-select form-select-sm input-cream" style={{ width: 'auto' }} value={orden} onChange={(e) => setOrden(e.target.value)}>
              <option value="">Sin orden</option>
              <option value="nombre-asc">Nombre A-Z</option>
              <option value="nombre-desc">Nombre Z-A</option>
              <option value="precio-asc">Precio menor a mayor</option>
              <option value="precio-desc">Precio mayor a menor</option>
            </select>
          </div>

          {productos.length === 0 ? (
            <div className="card-surface p-5 text-center">
              <p className="small-muted mb-0">{filtroActivo ? 'No hay equipos disponibles para las fechas seleccionadas.' : 'Cargando equipos...'}</p>
            </div>
          ) : (
            <div className="row g-3">
              {sortedProductos.map((equipo) => {
                const disp = filtroActivo ? (equipo.disponibleActual ?? equipo.cantidadTotalRentable ?? 0) : (equipo.cantidadTotalRentable || 0)
                return (
                  <div key={equipo.id} className="col-12 col-md-6 col-xl-4">
                    <div className="card border-0 shadow-sm h-100" style={{ cursor: 'pointer' }} onClick={() => navigate(`/producto/${equipo.slug}`)}>
                      <div className="card-img-top bg-light d-flex align-items-center justify-content-center overflow-hidden" style={{ height: 180 }}>
                        {equipo.imagenUrl ? (
                          <img src={equipo.imagenUrl} alt={equipo.nombre} className="w-100 h-100" style={{ objectFit: 'contain', background: '#f8f8f8' }} />
                        ) : (
                          <span className="display-6 text-muted">{['🎤', '🎙', '💡', '💺'][(equipo.categoriaId || 1) - 1] || '📦'}</span>
                        )}
                      </div>
                      <div className="card-body d-flex flex-column">
                        <h5 className="card-title mb-1">{equipo.nombre}</h5>
                        <p className="small-muted mb-2 flex-grow-1">{equipo.descripcion}</p>
                        <div className="d-flex justify-content-between align-items-center mt-auto">
                          <div>
                            <span className="price-tag">{formatCurrency(equipo.precioRentaDia)}</span>
                            <span className="small-muted"> / dia</span>
                          </div>
                          <div className="text-end">
                            {filtroActivo ? (
                              <div className="small-muted">Disponibles: {disp}</div>
                            ) : null}
                            {isCliente ? (
                              <button className="btn btn-outline-dark btn-sm mt-1" onClick={(e) => { e.stopPropagation(); handleAdd(equipo) }} disabled={!disp}>
                                {!disp ? 'Agotado' : 'Anadir'}
                              </button>
                            ) : null}
                          </div>
                        </div>
                        <div className="small-muted mt-2">{equipo.sku}</div>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default CatalogPage
