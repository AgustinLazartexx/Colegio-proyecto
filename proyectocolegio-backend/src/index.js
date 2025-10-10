import express from "express";
import cors from "cors";
import morgan from "morgan";
import dotenv from "dotenv";
import connectMongo from "./config/mongo.js";
import pool from "./config/mariadb.js";
import userRoutes from "./routes/user.routes.js";
import authRoutes from "./routes/auth.routes.js";
import materiaRoutes from "./routes/materia.routes.js";
import calificacionRoutes from "./routes/calificacion.routes.js";
import tareaRoutes from "./routes/tarea.routes.js";
import entregaRoutes from "./routes/entrega.routes.js";
import tareasAlumnoRoutes from "./routes/tareas.alumno.routes.js";
import getMateriasPorAlumno  from "./routes/materia.alumno.routes.js";
import adminRoutes from "./routes/admin.routes.js";
import anuncioRoutes from "./routes/anuncio.routes.js";
import claseRoutes from "./routes/clase.routes.js";
import asistenciasRoutes from "./routes/asistencias.routes.js";
import notasRoutes from "./routes/notas.routes.js";



dotenv.config();

const app = express();
app.use(cors({
  origin: "http://localhost:5173",
  credentials: true
}));
app.use(cors());
app.use(express.json());
app.use(morgan("dev"));

// Conexión MongoDB
connectMongo();

// Conexión MariaDB
(async () => {
  try {
    const conn = await pool.getConnection();
    const rows = await conn.query("SELECT 1 + 1 AS result");
    conn.release();
    console.log("✅ MariaDB conectado:", rows[0].result);
  } catch (err) {
    console.error("❌ Error al conectar MariaDB:", err.message);
  }
})();

app.use("/api/usuarios", userRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/materias", materiaRoutes);
app.use("/api/calificaciones", calificacionRoutes);
app.use("/api/tareas", tareaRoutes);
app.use("/api/entregas", entregaRoutes);
app.use("/api/tareas/alumno", tareasAlumnoRoutes);
app.use("/api/materias", getMateriasPorAlumno);
app.use("/api/admin", adminRoutes);
app.use("/api/anuncios", anuncioRoutes);
app.use("/api/clases", claseRoutes);
app.use("/api/asistencias", asistenciasRoutes);
app.use("/api/notas", notasRoutes);




app.get("/", (req, res) => {
  res.send("API Colegio funcionando 🏫");
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Servidor escuchando en http://localhost:${PORT}`);
});
