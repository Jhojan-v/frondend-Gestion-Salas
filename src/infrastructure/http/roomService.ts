const BASE_URL = "http://localhost:8090";

export const crearSala = async (datos: {
  nombre: string;
  ubicacion: string;
  capacidad: number;
  facultad: string;
}) => {
  const response = await fetch(`${BASE_URL}/salas`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(datos),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.mensaje || data.message || "Error al crear la sala");
  }

  return data;
};