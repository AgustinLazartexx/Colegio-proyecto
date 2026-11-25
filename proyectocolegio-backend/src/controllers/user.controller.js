import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { QueryTypes } from "sequelize";
import { sequelize } from "../config/mariadb.js";
import { findUserByEmail, findUserById, toPublicUser } from "../services/userAuth.service.js";

const userFields = `
  HEX(id) AS _id,
  nombre,
  email,
  dni,
  rol,
  codigoAlumno,
  anio,
  division,
  isActive,
  mustChangePassword,
  acceso_habilitado
`;

const validId = (id) => typeof id === "string" && /^[\da-f]{32}$/i.test(id);

const handleDuplicate = (res, error) => {
  if (
    error.name === "SequelizeUniqueConstraintError" ||
    error.original?.code === "ER_DUP_ENTRY" ||
    error.parent?.code === "ER_DUP_ENTRY" ||
    error.original?.code === "23505" ||
    error.parent?.code === "23505"
  ) {
    return res.status(409).json({ msg: "El email o DNI ya está registrado." });
  }
  console.error("Error de gestión de usuarios:", error);
  return res.status(500).json({ msg: "Error del servidor al gestionar usuarios." });
};

export const adminCrearUsuario = async (req, res) => {
  const { nombre, email, dni, rol, anio, division } = req.body;
  const normalizedEmail = typeof email === "string" ? email.trim().toLowerCase() : "";
  const normalizedDni = typeof dni === "string" ? dni.trim() : "";
  const normalizedDivision = typeof division === "string" ? division.trim().toUpperCase() : "";

  if (!nombre?.trim() || !normalizedEmail || !normalizedDni || !rol) {
    return res.status(400).json({ msg: "Nombre, email, DNI y rol son obligatorios." });
  }
  if (!["admin", "profesor", "alumno"].includes(rol)) {
    return res.status(400).json({ msg: "Rol inválido." });
  }
  if (rol === "alumno" && (!Number.isInteger(Number(anio)) || Number(anio) < 1 || Number(anio) > 6 || !normalizedDivision)) {
    return res.status(400).json({ msg: "Año y división válidos son obligatorios para alumnos." });
  }

  try {
    const existing = await sequelize.query(
      "SELECT email, dni FROM users WHERE email = :email OR dni = :dni LIMIT 1",
      {
        replacements: { email: normalizedEmail, dni: normalizedDni },
        type: QueryTypes.SELECT,
      },
    );
    if (existing.length) {
      return res.status(409).json({ msg: "El email o DNI ya está registrado." });
    }

    let codigoAlumno = null;
    if (rol === "alumno") {
      const codes = await sequelize.query(
        `SELECT codigoAlumno FROM users
         WHERE rol = 'alumno' AND codigoAlumno REGEXP '^[0-9]+$'
         ORDER BY LENGTH(codigoAlumno) DESC, codigoAlumno DESC LIMIT 1`,
        {
          type: QueryTypes.SELECT,
        },
      );
      codigoAlumno = String(Number(codes[0]?.codigoAlumno ?? 0) + 1).padStart(4, "0");
    }

    const password = await bcrypt.hash(normalizedDni, 12);
    await sequelize.query(
      `INSERT INTO users
         (id, nombre, email, password, dni, rol, codigoAlumno, anio, division, isActive, mustChangePassword, acceso_habilitado)
       VALUES
         (UNHEX(REPLACE(UUID(), '-', '')), :nombre, :email, :password, :dni, :rol, :codigoAlumno,
          :anio, :division, TRUE, TRUE, TRUE)`,
      {
        replacements: {
          nombre: nombre.trim(),
          email: normalizedEmail,
          password,
          dni: normalizedDni,
          rol,
          codigoAlumno,
          anio: rol === "alumno" ? Number(anio) : null,
          division: rol === "alumno" ? normalizedDivision : null,
        },
      },
    );

    const [usuario] = await sequelize.query(
      `SELECT ${userFields} FROM users WHERE email = :email LIMIT 1`,
      { replacements: { email: normalizedEmail }, type: QueryTypes.SELECT },
    );

    return res.status(201).json({
      msg: "Usuario creado exitosamente.",
      usuario,
      initialPassword: normalizedDni,
    });
  } catch (error) {
    return handleDuplicate(res, error);
  }
};

