import type { Usuario } from '../../shared/context/AuthContext'
import { getUsuarioHeaderId } from '../../shared/auth/usuarioSesion'

type BuildRequestHeadersOptions = {
  defaultRole?: string
  includeContentType?: boolean
}

export function buildRequestHeaders(
  usuario: Usuario | null,
  options: BuildRequestHeadersOptions = {},
) {
  const { defaultRole = 'DOCENTE', includeContentType = true } = options
  const headers: Record<string, string> = {
    'X-Usuario-Id': getUsuarioHeaderId(usuario),
    'X-Facultad-Id': String(usuario?.idFacultad ?? 1),
    'X-Rol': usuario?.rol ?? defaultRole,
  }

  if (includeContentType) {
    headers['Content-Type'] = 'application/json'
  }

  const token = usuario?.token?.trim()

  if (token) {
    headers.Authorization = `Bearer ${token}`
  }

  return headers
}
