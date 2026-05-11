import { resolveUsuarioId } from '../../shared/auth/usuarioSesion'
import { API_BASE_URL, getBackendUnavailableMessage } from './apiConfig'

type LoginResponse = {
  id?: number | string
  idUsuario?: number | string
  usuarioId?: number | string
  id_usuario?: number | string
  correo?: string
  email?: string
  rol?: string
  idFacultad?: number
  facultad?: string
  token?: string
}

export const registrarUsuario = async (datos: {
  nombre: string
  correo: string
  idFacultad: number
  contrasena: string
}) => {
  let response: Response

  try {
    response = await fetch(`${API_BASE_URL}/api/usuarios/registrar`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        nombre: datos.nombre,
        correo: datos.correo,
        password: datos.contrasena,
        idFacultad: datos.idFacultad,
      }),
    })
  } catch {
    throw new Error(getBackendUnavailableMessage())
  }

  const texto = await response.text()

  if (!response.ok) {
    throw new Error(texto || 'No fue posible registrar el usuario.')
  }

  if (
    texto.includes('obligatori') ||
    texto.includes('registrado') ||
    texto.includes('institucional') ||
    texto.includes('invalida') ||
    texto.includes('invalida') ||
    texto.includes('vacios') ||
    texto.includes('vacios')
  ) {
    throw new Error(texto)
  }

  return texto
}

export const iniciarSesion = async (datos: {
  correo: string
  contrasena: string
}) => {
  const params = new URLSearchParams({
    correo: datos.correo,
    password: datos.contrasena,
  })

  let response: Response

  try {
    response = await fetch(`${API_BASE_URL}/api/usuarios/login?${params.toString()}`, {
      method: 'POST',
    })
  } catch {
    throw new Error(getBackendUnavailableMessage())
  }

  const rawBody = await response.text()

  if (!response.ok || response.status === 204 || !rawBody.trim()) {
    throw new Error('Correo o contraseña incorrectos.')
  }

  let data: LoginResponse | null = null

  try {
    data = JSON.parse(rawBody) as LoginResponse
  } catch {
    throw new Error('El backend respondió con un formato inesperado al iniciar sesión.')
  }

  if (!data) {
    throw new Error('Correo o contraseña incorrectos.')
  }

  return {
    idUsuario: resolveUsuarioId({
      idUsuario: data.idUsuario ?? data.usuarioId ?? data.id_usuario ?? data.id ?? null,
      token: data.token,
    }),
    correo: data.correo ?? data.email ?? datos.correo,
    rol: data.rol ?? 'DOCENTE',
    idFacultad: data.idFacultad ?? null,
    facultad: data.facultad ?? '',
    token: data.token,
  }
}
