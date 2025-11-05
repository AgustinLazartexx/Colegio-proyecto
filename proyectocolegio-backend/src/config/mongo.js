import mongoose from "mongoose";
import dotenv from "dotenv";
dotenv.config();

const connectMongo = async () => {
  try {
    // 👇 MODIFICACIÓN PEQUEÑA AQUÍ 👇
    const conn = await mongoose.connect(process.env.MONGO_URI);
    
    // 👇 ¡AQUÍ ESTÁ LA LÍNEA IMPORTANTE! 👇
    // Esto nos dirá el nombre de la base de datos a la que se conectó.
    console.log("✅ MongoDB conectado a:", conn.connection.name); 

  } catch (error) {
    console.error("❌ Error al conectar MongoDB:", error.message);
    process.exit(1);
  }
};

export default connectMongo;