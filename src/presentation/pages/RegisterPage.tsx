import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { registrarUsuario } from '../../infrastructure/http/authService'
import { FACULTADES } from '../../shared/constants/facultades'
import '../../styles/RegisterPage.css'

const DOMINIO = '@uao.edu.co'

const validarNombre = (v: string) => {
  if (!v.trim()) return 'El nombre es obligatorio.'
  if (v.trim().length < 3) return 'Mínimo 3 caracteres.'
  return ''
}

const validarCorreo = (v: string) => {
  if (!v) return 'El correo es obligatorio.'
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)) return 'El formato del correo no es válido.'
  if (!v.endsWith(DOMINIO)) return `El correo debe terminar en ${DOMINIO}`
  return ''
}

const validarFacultad = (v: string) => (!v ? 'Selecciona tu facultad.' : '')

const validarContrasena = (v: string) => {
  if (!v) return 'La contraseña es obligatoria.'
  if (v.length < 8) return 'Mínimo 8 caracteres.'
  if (!/[A-Z]/.test(v)) return 'Debe incluir al menos una mayúscula.'
  if (!/[^a-zA-Z0-9]/.test(v)) return 'Debe incluir al menos un carácter especial.'
  return ''
}

export default function RegisterPage() {
  const navigate = useNavigate()

  const [form, setForm] = useState({
    nombre: '',
    correo: '',
    idFacultad: '',
    contrasena: '',
  })
  const [errores, setErrores] = useState({
    nombre: '',
    correo: '',
    idFacultad: '',
    contrasena: '',
  })
  const [alerta, setAlerta] = useState({ tipo: '', mensaje: '' })
  const [cargando, setCargando] = useState(false)
  const [focusPass, setFocusPass] = useState(false)

  const req = {
    longitud: form.contrasena.length >= 8,
    mayuscula: /[A-Z]/.test(form.contrasena),
    especial: /[^a-zA-Z0-9]/.test(form.contrasena),
  }

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => {
    const { name, value } = e.target
    setForm((prev) => ({ ...prev, [name]: value }))

    if (errores[name as keyof typeof errores]) {
      setErrores((prev) => ({ ...prev, [name]: '' }))
    }

    if (alerta.mensaje) {
      setAlerta({ tipo: '', mensaje: '' })
    }
  }

  const handleBlur = (
    e: React.FocusEvent<HTMLInputElement | HTMLSelectElement>,
  ) => {
    const { name, value } = e.target
    const validators = {
      nombre: validarNombre,
      correo: validarCorreo,
      idFacultad: validarFacultad,
      contrasena: validarContrasena,
    }

    setErrores((prev) => ({
      ...prev,
      [name]: validators[name as keyof typeof validators](value),
    }))

    if (name === 'contrasena') {
      setFocusPass(false)
    }
  }

  const validarTodo = () => {
    const nuevo = {
      nombre: validarNombre(form.nombre),
      correo: validarCorreo(form.correo),
      idFacultad: validarFacultad(form.idFacultad),
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
      await registrarUsuario({
        nombre: form.nombre.trim(),
        correo: form.correo.trim().toLowerCase(),
        idFacultad: Number(form.idFacultad),
        contrasena: form.contrasena,
      })

      setAlerta({
        tipo: 'exito',
        mensaje: '¡Cuenta creada! Redirigiendo al inicio de sesión...',
      })

      setTimeout(() => navigate('/login'), 2000)
    } catch (err: any) {
      const msg = err.message || ''

      if (msg.toLowerCase().includes('correo') && msg.toLowerCase().includes('registrado')) {
        setErrores((prev) => ({ ...prev, correo: 'Este correo ya está registrado.' }))
      } else {
        setAlerta({ tipo: 'error', mensaje: msg || 'Error técnico. Intenta de nuevo.' })
      }
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
        <h2>Crear cuenta</h2>
        <p className="subtitulo">
          Regístrate con tu correo institucional <b>{DOMINIO}</b>
        </p>

        {alerta.mensaje && (
          <div className={`alerta alerta-${alerta.tipo}`}>
            <span>{alerta.tipo === 'exito' ? '✓' : '!'}</span>
            <span>{alerta.mensaje}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} noValidate>
          <div className="campo">
            <label htmlFor="nombre">Nombre completo</label>
            <input
              id="nombre"
              name="nombre"
              type="text"
              value={form.nombre}
              onChange={handleChange}
              onBlur={handleBlur}
              placeholder="Ej: Jhojan Valencia"
              className={errores.nombre ? 'error' : ''}
            />
            {errores.nombre && (
              <p className="msg-error">
                <span>⚠</span>
                {errores.nombre}
              </p>
            )}
          </div>

          <div className="campo">
            <label htmlFor="correo">Correo institucional</label>
            <input
              id="correo"
              name="correo"
              type="email"
              value={form.correo}
              onChange={handleChange}
              onBlur={handleBlur}
              placeholder={`usuario${DOMINIO}`}
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
            <label htmlFor="idFacultad">Facultad</label>
            <select
              id="idFacultad"
              name="idFacultad"
              value={form.idFacultad}
              onChange={handleChange}
              onBlur={handleBlur}
              className={errores.idFacultad ? 'error' : ''}
            >
              <option value="">Selecciona tu facultad</option>
              {FACULTADES.map((facultad) => (
                <option key={facultad.id} value={facultad.id}>
                  {facultad.nombre}
                </option>
              ))}
            </select>
            {errores.idFacultad && (
              <p className="msg-error">
                <span>⚠</span>
                {errores.idFacultad}
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
              onFocus={() => setFocusPass(true)}
              placeholder="Mínimo 8 caracteres"
              className={errores.contrasena ? 'error' : ''}
            />
            {errores.contrasena && (
              <p className="msg-error">
                <span>⚠</span>
                {errores.contrasena}
              </p>
            )}

            {(focusPass || form.contrasena.length > 0) && (
              <div className="requisitos-box">
                <div className={`req-item ${req.longitud ? 'ok' : ''}`}>
                  <span className="req-dot" />
                  Mínimo 8 caracteres
                </div>
                <div className={`req-item ${req.mayuscula ? 'ok' : ''}`}>
                  <span className="req-dot" />
                  Al menos una mayúscula
                </div>
                <div className={`req-item ${req.especial ? 'ok' : ''}`}>
                  <span className="req-dot" />
                  Al menos un carácter especial (!@#$%...)
                </div>
              </div>
            )}
          </div>

          <button type="submit" className="btn-primary" disabled={cargando}>
            {cargando ? 'Creando cuenta...' : 'Crear cuenta'}
          </button>
        </form>

        <p className="auth-link">
          ¿Ya tienes cuenta? <Link to="/login">Inicia sesión</Link>
        </p>
      </div>

      <p className="info-horario">Horario de reservas: 7:00 AM - 9:30 PM</p>
    </div>
  )
}
