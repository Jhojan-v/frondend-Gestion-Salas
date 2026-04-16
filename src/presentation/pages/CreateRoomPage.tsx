import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { crearSala } from '../../infrastructure/http/roomService'
import { resolverNombreFacultad } from '../../shared/constants/facultades'
import { useAuth } from '../../shared/context/AuthContext'
import './create-room-page.css'
import './home-page.css'

// Validaciones de crear sala.
const validarNombre = (valor: string) => {
  if (!valor.trim()) return 'El nombre es obligatorio.'
  if (valor.trim().length < 3) return 'Minimo 3 caracteres.'
  return ''
}

const validarUbicacion = (valor: string) => {
  if (!valor.trim()) return 'La ubicacion es obligatoria.'
  return ''
}

const validarCapacidad = (valor: string) => {
  if (!valor) return 'La capacidad es obligatoria.'
  const numero = Number(valor)
  if (Number.isNaN(numero)) return 'Debe ser un numero.'
  if (numero < 2 || numero > 100) return 'Debe estar entre 2 y 100.'
  return ''
}

export default function CreateRoomPage() {
  // Vista de alta de salas.
  const navigate = useNavigate()
  const { usuario, cerrarSesion } = useAuth()

  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [form, setForm] = useState({ nombre: '', ubicacion: '', capacidad: '' })
  const [errores, setErrores] = useState({ nombre: '', ubicacion: '', capacidad: '' })
  const [alerta, setAlerta] = useState({ tipo: '', mensaje: '' })
  const [cargando, setCargando] = useState(false)

  const facultadNombre = resolverNombreFacultad(usuario?.facultad, usuario?.idFacultad)

  useEffect(() => {
    const root = document.getElementById('root')
    root?.classList.add('dashboard-root')

    return () => {
      root?.classList.remove('dashboard-root')
    }
  }, [])

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = event.target
    setForm((prev) => ({ ...prev, [name]: value }))

    if (errores[name as keyof typeof errores]) {
      setErrores((prev) => ({ ...prev, [name]: '' }))
    }

    if (alerta.mensaje) {
      setAlerta({ tipo: '', mensaje: '' })
    }
  }

  const handleBlur = (event: React.FocusEvent<HTMLInputElement>) => {
    const { name, value } = event.target
    const validadores = {
      nombre: validarNombre,
      ubicacion: validarUbicacion,
      capacidad: validarCapacidad,
    }

    setErrores((prev) => ({
      ...prev,
      [name]: validadores[name as keyof typeof validadores](value),
    }))
  }

  const validarTodo = () => {
    const nuevo = {
      nombre: validarNombre(form.nombre),
      ubicacion: validarUbicacion(form.ubicacion),
      capacidad: validarCapacidad(form.capacidad),
    }

    setErrores(nuevo)
    return !Object.values(nuevo).some(Boolean)
  }

  const handleSubmit = async (event: React.FormEvent) => {
    // Envio del formulario.
    event.preventDefault()

    if (!usuario || !validarTodo()) {
      return
    }

    setCargando(true)
    setAlerta({ tipo: '', mensaje: '' })

    try {
      await crearSala({
        nombre: form.nombre.trim(),
        ubicacion: form.ubicacion.trim(),
        capacidad: Number(form.capacidad),
        facultad: facultadNombre,
      }, usuario)

      setAlerta({
        tipo: 'exito',
        mensaje: `Sala "${form.nombre.trim()}" creada exitosamente.`,
      })
      setForm({ nombre: '', ubicacion: '', capacidad: '' })
    } catch (error: any) {
      const mensaje = error?.message || ''
      if (mensaje.toLowerCase().includes('nombre')) {
        setErrores((prev) => ({ ...prev, nombre: 'Ya existe una sala con ese nombre.' }))
      } else {
        setAlerta({
          tipo: 'error',
          mensaje: mensaje || 'Error tecnico. Intenta de nuevo.',
        })
      }
    } finally {
      setCargando(false)
    }
  }

  if (!usuario || usuario.rol !== 'SECRETARIA') {
    return (
      <section className="create-room-access">
        <div className="create-room-access-card">
          <h2>Acceso restringido</h2>
          <p>Solo las secretarias pueden crear salas.</p>
          <button type="button" className="action-button" onClick={() => navigate('/login')}>
            Volver al inicio
          </button>
        </div>
      </section>
    )
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
            className="sidebar-link"
            onClick={() => navigate('/dashboard-secretaria')}
            aria-label="Dashboard secretaria"
          >
            <span>{sidebarOpen ? 'Dashboard secretaria' : 'Inicio'}</span>
          </button>
          <button
            type="button"
            className="sidebar-link"
            onClick={() => navigate('/mis-reservas')}
            aria-label="Mis reservas"
          >
            <span>{sidebarOpen ? 'Mis reservas' : 'Reservas'}</span>
          </button>
          <button
            type="button"
            className="sidebar-link sidebar-link-active"
            aria-label="Crear sala"
          >
            <span>{sidebarOpen ? 'Crear sala' : 'Crear'}</span>
          </button>
        </nav>

        <div className="sidebar-user">
          <strong>{usuario.correo}</strong>
          {sidebarOpen ? (
            <>
              <span>{usuario.rol}</span>
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

      <section className="dashboard-main create-room-main">
        <header className="dashboard-header">
          <div>
            <h1>Crear sala de reuniones</h1>
            <p className="dashboard-subtitle">
              Registra un nuevo espacio disponible para tu facultad.
            </p>
          </div>

          <div className="dashboard-header-card">
            <span>Facultad</span>
            <strong>{facultadNombre}</strong>
            <p>La sala quedara asociada a la facultad de la sesion activa.</p>
          </div>
        </header>

        <section className="create-room-wrapper">
          <article className="dashboard-card create-room-card">
            {alerta.mensaje ? (
              <div className={`dashboard-alert dashboard-alert-${alerta.tipo || 'info'}`}>
                {alerta.mensaje}
              </div>
            ) : null}

            <form className="create-room-form" onSubmit={handleSubmit} noValidate>
              <label className="dashboard-field">
                <span>Nombre de la sala</span>
                <input
                  name="nombre"
                  type="text"
                  value={form.nombre}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  placeholder="Ej: Sala A-101"
                />
                {errores.nombre ? <small>{errores.nombre}</small> : null}
              </label>

              <label className="dashboard-field">
                <span>Ubicacion</span>
                <input
                  name="ubicacion"
                  type="text"
                  value={form.ubicacion}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  placeholder="Ej: Bloque B, Piso 2"
                />
                {errores.ubicacion ? <small>{errores.ubicacion}</small> : null}
              </label>

              <label className="dashboard-field">
                <span>Capacidad (entre 2 y 100 personas)</span>
                <input
                  name="capacidad"
                  type="number"
                  min={2}
                  max={100}
                  value={form.capacidad}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  placeholder="Ej: 20"
                />
                {errores.capacidad ? <small>{errores.capacidad}</small> : null}
              </label>

              <div className="create-room-actions">
                <button type="submit" className="action-button create-room-submit" disabled={cargando}>
                  {cargando ? 'Creando sala...' : 'Crear sala'}
                </button>
                <button
                  type="button"
                  className="create-room-cancel"
                  onClick={() => {
                    setForm({ nombre: '', ubicacion: '', capacidad: '' })
                    setErrores({ nombre: '', ubicacion: '', capacidad: '' })
                  }}
                >
                  Cancelar
                </button>
              </div>
            </form>
          </article>
        </section>
      </section>
    </div>
  )
}
