import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../shared/context/AuthContext';
import {
  listarMisReservas,
  cancelarReserva,
  type ReservaResponse,
} from '../../infrastructure/http/reservaService';
import './MyReservationsPage.css';

export default function MyReservationsPage() {
  const navigate = useNavigate();
  const { usuario } = useAuth();
  const [reservas, setReservas] = useState<ReservaResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [cancelandoId, setCancelandoId] = useState<number | null>(null);

  
  useEffect(() => {
    if (!usuario) {
      navigate('/login');
      return;
    }
    cargarReservas();
  }, [usuario]);

  async function cargarReservas() {
    try {
      setLoading(true);
      const data = await listarMisReservas(usuario);
      setReservas(data);
    } catch (err: unknown) {
      const mensaje = err instanceof Error ? err.message : 'Error desconocido';
      setError(mensaje);
    } finally {
      setLoading(false);
    }
  }

  async function handleCancelar(idReserva: number) {
    if (!confirm('¿Estás seguro de cancelar esta reserva?')) return;
    setCancelandoId(idReserva);
    try {
      await cancelarReserva(idReserva, usuario);
      await cargarReservas();
    } catch (err: unknown) {
      const mensaje = err instanceof Error ? err.message : 'Error desconocido';
      alert('Error: ' + mensaje);
    } finally {
      setCancelandoId(null);
    }
  }

  const formatearFechaHora = (iso: string) => {
    const date = new Date(iso);
    return date.toLocaleString('es-CO', {
      dateStyle: 'medium',
      timeStyle: 'short',
    });
  };

  return (
    <div className="my-reservations-page">
      <div className="page-container">
        <h1>Mis Reservas</h1>
        <button className="btn-back" onClick={() => navigate(-1)}>← Volver</button>

        {loading && <p>Cargando reservas...</p>}
        {error && <div className="alert alert-error">{error}</div>}

        {!loading && reservas.length === 0 && (
          <p className="empty-message">No tienes reservas activas.</p>
        )}

        <div className="reservas-list">
          {reservas.map(reserva => (
            <div key={reserva.idReserva} className="reserva-card">
              <div className="reserva-info">
                <h3>{reserva.nombreSala}</h3>
                <p>
                  <strong>Inicio:</strong> {formatearFechaHora(reserva.fechaHoraInicio)}<br />
                  <strong>Fin:</strong> {formatearFechaHora(reserva.fechaHoraFin)}
                </p>
                <p>
                  <strong>Estado:</strong>{' '}
                  <span className={`estado-${reserva.estado.toLowerCase()}`}>
                    {reserva.estado}
                  </span>
                </p>
                {reserva.motivoCancelacion && (
                  <p><strong>Motivo cancelación:</strong> {reserva.motivoCancelacion}</p>
                )}
              </div>
              {reserva.estado === 'ACTIVA' && (
                <button
                  className="btn-cancel"
                  onClick={() => handleCancelar(reserva.idReserva)}
                  disabled={cancelandoId === reserva.idReserva}
                >
                  {cancelandoId === reserva.idReserva ? 'Cancelando...' : 'Cancelar Reserva'}
                </button>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}