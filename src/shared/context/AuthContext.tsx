/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useState } from 'react'
import { resolveUsuarioId } from '../auth/usuarioSesion'
import { normalizarRol } from '../auth/roles'

export interface Usuario {
  correo: string
  facultad: string
  idFacultad?: number | null
  idUsuario?: number | null
  rol: string
  token?: string
}

interface AuthContextType {
  usuario: Usuario | null
  guardarSesion: (datos: Usuario) => void
  cerrarSesion: () => void
}

const AuthContext = createContext<AuthContextType | null>(null)

const normalizarUsuario = (datos: Usuario): Usuario => ({
  ...datos,
  idUsuario: resolveUsuarioId(datos),
  rol: normalizarRol(datos.rol),
})

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [usuario, setUsuario] = useState<Usuario | null>(() => {
    const guardado = localStorage.getItem('usuario')

    if (!guardado) {
      return null
    }

    try {
      return normalizarUsuario(JSON.parse(guardado) as Usuario)
    } catch {
      localStorage.removeItem('usuario')
      return null
    }
  })

  const guardarSesion = (datos: Usuario) => {
    const normalizado = normalizarUsuario(datos)
    localStorage.setItem('usuario', JSON.stringify(normalizado))
    setUsuario(normalizado)
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
