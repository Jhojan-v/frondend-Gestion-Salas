import { useState } from 'react'
import { crearSala } from '../../infrastructure/http/roomService'
import DashboardShell from '../components/DashboardShell'
import { useAuth } from '../../shared/context/AuthContext'
import './CreateRoomPage.css'

const validarNombre = (value: string) => {
  if (!value.trim()) return 'El nombre es obligatorio.'
  if (value.trim().length < 3) return 'Minimo 3 caracteres.'
  return ''
}

const validarUbicacion = (value: string) => {
  if (!value.trim()) return 'La ubicacion es obligatoria.'
  return ''
}

const validarCapacidad = (value: string) => {
  if (!value) return 'La capacidad es obligatoria.'
  const num = Number(value)
  if (Number.isNaN(num)) return 'Debe ser un numero.'
  if (num < 2 || num > 100) return 'Debe estar entre 2 y 100.'
  return ''
}

export default function CreateRoomPage() {
  const { usuario } = useAuth()

  const [form, setForm] = useState({ nombre: '', ubicacion: '', capacidad: '' })
  const [errores, setErrores] = useState({ nombre: '', ubicacion: '', capacidad: '' })
  const [alerta, setAlerta] = useState({ tipo: '', mensaje: '' })
  const [cargando, setCargando] = useState(false)

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = event.target
    setForm((current) => ({ ...current, [name]: value }))

    if (errores[name as keyof typeof errores]) {
      setErrores((current) => ({ ...current, [name]: '' }))
    }

    if (alerta.mensaje) {
      setAlerta({ tipo: '', mensaje: '' })
    }
  }

  const handleBlur = (event: React.FocusEvent<HTMLInputElement>) => {
    const { name, value } = event.target
    const validators = {
      nombre: validarNombre,
      ubicacion: validarUbicacion,
      capacidad: validarCapacidad,
    }

    setErrores((current) => ({
      ...current,
      [name]: validators[name as keyof typeof validators](value),
    }))
  }

  const validarTodo = () => {
    const nuevosErrores = {
      nombre: validarNombre(form.nombre),
      ubicacion: validarUbicacion(form.ubicacion),
      capacidad: validarCapacidad(form.capacidad),
    }

    setErrores(nuevosErrores)
    return !Object.values(nuevosErrores).some(Boolean)
  }

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()

    if (!validarTodo() || !usuario) {
      return
    }

    setCargando(true)
    setAlerta({ tipo: '', mensaje: '' })

    try {
      const resultado = await crearSala(
        {
          nombre: form.nombre,
          ubicacion: form.ubicacion,
          capacidad: Number(form.capacidad),
          facultad: usuario.facultad,
        },
        usuario,
      )

      setAlerta({
        tipo: 'exito',
        mensaje: resultado.modoLocal
          ? `Sala "${form.nombre}" guardada en modo local.`
          : `Sala "${form.nombre}" creada exitosamente.`,
      })
      setForm({ nombre: '', ubicacion: '', capacidad: '' })
    } catch (err: unknown) {
      const mensaje = err instanceof Error ? err.message : 'Error desconocido'

      if (mensaje.toLowerCase().includes('nombre')) {
        setErrores((current) => ({
          ...current,
          nombre: 'Ya existe una sala con ese nombre.',
        }))
      } else {
        setAlerta({ tipo: 'error', mensaje })
      }
    } finally {
      setCargando(false)
    }
  }

  const headerAside = (
    <div className="create-room__metrics">
      <article className="create-room__metric-card">
        <span>Capacidad minima</span>
        <strong>2</strong>
        <p>La sala debe poder recibir al menos dos personas.</p>
      </article>
      <article className="create-room__metric-card">
        <span>Capacidad maxima</span>
        <strong>100</strong>
        <p>El formulario valida automaticamente este limite.</p>
      </article>
    </div>
  )

  return (
    <DashboardShell
      activeKey="create-room"
      title="Crear sala"
      subtitle="Registra un nuevo espacio para que quede disponible dentro del sistema de reservas."
      headerAside={headerAside}
    >
      <section className="create-room">
        <article className="create-room__card">
          <div className="create-room__head">
            <div>
              <h3>Formulario de registro</h3>
              <p>Los datos se validan antes de enviarse al backend o al fallback local.</p>
            </div>
          </div>

          {alerta.mensaje ? (
            <div className={`create-room__alert is-${alerta.tipo}`}>
              {alerta.mensaje}
            </div>
          ) : null}

          <form className="create-room__form" onSubmit={handleSubmit} noValidate>
            <label className="create-room__field">
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

            <label className="create-room__field">
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

            <label className="create-room__field">
              <span>Capacidad</span>
              <input
                name="capacidad"
                type="number"
                value={form.capacidad}
                onChange={handleChange}
                onBlur={handleBlur}
                min={2}
                max={100}
                placeholder="Ej: 20"
              />
              {errores.capacidad ? <small>{errores.capacidad}</small> : null}
            </label>

            <div className="create-room__actions">
              <button type="submit" disabled={cargando}>
                {cargando ? 'Creando sala...' : 'Crear sala'}
              </button>
              <button
                type="button"
                className="secondary"
                onClick={() => setForm({ nombre: '', ubicacion: '', capacidad: '' })}
              >
                Limpiar formulario
              </button>
            </div>
          </form>
        </article>
      </section>
    </DashboardShell>
  )
}
