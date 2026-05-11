import { useEffect, useMemo, useState } from 'react'
import type { FormEvent } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useAuth } from '../../shared/context/AuthContext'
import { obtenerRutaDashboard } from '../../shared/auth/roles'
import { listarSalas, type SalaResumen } from '../../infrastructure/http/roomService'
import {
  crearReserva,
  consultarDisponibilidad,
  type DisponibilidadSalaResponse,
} from '../../infrastructure/http/reservaService'
import DashboardShell from '../components/DashboardShell'
import './CreateReservationPage.css'

const DAY_START_MINUTES = 7 * 60
const DAY_END_MINUTES = 21 * 60 + 30

function getTodayValue() {
  const now = new Date()
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const day = String(now.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function parseTimeToMinutes(value: string) {
  const [hours, minutes] = value.split(':').map(Number)

  if (!Number.isFinite(hours) || !Number.isFinite(minutes)) {
    return Number.NaN
  }

  return hours * 60 + minutes
}

function isThirtyMinuteInterval(value: string) {
  if (!value) {
    return false
  }

  return parseTimeToMinutes(value) % 30 === 0
}

function formatMinutes(totalMinutes: number) {
  const hours = Math.floor(totalMinutes / 60)
  const minutes = totalMinutes % 60
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`
}

function buildTimeOptions(startMinutes: number, endMinutes: number) {
  const options: string[] = []

  for (let minutes = startMinutes; minutes <= endMinutes; minutes += 30) {
    options.push(formatMinutes(minutes))
  }

  return options
}

function parseSalaId(value: string | null) {
  if (!value) {
    return null
  }

  const parsed = Number(value)
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null
}

export default function CreateReservationPage() {
  const navigate = useNavigate()
  const { usuario } = useAuth()
  const [searchParams] = useSearchParams()
  const today = useMemo(() => getTodayValue(), [])

  const [salas, setSalas] = useState<SalaResumen[]>([])
  const [selectedSalaId, setSelectedSalaId] = useState<number | null>(() =>
    parseSalaId(searchParams.get('sala')),
  )
  const [fecha, setFecha] = useState<string>(searchParams.get('fecha') ?? today)
  const [horaInicio, setHoraInicio] = useState<string>('')
  const [horaFin, setHoraFin] = useState<string>('')
  const [disponibilidad, setDisponibilidad] = useState<DisponibilidadSalaResponse | null>(null)
  const [loading, setLoading] = useState(false)
  const [pageLoading, setPageLoading] = useState(true)
  const [error, setError] = useState<string>('')
  const [exito, setExito] = useState<string>('')
  const startTimeOptions = useMemo(
    () => buildTimeOptions(DAY_START_MINUTES, DAY_END_MINUTES - 30),
    [],
  )
  const endTimeOptions = useMemo(
    () => buildTimeOptions(DAY_START_MINUTES + 30, DAY_END_MINUTES),
    [],
  )
  const filteredEndTimeOptions = endTimeOptions.filter(
    (option) => !horaInicio || parseTimeToMinutes(option) > parseTimeToMinutes(horaInicio),
  )

  useEffect(() => {
    if (!usuario) {
      navigate('/login')
      return
    }

    void cargarSalas()
  }, [navigate, usuario])

  useEffect(() => {
    if (!selectedSalaId || !fecha) {
      setDisponibilidad(null)
      return
    }

    void verificarDisponibilidad(selectedSalaId, fecha)
  }, [fecha, selectedSalaId])

  async function cargarSalas() {
    try {
      setPageLoading(true)
      const data = await listarSalas(usuario)
      const habilitadas = data.filter((sala) => sala.habilitada)
      setSalas(habilitadas)

      setSelectedSalaId((current) => {
        if (current && habilitadas.some((sala) => sala.idSala === current)) {
          return current
        }

        return habilitadas[0]?.idSala ?? null
      })
    } catch (err: unknown) {
      const mensaje = err instanceof Error ? err.message : 'Error desconocido'
      setError(mensaje)
    } finally {
      setPageLoading(false)
    }
  }

  async function verificarDisponibilidad(idSala: number, fechaSeleccionada: string) {
    try {
      const disponibilidadSalas = await consultarDisponibilidad(fechaSeleccionada, usuario)
      const salaDisponibilidad =
        disponibilidadSalas.find((sala) => sala.idSala === idSala) ?? null
      setDisponibilidad(salaDisponibilidad)
    } catch (err: unknown) {
      const mensaje = err instanceof Error ? err.message : 'Error desconocido'
      setError(mensaje)
    }
  }

  function isValidHorario() {
    if (!horaInicio || !horaFin) {
      return false
    }

    if (!isThirtyMinuteInterval(horaInicio) || !isThirtyMinuteInterval(horaFin)) {
      return false
    }

    const inicio = parseTimeToMinutes(horaInicio)
    const fin = parseTimeToMinutes(horaFin)

    if (inicio >= fin) {
      return false
    }

    if (inicio < DAY_START_MINUTES || fin > DAY_END_MINUTES) {
      return false
    }

    return true
  }

  const salaSeleccionada = salas.find((sala) => sala.idSala === selectedSalaId) ?? null

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError('')
    setExito('')

    if (!selectedSalaId || !fecha || !isValidHorario()) {
      setError(
        'Completa todos los campos con bloques de 30 minutos entre 07:00 y 21:30.',
      )
      return
    }

    const fechaHoraInicio = `${fecha}T${horaInicio}:00`
    const fechaHoraFin = `${fecha}T${horaFin}:00`

    setLoading(true)

    try {
      await crearReserva(
        {
          idSala: selectedSalaId,
          fechaHoraInicio,
          fechaHoraFin,
        },
        usuario,
      )

      setExito('Reserva creada exitosamente.')
      setHoraInicio('')
      setHoraFin('')
      await verificarDisponibilidad(selectedSalaId, fecha)
    } catch (err: unknown) {
      const mensaje = err instanceof Error ? err.message : 'Error desconocido'
      setError(mensaje)
    } finally {
      setLoading(false)
    }
  }

  const headerAside = (
    <div className="reservation-page__header-notes">
      <article className="reservation-page__note-card">
        <span>Intervalo obligatorio</span>
        <strong>30 minutos</strong>
        <p>El horario ahora se selecciona desde una lista cerrada con bloques fijos.</p>
      </article>
      <article className="reservation-page__note-card">
        <span>Sala activa</span>
        <strong>{salaSeleccionada?.nombre ?? 'Sin seleccion'}</strong>
        <p>{salaSeleccionada?.ubicacion ?? 'Selecciona una sala habilitada para continuar.'}</p>
      </article>
    </div>
  )

  return (
    <DashboardShell
      activeKey="create-reservation"
      title="Reservar una sala"
      subtitle="Selecciona fecha, sala y franja horaria con bloques fijos de 30 minutos."
      headerAside={headerAside}
    >
      <section className="reservation-page">
        {(error || exito) && (
          <div className={`reservation-page__alert ${error ? 'is-error' : 'is-success'}`}>
            {error || exito}
          </div>
        )}

        <div className="reservation-page__grid">
          <article className="reservation-page__card">
            <div className="reservation-page__section-head">
              <div>
                <h3>Datos de la reserva</h3>
                <p>Escoge horas exactas o medias horas desde un selector fijo.</p>
              </div>
              {pageLoading ? <span className="reservation-page__badge">Cargando...</span> : null}
            </div>

            <form className="reservation-page__form" onSubmit={handleSubmit}>
              <label className="reservation-page__field">
                <span>Sala</span>
                <select
                  value={selectedSalaId ?? ''}
                  onChange={(event) => setSelectedSalaId(parseSalaId(event.target.value))}
                  required
                >
                  {salas.length ? null : <option value="">No hay salas habilitadas</option>}
                  {salas.map((sala) => (
                    <option key={sala.idSala} value={sala.idSala}>
                      {sala.nombre} ({sala.ubicacion}) - Capacidad {sala.capacidad}
                    </option>
                  ))}
                </select>
              </label>

              <label className="reservation-page__field">
                <span>Fecha</span>
                <input
                  type="date"
                  value={fecha}
                  onChange={(event) => setFecha(event.target.value)}
                  min={today}
                  required
                />
              </label>

              <div className="reservation-page__time-grid">
                <label className="reservation-page__field">
                  <span>Hora inicio</span>
                  <select
                    value={horaInicio}
                    onChange={(event) => {
                      const nextValue = event.target.value
                      setHoraInicio(nextValue)

                      if (
                        horaFin &&
                        parseTimeToMinutes(horaFin) <= parseTimeToMinutes(nextValue)
                      ) {
                        setHoraFin('')
                      }
                    }}
                    required
                  >
                    <option value="">Selecciona una hora</option>
                    {startTimeOptions.map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                  <small className="reservation-page__field-help">
                    Solo bloques de 30 minutos desde las 07:00.
                  </small>
                </label>

                <label className="reservation-page__field">
                  <span>Hora fin</span>
                  <select
                    value={horaFin}
                    onChange={(event) => setHoraFin(event.target.value)}
                    required
                  >
                    <option value="">Selecciona una hora</option>
                    {filteredEndTimeOptions.map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                  <small className="reservation-page__field-help">
                    La hora final siempre debe quedar despues del inicio.
                  </small>
                </label>
              </div>

              <div className="reservation-page__summary">
                <p>
                  <strong>Sala:</strong> {salaSeleccionada?.nombre ?? 'Sin seleccionar'}
                </p>
                <p>
                  <strong>Fecha:</strong> {fecha || 'Sin seleccionar'}
                </p>
                <p>
                  <strong>Horario:</strong>{' '}
                  {horaInicio && horaFin ? `${horaInicio} - ${horaFin}` : 'Sin definir'}
                </p>
              </div>

              <div className="reservation-page__actions">
                <button type="submit" disabled={loading || !salas.length}>
                  {loading ? 'Creando...' : 'Crear reserva'}
                </button>
                <button
                  type="button"
                  className="secondary"
                  onClick={() => navigate(obtenerRutaDashboard(usuario))}
                >
                  Volver
                </button>
              </div>
            </form>
          </article>

          <article className="reservation-page__card">
            <div className="reservation-page__section-head">
              <div>
                <h3>Disponibilidad</h3>
                <p>Consulta los bloques libres para la sala y fecha seleccionadas.</p>
              </div>
              <span className="reservation-page__badge">
                {disponibilidad?.horariosDisponibles.length ?? 0} bloques
              </span>
            </div>

            {disponibilidad ? (
              <div className="reservation-page__availability">
                <div className="reservation-page__slots">
                  {disponibilidad.horariosDisponibles.map((horario, index) => (
                    <div
                      key={`${horario.horaInicio}-${horario.horaFin}-${index}`}
                      className={`reservation-page__slot ${
                        horario.disponible ? 'is-available' : 'is-busy'
                      }`}
                    >
                      <strong>
                        {horario.horaInicio} - {horario.horaFin}
                      </strong>
                      <span>{horario.disponible ? 'Disponible' : 'Ocupado'}</span>
                    </div>
                  ))}
                </div>

                <p className="reservation-page__note">
                  Los horarios se renderizan en bloques de 30 minutos para que la consulta y la
                  reserva usen exactamente la misma granularidad.
                </p>
              </div>
            ) : (
              <p className="reservation-page__empty">
                Selecciona una sala y una fecha para consultar disponibilidad.
              </p>
            )}
          </article>
        </div>
      </section>
    </DashboardShell>
  )
}
