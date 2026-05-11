import type { Usuario } from '../../shared/context/AuthContext'
import { API_BASE_URL, getBackendUnavailableMessage, LOCAL_FALLBACK_ENABLED } from './apiConfig'
import { buildRequestHeaders } from './requestHeaders'

export interface CrearReservaRequest {
  idSala: number
  fechaHoraInicio: string
  fechaHoraFin: string
}

export interface ReservaResponse {
  idReserva: number
  idSala: number
  nombreSala: string
  fechaHoraInicio: string
  fechaHoraFin: string
  estado: 'ACTIVA' | 'CANCELADA'
  motivoCancelacion?: string | null
  fechaCancelacion?: string | null
}

export interface CancelarReservaResponse {
  idReserva: number
  mensaje: string
  cancelada: boolean
}

export interface DisponibilidadSalaResponse {
  idSala: number
  nombreSala: string
  horariosDisponibles: {
    horaInicio: string
    horaFin: string
    disponible: boolean
  }[]
}

type LocalReserva = ReservaResponse & {
  usuarioId: string
  facultadId: number
}

type LocalSala = {
  idSala: number
  nombre: string
  facultadId: number
  habilitada: boolean
}

const RESERVAS_API_URL = `${API_BASE_URL}/api/reservas`
const LOCAL_RESERVAS_STORAGE_KEY = 'gestion-salas.local.reservas'
const LOCAL_ROOMS_STORAGE_KEY = 'gestion-salas.local.rooms'
const DEFAULT_USER_ID = '1'
const DAY_START_MINUTES = 7 * 60
const DAY_END_MINUTES = 21 * 60 + 30
const SLOT_DURATION_MINUTES = 30

const getHeaders = (usuario: Usuario | null) =>
  buildRequestHeaders(usuario, { defaultRole: 'DOCENTE' })

function canUseLocalStorage() {
  return typeof window !== 'undefined' && typeof window.localStorage !== 'undefined'
}

function readLocalCollection<T>(key: string): T[] {
  if (!canUseLocalStorage()) {
    return []
  }

  try {
    const stored = window.localStorage.getItem(key)

    if (!stored) {
      return []
    }

    const parsed = JSON.parse(stored) as unknown
    return Array.isArray(parsed) ? (parsed as T[]) : []
  } catch {
    return []
  }
}

function writeLocalCollection<T>(key: string, data: T[]) {
  if (!canUseLocalStorage()) {
    return
  }

  window.localStorage.setItem(key, JSON.stringify(data))
}

function readLocalReservas() {
  return readLocalCollection<LocalReserva>(LOCAL_RESERVAS_STORAGE_KEY)
}

function writeLocalReservas(reservas: LocalReserva[]) {
  writeLocalCollection(LOCAL_RESERVAS_STORAGE_KEY, reservas)
}

function readLocalSalas() {
  return readLocalCollection<LocalSala>(LOCAL_ROOMS_STORAGE_KEY)
}

function getUsuarioStorageId(usuario: Usuario | null) {
  return usuario?.correo ?? DEFAULT_USER_ID
}

function getFacultadId(usuario: Usuario | null) {
  return usuario?.idFacultad ?? 1
}

function parseIsoDate(value: string) {
  return new Date(value)
}

function sameDate(dateTime: string, fecha: string) {
  return dateTime.slice(0, 10) === fecha
}

function toMinutes(dateTime: string) {
  const date = parseIsoDate(dateTime)
  return date.getHours() * 60 + date.getMinutes()
}

