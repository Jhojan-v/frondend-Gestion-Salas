const BASE_URL = "http://localhost:8090";

export const registrarUsuario = async (datos: {
  correo: string;
  facultad: string;
  contrasena: string;
}) => {
  const response = await fetch(`${BASE_URL}/api/usuarios/registrar`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      email: datos.correo,
      password: datos.contrasena,
      facultad: datos.facultad,
    }),
  });

  const texto = await response.text();

  if (texto.includes("inválid") || texto.includes("obligatori") ||
      texto.includes("registrado") || texto.includes("institucional")) {
    throw new Error(texto);
  }

  return texto;
};

export const iniciarSesion = async (datos: {
  correo: string;
  contrasena: string;
}) => {
  const response = await fetch(`${BASE_URL}/api/usuarios/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      email: datos.correo,
      password: datos.contrasena,
    }),
  });

  if (!response.ok || response.status === 204) {
    throw new Error("Correo o contraseña incorrectos.");
  }

  const data = await response.json();

  if (!data) {
    throw new Error("Correo o contraseña incorrectos.");
  }

  return data;
};