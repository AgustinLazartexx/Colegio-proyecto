// src/context/AuthContext.jsx
import { createContext, useContext, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [usuario, setUsuario] = useState(null);
  const [token, setToken] = useState(null);
  const [authCargando, setAuthCargando] = useState(true);
  const navigate = useNavigate();

  // Verificar si ya hay usuario logueado al cargar
  useEffect(() => {
    const user = localStorage.getItem("usuario");
    const storedToken = localStorage.getItem("token");

    if (user && storedToken) {
      setUsuario(JSON.parse(user));
      setToken(storedToken);
    }

    setAuthCargando(false); // ya terminó la carga, incluso si no hay usuario
  }, []);

  const login = async (email, password) => {
    try {
      const res = await axios.post("http://localhost:5000/api/auth/login", {
        email,
        password,
      });

      const { token, user: usuario } = res.data;

      localStorage.setItem("token", token);
      localStorage.setItem("usuario", JSON.stringify(usuario));

      setUsuario(usuario);
      setToken(token);

      return usuario;
    } catch (error) {
      throw new Error(error.response?.data?.msg || "Error en el login");
    }
  };

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("usuario");
    setUsuario(null);
    setToken(null);
    navigate("/");
  };

  return (
    <AuthContext.Provider
      value={{
        usuario,
        token,
        login,
        logout,
        authCargando, // nuevo: para indicar si todavía está cargando
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
