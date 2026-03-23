import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { crearSala } from "../../infrastructure/http/roomService";
import { useAuth } from "../../shared/context/AuthContext";
import "../../styles/RegisterPage.css";

const validarNombre = (v: string) => {
  if (!v) return "El nombre es obligatorio.";
  if (v.length < 3) return "Mínimo 3 caracteres.";
  return "";
};

const validarUbicacion = (v: string) => {
  if (!v) return "La ubicación es obligatoria.";
  return "";
};

const validarCapacidad = (v: string) => {
  if (!v) return "La capacidad es obligatoria.";
  const num = Number(v);
  if (isNaN(num)) return "Debe ser un número.";
  if (num < 2 || num > 100) return "Debe estar entre 2 y 100.";
  return "";
};

export default function CreateRoomPage() {
  const navigate = useNavigate();
  const { usuario, cerrarSesion } = useAuth();

  const [form, setForm] = useState({ nombre: "", ubicacion: "", capacidad: "" });
  const [errores, setErrores] = useState({ nombre: "", ubicacion: "", capacidad: "" });
  const [alerta, setAlerta] = useState({ tipo: "", mensaje: "" });
  const [cargando, setCargando] = useState(false);

  if (!usuario || usuario.rol !== "SECRETARIA") {
    return (
      <div style={{ minHeight: "100vh", background: "#fce8ea", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'Segoe UI', sans-serif" }}>
        <div style={{ background: "#fff", borderRadius: 16, padding: "2.5rem 2rem", maxWidth: 400, width: "100%", textAlign: "center", border: "1px solid #e8d5d7" }}>
          <h2 style={{ color: "#1a1a1a", margin: "0 0 0.5rem" }}>Acceso restringido</h2>
          <p style={{ color: "#666", fontSize: "0.88rem", marginBottom: "1.5rem" }}>Solo las secretarias pueden crear salas.</p>
          <button onClick={() => navigate("/login")} style={{ width: "100%", padding: "0.85rem", background: "#c1121f", color: "#fff", border: "none", borderRadius: 10, fontSize: "0.95rem", fontWeight: 600, cursor: "pointer" }}>
            Volver al inicio
          </button>
        </div>
      </div>
    );
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setForm((p) => ({ ...p, [name]: value }));
    if (errores[name as keyof typeof errores]) setErrores((p) => ({ ...p, [name]: "" }));
    if (alerta.mensaje) setAlerta({ tipo: "", mensaje: "" });
  };

  const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    const fns = { nombre: validarNombre, ubicacion: validarUbicacion, capacidad: validarCapacidad };
    setErrores((p) => ({ ...p, [name]: fns[name as keyof typeof fns](value) }));
  };

  const validarTodo = () => {
    const nuevo = {
      nombre: validarNombre(form.nombre),
      ubicacion: validarUbicacion(form.ubicacion),
      capacidad: validarCapacidad(form.capacidad),
    };
    setErrores(nuevo);
    return !Object.values(nuevo).some(Boolean);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validarTodo()) return;
    setCargando(true);
    setAlerta({ tipo: "", mensaje: "" });
    try {
      await crearSala({
        nombre: form.nombre,
        ubicacion: form.ubicacion,
        capacidad: Number(form.capacidad),
        facultad: usuario.facultad,
      });
      setAlerta({ tipo: "exito", mensaje: `Sala "${form.nombre}" creada exitosamente.` });
      setForm({ nombre: "", ubicacion: "", capacidad: "" });
    } catch (err: any) {
      const msg = err.message || "";
      if (msg.toLowerCase().includes("nombre")) {
        setErrores((p) => ({ ...p, nombre: "Ya existe una sala con ese nombre." }));
      } else {
        setAlerta({ tipo: "error", mensaje: msg || "Error técnico. Intenta de nuevo." });
      }
    } finally {
      setCargando(false);
    }
  };

  return (
    <div style={{ display: "flex", minHeight: "100vh", fontFamily: "'Segoe UI', sans-serif" }}>

      {/* Sidebar */}
      <aside style={{ width: 240, minHeight: "100vh", background: "#c1121f", display: "flex", flexDirection: "column", padding: "1.5rem 0", flexShrink: 0 }}>
        <div style={{ padding: "0 1.5rem 1.5rem", borderBottom: "1px solid rgba(255,255,255,0.15)" }}>
          <h2 style={{ color: "#fff", fontSize: "1.1rem", fontWeight: 700, margin: 0 }}>Sistema de Reservas</h2>
          <p style={{ color: "rgba(255,255,255,0.7)", fontSize: "0.78rem", margin: "4px 0 0" }}>Universidad UAO</p>
        </div>

        <nav style={{ marginTop: "1rem", flex: 1 }}>
          <div onClick={() => navigate("/dashboard-secretaria")}
            style={{ padding: "0.75rem 1.5rem", color: "rgba(255,255,255,0.8)", fontSize: "0.9rem", cursor: "pointer" }}>
            Dashboard
          </div>
          <div onClick={() => navigate("/mis-reservas")}
            style={{ padding: "0.75rem 1.5rem", color: "rgba(255,255,255,0.8)", fontSize: "0.9rem", cursor: "pointer" }}>
            Mis Reservas
          </div>
          <div style={{ padding: "0.75rem 1.5rem", color: "#fff", fontSize: "0.9rem", cursor: "pointer", background: "rgba(0,0,0,0.2)", fontWeight: 600 }}>
            Crear Sala
          </div>
        </nav>

        <div style={{ padding: "1rem 1.5rem", borderTop: "1px solid rgba(255,255,255,0.15)" }}>
          <div onClick={() => { cerrarSesion(); navigate("/login"); }}
            style={{ color: "rgba(255,255,255,0.8)", fontSize: "0.9rem", cursor: "pointer" }}>
            Cerrar sesion
          </div>
        </div>
      </aside>

      {/* Contenido principal */}
      <div style={{ flex: 1, background: "#fce8ea", display: "flex", flexDirection: "column" }}>

        {/* Header */}
        <header style={{ background: "#fff", padding: "1rem 2rem", display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid #e8d5d7" }}>
          <div>
            <h3 style={{ margin: 0, fontSize: "1rem", fontWeight: 600, color: "#1a1a1a" }}>Panel de Gestion</h3>
            <p style={{ margin: 0, fontSize: "0.8rem", color: "#666" }}>Gestion de Salas de Reuniones</p>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "0.6rem", background: "#fce8ea", padding: "0.5rem 1rem", borderRadius: 10 }}>
            <div style={{ width: 32, height: 32, borderRadius: "50%", background: "#c1121f", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: "0.8rem", fontWeight: 700 }}>
              {usuario.correo.charAt(0).toUpperCase()}
            </div>
            <div>
              <p style={{ margin: 0, fontSize: "0.82rem", fontWeight: 600, color: "#1a1a1a" }}>{usuario.correo}</p>
              <p style={{ margin: 0, fontSize: "0.75rem", color: "#666" }}>{usuario.rol}</p>
            </div>
          </div>
        </header>

        {/* Formulario */}
        <main style={{ padding: "2rem", flex: 1 }}>
          <h2 style={{ fontSize: "1.5rem", fontWeight: 700, color: "#1a1a1a", margin: "0 0 0.3rem" }}>Crear sala de reuniones</h2>
          <p style={{ color: "#666", fontSize: "0.88rem", marginBottom: "1.5rem" }}>Registra un nuevo espacio disponible para tu facultad</p>

          <div style={{ background: "#fff", borderRadius: 16, padding: "2rem", maxWidth: 600, border: "1px solid #e8d5d7" }}>

            {alerta.mensaje && (
              <div style={{ borderRadius: 10, padding: "0.8rem 1rem", fontSize: "0.85rem", marginBottom: "1.2rem", display: "flex", gap: "0.5rem", background: alerta.tipo === "exito" ? "#f0faf2" : "#fff0f0", color: alerta.tipo === "exito" ? "#1e6630" : "#9b0e18", border: `1px solid ${alerta.tipo === "exito" ? "rgba(30,102,48,0.2)" : "rgba(193,18,31,0.2)"}` }}>
                <span>{alerta.tipo === "exito" ? "+" : "!"}</span>
                <span>{alerta.mensaje}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} noValidate>

              <div style={{ marginBottom: "1.1rem" }}>
                <label style={{ display: "block", fontSize: "0.83rem", fontWeight: 600, color: "#1a1a1a", marginBottom: "0.4rem" }}>Nombre de la sala</label>
                <input name="nombre" type="text" value={form.nombre} onChange={handleChange} onBlur={handleBlur} placeholder="Ej: Sala A-101"
                  style={{ width: "100%", padding: "0.75rem 1rem", border: `1.5px solid ${errores.nombre ? "#c1121f" : "#e8d5d7"}`, borderRadius: 10, fontSize: "0.9rem", outline: "none", boxSizing: "border-box", background: errores.nombre ? "#fff5f5" : "#fff" }} />
                {errores.nombre && <p style={{ fontSize: "0.78rem", color: "#c1121f", margin: "0.3rem 0 0" }}>! {errores.nombre}</p>}
              </div>

              <div style={{ marginBottom: "1.1rem" }}>
                <label style={{ display: "block", fontSize: "0.83rem", fontWeight: 600, color: "#1a1a1a", marginBottom: "0.4rem" }}>Ubicacion</label>
                <input name="ubicacion" type="text" value={form.ubicacion} onChange={handleChange} onBlur={handleBlur} placeholder="Ej: Bloque B, Piso 2"
                  style={{ width: "100%", padding: "0.75rem 1rem", border: `1.5px solid ${errores.ubicacion ? "#c1121f" : "#e8d5d7"}`, borderRadius: 10, fontSize: "0.9rem", outline: "none", boxSizing: "border-box", background: errores.ubicacion ? "#fff5f5" : "#fff" }} />
                {errores.ubicacion && <p style={{ fontSize: "0.78rem", color: "#c1121f", margin: "0.3rem 0 0" }}>! {errores.ubicacion}</p>}
              </div>

              <div style={{ marginBottom: "1.1rem" }}>
                <label style={{ display: "block", fontSize: "0.83rem", fontWeight: 600, color: "#1a1a1a", marginBottom: "0.4rem" }}>Capacidad (entre 2 y 100 personas)</label>
                <input name="capacidad" type="number" value={form.capacidad} onChange={handleChange} onBlur={handleBlur} placeholder="Ej: 20" min={2} max={100}
                  style={{ width: "100%", padding: "0.75rem 1rem", border: `1.5px solid ${errores.capacidad ? "#c1121f" : "#e8d5d7"}`, borderRadius: 10, fontSize: "0.9rem", outline: "none", boxSizing: "border-box", background: errores.capacidad ? "#fff5f5" : "#fff" }} />
                {errores.capacidad && <p style={{ fontSize: "0.78rem", color: "#c1121f", margin: "0.3rem 0 0" }}>! {errores.capacidad}</p>}
              </div>

              <div style={{ display: "flex", gap: "1rem", marginTop: "1.5rem" }}>
                <button type="submit" disabled={cargando}
                  style={{ flex: 1, padding: "0.85rem", background: "#c1121f", color: "#fff", border: "none", borderRadius: 10, fontSize: "0.95rem", fontWeight: 600, cursor: "pointer" }}>
                  {cargando ? "Creando sala..." : "Crear sala"}
                </button>
                <button type="button" onClick={() => setForm({ nombre: "", ubicacion: "", capacidad: "" })}
                  style={{ padding: "0.85rem 1.5rem", background: "#fce8ea", color: "#c1121f", border: "1px solid #e8d5d7", borderRadius: 10, fontSize: "0.95rem", fontWeight: 600, cursor: "pointer" }}>
                  Cancelar
                </button>
              </div>

            </form>
          </div>
        </main>
      </div>
    </div>
  );
}