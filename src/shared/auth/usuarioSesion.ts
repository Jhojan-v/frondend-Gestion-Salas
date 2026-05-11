type UsuarioSesionLike = {
  idUsuario?: unknown
  token?: string | null
}

function normalizeNumericId(value: unknown): number | null {
  if (typeof value === 'number' && Number.isFinite(value) && value > 0) {
    return Math.trunc(value)
  }

  if (typeof value === 'string' && /^\d+$/.test(value.trim())) {
    return Number(value.trim())
  }

  return null
}

function decodeJwtPayload(token?: string | null): Record<string, unknown> | null {
  if (!token) {
    return null
  }

  const [, payload] = token.split('.')

  if (!payload) {
    return null
  }

  try {
    const normalized = payload.replace(/-/g, '+').replace(/_/g, '/')
    const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, '=')
    const decoded = atob(padded)
    return JSON.parse(decoded) as Record<string, unknown>
  } catch {
    return null
  }
}

function readTokenUserId(payload: Record<string, unknown> | null) {
  if (!payload) {
    return null
  }

  return (
    normalizeNumericId(payload.idUsuario) ??
    normalizeNumericId(payload.usuarioId) ??
    normalizeNumericId(payload.id_usuario) ??
    normalizeNumericId(payload.userId) ??
    normalizeNumericId(payload.id) ??
    normalizeNumericId(payload.sub)
  )
}

export function resolveUsuarioId(usuario: UsuarioSesionLike | null | undefined) {
  return normalizeNumericId(usuario?.idUsuario) ?? readTokenUserId(decodeJwtPayload(usuario?.token))
}

export function getUsuarioHeaderId(usuario: UsuarioSesionLike | null | undefined) {
  return String(resolveUsuarioId(usuario) ?? 1)
}
