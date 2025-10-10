import multer from "multer";
import path from "path";
import fs from "fs";

// Aseguramos que la carpeta exista
const folderPath = "uploads/entregas/";
if (!fs.existsSync(folderPath)) {
  fs.mkdirSync(folderPath, { recursive: true });
}

// Configuración del almacenamiento
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, folderPath);
  },
  filename: (req, file, cb) => {
    const nombreUnico = `${Date.now()}-${file.originalname}`;
    cb(null, nombreUnico);
  },
});

// Filtro opcional de tipo de archivo
const fileFilter = (req, file, cb) => {
  const tiposPermitidos = [
    "application/pdf",
    "image/jpeg",
    "image/png",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    "application/msword",
    "application/zip",
  ];

  if (tiposPermitidos.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error("Tipo de archivo no permitido para la entrega."), false);
  }
};

export const uploadEntrega = multer({ storage, fileFilter });
