import type { Usuario } from '../../shared/context/AuthContext'
import { API_BASE_URL, getBackendUnavailableMessage, LOCAL_FALLBACK_ENABLED } from './apiConfig'
import { buildRequestHeaders } from './requestHeaders'

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

export type RecursoCatalogo = {
  codigoRecurso: string
  nombreRecurso: string
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

type RecursoCatalogoPayload = Partial<RecursoCatalogo> & {
  codigo?: string
  code?: string
  nombre?: string
  name?: string
  descripcion?: string
}

export type CrearSalaResult = {
  modoLocal: boolean
}

const SALAS_API_URL = `${API_BASE_URL}/api/salas`
const LOCAL_ROOMS_STORAGE_KEY = 'gestion-salas.local.rooms'
const LOCAL_RESOURCE_CATALOG_STORAGE_KEY = 'gestion-salas.local.resource-catalog'
const RESOURCE_CATALOG_API_URLS = [
  import.meta.env.VITE_RESOURCE_CATALOG_URL?.trim(),
  `${API_BASE_URL}/api/recursos`,
  `${API_BASE_URL}/api/recursos/catalogo`,
  `${API_BASE_URL}/api/recursos-tecnologicos`,
].filter((value): value is string => Boolean(value))
const DEFAULT_RESOURCE_CATALOG: RecursoCatalogo[] = [
  { codigoRecurso: 'PRY-001', nombreRecurso: 'Proyector' },
  { codigoRecurso: 'PNT-002', nombreRecurso: 'Pantalla interactiva' },
  { codigoRecurso: 'MIC-003', nombreRecurso: 'Microfono inalambrico' },
  { codigoRecurso: 'CAM-004', nombreRecurso: 'Camara web' },
  { codigoRecurso: 'AUD-005', nombreRecurso: 'Sistema de audio' },
]

const getHeaders = (usuario: Usuario | null) =>
  buildRequestHeaders(usuario, { defaultRole: 'SECRETARIA' })

function canUseLocalStorage() {
  return typeof window !== 'undefined' && typeof window.localStorage !== 'undefined'
}

function readLocalSalas() {
  if (!canUseLocalStorage()) {
    return [] as SalaDetalle[]
  }

  try {
    const stored = window.localStorage.getItem(LOCAL_ROOMS_STORAGE_KEY)

    if (!stored) {
      return [] as SalaDetalle[]
    }

    const parsed = JSON.parse(stored) as unknown
    return Array.isArray(parsed) ? (parsed as SalaDetalle[]) : []
  } catch {
    return [] as SalaDetalle[]
  }
}

function writeLocalSalas(salas: SalaDetalle[]) {
  if (!canUseLocalStorage()) {
    return
  }

  window.localStorage.setItem(LOCAL_ROOMS_STORAGE_KEY, JSON.stringify(salas))
}

function readLocalResourceCatalog() {
  if (!canUseLocalStorage()) {
    return [] as RecursoCatalogo[]
  }

  try {
    const stored = window.localStorage.getItem(LOCAL_RESOURCE_CATALOG_STORAGE_KEY)

    if (!stored) {
      return [] as RecursoCatalogo[]
    }

    const parsed = JSON.parse(stored) as unknown
    return Array.isArray(parsed) ? (parsed as RecursoCatalogo[]) : []
  } catch {
    return [] as RecursoCatalogo[]
  }
}

function writeLocalResourceCatalog(recursos: RecursoCatalogo[]) {
  if (!canUseLocalStorage()) {
    return
  }

  window.localStorage.setItem(LOCAL_RESOURCE_CATALOG_STORAGE_KEY, JSON.stringify(recursos))
}

function getUsuarioFacultadId(usuario: Usuario | null) {
  return usuario?.idFacultad ?? 1
}

function matchesUsuarioFacultad(sala: SalaDetalle, usuario: Usuario | null) {
  return sala.facultadId === getUsuarioFacultadId(usuario)
}

function toSalaResumen(sala: SalaDetalle): SalaResumen {
  return {
    idSala: sala.idSala,
    nombre: sala.nombre,
    ubicacion: sala.ubicacion,
    capacidad: sala.capacidad,
    habilitada: sala.habilitada,
  }
}

function cloneSalaDetalle(sala: SalaDetalle): SalaDetalle {
  return {
    ...sala,
    recursos: sala.recursos.map((recurso) => ({ ...recurso })),
  }
}

function getNextSalaId(salas: SalaDetalle[]) {
  return salas.reduce((maxId, sala) => Math.max(maxId, sala.idSala), 0) + 1
}

function getNextResourceId(salas: SalaDetalle[]) {
  return (
    salas.reduce((maxId, sala) => {
      const salaMaxId = sala.recursos.reduce(
        (resourceMaxId, recurso) => Math.max(resourceMaxId, recurso.idRecursoSala),
        0,
      )

      return Math.max(maxId, salaMaxId)
    }, 0) + 1
  )
}

function normalizeText(value: string) {
  return value.trim().toLowerCase()
}

function uniqueCatalogResources(recursos: RecursoCatalogo[]) {
  const resourcesByCode = new Map<string, RecursoCatalogo>()

  recursos.forEach((recurso) => {
    const code = recurso.codigoRecurso.trim()
    const name = recurso.nombreRecurso.trim()

    if (!code || !name) {
      return
    }

    resourcesByCode.set(normalizeText(code), {
      codigoRecurso: code,
      nombreRecurso: name,
    })
  })

  return Array.from(resourcesByCode.values()).sort((left, right) =>
    left.nombreRecurso.localeCompare(right.nombreRecurso, 'es'),
  )
}

function buildLocalResourceCatalog() {
  const recursosAsignados = readLocalSalas().flatMap((sala) =>
    sala.recursos.map((recurso) => ({
      codigoRecurso: recurso.codigoRecurso,
      nombreRecurso: recurso.nombreRecurso,
    })),
  )

  const catalogo = uniqueCatalogResources([
    ...readLocalResourceCatalog(),
    ...recursosAsignados,
    ...DEFAULT_RESOURCE_CATALOG,
  ])

  if (catalogo.length) {
    writeLocalResourceCatalog(catalogo)
  }

  return catalogo
}

function normalizeCatalogResource(payload: unknown): RecursoCatalogo | null {
  if (!payload || typeof payload !== 'object') {
    return null
  }

  const data = payload as RecursoCatalogoPayload
  const codigo = data.codigoRecurso ?? data.codigo ?? data.code
  const nombre = data.nombreRecurso ?? data.nombre ?? data.name ?? data.descripcion

  if (typeof codigo !== 'string' || typeof nombre !== 'string') {
    return null
  }

  const codigoLimpio = codigo.trim()
  const nombreLimpio = nombre.trim()

  if (!codigoLimpio || !nombreLimpio) {
    return null
  }

  return {
    codigoRecurso: codigoLimpio,
    nombreRecurso: nombreLimpio,
  }
}

function ensureUniqueRoomName(
  salas: SalaDetalle[],
  nombre: string,
  facultadId: number,
  excludeSalaId?: number,
) {
  const normalizedName = normalizeText(nombre)

  const alreadyExists = salas.some(
    (sala) =>
      sala.idSala !== excludeSalaId &&
      sala.facultadId === facultadId &&
      normalizeText(sala.nombre) === normalizedName,
  )

  if (alreadyExists) {
    throw new Error('Ya existe una sala con ese nombre.')
  }
}

function findLocalSalaOrThrow(
  salas: SalaDetalle[],
  idSala: number,
  usuario: Usuario | null,
) {
  const sala = salas.find(
    (currentSala) => currentSala.idSala === idSala && matchesUsuarioFacultad(currentSala, usuario),
  )

  if (!sala) {
    throw new Error('No fue posible encontrar la sala solicitada.')
  }

  return sala
}

function listLocalSalas(usuario: Usuario | null) {
  return readLocalSalas()
    .filter((sala) => matchesUsuarioFacultad(sala, usuario))
    .map(toSalaResumen)
}

function getLocalSalaDetalle(idSala: number, usuario: Usuario | null) {
  const sala = findLocalSalaOrThrow(readLocalSalas(), idSala, usuario)
  return cloneSalaDetalle(sala)
}

function createLocalSala(datos: CrearSalaPayload, usuario: Usuario | null) {
  const salas = readLocalSalas()
  const facultadId = getUsuarioFacultadId(usuario)

  ensureUniqueRoomName(salas, datos.nombre, facultadId)

  const nuevaSala: SalaDetalle = {
    idSala: getNextSalaId(salas),
    nombre: datos.nombre.trim(),
    ubicacion: datos.ubicacion.trim(),
    capacidad: datos.capacidad,
    habilitada: true,
    facultadId,
    recursos: [],
  }

  writeLocalSalas([...salas, nuevaSala])

  return cloneSalaDetalle(nuevaSala)
}

function updateLocalSala(
  idSala: number,
  datos: ActualizarSalaPayload,
  usuario: Usuario | null,
) {
  const salas = readLocalSalas()
  const facultadId = getUsuarioFacultadId(usuario)
  const sala = findLocalSalaOrThrow(salas, idSala, usuario)

  ensureUniqueRoomName(salas, datos.nombre, facultadId, idSala)

  const actualizada: SalaDetalle = {
    ...sala,
    nombre: datos.nombre.trim(),
    ubicacion: datos.ubicacion.trim(),
    capacidad: datos.capacidad,
  }

  writeLocalSalas(
    salas.map((currentSala) => (currentSala.idSala === idSala ? actualizada : currentSala)),
  )

  return cloneSalaDetalle(actualizada)
}

function updateLocalSalaStatus(
  idSala: number,
  habilitada: boolean,
  usuario: Usuario | null,
) {
  const salas = readLocalSalas()
  const sala = findLocalSalaOrThrow(salas, idSala, usuario)

  const actualizada: SalaDetalle = {
    ...sala,
    habilitada,
  }

  writeLocalSalas(
    salas.map((currentSala) => (currentSala.idSala === idSala ? actualizada : currentSala)),
  )

  return {
    idSala,
    habilitada,
    mensaje: habilitada
      ? 'La sala fue habilitada en modo local'
      : 'La sala fue deshabilitada en modo local',
    reservaCanceladaId: null,
  }
}

function addLocalResource(
  idSala: number,
  datos: AgregarRecursoPayload,
  usuario: Usuario | null,
) {
  const salas = readLocalSalas()
  const sala = findLocalSalaOrThrow(salas, idSala, usuario)

  if (!sala.habilitada) {
    throw new Error('La sala esta deshabilitada. No puedes agregar recursos.')
  }

  const normalizedCode = normalizeText(datos.codigoRecurso)
  const existingResource = sala.recursos.find(
    (recurso) => normalizeText(recurso.codigoRecurso) === normalizedCode,
  )

  let resourceResponse: RecursoSalaResponse

  if (existingResource) {
    existingResource.cantidad += datos.cantidad
    existingResource.nombreRecurso = datos.nombreRecurso.trim()
    resourceResponse = {
      ...existingResource,
      mensaje: 'Recurso actualizado en modo local.',
    }
  } else {
    const newResource: RecursoSala = {
      idRecursoSala: getNextResourceId(salas),
      codigoRecurso: datos.codigoRecurso.trim(),
      nombreRecurso: datos.nombreRecurso.trim(),
      cantidad: datos.cantidad,
    }

    sala.recursos = [...sala.recursos, newResource]
    resourceResponse = {
      ...newResource,
      mensaje: 'Recurso agregado en modo local.',
    }
  }

  writeLocalSalas(
    salas.map((currentSala) => (currentSala.idSala === idSala ? cloneSalaDetalle(sala) : currentSala)),
  )

  return resourceResponse
}

function removeLocalResource(idSala: number, idRecursoSala: number, usuario: Usuario | null) {
  const salas = readLocalSalas()
  const sala = findLocalSalaOrThrow(salas, idSala, usuario)

  const recursosActualizados = sala.recursos.filter(
    (recurso) => recurso.idRecursoSala !== idRecursoSala,
  )

  if (recursosActualizados.length === sala.recursos.length) {
    throw new Error('No fue posible encontrar el recurso solicitado.')
  }

  writeLocalSalas(
    salas.map((currentSala) =>
      currentSala.idSala === idSala
        ? {
            ...sala,
            recursos: recursosActualizados,
          }
        : currentSala,
    ),
  )

  return { mensaje: 'Recurso retirado en modo local.' }
}

async function tryFetchResourceCatalog(url: string, usuario: Usuario | null) {
  let response: Response

  try {
    response = await fetch(url, {
      method: 'GET',
      headers: getHeaders(usuario),
    })
  } catch {
    return null
  }

  if (!response.ok) {
    return null
  }

  const payload = await parseJsonSafe<unknown>(response)

  if (!Array.isArray(payload)) {
    return null
  }

  const recursos = uniqueCatalogResources(
    payload
      .map((item) => normalizeCatalogResource(item))
      .filter((item): item is RecursoCatalogo => item !== null),
  )

  if (!recursos.length) {
    return null
  }

  writeLocalResourceCatalog(recursos)
  return recursos
}

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
  fallbackLocal?: () => T | Promise<T>,
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
    if (LOCAL_FALLBACK_ENABLED && fallbackLocal) {
      return await fallbackLocal()
    }

    throw new Error(getBackendUnavailableMessage())
  }

  return handleResponse<T>(response, fallbackError)
}

