import express from "express";
import cors from "cors";
import morgan from "morgan";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from 'url';

import connectMongo from "./config/mongo.js";

// --- Importaciones de Rutas ---
import userRoutes from "./routes/user.routes.js";
import authRoutes from "./routes/auth.routes.js";
import materiaRoutes from "./routes/materia.routes.js";
import calificacionRoutes from "./routes/calificacion.routes.js";
import tareaRoutes from "./routes/tarea.routes.js";
import entregaRoutes from "./routes/entrega.routes.js";
import tareasAlumnoRoutes from "./routes/tareas.alumno.routes.js";
import adminRoutes from "./routes/admin.routes.js";
import anuncioRoutes from "./routes/anuncio.routes.js";
import claseRoutes from "./routes/clase.routes.js";
import asistenciasRoutes from "./routes/asistencias.routes.js";
import notasRoutes from "./routes/notas.routes.js";
import cuotaRoutes from "./routes/cuota.routes.js";

dotenv.config();

const app = express();

// --- CONFIGURACIÓN DE MIDDLEWARES ---
app.use(cors({
  origin: process.env.FRONTEND_URL || "http://localhost:5173", // Ajustado para Render
  credentials: true
}));

app.use(express.json());
app.use(morgan("dev"));

// Archivos estáticos
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// --- CONEXIÓN ÚNICA A MONGO ---
connectMongo();

// --- RUTAS DE LA API ---
app.use("/api/usuarios", userRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/materias", materiaRoutes);
app.use("/api/calificaciones", calificacionRoutes);
app.use("/api/tareas", tareaRoutes);
app.use("/api/entregas", entregaRoutes);
app.use("/api/tareas/alumno", tareasAlumnoRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/anuncios", anuncioRoutes);
app.use("/api/clases", claseRoutes);
app.use("/api/asistencias", asistenciasRoutes);
app.use("/api/notas", notasRoutes);
app.use("/api/cuotas", cuotaRoutes);

app.get("/", (req, res) => {
  res.send("API Colegio funcionando con MongoDB 🏫");
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Servidor en puerto ${PORT}`);
});