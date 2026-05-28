import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import api from '../services/api'
import { formatCurrency } from '../utils/currency'

const slugFromName = (name) => name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')

const emptyEquipoForm = {
  id: null, categoriaId: null, sku: '', nombre: '', descripcion: '',
  cantidadOptima: 0, cantidadConDetalles: 0, cantidadMantenimiento: 0,
  cantidadInservible: 0, precioRentaDia: 0, visibleWeb: true,
}

const emptyCategoriaForm = { id: null, nombre: '', descripcion: '' }

const AdminInventario = () => {
  const [equipos, setEquipos] = useState([])
  const [categorias, setCategorias] = useState([])
  const [catSeleccionada, setCatSeleccionada] = useState(null)
  const [equipoForm, setEquipoForm] = useState(emptyEquipoForm)
  const [catForm, setCatForm] = useState(emptyCategoriaForm)
  const [mostrarCatForm, setMostrarCatForm] = useState(false)
  const [imagenes, setImagenes] = useState([])
  const [imgKey, setImgKey] = useState(0)
  const [subiendo, setSubiendo] = useState(false)
  const [mostrarModal, setMostrarModal] = useState(false)

  const load = async () => {
    try {
      const [eqRes, catRes] = await Promise.all([
        api.get('/equipos'),
        api.get('/categorias'),
      ])
      setEquipos(eqRes.data)
      setCategorias(catRes.data)
    } catch {}
  }

  useEffect(() => { load() }, [])

  const cargarImagenes = async (equipoId) => {
    if (!equipoId) { setImagenes([]); return }
    try {
      const res = await api.get(`/equipos/${equipoId}/imagenes`)
      setImagenes(res.data || [])
    } catch { setImagenes([]) }
  }

  useEffect(() => {
    cargarImagenes(equipoForm.id)
  }, [equipoForm.id, imgKey])

  const equiposFiltrados = equipos.filter((e) => !catSeleccionada || e.categoriaId === catSeleccionada)

  const handleEquipoChange = (e) => {
    const { name, value, type, checked } = e.target
    setEquipoForm((prev) => ({ ...prev, [name]: type === 'checkbox' ? checked : value }))
  }

  const abrirModalNuevo = () => {
    setEquipoForm({ ...emptyEquipoForm, categoriaId: catSeleccionada })
    setImagenes([])
    setMostrarModal(true)
  }

  const handleEditEquipo = (equipo) => {
    setEquipoForm({
      id: equipo.id, categoriaId: equipo.categoriaId || catSeleccionada, sku: equipo.sku || '', nombre: equipo.nombre || '',
      descripcion: equipo.descripcion || '', cantidadOptima: equipo.cantidadOptima || 0,
      cantidadConDetalles: equipo.cantidadConDetalles || 0, cantidadMantenimiento: equipo.cantidadMantenimiento || 0,
      cantidadInservible: equipo.cantidadInservible || 0, precioRentaDia: equipo.precioRentaDia || 0,
      visibleWeb: equipo.visibleWeb ?? true,
    })
    setMostrarModal(true)
  }

  const cerrarModal = () => {
    setEquipoForm(emptyEquipoForm)
    setImagenes([])
    setMostrarModal(false)
  }

  const handleUploadImagenes = async (e) => {
    const files = e.target.files
    if (!files || files.length === 0 || !equipoForm.id) return
    setSubiendo(true)
    const formData = new FormData()
    for (const file of files) {
      formData.append('files', file)
    }
    try {
      await api.post(`/equipos/${equipoForm.id}/imagenes`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      setImgKey((k) => k + 1)
      load()
    } catch {}
    setSubiendo(false)
    e.target.value = ''
  }

  const handleDeleteImagen = async (imgId) => {
    if (!window.confirm('Eliminar esta imagen?')) return
    try {
      await api.delete(`/equipos/${equipoForm.id}/imagenes/${imgId}`)
      await cargarImagenes(equipoForm.id)
      load()
    } catch {}
  }

  const handleSetPrincipal = async (imgId) => {
    try {
      await api.put(`/equipos/${equipoForm.id}/imagenes/${imgId}/principal`)
      await cargarImagenes(equipoForm.id)
      load()
    } catch {}
  }

  const handleSubmitEquipo = async (e) => {
    e.preventDefault()
    const payload = {
      categoriaId: Number(equipoForm.categoriaId), sku: equipoForm.sku, nombre: equipoForm.nombre,
      slug: slugFromName(equipoForm.nombre), descripcion: equipoForm.descripcion,
      cantidadOptima: Number(equipoForm.cantidadOptima),
      cantidadConDetalles: Number(equipoForm.cantidadConDetalles), cantidadMantenimiento: Number(equipoForm.cantidadMantenimiento),
      cantidadInservible: Number(equipoForm.cantidadInservible), precioRentaDia: Number(equipoForm.precioRentaDia),
      visibleWeb: Boolean(equipoForm.visibleWeb),
    }
    try {
      if (equipoForm.id) {
        await api.put(`/equipos/${equipoForm.id}`, payload)
        cerrarModal()
      } else {
        const res = await api.post('/equipos', payload)
        setEquipoForm((prev) => ({ ...prev, id: res.data.id }))
        await cargarImagenes(res.data.id)
      }
      load()
    } catch {}
  }

  const handleDeleteEquipo = async (id) => {
    if (!window.confirm('Eliminar este equipo?')) return
    try {
      await api.delete(`/equipos/${id}`)
      load()
    } catch {}
  }

  const handleToggleVisible = async (equipo) => {
    try {
      await api.put(`/equipos/${equipo.id}`, {
        categoriaId: equipo.categoriaId, sku: equipo.sku, nombre: equipo.nombre,
        slug: equipo.slug, descripcion: equipo.descripcion || '',
        cantidadOptima: equipo.cantidadOptima || 0,
        cantidadConDetalles: equipo.cantidadConDetalles || 0,
        cantidadMantenimiento: equipo.cantidadMantenimiento || 0,
        cantidadInservible: equipo.cantidadInservible || 0,
        precioRentaDia: equipo.precioRentaDia || 0,
        visibleWeb: !equipo.visibleWeb,
      })
      load()
    } catch {}
  }

  const handleEditCategoria = (cat) => {
    setCatForm({ id: cat.id, nombre: cat.nombre, descripcion: cat.descripcion || '' })
    setMostrarCatForm(true)
  }

  const handleResetCatForm = () => {
    setCatForm(emptyCategoriaForm)
    setMostrarCatForm(false)
  }

  const handleSubmitCategoria = async (e) => {
    e.preventDefault()
    const payload = { nombre: catForm.nombre, descripcion: catForm.descripcion }
    try {
      if (catForm.id) {
        await api.put(`/categorias/${catForm.id}`, payload)
      } else {
        await api.post('/categorias', payload)
      }
      handleResetCatForm()
      load()
    } catch {}
  }

  const handleDeleteCategoria = async (id) => {
    if (!window.confirm('Eliminar esta categoria? Los equipos asociados se quedaran sin categoria.')) return
    try {
      await api.delete(`/categorias/${id}`)
      if (catSeleccionada === id) setCatSeleccionada(null)
      load()
    } catch {}
  }

  return (
    <div>
      <h2 className="section-title">Inventario</h2>

      <div className="card-surface p-3 mb-4">
        <div className="d-flex align-items-center justify-content-between mb-3">
          <h5 className="fw-semibold mb-0">Categorias</h5>
          <button className="btn btn-dark btn-sm" onClick={() => { setCatForm(emptyCategoriaForm); setMostrarCatForm(true) }}>+ Nueva categoria</button>
        </div>

        {mostrarCatForm && (
          <form onSubmit={handleSubmitCategoria} className="border-bottom pb-3 mb-3">
            <div className="row g-2 align-items-end">
              <div className="col">
                <label className="form-label">Nombre</label>
                <input className="form-control input-cream" name="nombre" value={catForm.nombre} onChange={(e) => setCatForm({ ...catForm, nombre: e.target.value })} required />
              </div>
              <div className="col">
                <label className="form-label">Descripcion</label>
                <input className="form-control input-cream" name="descripcion" value={catForm.descripcion} onChange={(e) => setCatForm({ ...catForm, descripcion: e.target.value })} />
              </div>
              <div className="col-auto d-flex gap-2">
                <button className="btn btn-terracotta btn-sm" type="submit">{catForm.id ? 'Guardar' : 'Crear'}</button>
                <button className="btn btn-outline-dark btn-sm" type="button" onClick={handleResetCatForm}>Cancelar</button>
              </div>
            </div>
          </form>
        )}

        <div className="d-flex flex-wrap gap-2">
          {categorias.map((cat) => (
            <div key={cat.id} className={`d-flex align-items-center gap-1 p-1 rounded ${catSeleccionada === cat.id ? 'bg-dark text-white' : 'bg-light'}`}>
              <button className={`btn btn-sm ${catSeleccionada === cat.id ? 'btn-dark' : 'btn-outline-dark'} border-0`} onClick={() => setCatSeleccionada(catSeleccionada === cat.id ? null : cat.id)}>
                {cat.nombre}
                <span className="ms-1 opacity-75">({equipos.filter((e) => e.categoriaId === cat.id).length})</span>
              </button>
              <button className={`btn btn-sm ${catSeleccionada === cat.id ? 'btn-light text-dark' : 'btn-outline-secondary'} border-0 py-0 px-1`} onClick={() => handleEditCategoria(cat)} title="Editar categoria">✎</button>
              <button className={`btn btn-sm border-0 py-0 px-1 ${equipos.filter((e) => e.categoriaId === cat.id).length > 0 ? 'btn-light text-muted opacity-50' : catSeleccionada === cat.id ? 'btn-light text-danger' : 'btn-outline-danger'}`} onClick={() => !equipos.filter((e) => e.categoriaId === cat.id).length && handleDeleteCategoria(cat.id)} title={equipos.filter((e) => e.categoriaId === cat.id).length > 0 ? 'Tiene productos, no se puede eliminar' : 'Eliminar categoria'} disabled={equipos.filter((e) => e.categoriaId === cat.id).length > 0}>✕</button>
            </div>
          ))}
        </div>
      </div>

      <div className="d-flex align-items-center justify-content-between mb-3">
        <h5 className="fw-semibold mb-0">Productos {catSeleccionada ? `(${categorias.find(c => c.id === catSeleccionada)?.nombre})` : ''}</h5>
        <button className="btn btn-dark btn-sm" onClick={abrirModalNuevo}>+ Nuevo producto</button>
      </div>

      <div className="table-responsive">
        <table className="table align-middle">
          <thead><tr><th>Nombre</th><th>SKU</th><th>Disponible</th><th>Precio/día</th><th>Visible</th><th></th></tr></thead>
          <tbody>
            {equiposFiltrados.length === 0 ? (
              <tr><td colSpan={6} className="text-center small-muted py-3">No hay productos.</td></tr>
            ) : (
              equiposFiltrados.map((equipo) => (
                <tr key={equipo.id}>
                  <td><div className="fw-semibold">{equipo.nombre}</div><div className="small-muted">{equipo.categoriaNombre}</div></td>
                  <td>{equipo.sku}</td>
                  <td>{equipo.cantidadTotalRentable}</td>
                  <td>{formatCurrency(equipo.precioRentaDia)}</td>
                  <td>
                    <button className={`btn btn-sm ${equipo.visibleWeb ? 'btn-success' : 'btn-secondary'}`} onClick={() => handleToggleVisible(equipo)} title={equipo.visibleWeb ? 'Visible' : 'Oculto'}>
                      {equipo.visibleWeb ? '✓' : '✕'}
                    </button>
                  </td>
                  <td className="text-end">
                    <div className="d-flex gap-2 justify-content-end">
                      <button className="btn btn-outline-dark btn-sm" onClick={() => handleEditEquipo(equipo)}>Editar</button>
                      <button className="btn btn-outline-danger btn-sm" onClick={() => handleDeleteEquipo(equipo.id)}>Eliminar</button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {mostrarModal ? createPortal(
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(0,0,0,0.5)' }} onClick={cerrarModal}>
          <div className="card-surface p-4" style={{ width: '90%', maxWidth: 720, maxHeight: '90vh', overflowY: 'auto' }} onClick={(e) => e.stopPropagation()}>
            <div className="d-flex align-items-center justify-content-between mb-3">
              <h5 className="fw-semibold mb-0">{equipoForm.id ? 'Editar equipo' : 'Nuevo equipo'}</h5>
              <button className="btn btn-sm btn-outline-dark border-0" onClick={cerrarModal}>✕</button>
            </div>
            <form onSubmit={handleSubmitEquipo}>
              <div className="row g-2">
                <div className="col-6 col-lg-3"><label className="form-label">Categoria</label><select className="form-select input-cream" name="categoriaId" value={equipoForm.categoriaId || ''} onChange={handleEquipoChange} required><option value="">Seleccionar...</option>{categorias.map((c) => <option key={c.id} value={c.id}>{c.nombre}</option>)}</select></div>
                <div className="col-6 col-lg-3"><label className="form-label">SKU</label><input className="form-control input-cream" name="sku" value={equipoForm.sku} onChange={handleEquipoChange} required /></div>
                <div className="col-6 col-lg-3"><label className="form-label">Nombre</label><input className="form-control input-cream" name="nombre" value={equipoForm.nombre} onChange={handleEquipoChange} required /></div>
                <div className="col-6 col-lg-3"><label className="form-label">Precio/día</label><input className="form-control input-cream" type="number" step="0.01" name="precioRentaDia" value={equipoForm.precioRentaDia} onChange={handleEquipoChange} required /></div>
                <div className="col-12"><label className="form-label">Descripcion</label><textarea className="form-control input-cream" rows={2} name="descripcion" value={equipoForm.descripcion} onChange={handleEquipoChange} required /></div>
                <div className="col-3"><label className="form-label">Optimos</label><input className="form-control input-cream" type="number" name="cantidadOptima" value={equipoForm.cantidadOptima} onChange={handleEquipoChange} /></div>
                <div className="col-3"><label className="form-label">Con detalles</label><input className="form-control input-cream" type="number" name="cantidadConDetalles" value={equipoForm.cantidadConDetalles} onChange={handleEquipoChange} /></div>
                <div className="col-3"><label className="form-label">Mantenimiento</label><input className="form-control input-cream" type="number" name="cantidadMantenimiento" value={equipoForm.cantidadMantenimiento} onChange={handleEquipoChange} /></div>
                <div className="col-3"><label className="form-label">Inservible</label><input className="form-control input-cream" type="number" name="cantidadInservible" value={equipoForm.cantidadInservible} onChange={handleEquipoChange} /></div>
                <div className="col-12 d-flex align-items-center gap-3 mt-2">
                  <div className="form-check"><input className="form-check-input" type="checkbox" name="visibleWeb" checked={equipoForm.visibleWeb} onChange={handleEquipoChange} /><label className="form-check-label">Visible</label></div>
                  <button className="btn btn-terracotta btn-sm" type="submit" disabled={!equipoForm.sku || !equipoForm.nombre || !equipoForm.precioRentaDia || !equipoForm.descripcion || !equipoForm.categoriaId}>{equipoForm.id ? 'Guardar' : 'Registrar'}</button>
                  <button className="btn btn-outline-dark btn-sm" type="button" onClick={cerrarModal}>Cancelar</button>
                </div>
              </div>
            </form>
            <div className="border-top pt-3 mt-3">
              <h6 className="fw-semibold mb-2">Imagenes</h6>
              {equipoForm.id ? (
                <>
                  <div className="d-flex flex-wrap gap-2 mb-2">
                    {imagenes.map((img) => (
                      <div key={img.id} className="position-relative" style={{ width: 100, height: 100 }}>
                        <img src={`${img.url}?t=${imgKey}`} alt="" className="w-100 h-100 rounded border" style={{ objectFit: 'cover' }} />
                        <div className="position-absolute top-0 end-0 d-flex gap-1 m-1">
                          {!img.esPrincipal && (
                            <button className="btn btn-sm btn-light border py-0 px-1 fs-6" onClick={() => handleSetPrincipal(img.id)} title="Principal">★</button>
                          )}
                          {img.esPrincipal && <span className="badge bg-warning text-dark fs-6" title="Principal">★</span>}
                          <button className="btn btn-sm btn-light border py-0 px-1 text-danger" onClick={() => handleDeleteImagen(img.id)} title="Eliminar">✕</button>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div>
                    <label className="btn btn-outline-dark btn-sm">
                      {subiendo ? 'Subiendo...' : '+ Agregar imagenes'}
                      <input type="file" multiple accept="image/*" className="d-none" onChange={handleUploadImagenes} disabled={subiendo} />
                    </label>
                  </div>
                </>
              ) : (
                <p className="small-muted mb-0">Guarda el producto primero para poder agregar imagenes.</p>
              )}
            </div>
          </div>
        </div>,
        document.body
      ) : null}
    </div>
  )
}

export default AdminInventario
