export const FACULTADES = [
  { id: 1, nombre: 'Facultad de Ingenieria y Ciencias Basicas' },
  { id: 2, nombre: 'Facultad de Comunicacion Social, Humanidades y Artes' },
  { id: 3, nombre: 'Facultad de Arquitectura, Urbanismo y Diseno' },
  { id: 4, nombre: 'Facultad de Administracion' },
]

// Catalogo local de apoyo.
export function getNombreFacultad(idFacultad: number | null | undefined) {
  return FACULTADES.find((facultad) => facultad.id === idFacultad)?.nombre ?? ''
}

// Prioriza backend y cae al catalogo.
export function resolverNombreFacultad(
  facultad: string | null | undefined,
  idFacultad: number | null | undefined,
) {
  const nombreBackend = facultad?.trim()

  if (nombreBackend) {
    return nombreBackend
  }

  const nombreCatalogo = getNombreFacultad(idFacultad)

  if (nombreCatalogo) {
    return nombreCatalogo
  }

  if (idFacultad !== null && idFacultad !== undefined) {
    return `Facultad ID ${idFacultad}`
  }

  return 'Sin facultad asignada'
}
