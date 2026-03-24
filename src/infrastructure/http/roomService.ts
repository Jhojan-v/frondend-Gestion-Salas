import { API_BASE_URL } from './apiConfig'

export const crearSala = async (datos: {
  nombre: string
  ubicacion: string
  capacidad: number
  facultad: string
}) => {
  let response: Response

  try {
    response = await fetch(`${API_BASE_URL}/api/salas`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Usuario-Id': '1',
        'X-Facultad-Id': '1',
        'X-Rol': 'SECRETARIA',
      },
      body: JSON.stringify({
        nombre: datos.nombre,
        ubicacion: datos.ubicacion,
        capacidad: datos.capacidad,
        facultad: datos.facultad,
      }),
    })
  } catch {
    throw new Error('No fue posible conectar con el backend en http://localhost:8080.')
  }

  if (response.status === 405) {
    throw new Error(
      'El backend actual no tiene habilitado un endpoint POST para crear salas todavía.',
    )
  }

  const rawBody = await response.text()
  const data = rawBody ? JSON.parse(rawBody) : null

  if (!response.ok) {
    throw new Error(data?.mensaje || data?.message || 'Error al crear la sala')
  }

  return data
}
