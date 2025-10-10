import User from "../models/User.js";
import bcrypt from "bcryptjs";
import { validationResult } from "express-validator";

export const registerUser = async (req, res) => {
  const errores = validationResult(req);
  if (!errores.isEmpty()) {
    return res.status(400).json({ errores: errores.array() });
  }

  const { nombre, email, password, rol } = req.body;

  try {
    const existeUsuario = await User.findOne({ email });
    if (existeUsuario) {
      return res.status(400).json({ msg: "El usuario ya existe" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const nuevoUsuario = new User({
      nombre,
      email,
      password: hashedPassword,
      rol,
    });

    await nuevoUsuario.save();

    res.status(201).json({
      msg: "Usuario registrado correctamente",
      usuario: {
        id: nuevoUsuario._id,
        nombre,
        email,
        rol,
      },
    });
  } catch (error) {
  // Loguea el error real en tu consola o en un servicio de logging
  console.error("Error en el registro:", error); 

  // Envía una respuesta genérica al cliente
  res.status(500).json({ msg: "Hubo un error en el servidor, intenta más tarde" });
}

  
};

export const getUsers = async (req, res) => {
  const usuarios = await User.find().select("-password");
  res.json(usuarios);
};

export const getUserById = async (req, res) => {
  const usuario = await User.findById(req.params.id).select("-password");
  if (!usuario) return res.status(404).json({ msg: "Usuario no encontrado" });
  res.json(usuario);
};

export const deleteUser = async (req, res) => {
  const usuario = await User.findByIdAndDelete(req.params.id);
  if (!usuario) return res.status(404).json({ msg: "Usuario no encontrado" });
  res.json({ msg: "Usuario eliminado correctamente" });
};
export const updateUser = async (req, res) => {
  const { id } = req.params;
  const { nombre, email, rol } = req.body;

  try {
    const user = await User.findById(id);
    if (!user) return res.status(404).json({ msg: "Usuario no encontrado" });

    user.nombre = nombre || user.nombre;
    user.email = email || user.email;
    user.rol = rol || user.rol;

    const updatedUser = await user.save();
    res.json(updatedUser);
  } catch (error) {
    res.status(500).json({ msg: "Error al actualizar usuario", error });
  }
};

