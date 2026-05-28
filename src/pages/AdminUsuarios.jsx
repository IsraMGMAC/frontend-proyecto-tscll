import { useEffect, useState } from 'react'
import api from '../services/api'

const AdminUsuarios = () => {
  const [clientes, setClientes] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ nombre: '', apellidoPaterno: '', apellidoMaterno: '', telefono: '', email: '', direccion: '', passwordHash: '' })
  const [status, setStatus] = useState({ loading: false, error: '', message: '' })

  const load = () => {
    api.get('/clientes').then((res) => setClientes(res.data)).catch(() => {}).finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [])

  const handleChange = (e) => setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    setStatus({ loading: true, error: '', message: '' })
    try {
      await api.post('/clientes/registrar', form)
      setStatus({ loading: false, error: '', message: 'Cliente registrado exitosamente.' })
      setShowForm(false)
      setForm({ nombre: '', apellidoPaterno: '', apellidoMaterno: '', telefono: '', email: '', direccion: '', passwordHash: '' })
      load()
    } catch (error) {
      setStatus({ loading: false, error: error?.response?.data?.mensaje || 'Error al registrar.', message: '' })
    }
  }

  const handleDarDeBaja = async (id) => {
    if (!window.confirm('Dar de baja a este cliente? Podra recuperarse despues.')) return
    try {
      await api.delete(`/clientes/${id}`)
      load()
    } catch {
      alert('Error al dar de baja.')
    }
  }

  if (loading) return <p className="small-muted">Cargando...</p>

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-3">
        <div>
          <h2 className="section-title mb-0">Usuarios registrados</h2>
          <p className="small-muted">{clientes.length} clientes</p>
        </div>
        <button className="btn btn-terracotta btn-sm" onClick={() => setShowForm(!showForm)}>
          {showForm ? 'Cancelar' : 'Nuevo cliente'}
        </button>
      </div>

      {showForm ? (
        <div className="card-surface p-3 mb-4">
          <h5 className="fw-semibold mb-3">Registrar nuevo cliente</h5>
          <form onSubmit={handleSubmit}>
            <div className="row g-2">
              <div className="col-4"><label className="form-label">Nombre</label><input className="form-control input-cream" name="nombre" value={form.nombre} onChange={handleChange} required /></div>
              <div className="col-4"><label className="form-label">Apellido paterno</label><input className="form-control input-cream" name="apellidoPaterno" value={form.apellidoPaterno} onChange={handleChange} required /></div>
              <div className="col-4"><label className="form-label">Apellido materno</label><input className="form-control input-cream" name="apellidoMaterno" value={form.apellidoMaterno} onChange={handleChange} required /></div>
              <div className="col-4"><label className="form-label">Teléfono</label><input className="form-control input-cream" name="telefono" value={form.telefono} onChange={handleChange} required /></div>
              <div className="col-4"><label className="form-label">Email</label><input className="form-control input-cream" type="email" name="email" value={form.email} onChange={handleChange} required /></div>
              <div className="col-4"><label className="form-label">Contrasena</label><input className="form-control input-cream" type="password" name="passwordHash" value={form.passwordHash} onChange={handleChange} required /></div>
              <div className="col-12"><label className="form-label">Dirección</label><textarea className="form-control input-cream" rows={2} name="direccion" value={form.direccion} onChange={handleChange} /></div>
            </div>
            <button className="btn btn-terracotta btn-sm mt-2" disabled={status.loading}>{status.loading ? 'Registrando...' : 'Registrar'}</button>
            {status.error ? <div className="alert alert-danger mt-2">{status.error}</div> : null}
            {status.message ? <div className="alert alert-success mt-2">{status.message}</div> : null}
          </form>
        </div>
      ) : null}

      <div className="table-responsive">
        <table className="table align-middle">
          <thead><tr><th>Nombre</th><th>Email</th><th>Teléfono</th><th>Registro</th><th></th></tr></thead>
          <tbody>
            {clientes.map((c) => (
              <tr key={c.id}>
                <td>{c.nombre} {c.apellidoPaterno} {c.apellidoMaterno}</td>
                <td>{c.email}</td>
                <td>{c.telefono}</td>
                <td>{new Date(c.fechaAlta).toLocaleDateString()}</td>
                <td className="text-end">
                  <button className="btn btn-outline-danger btn-sm" onClick={() => handleDarDeBaja(c.id)}>Dar de baja</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export default AdminUsuarios
