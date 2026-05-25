import { NavLink } from 'react-router-dom'

const Navbar = ({ user, onLogout, carritoCount = 0 }) => {
  const isAdmin = user?.tipo === 'admin'

  return (
    <nav className="navbar navbar-expand-lg bg-white bg-opacity-75 shadow-sm rounded-4 px-3 my-2">
      <div className="container-fluid">
        <NavLink to="/" className="navbar-brand fw-bold">
          <span className="nav-pill">Renta Eventos</span>
        </NavLink>

        <button
          className="navbar-toggler border-0"
          type="button"
          data-bs-toggle="collapse"
          data-bs-target="#navbarMain"
        >
          <span className="navbar-toggler-icon"></span>
        </button>

        <div className="collapse navbar-collapse" id="navbarMain">
          <ul className="navbar-nav mx-auto mb-2 mb-lg-0 gap-2">
            <li className="nav-item">
              <NavLink to="/" className={({ isActive }) => `nav-link px-3 rounded-pill ${isActive ? 'bg-dark text-white' : ''}`}>
                Catalogo
              </NavLink>
            </li>
            <li className="nav-item">
              <NavLink to="/condiciones" className={({ isActive }) => `nav-link px-3 rounded-pill ${isActive ? 'bg-dark text-white' : ''}`}>
                Condiciones
              </NavLink>
            </li>
            <li className="nav-item">
              <NavLink to="/nosotros" className={({ isActive }) => `nav-link px-3 rounded-pill ${isActive ? 'bg-dark text-white' : ''}`}>
                Nosotros
              </NavLink>
            </li>
            <li className="nav-item">
              <NavLink to="/faq" className={({ isActive }) => `nav-link px-3 rounded-pill ${isActive ? 'bg-dark text-white' : ''}`}>
                FAQ
              </NavLink>
            </li>
          </ul>

          <div className="d-flex gap-2 align-items-center">
            {isAdmin ? (
              <NavLink to="/admin" className="btn btn-sm btn-outline-dark">
                Admin
              </NavLink>
            ) : null}
            {!isAdmin ? (
              <NavLink to="/carrito" className="btn btn-sm btn-outline-dark position-relative">
                Carrito
                {carritoCount > 0 ? (
                  <span className="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger" style={{ fontSize: 10 }}>
                    {carritoCount}
                  </span>
                ) : null}
              </NavLink>
            ) : null}
            {user ? (
              <>
                {!isAdmin ? (
                  <NavLink to="/mis-rentas" className="btn btn-sm btn-outline-dark">
                    Mis rentas
                  </NavLink>
                ) : null}
                <NavLink to="/perfil" className="btn btn-sm btn-outline-dark">
                  Perfil
                </NavLink>
                <button className="btn btn-sm btn-outline-dark" onClick={onLogout}>
                  Cerrar sesion
                </button>
              </>
            ) : (
              <NavLink to="/login" className="btn btn-sm btn-terracotta">
                Iniciar sesion
              </NavLink>
            )}
          </div>
        </div>
      </div>
    </nav>
  )
}

export default Navbar
