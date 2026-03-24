import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { iniciarSesion } from '../../infrastructure/http/authService'
import { getNombreFacultad } from '../../shared/constants/facultades'
import { useAuth } from '../../shared/context/AuthContext'
import '../../styles/RegisterPage.css'

const validarCorreo = (v: string) => {
  if (!v) return 'El correo es obligatorio.'
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)) return 'El formato del correo no es válido.'
  return ''
}

const validarContrasena = (v: string) => {
  if (!v) return 'La contraseña es obligatoria.'
  return ''
}

export default function LoginPage() {
  const navigate = useNavigate()
  const { guardarSesion } = useAuth()

  const [form, setForm] = useState({ correo: '', contrasena: '' })
  const [errores, setErrores] = useState({ correo: '', contrasena: '' })
  const [alerta, setAlerta] = useState({ tipo: '', mensaje: '' })
  const [cargando, setCargando] = useState(false)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setForm((prev) => ({ ...prev, [name]: value }))

    if (errores[name as keyof typeof errores]) {
      setErrores((prev) => ({ ...prev, [name]: '' }))
    }

    if (alerta.mensaje) {
      setAlerta({ tipo: '', mensaje: '' })
    }
  }

  const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    const validators = { correo: validarCorreo, contrasena: validarContrasena }
    setErrores((prev) => ({
      ...prev,
      [name]: validators[name as keyof typeof validators](value),
    }))
  }

  const validarTodo = () => {
    const nuevo = {
      correo: validarCorreo(form.correo),
      contrasena: validarContrasena(form.contrasena),
    }

    setErrores(nuevo)
    return !Object.values(nuevo).some(Boolean)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validarTodo()) {
      return
    }

    setCargando(true)
    setAlerta({ tipo: '', mensaje: '' })

    try {
      const data = await iniciarSesion({
        correo: form.correo.trim().toLowerCase(),
        contrasena: form.contrasena,
      })

      guardarSesion({
        correo: data.correo,
        facultad: data.facultad || getNombreFacultad(data.idFacultad),
        idFacultad: data.idFacultad,
        rol: data.rol,
        token: data.token,
      })

      setAlerta({
        tipo: 'exito',
        mensaje: `¡Bienvenido! Ingresando como ${data.rol}...`,
      })

      setTimeout(() => {
        if (data.rol === 'SECRETARIA') {
          navigate('/dashboard-secretaria')
          return
        }

        navigate('/dashboard-docente')
      }, 1500)
    } catch (err: any) {
      setAlerta({
        tipo: 'error',
        mensaje: err.message || 'Correo o contraseña incorrectos.',
      })
    } finally {
      setCargando(false)
    }
  }

  return (
    <div className="auth-screen">
      <header className="auth-header">
        <h1>Sistema de Reservas</h1>
        <p className="sub1">Universidad UAO</p>
        <p className="sub2">Gestión de Salas de Reuniones</p>
      </header>

      <div className="auth-card">
        <h2>Iniciar sesión</h2>
        <p className="subtitulo">Ingresa con tu correo institucional</p>

        {alerta.mensaje && (
          <div className={`alerta alerta-${alerta.tipo}`}>
            <span>{alerta.tipo === 'exito' ? '✓' : '!'}</span>
            <span>{alerta.mensaje}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} noValidate>
          <div className="campo">
            <label htmlFor="correo">Correo institucional</label>
            <input
              id="correo"
              name="correo"
              type="email"
              value={form.correo}
              onChange={handleChange}
              onBlur={handleBlur}
              placeholder="usuario@uao.edu.co"
              className={errores.correo ? 'error' : ''}
            />
            {errores.correo && (
              <p className="msg-error">
                <span>⚠</span>
                {errores.correo}
              </p>
            )}
          </div>

          <div className="campo">
            <label htmlFor="contrasena">Contraseña</label>
            <input
              id="contrasena"
              name="contrasena"
              type="password"
              value={form.contrasena}
              onChange={handleChange}
              onBlur={handleBlur}
              placeholder="Tu contraseña"
              className={errores.contrasena ? 'error' : ''}
            />
            {errores.contrasena && (
              <p className="msg-error">
                <span>⚠</span>
                {errores.contrasena}
              </p>
            )}
          </div>

          <button type="submit" className="btn-primary" disabled={cargando}>
            {cargando ? 'Ingresando...' : 'Iniciar sesión'}
          </button>
        </form>

        <p className="auth-link">
          ¿No tienes cuenta? <Link to="/registro">Regístrate</Link>
        </p>
      </div>

      <p className="info-horario">Horario de reservas: 7:00 AM - 9:30 PM</p>
    </div>
  )
}
