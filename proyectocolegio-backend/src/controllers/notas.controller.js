import NotaFinal from "../models/notaFinal.model.js";
import Clase from "../models/Clases.js";
import mongoose from "mongoose";

// Helper (mismo que en asistencia)
const assertProfesorDeLaClase = async (claseId, profesorId) => {
  const clase = await Clase.findById(claseId).select("profesor");
  if (!clase) throw new Error("Clase no encontrada");
  if (String(clase.profesor) !== String(profesorId)) {
    const e = new Error("No autorizado para esta clase");
    e.status = 403;
    throw e;
  }
};

// PUT /api/notas/upsert  (profesor)
// body: { clase, alumno, trimestre1?, trimestre2?, trimestre3? }
export const upsertNotas = async (req, res) => {
  try {
    const { clase, alumno, trimestre1, trimestre2, trimestre3 } = req.body;
    if (!clase || !alumno) {
      return res.status(400).json({ msg: "clase y alumno son requeridos" });
    }

    // profesor dueño
    if (req.user.rol === "profesor") {
      await assertProfesorDeLaClase(clase, req.user.id);
    }

    const update = {
      actualizadoPor: req.user.id
    };
    if (trimestre1 !== undefined) update.trimestre1 = trimestre1;
    if (trimestre2 !== undefined) update.trimestre2 = trimestre2;
    if (trimestre3 !== undefined) update.trimestre3 = trimestre3;

    const doc = await NotaFinal.findOneAndUpdate(
      { clase, alumno },
      { $set: update },
      { new: true, upsert: true, runValidators: true }
    );

    // Para que corra el pre('save') del promedio, guardamos explícitamente
    await doc.save();

    res.json({ msg: "Notas guardadas", nota: doc });
  } catch (err) {
    console.error(err);
    res.status(err.status || 500).json({ msg: err.message || "Error al guardar notas" });
  }
};

// GET /api/notas  (admin) filtros: clase, alumno
// GET /api/notas/misclases (profesor) idem pero limitadas
export const listarNotas = async (req, res) => {
  try {
    const { clase, alumno } = req.query;
    const query = {};
    if (clase)  query.clase  = clase;
    if (alumno) query.alumno = alumno;

    if (req.user.rol === "profesor") {
      const clasesDoc = await Clase.find({ profesor: req.user.id }).select("_id");
      const ids = clasesDoc.map(c => c._id);
      query.clase = query.clase ? query.clase : { $in: ids };
    }

    const data = await NotaFinal.find(query)
      .populate("clase", "anio diaSemana horaInicio horaFin materia profesor")
      .populate("alumno", "nombre email")
      .sort({ "alumno.nombre": 1 });

    res.json({ total: data.length, notas: data });
  } catch (err) {
    res.status(500).json({ msg: "Error al listar notas" });
  }
};

// GET /api/notas/mias  (alumno)
export const misNotasAlumno = async (req, res) => {
  try {
    const data = await NotaFinal.find({ alumno: req.user.id })
      .populate("clase", "anio diaSemana horaInicio horaFin materia profesor");

    res.json({ total: data.length, notas: data });
  } catch (err) {
    res.status(500).json({ msg: "Error al obtener notas" });
  }
};
// Cargar notas
export const cargarNotas = async (req, res) => {
  try {
    const { materiaId, notas } = req.body;
    const profesorId = req.user.id;

    if (!materiaId || !notas) {
      return res.status(400).json({ msg: "Datos incompletos" });
    }

    const registros = await Promise.all(
      Object.entries(notas).map(async ([alumnoId, valor]) => {
        let nota = await NotaFinal.findOne({ materia: materiaId, alumno: alumnoId });

        if (!nota) {
          nota = new NotaFinal({ materia: materiaId, profesor: profesorId, alumno: alumnoId });
        }

        // Ejemplo: guardamos como trimestre1 (se puede mejorar con lógica de trimestre actual)
        nota.trimestre1 = valor;
        nota.notaFinal = nota.calcularPromedio();
        await nota.save();

        return nota;
      })
    );

    res.status(201).json({ msg: "Notas registradas", registros });
  } catch (error) {
    console.error("Error al cargar notas:", error);
    res.status(500).json({ msg: "Error al cargar notas", error: error.message });
  }
};

// Consultar notas de un alumno
export const getNotasAlumno = async (req, res) => {
  try {
    const { alumnoId } = req.params;
    const notas = await NotaFinal.find({ alumno: alumnoId })
      .populate("materia", "nombre");

    res.json({ msg: "Notas obtenidas", notas });
  } catch (error) {
    res.status(500).json({ msg: "Error al obtener notas", error: error.message });
  }
};