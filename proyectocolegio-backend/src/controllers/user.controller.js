// src/controllers/user.controller.js
import User from "../models/User.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken"; // Necesario para login
import { validationResult } from "express-validator"; // Útil si mantienes validaciones en rutas

// --- FUNCIÓN DE REGISTRO PÚBLICO ELIMINADA ---
// export const registerUser = async (req, res) => { ... }

// --- NUEVA FUNCIÓN: Solo Admin crea usuarios ---
export const adminCrearUsuario = async (req, res) => {
  // Asume que checkAuth y checkRole('admin') ya pasaron
  const { nombre, email, dni, rol, anio, division } = req.body;

  // Validación básica (puedes añadir express-validator en la ruta si prefieres)
  if (!nombre || !email || !rol || !dni) {
    return res.status(400).json({ msg: "Nombre, Email, DNI y Rol son requeridos." });
  }
  if (!["admin", "profesor", "alumno"].includes(rol)) {
     return res.status(400).json({ msg: "Rol inválido." });
  }
  if (rol === "alumno" && (!anio || !division)) {
     return res.status(400).json({ msg: "Año y División son requeridos para alumnos." });
  }

  try {
    const existeEmail = await User.findOne({ email });
    if (existeEmail) return res.status(400).json({ msg: "El email ya está registrado." });
    
    const existeDni = await User.findOne({ dni });
    if (existeDni) return res.status(400).json({ msg: "El DNI ya está registrado." });

    const nuevoUsuarioData = {
      nombre, email, dni, rol,
      password: dni, // Contraseña inicial = DNI
      mustChangePassword: true,
      isActive: true,
    };

    if (rol === "alumno") {
      nuevoUsuarioData.anio = parseInt(anio, 10);
      nuevoUsuarioData.division = division.toUpperCase();
      try {
           nuevoUsuarioData.codigoAlumno = await User.generarCodigoAlumno(anio, division.toUpperCase());
           const existeCodigo = await User.findOne({ codigoAlumno: nuevoUsuarioData.codigoAlumno });
            if (existeCodigo) {
               console.warn(`Conflicto de código de alumno: ${nuevoUsuarioData.codigoAlumno}. Reintentando...`);
               // Simple reintento (podría mejorarse con un loop o estrategia diferente)
               nuevoUsuarioData.codigoAlumno = await User.generarCodigoAlumno(anio, division.toUpperCase());
            }
      } catch(genError) {
          console.error("Error generando código de alumno:", genError);
          return res.status(500).json({ msg: "Error al generar código de alumno." });
      }
    }

    const nuevoUsuario = new User(nuevoUsuarioData);
    await nuevoUsuario.save();

    const usuarioCreado = nuevoUsuario.toObject();
    delete usuarioCreado.password; // Nunca devolver hash

    res.status(201).json({ msg: "Usuario creado exitosamente", usuario: usuarioCreado });

  } catch (error) {
    console.error("Error al crear usuario:", error);
     if (error.code === 11000) { // Error de índice único (email, dni, o codigoAlumno)
        let campoDuplicado = Object.keys(error.keyPattern)[0];
        return res.status(400).json({ msg: `El campo '${campoDuplicado}' ya está en uso.` });
     }
    res.status(500).json({ msg: "Error del servidor al crear usuario." });
  }
};


// --- LOGIN MODIFICADO ---
// Asume que tienes un controlador de autenticación separado o inclúyelo aquí
export const login = async (req, res) => {
  const { email, password } = req.body; // O podrías usar DNI para login también

  if (!email || !password) {
      return res.status(400).json({ msg: "Email y Contraseña son requeridos." });
  }

  try {
    const user = await User.findOne({ email });

    // IMPORTANTE: Asegúrate que la comparación de contraseña funcione con el DNI inicial
    if (!user || !(await user.matchPassword(password))) {
      return res.status(401).json({ msg: "Credenciales inválidas" });
    }

    if (!user.isActive) {
        return res.status(403).json({ msg: "Usuario deshabilitado." });
    }

    // Generar token JWT
    const token = jwt.sign(
        { id: user._id, rol: user.rol, nombre: user.nombre },
        process.env.JWT_SECRET,
        { expiresIn: '4h' } // O tu tiempo de expiración
    );

    // Devolver token Y flag 'mustChangePassword'
    res.json({
      token,
      usuario: {
        id: user._id,
        nombre: user.nombre,
        email: user.email,
        rol: user.rol,
        mustChangePassword: user.mustChangePassword // <-- ENVIAR FLAG
      }
    });
  } catch (error) {
      console.error("Error en login:", error);
      res.status(500).json({ msg: "Error del servidor durante el login." });
  }
};