export function listarSalas(usuario: Usuario | null) {
  return request<SalaResumen[]>(
    SALAS_API_URL,
    usuario,
    { method: 'GET' },
    'No fue posible cargar las salas.',
    () => listLocalSalas(usuario),
  )
}

export function obtenerSalaDetalle(idSala: number, usuario: Usuario | null) {
  return request<SalaDetalle>(
    `${SALAS_API_URL}/${idSala}`,
    usuario,
    { method: 'GET' },
    'No fue posible cargar el detalle de la sala.',
    () => getLocalSalaDetalle(idSala, usuario),
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
    () => updateLocalSala(idSala, datos, usuario),
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
    () => updateLocalSalaStatus(idSala, habilitada, usuario),
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
    () => addLocalResource(idSala, datos, usuario),
  )
}

export function retirarRecursoSala(
  idSala: number,
  idRecursoSala: number,
  usuario: Usuario | null,
): Promise<{ mensaje: string }> {
  return request<{ mensaje: string }>(
    `${SALAS_API_URL}/${idSala}/recursos/${idRecursoSala}`,
    usuario,
    {
      method: 'DELETE',
    },
    'No se pudo retirar el recurso.',
    () => removeLocalResource(idSala, idRecursoSala, usuario),
  )
}

export async function listarCatalogoRecursos(usuario: Usuario | null) {
  for (const url of RESOURCE_CATALOG_API_URLS) {
    const recursos = await tryFetchResourceCatalog(url, usuario)

    if (recursos?.length) {
      return recursos
    }
  }

  return buildLocalResourceCatalog()
}