function formatTime(totalMinutes: number) {
  const hours = Math.floor(totalMinutes / 60)
  const minutes = totalMinutes % 60

  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`
}

function hasOverlap(
  startA: string,
  endA: string,
  startB: string,
  endB: string,
) {
  return parseIsoDate(startA) < parseIsoDate(endB) && parseIsoDate(endA) > parseIsoDate(startB)
}

function getNextReservationId(reservas: LocalReserva[]) {
  return reservas.reduce((maxId, reserva) => Math.max(maxId, reserva.idReserva), 0) + 1
}

function sortReservas(reservas: ReservaResponse[]) {
  return [...reservas].sort((a, b) => {
    if (a.estado !== b.estado) {
      return a.estado === 'ACTIVA' ? -1 : 1
    }

    return parseIsoDate(a.fechaHoraInicio).getTime() - parseIsoDate(b.fechaHoraInicio).getTime()
  })
}

async function handleResponse<T>(response: Response, fallbackError: string): Promise<T> {
  const text = await response.text()

  if (!response.ok) {
    let mensaje = fallbackError

    try {
      const errorData = JSON.parse(text) as { message?: string; error?: string }
      mensaje = errorData.message || errorData.error || fallbackError
    } catch {
      mensaje = text || fallbackError
    }

    throw new Error(mensaje)
  }

  if (!text.trim()) {
    return null as T
  }

  return JSON.parse(text) as T
}

function createLocalReserva(
  datos: CrearReservaRequest,
  usuario: Usuario | null,
): ReservaResponse {
  const reservas = readLocalReservas()
  const salas = readLocalSalas()
  const usuarioId = getUsuarioStorageId(usuario)
  const facultadId = getFacultadId(usuario)
  const sala = salas.find(
    (currentSala) => currentSala.idSala === datos.idSala && currentSala.facultadId === facultadId,
  )

  if (parseIsoDate(datos.fechaHoraInicio) >= parseIsoDate(datos.fechaHoraFin)) {
    throw new Error('La hora de fin debe ser mayor a la hora de inicio.')
  }

  if (sala && !sala.habilitada) {
    throw new Error('La sala seleccionada no esta habilitada para reservas.')
  }

  const existeCruce = reservas.some(
    (reserva) =>
      reserva.idSala === datos.idSala &&
      reserva.estado === 'ACTIVA' &&
      hasOverlap(
        datos.fechaHoraInicio,
        datos.fechaHoraFin,
        reserva.fechaHoraInicio,
        reserva.fechaHoraFin,
      ),
  )

  if (existeCruce) {
    throw new Error('La sala ya tiene una reserva en el horario seleccionado.')
  }

  const nuevaReserva: LocalReserva = {
    idReserva: getNextReservationId(reservas),
    idSala: datos.idSala,
    nombreSala: sala?.nombre ?? `Sala ${datos.idSala}`,
    fechaHoraInicio: datos.fechaHoraInicio,
    fechaHoraFin: datos.fechaHoraFin,
    estado: 'ACTIVA',
    motivoCancelacion: null,
    fechaCancelacion: null,
    usuarioId,
    facultadId,
  }

  writeLocalReservas([...reservas, nuevaReserva])

  return nuevaReserva
}

function listLocalReservas(usuario: Usuario | null): ReservaResponse[] {
  const usuarioId = getUsuarioStorageId(usuario)

  return sortReservas(
    readLocalReservas()
      .filter((reserva) => reserva.usuarioId === usuarioId)
      .map((reserva) => ({
        idReserva: reserva.idReserva,
        idSala: reserva.idSala,
        nombreSala: reserva.nombreSala,
        fechaHoraInicio: reserva.fechaHoraInicio,
        fechaHoraFin: reserva.fechaHoraFin,
        estado: reserva.estado,
        motivoCancelacion: reserva.motivoCancelacion,
        fechaCancelacion: reserva.fechaCancelacion,
      })),
  )
}

function cancelLocalReserva(
  idReserva: number,
  usuario: Usuario | null,
): CancelarReservaResponse {
  const usuarioId = getUsuarioStorageId(usuario)
  const reservas = readLocalReservas()
  const reserva = reservas.find(
    (currentReserva) =>
      currentReserva.idReserva === idReserva && currentReserva.usuarioId === usuarioId,
  )

  if (!reserva) {
    throw new Error('No se encontro la reserva solicitada.')
  }

  if (reserva.estado === 'CANCELADA') {
    return {
      idReserva,
      mensaje: 'La reserva ya estaba cancelada.',
      cancelada: false,
    }
  }

  const actualizada: LocalReserva = {
    ...reserva,
    estado: 'CANCELADA',
    motivoCancelacion: 'Cancelada por el usuario.',
    fechaCancelacion: new Date().toISOString(),
  }

  writeLocalReservas(
    reservas.map((currentReserva) =>
      currentReserva.idReserva === idReserva ? actualizada : currentReserva,
    ),
  )

  return {
    idReserva,
    mensaje: 'Reserva cancelada en modo local.',
    cancelada: true,
  }
}

function getLocalDisponibilidad(fecha: string, facultadId: number): DisponibilidadSalaResponse[] {
  const salas = readLocalSalas().filter(
    (sala) => sala.facultadId === facultadId && sala.habilitada,
  )
  const reservas = readLocalReservas().filter(
    (reserva) => reserva.estado === 'ACTIVA' && sameDate(reserva.fechaHoraInicio, fecha),
  )

  return salas.map((sala) => ({
    idSala: sala.idSala,
    nombreSala: sala.nombre,
    horariosDisponibles: Array.from(
      { length: (DAY_END_MINUTES - DAY_START_MINUTES) / SLOT_DURATION_MINUTES },
      (_, index) => {
        const slotStart = DAY_START_MINUTES + index * SLOT_DURATION_MINUTES
        const slotEnd = slotStart + SLOT_DURATION_MINUTES

        const disponible = !reservas.some(
          (reserva) =>
            reserva.idSala === sala.idSala &&
            toMinutes(reserva.fechaHoraInicio) < slotEnd &&
            toMinutes(reserva.fechaHoraFin) > slotStart,
        )

        return {
          horaInicio: formatTime(slotStart),
          horaFin: formatTime(slotEnd),
          disponible,
        }
      },
    ),
  }))
}

export async function crearReserva(
  datos: CrearReservaRequest,
  usuario: Usuario | null,
): Promise<ReservaResponse> {
  let response: Response

  try {
    response = await fetch(RESERVAS_API_URL, {
      method: 'POST',
      headers: getHeaders(usuario),
      body: JSON.stringify(datos),
    })
  } catch {
    if (!LOCAL_FALLBACK_ENABLED) {
      throw new Error(getBackendUnavailableMessage())
    }

    return createLocalReserva(datos, usuario)
  }

  return handleResponse<ReservaResponse>(response, 'No se pudo crear la reserva.')
}

export async function cancelarReserva(
  idReserva: number,
  usuario: Usuario | null,
): Promise<CancelarReservaResponse> {
  let response: Response

  try {
    response = await fetch(`${RESERVAS_API_URL}/${idReserva}`, {
      method: 'DELETE',
      headers: getHeaders(usuario),
    })
  } catch {
    if (!LOCAL_FALLBACK_ENABLED) {
      throw new Error(getBackendUnavailableMessage())
    }

    return cancelLocalReserva(idReserva, usuario)
  }

  return handleResponse<CancelarReservaResponse>(response, 'No se pudo cancelar la reserva.')
}

export async function listarMisReservas(usuario: Usuario | null): Promise<ReservaResponse[]> {
  let response: Response

  try {
    response = await fetch(`${RESERVAS_API_URL}/mis-reservas`, {
      method: 'GET',
      headers: getHeaders(usuario),
    })
  } catch {
    if (!LOCAL_FALLBACK_ENABLED) {
      throw new Error(getBackendUnavailableMessage())
    }

    return listLocalReservas(usuario)
  }

  return handleResponse<ReservaResponse[]>(response, 'No se pudieron cargar las reservas.')
}

export async function consultarDisponibilidad(
  fecha: string,
  usuario: Usuario | null,
): Promise<DisponibilidadSalaResponse[]> {
  const url = `${RESERVAS_API_URL}/disponibilidad?fecha=${fecha}`
  let response: Response

  try {
    response = await fetch(url, {
      method: 'GET',
      headers: getHeaders(usuario),
    })
  } catch {
    if (!LOCAL_FALLBACK_ENABLED) {
      throw new Error(getBackendUnavailableMessage())
    }

    return getLocalDisponibilidad(fecha, getFacultadId(usuario))
  }

  return handleResponse<DisponibilidadSalaResponse[]>(
    response,
    'No se pudo consultar disponibilidad.',
  )
}
