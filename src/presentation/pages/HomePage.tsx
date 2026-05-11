import { useEffect, useMemo, useState } from 'react'
import type { FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  actualizarEstadoSala,
  actualizarSala,
  agregarRecursoSala,
  listarCatalogoRecursos,
  listarSalas,
  retirarRecursoSala,
  obtenerSalaDetalle,
  type RecursoCatalogo,
  type SalaDetalle,
  type SalaResumen,
} from '../../infrastructure/http/roomService'
import {
  consultarDisponibilidad,
  type DisponibilidadSalaResponse,
} from '../../infrastructure/http/reservaService'
import DashboardShell from '../components/DashboardShell'
import { useAuth } from '../../shared/context/AuthContext'
import { esSecretaria } from '../../shared/auth/roles'
import './home-page.css'

const emptyEditForm = {
  nombre: '',
  ubicacion: '',
  capacidad: 2,
}

const emptyResourceForm = {
  codigoRecurso: '',
  nombreRecurso: '',
  cantidad: 1,
}

const emptyEditErrors = {
  nombre: '',
  ubicacion: '',
  capacidad: '',
}

const emptyResourceErrors = {
  recurso: '',
  cantidad: '',
}

type AlertState = {
  tipo: '' | 'error' | 'exito' | 'info'
  mensaje: string
}

function validarNombre(nombre: string) {
  const value = nombre.trim()

  if (!value) {
    return 'El nombre de la sala es obligatorio.'
  }

  if (value.length < 3) {
    return 'Minimo 3 caracteres.'
  }

  return ''
}

function validarUbicacion(ubicacion: string) {
  return ubicacion.trim() ? '' : 'La ubicacion es obligatoria.'
}

function validarCapacidad(capacidad: number) {
  if (!Number.isFinite(capacidad)) {
    return 'La capacidad debe ser numerica.'
  }

  if (capacidad < 2 || capacidad > 100) {
    return 'La capacidad debe estar entre 2 y 100.'
  }

  return ''
}

function validarRecursoSeleccionado(codigoRecurso: string) {
  return codigoRecurso.trim() ? '' : 'Selecciona un recurso disponible.'
}

function validarCantidad(cantidad: number) {
  if (!Number.isFinite(cantidad)) {
    return 'La cantidad debe ser numerica.'
  }

  if (cantidad < 1) {
    return 'La cantidad minima debe ser 1.'
  }

  return ''
}

