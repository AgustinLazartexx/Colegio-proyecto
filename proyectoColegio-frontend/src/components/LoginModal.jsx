// src/components/LoginModal.jsx
import { useState } from "react";
import { X, Eye, EyeOff } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";

const LoginModal = ({ isOpen, onClose }) => {
  const [formData, setFormData] = useState({ email: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false); // Nuevo estado para la visibilidad
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const { email, password } = formData;

    if (!email || !password) {
      return toast.error("Completa ambos campos, por favor.");
    }

    try {
      setLoading(true);

      const user = await toast.promise(
        login(email, password),
        {
          pending: "Verificando credenciales...",
          success: {
            render() {
              return "¡Bienvenido!";
            },
          },
          error: "Credenciales inválidas o error del servidor",
        },
        {
          autoClose: 2000,
        }
      );

      // Esperar a que se cierre el toast para redirigir
      setTimeout(() => {
        switch (user.rol) {
          case "alumno":
            navigate("/alumno");
            break;
          case "profesor":
            navigate("/profesor");
            break;
          case "admin":
            navigate("/admin/Inicio");
            break;
          default:
            navigate("/");
        }
        onClose(); // cerrar el modal después de redirigir
      }, 2200); // un poco más que el autoClose del toast
    } catch (err) {
      console.error("Error al iniciar sesión:", err);
    } finally {
      setLoading(false);
    }
  };

  const togglePasswordVisibility = () => {
    setShowPassword((prev) => !prev);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-2xl p-8 w-full max-w-md m-4 relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-500 hover:text-gray-800"
        >
          <X size={24} />
        </button>
        <h2 className="text-2xl font-bold text-accent mb-6">Iniciar Sesión</h2>
        <form onSubmit={handleSubmit}>
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
              autoComplete="email"
            />
          </div>

          <div className="mb-6 relative">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Contraseña
            </label>
            <input
              type={showPassword ? "text" : "password"} // Tipo dinámico
              name="password"
              value={formData.password}
              onChange={handleChange}
              className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-accent pr-10" // pr-10 para el botón
              autoComplete="current-password"
            />
            <button
              type="button"
              onClick={togglePasswordVisibility}
              className="absolute inset-y-0 right-0 top-6 pr-3 flex items-center text-gray-500"
            >
              {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
            </button>
          </div>

          <button
            type="submit"
            disabled={loading}
            className={`w-full ${
              loading ? "bg-gray-400" : "bg-accent hover:bg-blue-900"
            } text-white py-2 rounded-lg font-semibold transition`}
          >
            {loading ? "Ingresando..." : "Iniciar Sesión"}
          </button>
        </form>
      </div>
    </div>
  );
};

export default LoginModal;