export const login = async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ msg: "Email y contraseña son obligatorios." });
  }

  try {
    const user = await findUserByEmail(email);
    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({ msg: "Credenciales inválidas" });
    }
    if (!user.isActive) {
      return res.status(403).json({ msg: "Usuario deshabilitado." });
    }
    if (user.rol === "alumno" && !user.acceso_habilitado) {
      return res.status(403).json({ msg: "Acceso restringido por estado de cuenta. Contacte administración." });
    }

    const token = jwt.sign(
      { id: user.id, rol: user.rol, nombre: user.nombre },
      process.env.JWT_SECRET,
      { expiresIn: "4h" },
    );
    return res.json({ token, usuario: toPublicUser(user) });
  } catch (error) {
    console.error("Error en login:", error);
    return res.status(500).json({ msg: "Error del servidor durante el login." });
  }
};

export const cambiarPassword = async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  if (!currentPassword || !newPassword) {
    return res.status(400).json({ msg: "Contraseña actual y nueva son requeridas." });
  }
  if (newPassword.length < 6) {
    return res.status(400).json({ msg: "La nueva contraseña debe tener al menos 6 caracteres." });
  }

  try {
    const user = await findUserById(req.user.id);
    if (!user) return res.status(404).json({ msg: "Usuario no encontrado." });
    if (!(await bcrypt.compare(currentPassword, user.password))) {
      return res.status(401).json({ msg: "La contraseña actual es incorrecta." });
    }

    const password = await bcrypt.hash(newPassword, 12);
    await sequelize.query(
      "UPDATE users SET password = :password, mustChangePassword = FALSE WHERE id = UNHEX(:id)",
      { replacements: { password, id: req.user.id } },
    );
    return res.json({ msg: "Contraseña actualizada exitosamente." });
  } catch (error) {
    console.error("Error al cambiar contraseña:", error);
    return res.status(500).json({ msg: "Error del servidor al cambiar contraseña." });
  }
};

export const getUsers = async (req, res) => {
  const { rol, anio, division, q, isActive, cicloLectivoId } = req.query;
  const filters = [];
  const replacements = {};

  if (rol && !["admin", "profesor", "alumno"].includes(rol)) {
    return res.status(400).json({ msg: "Rol de usuario inválido." });
  }
  if (rol) {
    filters.push("users.rol = :rol");
    replacements.rol = rol;
  }
  let validatedYear = null;
  if (anio) {
    const year = Number(anio);
    if (!Number.isInteger(year) || year < 1 || year > 6) {
      return res.status(400).json({ msg: "Filtro de año inválido." });
    }
    validatedYear = year;
  }
  const normalizedDivision = division ? String(division).trim().toUpperCase() : "";
  if (isActive !== undefined) {
    if (!["true", "false", "1", "0"].includes(String(isActive))) {
      return res.status(400).json({ msg: "Filtro de estado de usuario inválido." });
    }
    filters.push("users.isActive = :isActive");
    replacements.isActive = ["true", "1"].includes(String(isActive)) ? 1 : 0;
  }
  if (cicloLectivoId) {
    if (!validId(cicloLectivoId)) {
      return res.status(400).json({ msg: "ID de ciclo lectivo inválido." });
    }
    if (rol && rol !== "alumno") {
      return res.status(400).json({ msg: "El filtro de ciclo lectivo solo aplica a alumnos." });
    }
    const cycleConditions = [
      "i.alumno_id = users.id",
      "i.ciclo_lectivo_id = UNHEX(:cicloLectivoId)",
      "i.estado_academico <> 'BAJA'",
    ];
    if (validatedYear !== null) {
      cycleConditions.push("i.nivel = :anio");
      replacements.anio = validatedYear;
    }
    if (normalizedDivision) {
      cycleConditions.push("i.division = :division");
      replacements.division = normalizedDivision;
    }
    filters.push(
      `users.rol = 'alumno' AND EXISTS (
         SELECT 1 FROM inscripciones_ciclo i
         WHERE ${cycleConditions.join(" AND ")}
       )`,
    );
    replacements.cicloLectivoId = cicloLectivoId;
  } else {
    if (validatedYear !== null) {
      filters.push("users.anio = :anio");
      replacements.anio = validatedYear;
    }
    if (normalizedDivision) {
      filters.push("users.division = :division");
      replacements.division = normalizedDivision;
    }
  }
  const searchTerm = typeof q === "string" ? q.trim() : "";
  if (searchTerm) {
    filters.push("(users.nombre LIKE :search OR users.email LIKE :search OR users.dni LIKE :search)");
    replacements.search = `%${searchTerm}%`;
  }
  if (!filters.length) return res.json([]);

  try {
    const where = `WHERE ${filters.join(" AND ")}`;
    const selectedFields = cicloLectivoId
      ? userFields.replace(
        "  division,",
        `  division,
  (SELECT i.nivel FROM inscripciones_ciclo i
     WHERE i.alumno_id = users.id AND i.ciclo_lectivo_id = UNHEX(:cicloLectivoId)
       AND i.estado_academico <> 'BAJA' LIMIT 1) AS nivelCiclo,
  (SELECT i.division FROM inscripciones_ciclo i
     WHERE i.alumno_id = users.id AND i.ciclo_lectivo_id = UNHEX(:cicloLectivoId)
       AND i.estado_academico <> 'BAJA' LIMIT 1) AS divisionCiclo,`,
      )
      : userFields;
    const users = await sequelize.query(
      `SELECT ${selectedFields} FROM users ${where} ORDER BY users.rol, users.nombre`,
      { replacements, type: QueryTypes.SELECT },
    );
    return res.json(users);
  } catch (error) {
    return handleDuplicate(res, error);
  }
};

