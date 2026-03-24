import { useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import { useAuth } from '../../shared/context/AuthContext'
import './home-page.css'

type SalaResumen = {
  idSala: number
  nombre: string
  ubicacion: string
  capacidad: number
  habilitada: boolean
}

type RecursoSala = {
  idRecursoSala: number
  codigoRecurso: string
  nombreRecurso: string
  cantidad: number
}

type SalaDetalle = SalaResumen & {
  facultadId: number
  recursos: RecursoSala[]
}

type EstadoSalaResponse = {
  idSala: number
  habilitada: boolean
  mensaje: string
}

type RecursoSalaResponse = {
  idRecursoSala: number
  codigoRecurso: string
  nombreRecurso: string
  cantidad: number
  mensaje: string
}

const API_URL = 'http://localhost:8080/api/salas'
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

function HomePage() {
  const { usuario } = useAuth()
  const [salas, setSalas] = useState<SalaResumen[]>([])
  const [selectedSalaId, setSelectedSalaId] = useState<number | null>(null)
  const [selectedSala, setSelectedSala] = useState<SalaDetalle | null>(null)
  const [editForm, setEditForm] = useState(emptyEditForm)
  const [resourceForm, setResourceForm] = useState(emptyResourceForm)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('Cargando salas...')
  const [error, setError] = useState('')

  const headers = {
    'Content-Type': 'application/json',
    'X-Usuario-Id': '1',
    'X-Facultad-Id': String(usuario?.idFacultad ?? 1),
    'X-Rol': usuario?.rol ?? 'SECRETARIA',
  }

  useEffect(() => {
    void loadSalas()
  }, [])

  useEffect(() => {
    if (selectedSalaId !== null) {
      void loadSalaDetalle(selectedSalaId)
    }
  }, [selectedSalaId])

  async function parseResponse<T>(response: Response): Promise<T> {
    if (!response.ok) {
      const errorBody = await response.json().catch(() => null)
      throw new Error(errorBody?.message ?? 'No fue posible completar la solicitud')
    }

    return response.json() as Promise<T>
  }

  async function loadSalas() {
    try {
      setLoading(true)
      setError('')
      const response = await fetch(API_URL, { headers })
      const data = await parseResponse<SalaResumen[]>(response)
      setSalas(data)
      setMessage(`${data.length} salas cargadas correctamente`)

      if (data.length > 0) {
        setSelectedSalaId((current) => current ?? data[0].idSala)
      }
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Error inesperado')
      setMessage('No se pudieron cargar las salas')
    } finally {
      setLoading(false)
    }
  }

  async function loadSalaDetalle(idSala: number) {
    try {
      setError('')
      const response = await fetch(`${API_URL}/${idSala}`, { headers })
      const data = await parseResponse<SalaDetalle>(response)
      setSelectedSala(data)
      setEditForm({
        nombre: data.nombre,
        ubicacion: data.ubicacion,
        capacidad: data.capacidad,
      })
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Error inesperado')
    }
  }

  async function handleEditSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (selectedSalaId === null) {
      return
    }

    try {
      setSaving(true)
      setError('')
      const response = await fetch(`${API_URL}/${selectedSalaId}`, {
        method: 'PUT',
        headers,
        body: JSON.stringify(editForm),
      })

      const data = await parseResponse<SalaDetalle>(response)
      setSelectedSala(data)
      setMessage('Sala actualizada correctamente')
      await loadSalas()
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Error inesperado')
    } finally {
      setSaving(false)
    }
  }

  async function handleToggleStatus() {
    if (!selectedSala) {
      return
    }

    try {
      setSaving(true)
      setError('')
      const response = await fetch(`${API_URL}/${selectedSala.idSala}/estado`, {
        method: 'PATCH',
        headers,
        body: JSON.stringify({ habilitada: !selectedSala.habilitada }),
      })

      const data = await parseResponse<EstadoSalaResponse>(response)
      setMessage(data.mensaje)
      await loadSalas()
      await loadSalaDetalle(selectedSala.idSala)
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Error inesperado')
    } finally {
      setSaving(false)
    }
  }

  async function handleResourceSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (selectedSalaId === null) {
      return
    }

    try {
      setSaving(true)
      setError('')
      const response = await fetch(`${API_URL}/${selectedSalaId}/recursos`, {
        method: 'POST',
        headers,
        body: JSON.stringify(resourceForm),
      })

      const data = await parseResponse<RecursoSalaResponse>(response)
      setMessage(data.mensaje)
      setResourceForm(emptyResourceForm)
      await loadSalaDetalle(selectedSalaId)
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Error inesperado')
    } finally {
      setSaving(false)
    }
  }

  return (
    <main className="dashboard-page">
      <section className="dashboard-hero">
        <div>
          <p className="eyebrow">Gestion de salas</p>
          <h1>Conectado al backend real</h1>
          <p className="hero-copy">
            Esta vista consume el backend en tiempo real para listar, editar, habilitar
            o deshabilitar salas y agregar recursos tecnologicos.
          </p>
        </div>
        <div className="status-card">
          <span className="status-label">Estado</span>
          <strong>{loading ? 'Sincronizando...' : 'Backend activo'}</strong>
          <p>{message}</p>
        </div>
      </section>

      {error ? <div className="banner banner-error">{error}</div> : null}

      <section className="dashboard-grid">
        <article className="panel salas-panel">
          <div className="panel-head">
            <h2>Salas disponibles</h2>
            <button type="button" className="ghost-button" onClick={() => void loadSalas()}>
              Recargar
            </button>
          </div>

          <div className="salas-list">
            {salas.map((sala) => (
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
            ))}
          </div>
        </article>

        <article className="panel detail-panel">
          <div className="panel-head">
            <h2>Detalle y edicion</h2>
            {selectedSala ? (
              <button type="button" className="primary-button" onClick={handleToggleStatus} disabled={saving}>
                {selectedSala.habilitada ? 'Deshabilitar sala' : 'Habilitar sala'}
              </button>
            ) : null}
          </div>

          {selectedSala ? (
            <>
              <div className="detail-summary">
                <div>
                  <span>Facultad</span>
                  <strong>{selectedSala.facultadId}</strong>
                </div>
                <div>
                  <span>Capacidad</span>
                  <strong>{selectedSala.capacidad}</strong>
                </div>
                <div>
                  <span>Ubicacion</span>
                  <strong>{selectedSala.ubicacion}</strong>
                </div>
              </div>

              <form className="form-card" onSubmit={handleEditSubmit}>
                <h3>Editar sala</h3>

                <label>
                  Nombre
                  <input
                    value={editForm.nombre}
                    onChange={(event) => setEditForm((current) => ({ ...current, nombre: event.target.value }))}
                  />
                </label>

                <label>
                  Ubicacion
                  <input
                    value={editForm.ubicacion}
                    onChange={(event) => setEditForm((current) => ({ ...current, ubicacion: event.target.value }))}
                  />
                </label>

                <label>
                  Capacidad
                  <input
                    type="number"
                    min={2}
                    max={100}
                    value={editForm.capacidad}
                    onChange={(event) =>
                      setEditForm((current) => ({
                        ...current,
                        capacidad: Number(event.target.value),
                      }))
                    }
                  />
                </label>

                <button type="submit" className="primary-button" disabled={saving}>
                  Guardar cambios
                </button>
              </form>
            </>
          ) : (
            <p className="empty-state">Selecciona una sala para ver su informacion.</p>
          )}
        </article>
      </section>

      <section className="dashboard-grid secondary-grid">
        <article className="panel">
          <div className="panel-head">
            <h2>Recursos asignados</h2>
          </div>

          {selectedSala?.recursos.length ? (
            <div className="resource-table">
              {selectedSala.recursos.map((recurso) => (
                <div key={recurso.idRecursoSala} className="resource-row">
                  <div>
                    <strong>{recurso.nombreRecurso}</strong>
                    <span>{recurso.codigoRecurso}</span>
                  </div>
                  <span className="quantity-pill">x{recurso.cantidad}</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="empty-state">Esta sala aun no tiene recursos tecnologicos asignados.</p>
          )}
        </article>

        <article className="panel">
          <form className="form-card" onSubmit={handleResourceSubmit}>
            <h3>Agregar recurso tecnologico</h3>

            <label>
              Codigo del recurso
              <input
                value={resourceForm.codigoRecurso}
                onChange={(event) =>
                  setResourceForm((current) => ({ ...current, codigoRecurso: event.target.value }))
                }
              />
            </label>

            <label>
              Nombre del recurso
              <input
                value={resourceForm.nombreRecurso}
                onChange={(event) =>
                  setResourceForm((current) => ({ ...current, nombreRecurso: event.target.value }))
                }
              />
            </label>

            <label>
              Cantidad
              <input
                type="number"
                min={1}
                value={resourceForm.cantidad}
                onChange={(event) =>
                  setResourceForm((current) => ({
                    ...current,
                    cantidad: Number(event.target.value),
                  }))
                }
              />
            </label>

            <button type="submit" className="primary-button" disabled={saving || selectedSalaId === null}>
              Agregar recurso
            </button>
          </form>
        </article>
      </section>
    </main>
  )
}

export default HomePage