// --- NUEVA FUNCIÓN: Cambiar Contraseña ---
export const cambiarPassword = async (req, res) => {
    const { currentPassword, newPassword } = req.body;
    // Asume checkAuth ya puso req.user
    const userId = req.user.id;

    if (!currentPassword || !newPassword) {
        return res.status(400).json({ msg: "Contraseña actual y nueva son requeridas." });
    }
    // Añade tus validaciones para newPassword (longitud, caracteres, etc.)
    if (newPassword.length < 6) {
        return res.status(400).json({ msg: "La nueva contraseña debe tener al menos 6 caracteres." });
    }
    // Opcional: Evitar que la nueva sea igual a la actual (o al DNI si es la primera vez)
    // if (newPassword === currentPassword) { ... }

    try {
        const user = await User.findById(userId);
        if (!user) return res.status(404).json({ msg: "Usuario no encontrado." });

        // Verificar contraseña actual
        if (!(await user.matchPassword(currentPassword))) {
            // Especialmente importante la primera vez (currentPassword será el DNI)
            return res.status(401).json({ msg: "La contraseña actual es incorrecta." });
        }

        // Actualizar contraseña (el pre-save la hasheará)
        user.password = newPassword;
        user.mustChangePassword = false; // Marcar como cambiada
        await user.save();

        res.json({ msg: "Contraseña actualizada exitosamente." });

    } catch (error) {
        console.error("Error al cambiar password:", error);
        res.status(500).json({ msg: "Error del servidor al cambiar contraseña." });
    }
};


// --- CRUD BÁSICO (Mantenemos los que tenías) ---
export const getUsers = async (req, res) => {
  try {
    // 1. Lee los filtros desde req.query
    const { rol, anio, division } = req.query;
    const query = {}; // Crea un objeto de consulta vacío

    // 2. Construye la consulta dinámicamente
    if (rol) {
      query.rol = rol; // Añade filtro de rol
    }
    if (anio) {
      query.anio = anio; // Añade filtro de año
    }
    if (division) {
      query.division = division; // Añade filtro de división
    }

    // 3. Usa el objeto 'query' en la búsqueda de Mongoose
    const usuarios = await User.find(query).select("-password");
    
    res.json(usuarios);

  } catch(error){
       res.status(500).json({ msg: "Error al obtener usuarios." });
  }
};

export const getUserById = async (req, res) => {
 try {
     const usuario = await User.findById(req.params.id).select("-password");
     if (!usuario) return res.status(404).json({ msg: "Usuario no encontrado" });
     res.json(usuario);
 } catch(error){
      res.status(500).json({ msg: "Error al obtener usuario." });
 }
};

export const deleteUser = async (req, res) => {
  // Considera cambiar esto a "deshabilitar" (isActive=false) en lugar de borrar
 try {
     const usuario = await User.findByIdAndDelete(req.params.id);
     if (!usuario) return res.status(404).json({ msg: "Usuario no encontrado" });
     res.json({ msg: "Usuario eliminado correctamente" }); // O "deshabilitado"
 } catch(error){
      res.status(500).json({ msg: "Error al eliminar usuario." });
 }
};

export const updateUser = async (req, res) => {
  // Este controlador ahora podría permitir al Admin cambiar más cosas
  const { id } = req.params;
  const { nombre, email, rol, anio, division, isActive, dni } = req.body;

  try {
    const user = await User.findById(id);
    if (!user) return res.status(404).json({ msg: "Usuario no encontrado" });

    // Actualizar campos permitidos (evitar que se cambie password aquí)
    if (nombre) user.nombre = nombre;
    if (email) user.email = email; // Cuidado con duplicados si se cambia
    if (rol) user.rol = rol;
    if (anio) user.anio = anio;
    if (division) user.division = division.toUpperCase();
    if (isActive !== undefined) user.isActive = isActive;
    if (dni) user.dni = dni; // Cuidado con duplicados si se cambia

    // Si se cambia email o DNI, verificar duplicados antes de guardar
    if (email && email !== user.email) {
        const existe = await User.findOne({ email });
        if (existe) return res.status(400).json({ msg: "El nuevo email ya está en uso." });
    }
     if (dni && dni !== user.dni) {
         const existe = await User.findOne({ dni });
         if (existe) return res.status(400).json({ msg: "El nuevo DNI ya está en uso." });
     }


    const updatedUser = await user.save();
    
    const userResponse = updatedUser.toObject();
    delete userResponse.password; // Nunca devolver hash

    res.json(userResponse);
  } catch (error) {
     console.error("Error al actualizar usuario:", error);
     if (error.code === 11000) { // Manejar duplicados
         let campoDuplicado = Object.keys(error.keyPattern)[0];
         return res.status(400).json({ msg: `El campo '${campoDuplicado}' ya está en uso.` });
     }
    res.status(500).json({ msg: "Error al actualizar usuario" });
  }
};