import type { ReactNode } from 'react'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { AuthProvider } from '../shared/context/AuthContext'
import { useAuth } from '../shared/context/AuthContext'
import CreateRoomPage from '../presentation/pages/CreateRoomPage'
import HomePage from '../presentation/pages/HomePage'
import LoginPage from '../presentation/pages/LoginPage'
import RegisterPage from '../presentation/pages/RegisterPage'
import CreateReservationPage from '../presentation/pages/CreateReservationPage'
import MyReservationsPage from '../presentation/pages/MyReservationsPage'
import {
  obtenerRutaDashboard,
  ROLES,
  esRolPermitido,
  type AppRole,
} from '../shared/auth/roles'

function ProtectedRoute({ children }: { children: ReactNode }) {
  const { usuario } = useAuth()

  if (!usuario) {
    return <Navigate to="/login" replace />
  }

  return <>{children}</>
}

function RoleRoute({
  children,
  allowedRoles,
}: {
  children: ReactNode
  allowedRoles: readonly AppRole[]
}) {
  const { usuario } = useAuth()

  if (!usuario) {
    return <Navigate to="/login" replace />
  }

  if (!esRolPermitido(usuario, allowedRoles)) {
    return <Navigate to={obtenerRutaDashboard(usuario)} replace />
  }

  return <>{children}</>
}

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Navigate to="/login" replace />} />
          <Route path="/registro" element={<RegisterPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route
            path="/crear-sala"
            element={
              <RoleRoute allowedRoles={[ROLES.SECRETARIA]}>
                <CreateRoomPage />
              </RoleRoute>
            }
          />
          <Route
            path="/dashboard-secretaria"
            element={
              <RoleRoute allowedRoles={[ROLES.SECRETARIA]}>
                <HomePage />
              </RoleRoute>
            }
          />
          <Route
            path="/dashboard-docente"
            element={
              <RoleRoute allowedRoles={[ROLES.DOCENTE]}>
                <HomePage />
              </RoleRoute>
            }
          />
          <Route
            path="/crear-reserva"
            element={
              <ProtectedRoute>
                <CreateReservationPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/mis-reservas"
            element={
              <RoleRoute allowedRoles={[ROLES.SECRETARIA, ROLES.DOCENTE]}>
                <MyReservationsPage />
              </RoleRoute>
            }
          />
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}

export default App
