import { useEffect, useMemo, useState } from 'react'
import {
  listarMisReservas,
  cancelarReserva,
  type ReservaResponse,
} from '../../infrastructure/http/reservaService'
import DashboardShell from '../components/DashboardShell'
import { useAuth } from '../../shared/context/AuthContext'
import './MyReservationsPage.css'

export default function MyReservationsPage() {
  const { usuario } = useAuth()
  const [reservas, setReservas] = useState<ReservaResponse[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [cancelandoId, setCancelandoId] = useState<number | null>(null)

  useEffect(() => {
    if (!usuario) {
      return
    }

    void cargarReservas()
  }, [usuario])

  async function cargarReservas() {
    try {
      setLoading(true)
      setError('')
      const data = await listarMisReservas(usuario)
      setReservas(data)
    } catch (err: unknown) {
      const mensaje = err instanceof Error ? err.message : 'Error desconocido'
      setError(mensaje)
      setReservas([])
    } finally {
      setLoading(false)
    }
  }

  async function handleCancelar(idReserva: number) {
    if (!confirm('Estas segura de cancelar esta reserva?')) {
      return
    }

    setCancelandoId(idReserva)

    try {
      await cancelarReserva(idReserva, usuario)
      await cargarReservas()
    } catch (err: unknown) {
      const mensaje = err instanceof Error ? err.message : 'Error desconocido'
      setError(mensaje)
    } finally {
      setCancelandoId(null)
    }
  }

  const formatearFechaHora = (iso: string) => {
    const date = new Date(iso)
    return date.toLocaleString('es-CO', {
      dateStyle: 'medium',
      timeStyle: 'short',
    })
  }

  const reservasActivas = useMemo(
    () => reservas.filter((reserva) => reserva.estado === 'ACTIVA').length,
    [reservas],
  )

  const headerAside = (
    <div className="my-reservations__metrics">
      <article className="my-reservations__metric-card">
        <span>Total</span>
        <strong>{reservas.length}</strong>
        <p>Reservas historicas visibles en tu sesion actual.</p>
      </article>
      <article className="my-reservations__metric-card">
        <span>Activas</span>
        <strong>{reservasActivas}</strong>
        <p>Puedes cancelarlas si aun no han terminado.</p>
      </article>
    </div>
  )

  return (
    <DashboardShell
      activeKey="my-reservations"
      title="Mis reservas"
      subtitle="Consulta el estado de tus reservas y cancela las que ya no necesites."
      headerAside={headerAside}
    >
      <section className="my-reservations">
        {error ? <div className="my-reservations__alert">{error}</div> : null}

        <article className="my-reservations__toolbar">
          <div>
            <h3>Listado personal</h3>
            <p>Las reservas activas aparecen primero para que puedas gestionarlas rapido.</p>
          </div>
          <button type="button" onClick={() => void cargarReservas()}>
            Actualizar
          </button>
        </article>

        {loading ? (
          <article className="my-reservations__empty-card">
            <p>Cargando reservas...</p>
          </article>
        ) : reservas.length ? (
          <div className="my-reservations__list">
            {reservas.map((reserva) => (
              <article key={reserva.idReserva} className="my-reservations__card">
                <div className="my-reservations__card-head">
                  <div>
                    <h4>{reserva.nombreSala}</h4>
                    <p>Reserva #{reserva.idReserva}</p>
                  </div>
                  <span
                    className={`my-reservations__status ${
                      reserva.estado === 'ACTIVA' ? 'is-active' : 'is-cancelled'
                    }`}
                  >
                    {reserva.estado}
                  </span>
                </div>

                <div className="my-reservations__details">
                  <p>
                    <strong>Inicio:</strong> {formatearFechaHora(reserva.fechaHoraInicio)}
                  </p>
                  <p>
                    <strong>Fin:</strong> {formatearFechaHora(reserva.fechaHoraFin)}
                  </p>
                  {reserva.motivoCancelacion ? (
                    <p>
                      <strong>Motivo de cancelacion:</strong> {reserva.motivoCancelacion}
                    </p>
                  ) : null}
                </div>

                {reserva.estado === 'ACTIVA' ? (
                  <button
                    type="button"
                    className="my-reservations__cancel"
                    onClick={() => handleCancelar(reserva.idReserva)}
                    disabled={cancelandoId === reserva.idReserva}
                  >
                    {cancelandoId === reserva.idReserva
                      ? 'Cancelando...'
                      : 'Cancelar reserva'}
                  </button>
                ) : null}
              </article>
            ))}
          </div>
        ) : (
          <article className="my-reservations__empty-card">
            <p>No tienes reservas activas en este momento.</p>
          </article>
        )}
      </section>
    </DashboardShell>
  )
}
