import { useState } from "react";
import { Link } from "react-router-dom";
import { toast } from "react-toastify";
import { solicitarRecuperacion } from "../api/api";

const ForgotPasswordPage = () => {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!email.trim()) {
      toast.error("Ingresa tu correo electrónico.");
      return;
    }

    setLoading(true);

    try {
      await solicitarRecuperacion(email.trim());
      setSubmitted(true);
      toast.success("Si el correo existe, recibirás instrucciones para restablecer tu contraseña.");
    } catch (error) {
      toast.error(error.response?.data?.msg || "No se pudo procesar la solicitud.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 flex items-center justify-center px-4">
      <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-md">
        <div className="mb-6">
          <p className="text-sm font-semibold text-blue-700 uppercase tracking-wide">Recuperación de contraseña</p>
          <h1 className="mt-2 text-2xl font-bold text-slate-900">¿Olvidaste tu contraseña?</h1>
          <p className="mt-2 text-sm text-slate-600">
            Ingresá tu correo electrónico y te enviaremos un enlace para restablecerla.
          </p>
        </div>

        {submitted ? (
          <div className="rounded-xl bg-green-50 border border-green-200 p-4 text-sm text-green-800">
            Revisa tu correo electrónico. Si el correo existe, encontrarás un enlace de recuperación que expira en 15 minutos.
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1" htmlFor="email">
                Correo electrónico
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="correo@ejemplo.com"
                autoComplete="email"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className={`w-full rounded-lg py-2 font-semibold text-white transition ${loading ? "bg-blue-300" : "bg-blue-700 hover:bg-blue-800"}`}
            >
              {loading ? "Enviando..." : "Enviar enlace"}
            </button>
          </form>
        )}

        <div className="mt-4 text-sm text-slate-600">
          <Link to="/" className="text-blue-700 font-medium hover:underline">
            Volver al inicio
          </Link>
        </div>
      </div>
    </div>
  );
};

export default ForgotPasswordPage;
