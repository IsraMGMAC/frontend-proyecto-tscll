import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../services/api'

const ProfilePage = ({ user }) => {
  const navigate = useNavigate()
  const isCliente = user?.tipo === 'cliente'
  const [perfil, setPerfil] = useState(null)
  const [editando, setEditando] = useState(false)
  const [form, setForm] = useState({})
  const [passForm, setPassForm] = useState({ passwordActual: '', passwordNueva: '' })
  const [status, setStatus] = useState({ loading: false, error: '', message: '' })
  const [passStatus, setPassStatus] = useState({ loading: false, error: '', message: '' })

  useEffect(() => {
    if (!user) { navigate('/login'); return }
    const endpoint = isCliente ? `/clientes/${user.id}` : `/usuarios/${user.id}`
    api.get(endpoint).then((res) => {
      setPerfil(res.data)
      if (isCliente) {
        setForm({
          nombre: res.data.nombre || '',
          apellidoPaterno: res.data.apellidoPaterno || '',
          apellidoMaterno: res.data.apellidoMaterno || '',
          telefono: res.data.telefono || '',
          direccion: res.data.direccion || '',
        })
      } else {
        setForm({
          nombre: res.data.nombre || '',
          apellidoPaterno: res.data.apellidoPaterno || '',
          apellidoMaterno: res.data.apellidoMaterno || '',
          email: res.data.email || '',
        })
      }
    }).catch(() => navigate('/'))
  }, [user, isCliente, navigate])

  if (!perfil) {
    return <div className="container py-5 text-center"><p className="small-muted">Cargando...</p></div>
  }

  const handleGuardar = async (e) => {
    e.preventDefault()
    setStatus({ loading: true, error: '', message: '' })
    try {
      const endpoint = isCliente ? `/clientes/${user.id}` : `/usuarios/${user.id}`
      await api.put(endpoint, form)
      setStatus({ loading: false, error: '', message: 'Datos actualizados.' })
      setEditando(false)
    } catch (error) {
      setStatus({ loading: false, error: error?.response?.data?.mensaje || 'Error al actualizar.', message: '' })
    }
  }

  const handleCambiarPass = async (e) => {
    e.preventDefault()
    setPassStatus({ loading: true, error: '', message: '' })
    try {
      if (isCliente) {
        await api.put(`/clientes/${user.id}`, { ...form, passwordHash: passForm.passwordNueva })
      } else {
        await api.post(`/usuarios/${user.id}/cambiar-password`, {
          passwordActual: passForm.passwordActual,
          passwordNueva: passForm.passwordNueva,
        })
      }
      setPassStatus({ loading: false, error: '', message: 'Contrasena actualizada.' })
      setPassForm({ passwordActual: '', passwordNueva: '' })
    } catch (error) {
      setPassStatus({ loading: false, error: error?.response?.data?.mensaje || 'Error al cambiar contrasena.', message: '' })
    }
  }

  return (
    <div className="container py-4">
      <div className="app-hero">
        <h1 className="app-title fade-in">Mi perfil</h1>
        <p className="app-subtitle fade-in-delay">Tus datos personales y configuracion de cuenta.</p>
      </div>

      <div className="row g-4">
        <div className="col-12 col-lg-6">
          <div className="card-surface p-4">
            <div className="d-flex justify-content-between align-items-center mb-3">
              <h2 className="section-title mb-0">Datos personales</h2>
              <button className="btn btn-sm btn-outline-dark" onClick={() => setEditando(!editando)}>
                {editando ? 'Cancelar' : 'Editar'}
              </button>
            </div>

            {editando ? (
              <form onSubmit={handleGuardar}>
                <div className="mb-2"><label className="form-label">Nombre</label><input className="form-control input-cream" value={form.nombre} onChange={(e) => setForm({ ...form, nombre: e.target.value })} required /></div>
                <div className="mb-2"><label className="form-label">Apellido paterno</label><input className="form-control input-cream" value={form.apellidoPaterno} onChange={(e) => setForm({ ...form, apellidoPaterno: e.target.value })} required /></div>
                <div className="mb-2"><label className="form-label">Apellido materno</label><input className="form-control input-cream" value={form.apellidoMaterno} onChange={(e) => setForm({ ...form, apellidoMaterno: e.target.value })} required /></div>
                {isCliente && (
                  <>
                    <div className="mb-2"><label className="form-label">Telefono</label><input className="form-control input-cream" value={form.telefono} onChange={(e) => setForm({ ...form, telefono: e.target.value })} required /></div>
                    <div className="mb-2"><label className="form-label">Direccion</label><textarea className="form-control input-cream" rows={2} value={form.direccion} onChange={(e) => setForm({ ...form, direccion: e.target.value })} /></div>
                  </>
                )}
                <button className="btn btn-terracotta w-100 mt-2" disabled={status.loading}>{status.loading ? 'Guardando...' : 'Guardar cambios'}</button>
                {status.error ? <div className="alert alert-danger mt-2">{status.error}</div> : null}
                {status.message ? <div className="alert alert-success mt-2">{status.message}</div> : null}
              </form>
            ) : (
              <div>
                <div className="d-flex justify-content-between py-2 border-bottom"><span className="small-muted">Nombre</span><span>{perfil.nombre} {perfil.apellidoPaterno} {perfil.apellidoMaterno}</span></div>
                <div className="d-flex justify-content-between py-2 border-bottom"><span className="small-muted">Email</span><span>{perfil.email}</span></div>
                {isCliente && (
                  <>
                    <div className="d-flex justify-content-between py-2 border-bottom"><span className="small-muted">Telefono</span><span>{perfil.telefono}</span></div>
                    <div className="d-flex justify-content-between py-2"><span className="small-muted">Direccion</span><span>{perfil.direccion || 'Sin registrar'}</span></div>
                  </>
                )}
                {!isCliente && (
                  <div className="d-flex justify-content-between py-2"><span className="small-muted">Rol</span><span>{perfil.rol}</span></div>
                )}
              </div>
            )}
          </div>
        </div>

        <div className="col-12 col-lg-6">
          <div className="card-surface p-4">
            <h2 className="section-title">Cambiar contrasena</h2>
            <form className="mt-3" onSubmit={handleCambiarPass}>
              <div className="mb-2"><label className="form-label">Contrasena actual</label><input className="form-control input-cream" type="password" value={passForm.passwordActual} onChange={(e) => setPassForm({ ...passForm, passwordActual: e.target.value })} required /></div>
              <div className="mb-2"><label className="form-label">Contrasena nueva</label><input className="form-control input-cream" type="password" value={passForm.passwordNueva} onChange={(e) => setPassForm({ ...passForm, passwordNueva: e.target.value })} required /></div>
              <button className="btn btn-terracotta w-100 mt-2" disabled={passStatus.loading}>{passStatus.loading ? 'Cambiando...' : 'Cambiar contrasena'}</button>
              {passStatus.error ? <div className="alert alert-danger mt-2">{passStatus.error}</div> : null}
              {passStatus.message ? <div className="alert alert-success mt-2">{passStatus.message}</div> : null}
            </form>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ProfilePage
