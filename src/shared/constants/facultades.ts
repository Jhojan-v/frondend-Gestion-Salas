export const FACULTADES = [
  { id: 3, nombre: 'Facultad de Ingeniería y Ciencias Básicas' },
  { id: 4, nombre: 'Facultad de Comunicación Social, Humanidades y Artes' },
  { id: 5, nombre: 'Facultad de Arquitectura, Urbanismo y Diseño' },
  { id: 6, nombre: 'Facultad de Administración' },
]

export function getNombreFacultad(idFacultad: number | null | undefined) {
  return FACULTADES.find((facultad) => facultad.id === idFacultad)?.nombre ?? ''
}
