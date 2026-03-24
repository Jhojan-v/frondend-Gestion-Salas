import { createContext, useContext, useState } from 'react'

export interface Usuario {
  correo: string
  facultad: string
  idFacultad?: number | null
  rol: string
  token?: string
}

interface AuthContextType {
  usuario: Usuario | null
  guardarSesion: (datos: Usuario) => void
  cerrarSesion: () => void
}

const AuthContext = createContext<AuthContextType | null>(null)

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [usuario, setUsuario] = useState<Usuario | null>(() => {
    const guardado = localStorage.getItem('usuario')
    return guardado ? (JSON.parse(guardado) as Usuario) : null
  })

  const guardarSesion = (datos: Usuario) => {
    localStorage.setItem('usuario', JSON.stringify(datos))
    setUsuario(datos)
  }

  const cerrarSesion = () => {
    localStorage.removeItem('usuario')
    setUsuario(null)
  }

  return (
    <AuthContext.Provider value={{ usuario, guardarSesion, cerrarSesion }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const context = useContext(AuthContext)

  if (!context) {
    throw new Error('useAuth debe usarse dentro de AuthProvider')
  }

  return context
}
