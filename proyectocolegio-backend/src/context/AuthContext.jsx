// src/context/AuthContext.jsx
import { createContext, useContext, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/api";

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [usuario, setUsuario] = useState(null);
  const [token, setToken] = useState(null);
  const [authCargando, setAuthCargando] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const verificarSesion = async () => {
      const storedToken = localStorage.getItem("token");

      if (!storedToken) {
        setAuthCargando(false);
        return;
      }

      try {
        // CAMBIO: Eliminamos la línea redundante que estaba aquí.
        // La cabecera se pasa explícitamente en la llamada `get` de abajo,
        // que es la forma más segura para esta verificación inicial.
        
        const res = await api.get("/auth/verify", {
          headers: {
            Authorization: `Bearer ${storedToken}`
          }
        });

        // Si la verificación fue exitosa, el interceptor de api.js
        // ya usará el token guardado en localStorage.
        api.defaults.headers.common['Authorization'] = `Bearer ${storedToken}`;
        setUsuario(res.data.user);
        setToken(storedToken);

      } catch (error) {
        console.error("La sesión guardada no es válida:", error.message);
        localStorage.removeItem("token");
        localStorage.removeItem("usuario");
        setUsuario(null);
        setToken(null);
      } finally {
        setAuthCargando(false);
      }
    };

    verificarSesion();
  }, []);

  const login = async (email, password) => {
    try {
      const res = await api.post("/auth/login", { email, password });
      const { token, user: loggedUser } = res.data;

      localStorage.setItem("token", token);
      localStorage.setItem("usuario", JSON.stringify(loggedUser));

      setUsuario(loggedUser);
      setToken(token);
      
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      return loggedUser;
    } catch (error) {
      throw new Error(error.response?.data?.msg || "Error en el login");
    }
  };

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("usuario");
    setUsuario(null);
    setToken(null);
    delete api.defaults.headers.common['Authorization'];
    navigate("/");
  };

  return (
    <AuthContext.Provider
      value={{
        usuario,
        token,
        login,
        logout,
        authCargando,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);

export { api };