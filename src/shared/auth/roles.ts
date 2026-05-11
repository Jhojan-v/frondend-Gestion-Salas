import type { Usuario } from '../context/AuthContext'

export const ROLES = {
  DOCENTE: 'DOCENTE',
  SECRETARIA: 'SECRETARIA',
} as const

export type AppRole = (typeof ROLES)[keyof typeof ROLES]

type UsuarioConRol = Pick<Usuario, 'rol'> | null | undefined

export function normalizarRol(rol: string | null | undefined) {
  return rol?.trim().toUpperCase() || ROLES.DOCENTE
}

export function esSecretaria(usuario: UsuarioConRol) {
  return normalizarRol(usuario?.rol) === ROLES.SECRETARIA
}

export function esDocente(usuario: UsuarioConRol) {
  return normalizarRol(usuario?.rol) === ROLES.DOCENTE
}

export function obtenerRutaDashboard(usuario: UsuarioConRol) {
  return esSecretaria(usuario) ? '/dashboard-secretaria' : '/dashboard-docente'
}

export function puedeGestionarSistema(usuario: UsuarioConRol) {
  return esSecretaria(usuario)
}

export function puedeVerMisReservas(usuario: UsuarioConRol) {
  return esSecretaria(usuario) || esDocente(usuario)
}

export function esRolPermitido(
  usuario: UsuarioConRol,
  rolesPermitidos: readonly AppRole[],
) {
  return rolesPermitidos.includes(normalizarRol(usuario?.rol) as AppRole)
}
