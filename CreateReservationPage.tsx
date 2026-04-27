
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../shared/context/AuthContext';
import { listarSalas, type SalaResumen } from '../../infrastructure/http/roomService';
import {
  crearReserva,
  consultarDisponibilidad,
  type DisponibilidadSalaResponse,
} from '../../infrastructure/http/reservaService';
import './CreateReservationPage.css';

const FRANJA_INICIO = 7;  
const FRANJA_FIN = 21.5;  

export default function CreateReservationPage() {
  const navigate = useNavigate();
  const { usuario } = useAuth();
  const [salas, setSalas] = useState<SalaResumen[]>([]);
  const [selectedSalaId, setSelectedSalaId] = useState<number | null>(null);
  const [fecha, setFecha] = useState<string>('');
  const [horaInicio, setHoraInicio] = useState<string>('');
  const [horaFin, setHoraFin] = useState<string>('');
  const [disponibilidad, setDisponibilidad] = useState<DisponibilidadSalaResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const [exito, setExito] = useState<string>('');

  
  useEffect(() => {
    if (!usuario) {
      navigate('/login');
      return;
    }
    cargarSalas();
  }, [usuario]);

  async function cargarSalas() {
    try {
      const data = await listarSalas(usuario);
      setSalas(data.filter(s => s.habilitada));
    } catch (err: unknown) {
      const mensaje = err instanceof Error ? err.message : 'Error desconocido';
      setError(mensaje);
    }
  }

  
  useEffect(() => {
    if (selectedSalaId && fecha) {
      verificarDisponibilidad();
    } else {
      setDisponibilidad(null);
    }
  }, [selectedSalaId, fecha]);

  async function verificarDisponibilidad() {
    if (!selectedSalaId || !fecha) return;
    try {
      const disp = await consultarDisponibilidad(
        fecha,
        usuario!.idFacultad!,
        usuario!.correo
      );
      const salaDisp = disp.find(s => s.idSala === selectedSalaId);
      setDisponibilidad(salaDisp || null);
    } catch (err: unknown) {
      const mensaje = err instanceof Error ? err.message : 'Error desconocido';
      setError(mensaje);
    }
  }

  const horaInicioFloat = horaInicio ? parseFloat(horaInicio.replace(':', '.')) : 0;
  const horaFinFloat = horaFin ? parseFloat(horaFin.replace(':', '.')) : 0;

  const isValidHorario = (): boolean => {
    if (!horaInicio || !horaFin) return false;
    const inicio = horaInicioFloat;
    const fin = horaFinFloat;
    if (inicio >= fin) return false;
    if (inicio < FRANJA_INICIO || fin > FRANJA_FIN) return false;
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setExito('');
    if (!selectedSalaId || !fecha || !isValidHorario()) {
      setError('Por favor complete todos los campos correctamente.');
      return;
    }

    const fechaHoraInicio = `${fecha}T${horaInicio}:00`;
    const fechaHoraFin = `${fecha}T${horaFin}:00`;

    setLoading(true);
    try {
      await crearReserva(
        {
          idSala: selectedSalaId,
          fechaHoraInicio,
          fechaHoraFin,
        },
        usuario
      );
      setExito('¡Reserva creada exitosamente!');
      setSelectedSalaId(null);
      setFecha('');
      setHoraInicio('');
      setHoraFin('');
      setDisponibilidad(null);
    } catch (err: unknown) {
      const mensaje = err instanceof Error ? err.message : 'Error desconocido';
      setError(mensaje);
    } finally {
      setLoading(false);
    }
  };

  const salaSeleccionada = salas.find(s => s.idSala === selectedSalaId);

  return (
    <div className="create-reservation-page">
      <div className="page-container">
        <h1>Crear Nueva Reserva</h1>
        <p className="subtitle">Selecciona sala, fecha y horario (7:00 AM - 9:30 PM)</p>

        {error && <div className="alert alert-error">{error}</div>}
        {exito && <div className="alert alert-success">{exito}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Sala</label>
            <select
              value={selectedSalaId || ''}
              onChange={(e) => setSelectedSalaId(Number(e.target.value))}
              required
            >
              <option value="">-- Selecciona una sala --</option>
              {salas.map(sala => (
                <option key={sala.idSala} value={sala.idSala}>
                  {sala.nombre} ({sala.ubicacion}) - Capacidad: {sala.capacidad}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label>Fecha</label>
            <input
              type="date"
              value={fecha}
              onChange={(e) => setFecha(e.target.value)}
              min={new Date().toISOString().split('T')[0]}
              required
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Hora inicio</label>
              <input
                type="time"
                value={horaInicio}
                onChange={(e) => setHoraInicio(e.target.value)}
                min="07:00"
                max="21:30"
                step="1800"
                required
              />
            </div>
            <div className="form-group">
              <label>Hora fin</label>
              <input
                type="time"
                value={horaFin}
                onChange={(e) => setHoraFin(e.target.value)}
                min="07:00"
                max="21:30"
                step="1800"
                required
              />
            </div>
          </div>

          {disponibilidad && horaInicio && horaFin && isValidHorario() && (
            <div className="disponibilidad-info">
              <h3>Disponibilidad de la sala</h3>
              <div className="horarios-lista">
                {disponibilidad.horariosDisponibles.map((h, idx) => (
                  <div
                    key={idx}
                    className={`horario-slot ${h.disponible ? 'disponible' : 'ocupado'}`}
                  >
                    {h.horaInicio} - {h.horaFin} {h.disponible ? '✓' : '✗'}
                  </div>
                ))}
              </div>
              <p className="nota">* Los horarios mostrados son bloques de 30 minutos.</p>
            </div>
          )}

          <div className="resumen">
            <p><strong>Sala seleccionada:</strong> {salaSeleccionada?.nombre || 'Ninguna'}</p>
            <p><strong>Fecha:</strong> {fecha || 'No seleccionada'}</p>
            <p><strong>Horario:</strong> {horaInicio} - {horaFin}</p>
          </div>

          <div className="form-actions">
            <button type="submit" disabled={loading}>
              {loading ? 'Creando...' : 'Crear Reserva'}
            </button>
            <button type="button" onClick={() => navigate(-1)}>Cancelar</button>
          </div>
        </form>
      </div>
    </div>
  );
}