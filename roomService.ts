import type { Usuario } from '../../shared/context/AuthContext'
import { API_BASE_URL } from './apiConfig'

export type SalaResumen = {
  idSala: number
  nombre: string
  ubicacion: string
  capacidad: number
  habilitada: boolean
}

export type RecursoSala = {
  idRecursoSala: number
  codigoRecurso: string
  nombreRecurso: string
  cantidad: number
  mensaje?: string | null
}

export type SalaDetalle = SalaResumen & {
  facultadId: number
  recursos: RecursoSala[]
}

export type EstadoSalaResponse = {
  idSala: number
  habilitada: boolean
  mensaje: string
  reservaCanceladaId: number | null
}

export type RecursoSalaResponse = {
  idRecursoSala: number
  codigoRecurso: string
  nombreRecurso: string
  cantidad: number
  mensaje: string
}

export async function retirarRecursoSala(
  idSala: number,
  idRecursoSala: number,
  usuario: Usuario | null,
): Promise<{ mensaje: string }> {
  const response = await fetch(
    `${SALAS_API_URL}/${idSala}/recursos/${idRecursoSala}`,
    {
      method: 'DELETE',
      headers: getHeaders(usuario),
    },
  );
  return handleResponse<{ mensaje: string }>(
    response,
    'No se pudo retirar el recurso.',
  );
}

type ActualizarSalaPayload = {
  nombre: string
  ubicacion: string
  capacidad: number
}

type AgregarRecursoPayload = {
  codigoRecurso: string
  nombreRecurso: string
  cantidad: number
}

type CrearSalaPayload = {
  nombre: string
  ubicacion: string
  capacidad: number
  facultad: string
}

type ErrorDetalle = {
  campo?: string
  mensaje?: string
}

type ErrorPayload = {
  message?: string
  errores?: ErrorDetalle[]
}

const SALAS_API_URL = `${API_BASE_URL}/api/salas`

const DEFAULT_USER_ID = '1'

const getHeaders = (usuario: Usuario | null) => ({
  'Content-Type': 'application/json',
  'X-Usuario-Id': DEFAULT_USER_ID,
  'X-Facultad-Id': String(usuario?.idFacultad ?? 1),
  'X-Rol': usuario?.rol ?? 'SECRETARIA',
})

async function parseJsonSafe<T>(response: Response): Promise<T | null> {
  const text = await response.text()

  if (!text.trim()) {
    return null
  }

  return JSON.parse(text) as T
}

function getErrorMessage(payload: ErrorPayload | null, fallback: string) {
  if (!payload) {
    return fallback
  }

  const detalles = payload.errores
    ?.map((error) => error.mensaje?.trim())
    .filter((mensaje): mensaje is string => Boolean(mensaje))

  if (detalles?.length) {
    return detalles.join(' ')
  }

  return payload.message?.trim() || fallback
}

async function handleResponse<T>(response: Response, fallbackError: string) {
  const payload = await parseJsonSafe<T | ErrorPayload>(response)

  if (!response.ok) {
    throw new Error(getErrorMessage(payload as ErrorPayload | null, fallbackError))
  }

  if (payload === null) {
    throw new Error('El backend respondio sin contenido.')
  }

  return payload as T
}

async function request<T>(
  url: string,
  usuario: Usuario | null,
  init: RequestInit,
  fallbackError: string,
) {
  let response: Response

  try {
    response = await fetch(url, {
      ...init,
      headers: {
        ...getHeaders(usuario),
        ...(init.headers ?? {}),
      },
    })
  } catch {
    throw new Error('No fue posible conectar con el backend en http://localhost:8080.')
  }

  return handleResponse<T>(response, fallbackError)
}

export function listarSalas(usuario: Usuario | null) {
  return request<SalaResumen[]>(
    SALAS_API_URL,
    usuario,
    { method: 'GET' },
    'No fue posible cargar las salas.',
  )
}

export function obtenerSalaDetalle(idSala: number, usuario: Usuario | null) {
  return request<SalaDetalle>(
    `${SALAS_API_URL}/${idSala}`,
    usuario,
    { method: 'GET' },
    'No fue posible cargar el detalle de la sala.',
  )
}

export function actualizarSala(
  idSala: number,
  datos: ActualizarSalaPayload,
  usuario: Usuario | null,
) {
  return request<SalaDetalle>(
    `${SALAS_API_URL}/${idSala}`,
    usuario,
    {
      method: 'PUT',
      body: JSON.stringify(datos),
    },
    'No fue posible actualizar la sala.',
  )
}

export function actualizarEstadoSala(
  idSala: number,
  habilitada: boolean,
  usuario: Usuario | null,
) {
  return request<EstadoSalaResponse>(
    `${SALAS_API_URL}/${idSala}/estado`,
    usuario,
    {
      method: 'PATCH',
      body: JSON.stringify({ habilitada }),
    },
    'No fue posible actualizar el estado de la sala.',
  )
}

export function agregarRecursoSala(
  idSala: number,
  datos: AgregarRecursoPayload,
  usuario: Usuario | null,
) {
  return request<RecursoSalaResponse>(
    `${SALAS_API_URL}/${idSala}/recursos`,
    usuario,
    {
      method: 'POST',
      body: JSON.stringify(datos),
    },
    'No fue posible agregar el recurso tecnologico.',
  )
}

export async function crearSala(datos: CrearSalaPayload) {
  let response: Response

  try {
    response = await fetch(SALAS_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Usuario-Id': DEFAULT_USER_ID,
        'X-Facultad-Id': '1',
        'X-Rol': 'SECRETARIA',
      },
      body: JSON.stringify(datos),
    })
  } catch {
    throw new Error('No fue posible conectar con el backend en http://localhost:8080.')
  }

  if (response.status === 405) {
    throw new Error(
      'El backend actual no tiene habilitado un endpoint POST para crear salas todavia.',
    )
  }

  return handleResponse<Record<string, unknown>>(
    response,
    'No fue posible crear la sala solicitada.',
  )
}
