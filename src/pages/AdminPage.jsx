import { useState } from 'react'
import AdminUsuarios from './AdminUsuarios'
import AdminPedidos from './AdminPedidos'
import AdminResumen from './AdminResumen'
import AdminInventario from './AdminInventario'

const TABS = [
  { id: 'resumen', label: 'Resumen', icon: '📊' },
  { id: 'inventario', label: 'Inventario', icon: '📦' },
  { id: 'pedidos', label: 'Pedidos', icon: '📋' },
  { id: 'usuarios', label: 'Usuarios', icon: '👥' },
]

const AdminPage = ({ user }) => {
  const [tab, setTab] = useState('resumen')

  if (user?.tipo !== 'admin') {
    return (
      <div className="container py-5">
        <div className="card-surface p-4 text-center">
          <h2 className="section-title">Acceso restringido</h2>
          <p className="small-muted">Inicia sesión como administrador.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="container py-4">
      <div className="app-hero">
        <h1 className="app-title fade-in">Panel de administracion</h1>
        <p className="app-subtitle fade-in-delay">Gestiona usuarios, pedidos, inventario y más.</p>
      </div>

      <div className="row g-4">
        <div className="col-12 col-lg-2">
          <div className="card-surface p-2 d-flex flex-lg-column gap-1 flex-row flex-wrap">
            {TABS.map((t) => (
              <button key={t.id} className={`btn btn-sm text-start ${tab === t.id ? 'btn-dark' : 'btn-outline-dark'}`} onClick={() => setTab(t.id)}>
                {t.icon} {t.label}
              </button>
            ))}
          </div>
        </div>
        <div className="col-12 col-lg-10">
          <div className="card-surface p-4">
            {tab === 'resumen' && <AdminResumen />}
            {tab === 'inventario' && <AdminInventario />}
            {tab === 'pedidos' && <AdminPedidos user={user} />}
            {tab === 'usuarios' && <AdminUsuarios />}
          </div>
        </div>
      </div>
    </div>
  )
}

export default AdminPage
