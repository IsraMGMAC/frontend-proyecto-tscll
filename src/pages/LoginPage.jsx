import { useState } from 'react'
import api from '../services/api'

const LoginPage = ({ onLogin }) => {
  const [mostrarRegistro, setMostrarRegistro] = useState(false)
  const [form, setForm] = useState({ email: '', passwordHash: '', tipo: 'cliente' })
  const [status, setStatus] = useState({ loading: false, error: '', message: '' })
  const [registerForm, setRegisterForm] = useState({
    nombre: '',
    apellidoPaterno: '',
    apellidoMaterno: '',
    telefono: '',
    email: '',
    direccion: '',
    passwordHash: '',
  })
  const [registerStatus, setRegisterStatus] = useState({
    loading: false,
    error: '',
    message: '',
  })

  const handleChange = (event) => {
    const { name, value } = event.target
    setForm((prev) => ({ ...prev, [name]: value }))
  }

  const handleRegisterChange = (event) => {
    const { name, value } = event.target
    setRegisterForm((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setStatus({ loading: true, error: '', message: '' })
    try {
      const endpoint = form.tipo === 'admin' ? '/auth/admin/login' : '/clientes/login'
      const payload = { email: form.email, passwordHash: form.passwordHash }
      const response = await api.post(endpoint, payload)
      onLogin({ ...response.data, tipo: form.tipo })
      setStatus({ loading: false, error: '', message: response.data.mensaje || 'Login exitoso.' })
    } catch (error) {
      const message = error?.response?.data?.mensaje || 'No se pudo iniciar sesion.'
      setStatus({ loading: false, error: message, message: '' })
    }
  }

  const handleRegisterSubmit = async (event) => {
    event.preventDefault()
    setRegisterStatus({ loading: true, error: '', message: '' })
    try {
      await api.post('/clientes/registrar', registerForm)
      const loginRes = await api.post('/clientes/login', {
        email: registerForm.email,
        passwordHash: registerForm.passwordHash,
      })
      onLogin({ ...loginRes.data, tipo: 'cliente' })
    } catch (error) {
      const message = error?.response?.data?.mensaje || 'No se pudo registrar el cliente.'
      setRegisterStatus({ loading: false, error: message, message: '' })
    }
  }

  return (
    <div className="container py-4">
      <div className="app-hero">
        <h1 className="app-title fade-in">Acceso</h1>
        <p className="app-subtitle fade-in-delay">
          Inicia sesion para revisar el catalogo disponible y gestionar tu alquiler.
        </p>
      </div>

      <div className="row justify-content-center g-4">
        <div className="col-12 col-lg-5">
          <div className="card-surface p-4">
            {mostrarRegistro ? (
              <>
                <h2 className="section-title">Registro de cliente</h2>
                <p className="small-muted">Crea tu cuenta para empezar a rentar equipo.</p>
                <form className="mt-4" onSubmit={handleRegisterSubmit}>
                  <div className="mb-3">
                    <label className="form-label">Nombre</label>
                    <input
                      className="form-control input-cream"
                      name="nombre"
                      value={registerForm.nombre}
                      onChange={handleRegisterChange}
                      required
                    />
                  </div>
                  <div className="mb-3">
                    <label className="form-label">Apellido paterno</label>
                    <input
                      className="form-control input-cream"
                      name="apellidoPaterno"
                      value={registerForm.apellidoPaterno}
                      onChange={handleRegisterChange}
                      required
                    />
                  </div>
                  <div className="mb-3">
                    <label className="form-label">Apellido materno</label>
                    <input
                      className="form-control input-cream"
                      name="apellidoMaterno"
                      value={registerForm.apellidoMaterno}
                      onChange={handleRegisterChange}
                      required
                    />
                  </div>
                  <div className="mb-3">
                    <label className="form-label">Telefono</label>
                    <input
                      className="form-control input-cream"
                      name="telefono"
                      value={registerForm.telefono}
                      onChange={handleRegisterChange}
                      required
                    />
                  </div>
                  <div className="mb-3">
                    <label className="form-label">Correo</label>
                    <input
                      className="form-control input-cream"
                      type="email"
                      name="email"
                      value={registerForm.email}
                      onChange={handleRegisterChange}
                      required
                    />
                  </div>
                  <div className="mb-3">
                    <label className="form-label">Direccion</label>
                    <textarea
                      className="form-control input-cream"
                      rows={2}
                      name="direccion"
                      value={registerForm.direccion}
                      onChange={handleRegisterChange}
                    />
                  </div>
                  <div className="mb-3">
                    <label className="form-label">Contrasena</label>
                    <input
                      className="form-control input-cream"
                      type="password"
                      name="passwordHash"
                      value={registerForm.passwordHash}
                      onChange={handleRegisterChange}
                      required
                    />
                  </div>
                  <button className="btn btn-terracotta w-100" type="submit" disabled={registerStatus.loading}>
                    {registerStatus.loading ? 'Registrando...' : 'Crear cuenta'}
                  </button>
                </form>
                {registerStatus.error ? (
                  <div className="alert alert-danger mt-3">{registerStatus.error}</div>
                ) : null}
                {registerStatus.message ? (
                  <div className="alert alert-success mt-3">{registerStatus.message}</div>
                ) : null}
                <p className="mt-3 mb-0 small-muted">
                  ¿Ya tienes cuenta?{' '}
                  <button className="btn btn-link p-0" onClick={() => setMostrarRegistro(false)}>
                    Inicia sesion
                  </button>
                </p>
              </>
            ) : (
              <>
                <h2 className="section-title">Iniciar sesion</h2>
                <p className="small-muted">Ingresa tus credenciales.</p>
                <form className="mt-4" onSubmit={handleSubmit}>
                  <div className="mb-3">
                    <label className="form-label">Tipo de acceso</label>
                    <div className="d-flex gap-3">
                      <div className="form-check">
                        <input
                          className="form-check-input"
                          type="radio"
                          name="tipo"
                          value="cliente"
                          checked={form.tipo === 'cliente'}
                          onChange={handleChange}
                        />
                        <label className="form-check-label">Cliente</label>
                      </div>
                      <div className="form-check">
                        <input
                          className="form-check-input"
                          type="radio"
                          name="tipo"
                          value="admin"
                          checked={form.tipo === 'admin'}
                          onChange={handleChange}
                        />
                        <label className="form-check-label">Admin</label>
                      </div>
                    </div>
                  </div>
                  <div className="mb-3">
                    <label className="form-label">Correo</label>
                    <input
                      className="form-control input-cream"
                      type="email"
                      name="email"
                      value={form.email}
                      onChange={handleChange}
                      placeholder="cliente@correo.com"
                      required
                    />
                  </div>
                  <div className="mb-3">
                    <label className="form-label">Contrasena</label>
                    <input
                      className="form-control input-cream"
                      type="password"
                      name="passwordHash"
                      value={form.passwordHash}
                      onChange={handleChange}
                      placeholder="********"
                      required
                    />
                  </div>
                  <button className="btn btn-terracotta w-100" type="submit" disabled={status.loading}>
                    {status.loading ? 'Validando...' : 'Entrar'}
                  </button>
                </form>
                {status.error ? <div className="alert alert-danger mt-3">{status.error}</div> : null}
                {status.message ? <div className="alert alert-success mt-3">{status.message}</div> : null}
                <p className="mt-3 mb-0 small-muted">
                  ¿No tienes cuenta?{' '}
                  <button className="btn btn-link p-0" onClick={() => setMostrarRegistro(true)}>
                    Registrate
                  </button>
                </p>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default LoginPage
