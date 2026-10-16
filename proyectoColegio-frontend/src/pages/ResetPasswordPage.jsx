import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { toast } from "react-toastify";
import { restablecerPassword } from "../api/api";

const ResetPasswordPage = () => {
  const [searchParams] = useSearchParams();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const token = searchParams.get("token");

  useEffect(() => {
    if (!token) {
      toast.error("El enlace de recuperación es inválido o faltante.");
    }
  }, [token]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!token) {
      toast.error("El enlace de recuperación es inválido o faltante.");
      return;
    }

    if (password.length < 6) {
      toast.error("La contraseña debe tener al menos 6 caracteres.");
      return;
    }

    if (password !== confirmPassword) {
      toast.error("Las contraseñas no coinciden.");
      return;
    }

    setLoading(true);

    try {
      await restablecerPassword(token, password);
      setSuccess(true);
      toast.success("Contraseña actualizada correctamente.");
    } catch (error) {
      toast.error(error.response?.data?.msg || "No se pudo restablecer la contraseña.");
    } finally {
      setLoading(false);
    }
  };

  if (!token) {
    return (
      <div className="min-h-screen bg-slate-100 flex items-center justify-center px-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-md">
          <p className="text-sm font-semibold text-red-700 uppercase tracking-wide">Enlace inválido</p>
          <h1 className="mt-2 text-2xl font-bold text-slate-900">No pudimos validar este enlace</h1>
          <p className="mt-2 text-sm text-slate-600">Solicita un nuevo enlace de recuperación para continuar.</p>
          <div className="mt-4">
            <Link to="/forgot-password" className="inline-flex rounded-lg bg-blue-700 px-4 py-2 text-white font-semibold hover:bg-blue-800">
              Solicitar nuevo enlace
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100 flex items-center justify-center px-4">
      <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-md">
        <div className="mb-6">
          <p className="text-sm font-semibold text-blue-700 uppercase tracking-wide">Restablecer contraseña</p>
          <h1 className="mt-2 text-2xl font-bold text-slate-900">Crea una nueva contraseña</h1>
          <p className="mt-2 text-sm text-slate-600">Ingresa tu nueva contraseña para completar el proceso.</p>
        </div>

        {success ? (
          <div className="space-y-4">
            <div className="rounded-xl bg-green-50 border border-green-200 p-4 text-sm text-green-800">
              Tu contraseña se actualizó correctamente. Ya podés iniciar sesión con la nueva contraseña.
            </div>
            <Link to="/" className="inline-flex rounded-lg bg-blue-700 px-4 py-2 text-white font-semibold hover:bg-blue-800">
              Ir al inicio
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1" htmlFor="password">
                Nueva contraseña
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Mínimo 6 caracteres"
                autoComplete="new-password"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1" htmlFor="confirmPassword">
                Confirmar contraseña
              </label>
              <input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Repetí la contraseña"
                autoComplete="new-password"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className={`w-full rounded-lg py-2 font-semibold text-white transition ${loading ? "bg-blue-300" : "bg-blue-700 hover:bg-blue-800"}`}
            >
              {loading ? "Guardando..." : "Restablecer contraseña"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

export default ResetPasswordPage;
