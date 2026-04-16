import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { resolverNombreFacultad } from '../../shared/constants/facultades'
import { useAuth } from '../../shared/context/AuthContext'
import './create-room-page.css'
import './home-page.css'

export default function MisReservasPage() {
  const navigate = useNavigate()
  const { usuario, cerrarSesion } = useAuth()
  const [sidebarOpen, setSidebarOpen] = useState(true)

  const facultadNombre = resolverNombreFacultad(usuario?.facultad, usuario?.idFacultad)

  useEffect(() => {
    const root = document.getElementById('root')
    root?.classList.add('dashboard-root')

    return () => {
      root?.classList.remove('dashboard-root')
    }
  }, [])

  if (!usuario) {
    return (
      <section className="create-room-access">
        <div className="create-room-access-card">
          <h2>Inicia sesion para continuar</h2>
          <p>Necesitas una sesion activa para consultar este apartado.</p>
          <button type="button" className="action-button" onClick={() => navigate('/login')}>
            Ir al login
          </button>
        </div>
      </section>
    )
  }

  return (
    <div className="secretaria-dashboard">
      <aside className={`dashboard-sidebar ${sidebarOpen ? '' : 'dashboard-sidebar-collapsed'}`}>
        <button
          type="button"
          className="sidebar-toggle"
          onClick={() => setSidebarOpen((current) => !current)}
          aria-label={sidebarOpen ? 'Contraer barra lateral' : 'Expandir barra lateral'}
        >
          {sidebarOpen ? 'Ocultar' : 'Menu'}
        </button>

        <div className="sidebar-brand">
          <h2>{sidebarOpen ? 'Sistema de Reservas' : 'SR'}</h2>
          {sidebarOpen ? <p>Universidad UAO</p> : null}
        </div>

        <nav className="sidebar-menu">
          <button
            type="button"
            className="sidebar-link"
            onClick={() => navigate('/dashboard-secretaria')}
          >
            <span>{sidebarOpen ? 'Dashboard secretaria' : 'Inicio'}</span>
          </button>
          <button type="button" className="sidebar-link sidebar-link-active">
            <span>{sidebarOpen ? 'Mis reservas' : 'Reservas'}</span>
          </button>
          <button
            type="button"
            className="sidebar-link"
            onClick={() => navigate('/crear-sala')}
          >
            <span>{sidebarOpen ? 'Crear sala' : 'Crear'}</span>
          </button>
        </nav>

        <div className="sidebar-user">
          <strong>{usuario.correo}</strong>
          {sidebarOpen ? (
            <>
              <span>{usuario.rol}</span>
              <span>{facultadNombre}</span>
            </>
          ) : null}
        </div>

        <button
          type="button"
          className="sidebar-logout"
          onClick={() => {
            cerrarSesion()
            navigate('/login')
          }}
        >
          {sidebarOpen ? 'Cerrar sesion' : 'Salir'}
        </button>
      </aside>

      <section className="dashboard-main create-room-main">
        <header className="dashboard-header">
          <div>
            <h1>Mis reservas</h1>
            <p className="dashboard-subtitle">
              Esta vista queda habilitada para que la navegacion no te expulse al login.
            </p>
          </div>

          <div className="dashboard-header-card">
            <span>Sesion activa</span>
            <strong>{usuario.correo}</strong>
            <p>{facultadNombre}</p>
          </div>
        </header>

        <section className="create-room-wrapper">
          <article className="dashboard-card create-room-card">
            <div className="mis-reservas-placeholder">
              <h2>Modulo en preparacion</h2>
              <p>
                La ruta de Mis reservas ya no redirige al login. Puedes volver al dashboard o
                continuar con la gestion de salas.
              </p>
              <div className="create-room-actions">
                <button
                  type="button"
                  className="action-button create-room-submit"
                  onClick={() => navigate('/dashboard-secretaria')}
                >
                  Ir al dashboard
                </button>
                <button
                  type="button"
                  className="create-room-cancel"
                  onClick={() => navigate('/crear-sala')}
                >
                  Ir a crear sala
                </button>
              </div>
            </div>
          </article>
        </section>
      </section>
    </div>
  )
}
