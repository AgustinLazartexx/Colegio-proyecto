import { useState } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import { X } from "lucide-react";

const RegisterModal = ({ isOpen, onClose }) => {
  // 1. Añadimos el estado para la carga
  const [isLoading, setIsLoading] = useState(false);

  const [formData, setFormData] = useState({
    nombre: "",
    email: "",
    password: "",
    confirmPassword: "",
    rol: "",
  });

  const handleChange = (e) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const { nombre, email, password, confirmPassword, rol } = formData;

    // --- Validaciones iniciales ---
    if (!nombre || !email || !password || !confirmPassword || !rol) {
      toast.error("Todos los campos son obligatorios");
      return;
    }
    if (password !== confirmPassword) {
      toast.error("Las contraseñas no coinciden");
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      toast.error("Ingrese un correo electrónico válido");
      return;
    }
    // --- Fin de validaciones ---


    // 2. Activamos el estado de carga antes de la petición
    setIsLoading(true);

    try {
      await axios.post(`${import.meta.env.VITE_API_URL}/api/usuarios/register`, formData);
      toast.success("Registro exitoso 🎉", { autoClose: 3000 });
      onClose();
    } catch (error) {
      console.error("Error al registrar:", error);

      if (error.response && error.response.data) {
        if (error.response.data.errores) {
          error.response.data.errores.forEach(err => toast.error(err.msg));
        } else {
          toast.error(error.response.data.msg || "Hubo un error al registrar");
        }
      } else {
        toast.error("Error de conexión. Intenta más tarde.");
      }
    } finally {
      // 3. Desactivamos el estado de carga al finalizar (sea éxito o error)
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-2xl p-8 w-full max-w-md m-4 relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-500 hover:text-gray-800"
          disabled={isLoading} // Opcional: deshabilitar la X mientras carga
        >
          <X size={24} />
        </button>
        <h2 className="text-2xl font-bold text-accent mb-6">Crear Cuenta</h2>
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nombre completo
            </label>
            <input
              type="text"
              name="nombre"
              value={formData.nombre}
              onChange={handleChange}
              className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-accent"
            />
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Correo electrónico
            </label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-accent"
            />
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Contraseña
            </label>
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-accent"
            />
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
                Confirmar Contraseña
            </label>
            <input
              type="password"
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleChange}
              className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-accent"
            />
          </div>

          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Rol
            </label>
            <select
              name="rol"
              value={formData.rol}
              onChange={handleChange}
              className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-accent"
            >
              <option value="">Selecciona un rol</option>
              <option value="alumno">Alumno</option>
              <option value="profesor">Profesor</option>
              <option value="admin">Administrativo</option>
            </select>
          </div>

          {/* 4. El botón cambia su texto y estado según isLoading */}
          <button
            type="submit"
            className="w-full bg-accent text-white py-2 rounded-lg font-semibold hover:bg-blue-900 transition disabled:bg-gray-400"
            disabled={isLoading}
          >
            {isLoading ? "Registrando..." : "Registrarse"}
          </button>
        </form>
      </div>
    </div>
  );
};

export default RegisterModal;