export const getUserById = async (req, res) => {
  if (!validId(req.params.id)) return res.status(400).json({ msg: "ID de usuario inválido." });
  try {
    const [usuario] = await sequelize.query(
      `SELECT ${userFields} FROM users WHERE id = UNHEX(:id) LIMIT 1`,
      { replacements: { id: req.params.id }, type: QueryTypes.SELECT },
    );
    if (!usuario) return res.status(404).json({ msg: "Usuario no encontrado." });
    return res.json(usuario);
  } catch (error) {
    return handleDuplicate(res, error);
  }
};

export const deleteUser = async (req, res) => {
  if (!validId(req.params.id)) return res.status(400).json({ msg: "ID de usuario inválido." });
  try {
    const [result] = await sequelize.query(
      "DELETE FROM users WHERE id = UNHEX(:id)",
      { replacements: { id: req.params.id } },
    );
    if (!result.affectedRows) return res.status(404).json({ msg: "Usuario no encontrado." });
    return res.json({ msg: "Usuario eliminado correctamente." });
  } catch (error) {
    return handleDuplicate(res, error);
  }
};

export const updateUser = async (req, res) => {
  const { id } = req.params;
  if (!validId(id)) return res.status(400).json({ msg: "ID de usuario inválido." });
  const allowedFields = ["nombre", "email", "dni", "rol", "anio", "division", "isActive"];
  const updates = {};

  for (const field of allowedFields) {
    if (req.body[field] !== undefined) updates[field] = req.body[field];
  }
  if (typeof updates.nombre === "string") updates.nombre = updates.nombre.trim();
  if (typeof updates.email === "string") updates.email = updates.email.trim().toLowerCase();
  if (typeof updates.dni === "string") updates.dni = updates.dni.trim();
  if (typeof updates.division === "string") updates.division = updates.division.trim().toUpperCase();
  if (updates.anio !== undefined) updates.anio = Number(updates.anio);
  if (updates.isActive !== undefined) updates.isActive = Boolean(updates.isActive);

  if (updates.rol && !["admin", "profesor", "alumno"].includes(updates.rol)) {
    return res.status(400).json({ msg: "Rol inválido." });
  }
  if (updates.rol === "alumno" && (!Number.isInteger(updates.anio) || updates.anio < 1 || updates.anio > 6 || !updates.division)) {
    return res.status(400).json({ msg: "Año y división válidos son obligatorios para alumnos." });
  }
  if (!Object.keys(updates).length) {
    return res.status(400).json({ msg: "No se recibieron campos para actualizar." });
  }

  try {
    const assignments = Object.keys(updates).map((field) => `\`${field}\` = :${field}`);
    const [result] = await sequelize.query(
      `UPDATE users SET ${assignments.join(", ")} WHERE id = UNHEX(:id)`,
      { replacements: { ...updates, id } },
    );
    if (!result.affectedRows) {
      const [exists] = await sequelize.query(
        "SELECT id FROM users WHERE id = UNHEX(:id)",
        { replacements: { id }, type: QueryTypes.SELECT },
      );
      if (!exists) return res.status(404).json({ msg: "Usuario no encontrado." });
    }

    const [usuario] = await sequelize.query(
      `SELECT ${userFields} FROM users WHERE id = UNHEX(:id) LIMIT 1`,
      { replacements: { id }, type: QueryTypes.SELECT },
    );
    return res.json(usuario);
  } catch (error) {
    return handleDuplicate(res, error);
  }
};