function getTodayValue() {
  const now = new Date()
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const day = String(now.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function formatDateLabel(value: string) {
  if (!value) {
    return 'sin fecha'
  }

  return new Date(`${value}T00:00:00`).toLocaleDateString('es-CO', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  })
}

function HomePage() {
  const navigate = useNavigate()
  const { usuario } = useAuth()
  const secretaria = esSecretaria(usuario)
  const today = useMemo(() => getTodayValue(), [])

  const [salas, setSalas] = useState<SalaResumen[]>([])
  const [selectedSalaId, setSelectedSalaId] = useState<number | null>(null)
  const [selectedSala, setSelectedSala] = useState<SalaDetalle | null>(null)
  const [catalogoRecursos, setCatalogoRecursos] = useState<RecursoCatalogo[]>([])
  const [disponibilidadDocente, setDisponibilidadDocente] = useState<
    DisponibilidadSalaResponse[]
  >([])
  const [selectedSalaDocenteId, setSelectedSalaDocenteId] = useState<number | null>(null)
  const [fechaConsulta, setFechaConsulta] = useState(today)
  const [editForm, setEditForm] = useState(emptyEditForm)
  const [resourceForm, setResourceForm] = useState(emptyResourceForm)
  const [editErrors, setEditErrors] = useState(emptyEditErrors)
  const [resourceErrors, setResourceErrors] = useState(emptyResourceErrors)
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [detailLoading, setDetailLoading] = useState(false)
  const [catalogoLoading, setCatalogoLoading] = useState(false)
  const [availabilityLoading, setAvailabilityLoading] = useState(false)
  const [savingEdit, setSavingEdit] = useState(false)
  const [savingStatus, setSavingStatus] = useState(false)
  const [savingResource, setSavingResource] = useState(false)
  const [alerta, setAlerta] = useState<AlertState>({
    tipo: 'info',
    mensaje: 'Cargando informacion de salas...',
  })

  const salasFiltradas = salas.filter((sala) => {
    if (!secretaria) {
      return selectedSalaDocenteId === null || sala.idSala === selectedSalaDocenteId
    }

    const term = search.trim().toLowerCase()

    if (!term) {
      return true
    }

    return (
      sala.nombre.toLowerCase().includes(term) ||
      sala.ubicacion.toLowerCase().includes(term)
    )
  })

  const recursoSeleccionado =
    catalogoRecursos.find(
      (recurso) => recurso.codigoRecurso === resourceForm.codigoRecurso,
    ) ?? null

  const salaDocenteSeleccionada =
    salas.find((sala) => sala.idSala === selectedSalaDocenteId) ?? null

  useEffect(() => {
    if (!usuario) {
      navigate('/login')
      return
    }

    void cargarSalas()

    if (secretaria) {
      void cargarCatalogoRecursos()
    }
  }, [navigate, secretaria, usuario])

  useEffect(() => {
    if (!secretaria) {
      setSelectedSala(null)
      return
    }

    if (selectedSalaId === null) {
      setSelectedSala(null)
      return
    }

    void cargarDetalle(selectedSalaId)
  }, [secretaria, selectedSalaId])

  useEffect(() => {
    if (secretaria || !fechaConsulta) {
      return
    }

    void cargarDisponibilidadDocente(fechaConsulta)
  }, [fechaConsulta, secretaria])

  async function cargarSalas() {
    try {
      setLoading(true)
      const data = await listarSalas(usuario)
      const salasVisibles = secretaria ? data : data.filter((sala) => sala.habilitada)
      setSalas(salasVisibles)

      if (secretaria) {
        setSelectedSalaId((current) => {
          if (!data.length) {
            return null
          }

          if (current !== null && data.some((sala) => sala.idSala === current)) {
            return current
          }

          return data[0].idSala
        })
      } else {
        setSelectedSalaDocenteId((current) => {
          if (current !== null && salasVisibles.some((sala) => sala.idSala === current)) {
            return current
          }

          return salasVisibles[0]?.idSala ?? null
        })
      }

      setAlerta({
        tipo: 'info',
        mensaje: data.length
          ? `${data.length} salas cargadas correctamente.`
          : 'No hay salas registradas para la facultad actual.',
      })
    } catch (error) {
      setAlerta({
        tipo: 'error',
        mensaje:
          error instanceof Error ? error.message : 'No se pudieron cargar las salas.',
      })
    } finally {
      setLoading(false)
    }
  }

  async function cargarDetalle(idSala: number) {
    try {
      setDetailLoading(true)
      const data = await obtenerSalaDetalle(idSala, usuario)
      setSelectedSala(data)
      setEditForm({
        nombre: data.nombre,
        ubicacion: data.ubicacion,
        capacidad: data.capacidad,
      })
      setEditErrors(emptyEditErrors)
    } catch (error) {
      setAlerta({
        tipo: 'error',
        mensaje:
          error instanceof Error
            ? error.message
            : 'No fue posible consultar el detalle de la sala.',
      })
    } finally {
      setDetailLoading(false)
    }
  }

  async function cargarCatalogoRecursos() {
    try {
      setCatalogoLoading(true)
      const recursos = await listarCatalogoRecursos(usuario)
      setCatalogoRecursos(recursos)
    } catch (error) {
      setAlerta({
        tipo: 'error',
        mensaje:
          error instanceof Error
            ? error.message
            : 'No fue posible cargar el catalogo de recursos.',
      })
    } finally {
      setCatalogoLoading(false)
    }
  }

  async function cargarDisponibilidadDocente(fecha: string) {
    try {
      setAvailabilityLoading(true)
      const disponibilidad = await consultarDisponibilidad(fecha, usuario)
      setDisponibilidadDocente(disponibilidad)
    } catch (error) {
      setAlerta({
        tipo: 'error',
        mensaje:
          error instanceof Error
            ? error.message
            : 'No se pudo consultar la disponibilidad de salas.',
      })
    } finally {
      setAvailabilityLoading(false)
    }
  }

  function validarEdicion() {
    const errores = {
      nombre: validarNombre(editForm.nombre),
      ubicacion: validarUbicacion(editForm.ubicacion),
      capacidad: validarCapacidad(editForm.capacidad),
    }

    setEditErrors(errores)
    return !Object.values(errores).some(Boolean)
  }

  function validarRecurso() {
    const errores = {
      recurso: validarRecursoSeleccionado(resourceForm.codigoRecurso),
      cantidad: validarCantidad(resourceForm.cantidad),
    }

    setResourceErrors(errores)
    return !Object.values(errores).some(Boolean)
  }

  async function handleEditSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (!selectedSala || !validarEdicion()) {
      return
    }

    try {
      setSavingEdit(true)
      const data = await actualizarSala(
        selectedSala.idSala,
        {
          nombre: editForm.nombre.trim(),
          ubicacion: editForm.ubicacion.trim(),
          capacidad: editForm.capacidad,
        },
        usuario,
      )

      setSelectedSala(data)
      setSalas((current) =>
        current.map((sala) =>
          sala.idSala === data.idSala
            ? {
                idSala: data.idSala,
                nombre: data.nombre,
                ubicacion: data.ubicacion,
                capacidad: data.capacidad,
                habilitada: data.habilitada,
              }
            : sala,
        ),
      )
      setAlerta({
        tipo: 'exito',
        mensaje: 'La sala fue actualizada correctamente.',
      })
    } catch (error) {
      setAlerta({
        tipo: 'error',
        mensaje:
          error instanceof Error ? error.message : 'No fue posible actualizar la sala.',
      })
    } finally {
      setSavingEdit(false)
    }
  }

  async function handleRetirarRecurso(idRecursoSala: number) {
    if (!selectedSala) {
      return
    }

    if (!confirm('Seguro que deseas retirar este recurso?')) {
      return
    }

    try {
      await retirarRecursoSala(selectedSala.idSala, idRecursoSala, usuario)
      await cargarDetalle(selectedSala.idSala)
      setAlerta({ tipo: 'exito', mensaje: 'Recurso retirado correctamente.' })
    } catch (error) {
      setAlerta({
        tipo: 'error',
        mensaje: error instanceof Error ? error.message : 'Error desconocido.',
      })
    }
  }

  async function handleToggleStatus() {
    if (!selectedSala) {
      return
    }

    try {
      setSavingStatus(true)
      const response = await actualizarEstadoSala(
        selectedSala.idSala,
        !selectedSala.habilitada,
        usuario,
      )

      await cargarSalas()
      await cargarDetalle(selectedSala.idSala)

      const detalleReserva =
        response.reservaCanceladaId !== null
          ? ` Reserva activa cancelada: #${response.reservaCanceladaId}.`
          : ''

      setAlerta({
        tipo: 'exito',
        mensaje: `${response.mensaje}.${detalleReserva}`.replace('..', '.'),
      })
    } catch (error) {
      setAlerta({
        tipo: 'error',
        mensaje:
          error instanceof Error
            ? error.message
            : 'No fue posible cambiar el estado de la sala.',
      })
    } finally {
      setSavingStatus(false)
    }
  }

  async function handleResourceSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (!selectedSala || !validarRecurso()) {
      return
    }

    try {
      setSavingResource(true)
      const data = await agregarRecursoSala(
        selectedSala.idSala,
        {
          codigoRecurso: resourceForm.codigoRecurso.trim(),
          nombreRecurso: resourceForm.nombreRecurso.trim(),
          cantidad: resourceForm.cantidad,
        },
        usuario,
      )

      setResourceForm(emptyResourceForm)
      setResourceErrors(emptyResourceErrors)
      await cargarDetalle(selectedSala.idSala)
      setAlerta({
        tipo: 'exito',
        mensaje: data.mensaje,
      })
    } catch (error) {
      setAlerta({
        tipo: 'error',
        mensaje:
          error instanceof Error
            ? error.message
            : 'No fue posible agregar el recurso tecnologico.',
      })
    } finally {
      setSavingResource(false)
    }
  }

  function handleResourceSelection(codigoRecurso: string) {
    const recurso = catalogoRecursos.find(
      (item) => item.codigoRecurso === codigoRecurso,
    )

    setResourceForm((current) => ({
      ...current,
      codigoRecurso: recurso?.codigoRecurso ?? '',
      nombreRecurso: recurso?.nombreRecurso ?? '',
    }))

    if (resourceErrors.recurso) {
      setResourceErrors((current) => ({
        ...current,
        recurso: '',
      }))
    }
  }

  const totalSalasDisponiblesDocente = disponibilidadDocente.filter((sala) =>
    sala.horariosDisponibles.some((horario) => horario.disponible),
  ).length

  const totalBloquesLibresDocente = disponibilidadDocente.reduce(
    (total, sala) =>
      total + sala.horariosDisponibles.filter((horario) => horario.disponible).length,
    0,
  )

  const headerAside = secretaria ? (
    <div className="dashboard-metrics">
      <article className="dashboard-metric-card">
        <span>Salas</span>
        <strong>{salas.length}</strong>
        <p>Inventario total de espacios registrados.</p>
      </article>
      <article className="dashboard-metric-card">
        <span>Habilitadas</span>
        <strong>{salas.filter((sala) => sala.habilitada).length}</strong>
        <p>Salas aptas para reserva o asignacion.</p>
      </article>
      <article className="dashboard-metric-card">
        <span>Catalogo</span>
        <strong>{catalogoRecursos.length}</strong>
        <p>{catalogoLoading ? 'Sincronizando recursos...' : 'Recursos disponibles para asignar.'}</p>
      </article>
    </div>
  ) : (
    <div className="dashboard-metrics">
      <article className="dashboard-metric-card">
        <span>Salas habilitadas</span>
        <strong>{salas.length}</strong>
        <p>Solo se muestran salas reservables.</p>
      </article>
      <article className="dashboard-metric-card">
        <span>Con disponibilidad</span>
        <strong>{totalSalasDisponiblesDocente}</strong>
        <p>{availabilityLoading ? 'Consultando...' : `Fecha ${formatDateLabel(fechaConsulta)}.`}</p>
      </article>
      <article className="dashboard-metric-card">
        <span>Bloques libres</span>
        <strong>{totalBloquesLibresDocente}</strong>
        <p>Fracciones de 30 minutos listas para reservar.</p>
      </article>
    </div>
  )

  const teacherView = (
    <>
      {alerta.mensaje ? (
        <div className={`dashboard-alert dashboard-alert-${alerta.tipo || 'info'}`}>
          {alerta.mensaje}
        </div>
      ) : null}

      <section className="teacher-actions">
        <article className="teacher-action-card">
          <span>Consultar</span>
          <h3>Disponibilidad de salas</h3>
          <p>Elige una fecha, revisa los bloques libres y confirma si la sala esta activa.</p>
        </article>
        <button
          type="button"
          className="teacher-cta"
          onClick={() => navigate('/crear-reserva')}
        >
          Reservar una sala
        </button>
      </section>

      <section className="dashboard-card availability-panel">
        <div className="card-head">
          <div>
            <h2>Consulta por fecha</h2>
            <p>Vista filtrada de las salas habilitadas de tu facultad.</p>
          </div>
          <button type="button" className="action-button ghost" onClick={() => void cargarSalas()}>
            Actualizar listado
          </button>
        </div>

        <div className="availability-toolbar">
          <label className="dashboard-field">
            <span>Fecha de consulta</span>
            <input
              type="date"
              value={fechaConsulta}
              min={today}
              onChange={(event) => setFechaConsulta(event.target.value)}
            />
          </label>

          <label className="dashboard-field">
            <span>Sala a consultar</span>
            <select
              value={selectedSalaDocenteId ?? ''}
              onChange={(event) =>
                setSelectedSalaDocenteId(
                  event.target.value ? Number(event.target.value) : null,
                )
              }
            >
              <option value="">Todas las salas habilitadas</option>
              {salas.map((sala) => (
                <option key={sala.idSala} value={sala.idSala}>
                  {sala.nombre} - {sala.ubicacion}
                </option>
              ))}
            </select>
          </label>
        </div>
      </section>

      {salaDocenteSeleccionada ? (
        <p className="teacher-selection-copy">
          Mostrando disponibilidad de {salaDocenteSeleccionada.nombre}.
        </p>
      ) : null}

      <section className="teacher-room-grid">
        {loading ? (
          <article className="dashboard-card teacher-room-card">
            <p className="empty-state">Cargando salas habilitadas...</p>
          </article>
        ) : salasFiltradas.length ? (
          salasFiltradas.map((sala) => {
            const disponibilidad =
              disponibilidadDocente.find((item) => item.idSala === sala.idSala) ?? null
            const bloquesLibres =
              disponibilidad?.horariosDisponibles.filter((item) => item.disponible).length ?? 0
            const tieneEspacios = bloquesLibres > 0

            return (
              <article key={sala.idSala} className="dashboard-card teacher-room-card">
                <div className="teacher-room-card__head">
                  <div>
                    <h3>{sala.nombre}</h3>
                    <p>{sala.ubicacion}</p>
                  </div>
                  <span className={`badge ${tieneEspacios ? 'enabled' : 'disabled'}`}>
                    {availabilityLoading
                      ? 'Consultando...'
                      : tieneEspacios
                        ? 'Con espacio'
                        : 'Sin cupos'}
                  </span>
                </div>

                <div className="teacher-room-card__meta">
                  <span>Capacidad: {sala.capacidad} personas</span>
                  <span>
                    {availabilityLoading
                      ? 'Cargando bloques libres'
                      : `${bloquesLibres} bloques de 30 min libres`}
                  </span>
                </div>

                <button
                  type="button"
                  className="action-button"
                  onClick={() =>
                    navigate(`/crear-reserva?sala=${sala.idSala}&fecha=${fechaConsulta}`)
                  }
                >
                  Reservar esta sala
                </button>
              </article>
            )
          })
        ) : (
          <article className="dashboard-card teacher-room-card">
            <p className="empty-state">
              No hay salas disponibles para la seleccion actual.
            </p>
          </article>
        )}
      </section>
    </>
  )

  const secretaryView = (
    <>
      {alerta.mensaje ? (
        <div className={`dashboard-alert dashboard-alert-${alerta.tipo || 'info'}`}>
          {alerta.mensaje}
        </div>
      ) : null}

      <section className="dashboard-grid">
        <article className="dashboard-card">
          <div className="card-head">
            <div>
              <h2>Listado de salas</h2>
              <p>Selecciona una sala para consultar su detalle.</p>
            </div>
            <span className="card-badge">
              {loading ? 'Cargando...' : `${salasFiltradas.length} visibles`}
            </span>
          </div>

          <label className="dashboard-field">
            <span>Buscar sala</span>
            <input
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Nombre o ubicacion"
            />
          </label>

          <div className="salas-list">
            {salasFiltradas.length ? (
              salasFiltradas.map((sala) => (
                <button
                  key={sala.idSala}
                  type="button"
                  className={`sala-item ${selectedSalaId === sala.idSala ? 'active' : ''}`}
                  onClick={() => setSelectedSalaId(sala.idSala)}
                >
                  <div>
                    <strong>{sala.nombre}</strong>
                    <span>{sala.ubicacion}</span>
                  </div>
                  <span className={`badge ${sala.habilitada ? 'enabled' : 'disabled'}`}>
                    {sala.habilitada ? 'Habilitada' : 'Deshabilitada'}
                  </span>
                </button>
              ))
            ) : (
              <p className="empty-state">No hay salas que coincidan con la busqueda.</p>
            )}
          </div>
        </article>

        <article className="dashboard-card">
          <div className="card-head">
            <div>
              <h2>Detalle y edicion</h2>
              <p>Informacion actual de la sala seleccionada.</p>
            </div>
            {selectedSala ? (
              <button
                type="button"
                className={`action-button ${selectedSala.habilitada ? 'danger' : 'success'}`}
                onClick={handleToggleStatus}
                disabled={savingStatus || detailLoading}
              >
                {savingStatus
                  ? 'Actualizando...'
                  : selectedSala.habilitada
                    ? 'Deshabilitar sala'
                    : 'Habilitar sala'}
              </button>
            ) : null}
          </div>

          {detailLoading ? (
            <p className="empty-state">Cargando detalle de la sala...</p>
          ) : selectedSala ? (
            <>
              <div className="detail-summary">
                <div>
                  <span>Capacidad</span>
                  <strong>{selectedSala.capacidad}</strong>
                </div>
                <div>
                  <span>Estado</span>
                  <strong>{selectedSala.habilitada ? 'Disponible' : 'No disponible'}</strong>
                </div>
                <div>
                  <span>Recursos</span>
                  <strong>{selectedSala.recursos.length}</strong>
                </div>
              </div>

              {!selectedSala.habilitada ? (
                <div className="info-box">
                  La sala esta deshabilitada. Mientras siga asi, no se podra editar ni asignar
                  recursos.
                </div>
              ) : null}

              <form className="form-card" onSubmit={handleEditSubmit}>
                <h3>Editar sala</h3>

                <label className="dashboard-field">
                  <span>Nombre</span>
                  <input
                    value={editForm.nombre}
                    disabled={!selectedSala.habilitada}
                    onChange={(event) =>
                      setEditForm((current) => ({ ...current, nombre: event.target.value }))
                    }
                  />
                  {editErrors.nombre ? <small>{editErrors.nombre}</small> : null}
                </label>

                <label className="dashboard-field">
                  <span>Ubicacion</span>
                  <input
                    value={editForm.ubicacion}
                    disabled={!selectedSala.habilitada}
                    onChange={(event) =>
                      setEditForm((current) => ({
                        ...current,
                        ubicacion: event.target.value,
                      }))
                    }
                  />
                  {editErrors.ubicacion ? <small>{editErrors.ubicacion}</small> : null}
                </label>

                <label className="dashboard-field">
                  <span>Capacidad</span>
                  <input
                    type="number"
                    min={2}
                    max={100}
                    value={editForm.capacidad}
                    disabled={!selectedSala.habilitada}
                    onChange={(event) =>
                      setEditForm((current) => ({
                        ...current,
                        capacidad: Number(event.target.value),
                      }))
                    }
                  />
                  {editErrors.capacidad ? <small>{editErrors.capacidad}</small> : null}
                </label>

                <button
                  type="submit"
                  className="action-button"
                  disabled={savingEdit || !selectedSala.habilitada}
                >
                  {savingEdit ? 'Guardando...' : 'Guardar cambios'}
                </button>
              </form>
            </>
          ) : (
            <p className="empty-state">Selecciona una sala para revisar su detalle.</p>
          )}
        </article>
      </section>

      <section className="dashboard-grid dashboard-grid-secondary">
        <article className="dashboard-card">
          <div className="card-head">
            <div>
              <h2>Recursos asignados</h2>
              <p>Listado actual de recursos de la sala seleccionada.</p>
            </div>
          </div>

          <div className="resource-table">
            {selectedSala ? (
              selectedSala.recursos.length ? (
                selectedSala.recursos.map((recurso) => (
                  <div key={recurso.idRecursoSala} className="resource-row">
                    <div>
                      <strong>{recurso.nombreRecurso}</strong>
                      <span>{recurso.codigoRecurso}</span>
                    </div>
                    <div className="resource-row__actions">
                      <span className="quantity-pill">x{recurso.cantidad}</span>
                      {selectedSala.habilitada ? (
                        <button
                          type="button"
                          className="action-button danger compact"
                          onClick={() => handleRetirarRecurso(recurso.idRecursoSala)}
                        >
                          Retirar
                        </button>
                      ) : null}
                    </div>
                  </div>
                ))
              ) : (
                <p className="empty-state">
                  Esta sala aun no tiene recursos tecnologicos asignados.
                </p>
              )
            ) : (
              <p className="empty-state">
                Selecciona una sala para revisar sus recursos.
              </p>
            )}
          </div>
        </article>

        <article className="dashboard-card">
          <form className="form-card" onSubmit={handleResourceSubmit}>
            <div className="card-head">
              <div>
                <h2>Agregar recurso tecnologico</h2>
                <p>Selecciona un recurso del catalogo y asigna la cantidad requerida.</p>
              </div>
            </div>

            <label className="dashboard-field">
              <span>Nombre del recurso</span>
              <select
                value={resourceForm.codigoRecurso}
                disabled={!selectedSala || !selectedSala.habilitada || catalogoLoading}
                onChange={(event) => handleResourceSelection(event.target.value)}
              >
                <option value="">Selecciona un recurso disponible</option>
                {catalogoRecursos.map((recurso) => (
                  <option key={recurso.codigoRecurso} value={recurso.codigoRecurso}>
                    {recurso.nombreRecurso}
                  </option>
                ))}
              </select>
              {resourceErrors.recurso ? <small>{resourceErrors.recurso}</small> : null}
            </label>

            <label className="dashboard-field">
              <span>Codigo del recurso</span>
              <input
                value={resourceForm.codigoRecurso}
                readOnly
                placeholder="Se completa automaticamente"
              />
            </label>

            <div className="selected-resource-preview">
              <span>Seleccion actual</span>
              <strong>
                {recursoSeleccionado?.nombreRecurso ?? 'Ningun recurso seleccionado'}
              </strong>
              <p>
                {recursoSeleccionado?.codigoRecurso ??
                  'El codigo aparecera aqui cuando elijas un recurso del backend.'}
              </p>
            </div>

            <label className="dashboard-field">
              <span>Cantidad</span>
              <input
                type="number"
                min={1}
                value={resourceForm.cantidad}
                disabled={!selectedSala || !selectedSala.habilitada}
                onChange={(event) =>
                  setResourceForm((current) => ({
                    ...current,
                    cantidad: Number(event.target.value),
                  }))
                }
              />
              {resourceErrors.cantidad ? <small>{resourceErrors.cantidad}</small> : null}
            </label>

            <button
              type="submit"
              className="action-button"
              disabled={
                savingResource ||
                !selectedSala ||
                !selectedSala.habilitada ||
                catalogoLoading
              }
            >
              {savingResource ? 'Agregando...' : 'Agregar recurso'}
            </button>
          </form>
        </article>
      </section>
    </>
  )

  return (
    <DashboardShell
      activeKey="dashboard"
      title={secretaria ? 'Panel de secretaria' : 'Consultar disponibilidad de sala'}
      subtitle={
        secretaria
          ? 'Administra salas, edita sus datos y asigna recursos tecnologicos desde una sola vista.'
          : 'Consulta disponibilidad por fecha y pasa a la reserva solo cuando encuentres un horario conveniente.'
      }
      headerAside={headerAside}
    >
      {secretaria ? secretaryView : teacherView}
    </DashboardShell>
  )
}

export default HomePage
