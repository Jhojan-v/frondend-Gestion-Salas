import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { AuthProvider } from '../shared/context/AuthContext'
import CreateRoomPage from '../presentation/pages/CreateRoomPage'
import HomePage from '../presentation/pages/HomePage'
import LoginPage from '../presentation/pages/LoginPage'
import RegisterPage from '../presentation/pages/RegisterPage'

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Navigate to="/login" replace />} />
          <Route path="/registro" element={<RegisterPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/crear-sala" element={<CreateRoomPage />} />
          <Route path="/dashboard-secretaria" element={<HomePage />} />
          <Route path="/dashboard-docente" element={<HomePage />} />
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}

export default App
