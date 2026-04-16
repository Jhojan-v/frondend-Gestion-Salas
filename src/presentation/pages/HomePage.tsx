import { useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  actualizarEstadoSala,
  actualizarSala,
  agregarRecursoSala,
  listarSalas,
  obtenerSalaDetalle,
  type SalaDetalle,
  type SalaResumen,
} from '../../infrastructure/http/roomService'
import { resolverNombreFacultad } from '../../shared/constants/facultades'
import { useAuth } from '../../shared/context/AuthContext'
import './home-page.css'

// Estado base de edicion.
const emptyEditForm = {
  nombre: '',
  ubicacion: '',
  capacidad: 2,
}

// Estado base de recursos.
const emptyResourceForm = {
  codigoRecurso: '',
  nombreRecurso: '',
}

const emptyEditErrors = {
  nombre: '',
  ubicacion: '',
  capacidad: '',
}

const emptyResourceErrors = {
  codigoRecurso: '',
  nombreRecurso: '',
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

function validarCodigoRecurso(codigo: string) {
  return codigo.trim() ? '' : 'El codigo del recurso es obligatorio.'
}

function validarNombreRecurso(nombre: string) {
  return nombre.trim() ? '' : 'El nombre del recurso es obligatorio.'
}

function HomePage() {
  // Dashboard de secretaria.
  const navigate = useNavigate()
  const { usuario, cerrarSesion } = useAuth()

  const [salas, setSalas] = useState<SalaResumen[]>([])
  const [selectedSalaId, setSelectedSalaId] = useState<number | null>(null)
  const [selectedSala, setSelectedSala] = useState<SalaDetalle | null>(null)
  const [editForm, setEditForm] = useState(emptyEditForm)
  const [resourceForm, setResourceForm] = useState(emptyResourceForm)
  const [editErrors, setEditErrors] = useState(emptyEditErrors)
  const [resourceErrors, setResourceErrors] = useState(emptyResourceErrors)
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [detailLoading, setDetailLoading] = useState(false)
  const [savingEdit, setSavingEdit] = useState(false)
  const [savingStatus, setSavingStatus] = useState(false)
  const [savingResource, setSavingResource] = useState(false)
  const [alerta, setAlerta] = useState<AlertState>({
    tipo: 'info',
    mensaje: 'Cargando salas...',
  })

  const facultadNombre = resolverNombreFacultad(usuario?.facultad, usuario?.idFacultad)

  const salasFiltradas = salas.filter((sala) => {
    const term = search.trim().toLowerCase()

    if (!term) {
      return true
    }

    return (
      sala.nombre.toLowerCase().includes(term) ||
      sala.ubicacion.toLowerCase().includes(term)
    )
  })

  useEffect(() => {
    void cargarSalas()
  }, [usuario?.idFacultad, usuario?.rol])

  useEffect(() => {
    const root = document.getElementById('root')
    root?.classList.add('dashboard-root')

    return () => {
      root?.classList.remove('dashboard-root')
    }
  }, [])

  useEffect(() => {
    if (selectedSalaId !== null) {
      void cargarDetalle(selectedSalaId)
    } else {
      setSelectedSala(null)
    }
  }, [selectedSalaId, usuario?.idFacultad, usuario?.rol])

  async function cargarSalas() {
    // Listado principal.
    try {
      setLoading(true)
      const data = await listarSalas(usuario)
      setSalas(data)
      setSelectedSalaId((current) => {
        if (!data.length) {
          return null
        }

        if (current !== null && data.some((sala) => sala.idSala === current)) {
          return current
        }

        return data[0].idSala
      })
      setAlerta({
        tipo: 'info',
        mensaje: data.length
          ? `${data.length} salas cargadas correctamente.`
          : 'No hay salas registradas para la facultad actual.',
      })
    } catch (error) {
      setAlerta({
        tipo: 'error',
        mensaje: error instanceof Error ? error.message : 'No se pudieron cargar las salas.',
      })
    } finally {
      setLoading(false)
    }
  }

  async function cargarDetalle(idSala: number) {
    // Detalle de la sala activa.
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
      codigoRecurso: validarCodigoRecurso(resourceForm.codigoRecurso),
      nombreRecurso: validarNombreRecurso(resourceForm.nombreRecurso),
    }

    setResourceErrors(errores)
    return !Object.values(errores).some(Boolean)
  }

  async function handleEditSubmit(event: FormEvent<HTMLFormElement>) {
    // HU-05.
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

  async function handleToggleStatus() {
    // HU-06.
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
    // HU-07.
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
          cantidad: 1,
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

  return (
    <div className="secretaria-dashboard">
      <aside className={`dashboard-sidebar ${sidebarOpen ? '' : 'dashboard-sidebar-collapsed'}`}>
        <button
          type="button"
          className="sidebar-toggle"
          onClick={() => setSidebarOpen((current) => !current)}
          aria-label={sidebarOpen ? 'Contraer barra lateral' : 'Expandir barra lateral'}
        >
          {sidebarOpen ? 'Ocultar' : 'Menu'}
        </button>

        <div className="sidebar-brand">
          <h2>{sidebarOpen ? 'Sistema de Reservas' : 'SR'}</h2>
          {sidebarOpen ? <p>Universidad UAO</p> : null}
        </div>

        <nav className="sidebar-menu">
          <button
            type="button"
            className="sidebar-link sidebar-link-active"
            aria-label="Dashboard secretaria"
          >
            <span>{sidebarOpen ? 'Dashboard secretaria' : 'Inicio'}</span>
          </button>
          <button
            type="button"
            className="sidebar-link"
            onClick={() => navigate('/crear-sala')}
            aria-label="Crear sala"
          >
            <span>{sidebarOpen ? 'Crear sala' : 'Crear'}</span>
          </button>
          <button
            type="button"
            className="sidebar-link"
            onClick={() => void cargarSalas()}
            aria-label="Recargar salas"
          >
            <span>{sidebarOpen ? 'Recargar salas' : 'Sync'}</span>
          </button>
        </nav>

        <div className="sidebar-user">
          <strong>{usuario?.correo ?? 'Sin sesion'}</strong>
          {sidebarOpen ? (
            <>
              <span>{usuario?.rol ?? 'Sin rol'}</span>
              <span>{facultadNombre}</span>
            </>
          ) : null}
        </div>

        <button
          type="button"
          className="sidebar-logout"
          onClick={() => {
            cerrarSesion()
            navigate('/login')
          }}
        >
          {sidebarOpen ? 'Cerrar sesion' : 'Salir'}
        </button>
      </aside>

      <section className="dashboard-main">
        <header className="dashboard-header">
          <div>
            <h1>Panel de secretaria</h1>
            <p className="dashboard-subtitle">
              Administra salas y recursos de tu facultad desde una sola vista.
            </p>
          </div>

          <div className="dashboard-header-card">
            <span>Facultad</span>
            <strong>{facultadNombre}</strong>
            <p>{loading ? 'Sincronizando informacion...' : alerta.mensaje}</p>
          </div>
        </header>

        {alerta.mensaje ? (
          <div className={`dashboard-alert dashboard-alert-${alerta.tipo || 'info'}`}>
            {alerta.mensaje}
          </div>
        ) : null}

        <section className="dashboard-summary">
          <article className="summary-card">
            <span>Salas</span>
            <strong>{salas.length}</strong>
          </article>
          <article className="summary-card">
            <span>Habilitadas</span>
            <strong>{salas.filter((sala) => sala.habilitada).length}</strong>
          </article>
          <article className="summary-card">
            <span>Deshabilitadas</span>
            <strong>{salas.filter((sala) => !sala.habilitada).length}</strong>
          </article>
        </section>

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
                    <span>Facultad</span>
                    <strong>{facultadNombre}</strong>
                  </div>
                  <div>
                    <span>Capacidad</span>
                    <strong>{selectedSala.capacidad}</strong>
                  </div>
                  <div>
                    <span>Estado</span>
                    <strong>{selectedSala.habilitada ? 'Disponible' : 'No disponible'}</strong>
                  </div>
                </div>

                {!selectedSala.habilitada ? (
                  <div className="info-box">La sala esta deshabilitada.</div>
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

            {selectedSala?.recursos.length ? (
              <div className="resource-table">
                {selectedSala.recursos.map((recurso) => (
                  <div key={recurso.idRecursoSala} className="resource-row">
                    <div>
                      <strong>{recurso.nombreRecurso}</strong>
                      <span>{recurso.codigoRecurso}</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="empty-state">
                Esta sala aun no tiene recursos tecnologicos asignados.
              </p>
            )}
          </article>

          <article className="dashboard-card">
            <form className="form-card" onSubmit={handleResourceSubmit}>
              <div className="card-head">
                <div>
                  <h2>Agregar recurso tecnologico</h2>
                </div>
              </div>

              <label className="dashboard-field">
                <span>Identificador del recurso</span>
                <input
                  value={resourceForm.codigoRecurso}
                  disabled={!selectedSala || !selectedSala.habilitada}
                  onChange={(event) =>
                    setResourceForm((current) => ({
                      ...current,
                      codigoRecurso: event.target.value,
                    }))
                  }
                />
                {resourceErrors.codigoRecurso ? (
                  <small>{resourceErrors.codigoRecurso}</small>
                ) : null}
              </label>

              <label className="dashboard-field">
                <span>Nombre del recurso</span>
                <input
                  value={resourceForm.nombreRecurso}
                  disabled={!selectedSala || !selectedSala.habilitada}
                  onChange={(event) =>
                    setResourceForm((current) => ({
                      ...current,
                      nombreRecurso: event.target.value,
                    }))
                  }
                />
                {resourceErrors.nombreRecurso ? (
                  <small>{resourceErrors.nombreRecurso}</small>
                ) : null}
              </label>

              <button
                type="submit"
                className="action-button"
                disabled={savingResource || !selectedSala || !selectedSala.habilitada}
              >
                {savingResource ? 'Agregando...' : 'Agregar recurso'}
              </button>
            </form>
          </article>
        </section>
      </section>
    </div>
  )
}

export default HomePage