export async function crearSala(
  datos: CrearSalaPayload,
  usuario: Usuario | null,
): Promise<CrearSalaResult> {
  let response: Response

  try {
    response = await fetch(SALAS_API_URL, {
      method: 'POST',
      headers: getHeaders(usuario),
      body: JSON.stringify({
        nombre: datos.nombre.trim(),
        ubicacion: datos.ubicacion.trim(),
        capacidad: datos.capacidad,
        facultad: datos.facultad,
      }),
    })
  } catch {
    if (LOCAL_FALLBACK_ENABLED) {
      createLocalSala(datos, usuario)
      return { modoLocal: true }
    }

    throw new Error(getBackendUnavailableMessage())
  }

  if (response.status === 405) {
    throw new Error(
      'El backend actual no tiene habilitado un endpoint POST para crear salas todavia.',
    )
  }

  const rawBody = await response.text()

  if (!response.ok) {
    let errorPayload: ErrorPayload | null = null

    if (rawBody.trim()) {
      try {
        errorPayload = JSON.parse(rawBody) as ErrorPayload
      } catch {
        errorPayload = {
          message: rawBody,
        }
      }
    }

    throw new Error(
      getErrorMessage(errorPayload, 'No fue posible crear la sala solicitada.'),
    )
  }

  return { modoLocal: false }
}
