import type { ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import { resolverNombreFacultad } from '../../shared/constants/facultades'
import { useAuth } from '../../shared/context/AuthContext'
import {
  esSecretaria,
  obtenerRutaDashboard,
  puedeVerMisReservas,
} from '../../shared/auth/roles'
import './dashboard-shell.css'

type NavigationKey =
  | 'dashboard'
  | 'create-reservation'
  | 'my-reservations'
  | 'create-room'

type DashboardShellProps = {
  activeKey: NavigationKey
  title: string
  subtitle: string
  children: ReactNode
  headerAside?: ReactNode
}

type NavigationItem = {
  key: NavigationKey
  label: string
  to: string
}

function DashboardShell({
  activeKey,
  title,
  subtitle,
  children,
  headerAside,
}: DashboardShellProps) {
  const navigate = useNavigate()
  const { usuario, cerrarSesion } = useAuth()
  const secretaria = esSecretaria(usuario)
  const facultadNombre = resolverNombreFacultad(usuario?.facultad, usuario?.idFacultad)

  const navigationItems: NavigationItem[] = secretaria
    ? [
        { key: 'dashboard', label: 'Panel de salas', to: '/dashboard-secretaria' },
        { key: 'create-reservation', label: 'Reservar una sala', to: '/crear-reserva' },
        { key: 'my-reservations', label: 'Mis reservas', to: '/mis-reservas' },
        { key: 'create-room', label: 'Crear sala', to: '/crear-sala' },
      ]
    : [
        { key: 'dashboard', label: 'Consultar disponibilidad', to: '/dashboard-docente' },
        { key: 'create-reservation', label: 'Reservar una sala', to: '/crear-reserva' },
        { key: 'my-reservations', label: 'Mis reservas', to: '/mis-reservas' },
      ]

  return (
    <div className="app-shell">
      <aside className="app-shell__sidebar">
        <div className="app-shell__brand">
          <span className="app-shell__eyebrow">Universidad UAO</span>
          <h1>Sistema de Reservas</h1>
          <p>
            {secretaria
              ? 'Gestion centralizada de salas y recursos.'
              : 'Consulta disponibilidad y agenda tus reservas.'}
          </p>
        </div>

        <nav className="app-shell__nav" aria-label="Navegacion principal">
          {navigationItems.map((item) => (
            <button
              key={item.key}
              type="button"
              className={`app-shell__nav-link ${item.key === activeKey ? 'is-active' : ''}`}
              onClick={() => navigate(item.to)}
            >
              {item.label}
            </button>
          ))}
        </nav>

        <div className="app-shell__user-card">
          <span className="app-shell__user-role">
            {secretaria ? 'Rol Secretaria' : 'Rol Docente'}
          </span>
          <strong>{usuario?.correo ?? 'Sin sesion'}</strong>
          <span>{facultadNombre}</span>
          {puedeVerMisReservas(usuario) ? (
            <button
              type="button"
              className="app-shell__secondary-link"
              onClick={() => navigate('/mis-reservas')}
            >
              Consultar mis reservas
            </button>
          ) : null}
        </div>

        <button
          type="button"
          className="app-shell__logout"
          onClick={() => {
            cerrarSesion()
            navigate('/login')
          }}
        >
          Cerrar sesion
        </button>
      </aside>

      <main className="app-shell__main">
        <header className="app-shell__header">
          <div>
            <p className="app-shell__section-label">
              {secretaria ? 'Panel administrativo' : 'Panel de consulta'}
            </p>
            <h2>{title}</h2>
            <p className="app-shell__subtitle">{subtitle}</p>
          </div>

          <div className="app-shell__header-card">
            <span>Ruta principal</span>
            <strong>{obtenerRutaDashboard(usuario)}</strong>
            <p>{facultadNombre}</p>
          </div>

          {headerAside ? <div className="app-shell__header-aside">{headerAside}</div> : null}
        </header>

        <section className="app-shell__content">{children}</section>
      </main>
    </div>
  )
}

export default DashboardShell
