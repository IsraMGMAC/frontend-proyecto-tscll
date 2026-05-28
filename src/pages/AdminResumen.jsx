import { useEffect, useState } from 'react'
import api from '../services/api'
import { formatCurrency } from '../utils/currency'

const FILTROS_CANTIDAD = [
  { key: 'todos', label: 'Todos' },
  { key: 'cantidadOptima', label: 'Optimos' },
  { key: 'cantidadConDetalles', label: 'Con detalles' },
  { key: 'cantidadMantenimiento', label: 'Mantenimiento' },
  { key: 'cantidadInservible', label: 'Inservible' },
]

const AdminResumen = () => {
  const [equipos, setEquipos] = useState([])
  const [categorias, setCategorias] = useState([])
  const [categoriaFiltro, setCategoriaFiltro] = useState(null)
  const [cantidadFiltro, setCantidadFiltro] = useState('todos')

  useEffect(() => {
    api.get('/equipos').then((res) => setEquipos(res.data)).catch(() => {})
    api.get('/categorias').then((res) => setCategorias(res.data)).catch(() => {})
  }, [])

  const filtrados = equipos.filter((e) => {
    if (categoriaFiltro && e.categoriaId !== categoriaFiltro) return false
    if (cantidadFiltro !== 'todos' && !(e[cantidadFiltro] > 0)) return false
    return true
  })

  const totalStock = filtrados.reduce((s, e) => s + (e.cantidadTotalRentable || 0), 0)
  const totalFisico = filtrados.reduce((s, e) => s + (e.cantidadTotalFisica || 0), 0)
  const totalOptimo = filtrados.reduce((s, e) => s + (e.cantidadOptima || 0), 0)
  const totalDetalles = filtrados.reduce((s, e) => s + (e.cantidadConDetalles || 0), 0)
  const totalMantenimiento = filtrados.reduce((s, e) => s + (e.cantidadMantenimiento || 0), 0)
  const totalInservible = filtrados.reduce((s, e) => s + (e.cantidadInservible || 0), 0)

  return (
    <div>
      <h2 className="section-title">Resumen de inventario</h2>

      <div className="d-flex flex-wrap gap-2 mb-4">
        <select className="form-select input-cream" style={{ width: 'auto' }} value={categoriaFiltro ?? ''} onChange={(e) => setCategoriaFiltro(e.target.value ? Number(e.target.value) : null)}>
          <option value="">Todas las categorias</option>
          {categorias.map((cat) => (
            <option key={cat.id} value={cat.id}>{cat.nombre}</option>
          ))}
        </select>
        <div className="btn-group" role="group">
          {FILTROS_CANTIDAD.map((f) => (
            <button key={f.key} className={`btn btn-sm ${cantidadFiltro === f.key ? 'btn-dark' : 'btn-outline-dark'}`} onClick={() => setCantidadFiltro(f.key)}>{f.label}</button>
          ))}
        </div>
      </div>

      <div className="row g-3 mb-4">
        <div className="col-6 col-lg-3">
          <div className="card-surface p-3 text-center">
            <div className="display-6 fw-bold">{filtrados.length}</div>
            <div className="small-muted">Productos</div>
          </div>
        </div>
        <div className="col-6 col-lg-3">
          <div className="card-surface p-3 text-center">
            <div className="display-6 fw-bold">{totalOptimo}</div>
            <div className="small-muted">Optimos</div>
          </div>
        </div>
        <div className="col-6 col-lg-3">
          <div className="card-surface p-3 text-center">
            <div className="display-6 fw-bold">{totalDetalles}</div>
            <div className="small-muted">Con detalles</div>
          </div>
        </div>
        <div className="col-6 col-lg-3">
          <div className="card-surface p-3 text-center">
            <div className="display-6 fw-bold">{totalMantenimiento}</div>
            <div className="small-muted">Mantenimiento</div>
          </div>
        </div>
        <div className="col-6 col-lg-3">
          <div className="card-surface p-3 text-center">
            <div className="display-6 fw-bold">{totalInservible}</div>
            <div className="small-muted">Inservible</div>
          </div>
        </div>
        <div className="col-6 col-lg-3">
          <div className="card-surface p-3 text-center">
            <div className="display-6 fw-bold">{totalStock}</div>
            <div className="small-muted">Unidades disponibles</div>
          </div>
        </div>
        <div className="col-6 col-lg-3">
          <div className="card-surface p-3 text-center">
            <div className="display-6 fw-bold">{totalFisico}</div>
            <div className="small-muted">Unidades fisicas</div>
          </div>
        </div>
      </div>

      <div className="card-surface p-4">
        <h5 className="fw-semibold mb-3">Por categoria</h5>
        {categorias
          .filter((cat) => !categoriaFiltro || cat.id === categoriaFiltro)
          .map((cat) => {
          const items = equipos.filter((e) => e.categoriaId === cat.id)
          return (
            <div key={cat.id} className="d-flex justify-content-between align-items-center border-bottom py-2">
              <div>
                <div className="fw-semibold">{cat.nombre}</div>
                <div className="small-muted">{items.length} productos</div>
              </div>
              <div className="text-end">
                <div>{items.reduce((s, e) => s + (e.cantidadTotalRentable || 0), 0)} disponibles</div>
                <div className="small-muted">{items.reduce((s, e) => s + (e.cantidadTotalFisica || 0), 0)} total</div>
              </div>
            </div>
          )
        })}
      </div>

      <div className="card-surface p-4 mt-4">
        <h5 className="fw-semibold mb-3">Productos</h5>
        <div className="table-responsive">
          <table className="table align-middle">
            <thead><tr><th>Producto</th><th>SKU</th><th>Precio/día</th><th>Optimos</th><th>Con detalles</th><th>Mantenimiento</th><th>Inservible</th><th>Disponibles</th><th>Fisico</th></tr></thead>
            <tbody>
              {filtrados.map((e) => (
                <tr key={e.id}>
                  <td><div className="fw-semibold">{e.nombre}</div><div className="small-muted">{e.categoriaNombre}</div></td>
                  <td>{e.sku}</td>
                  <td>{formatCurrency(e.precioRentaDia)}</td>
                  <td>{e.cantidadOptima || 0}</td>
                  <td>{e.cantidadConDetalles || 0}</td>
                  <td>{e.cantidadMantenimiento || 0}</td>
                  <td>{e.cantidadInservible || 0}</td>
                  <td>{e.cantidadTotalRentable || 0}</td>
                  <td>{e.cantidadTotalFisica || 0}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

export default AdminResumen
