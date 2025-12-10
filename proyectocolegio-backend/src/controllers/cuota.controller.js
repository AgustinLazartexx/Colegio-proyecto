import Cuota from "../models/Cuota.js";
import User from "../models/User.js";

// --- Función Auxiliar para Recalcular el Acceso ---
const actualizarEstadoAcceso = async (alumnoId) => {
  // Buscamos si tiene alguna cuota 'vencida'
  const tieneDeuda = await Cuota.exists({ 
    alumno: alumnoId, 
    estado: 'vencido' 
  });

  // Si tiene deuda, acceso false. Si no, acceso true.
  const nuevoEstado = !tieneDeuda;

  await User.findByIdAndUpdate(alumnoId, { acceso_habilitado: nuevoEstado });
  return nuevoEstado;
};

// 1. Generar Cuota (Admin)
export const generarCuota = async (req, res) => {
  try {
    const { alumnoId, mes, anio, monto, fechaVencimiento } = req.body;

    const nuevaCuota = new Cuota({
      alumno: alumnoId,
      mes,
      anio,
      monto,
      fechaVencimiento: new Date(fechaVencimiento)
    });

    await nuevaCuota.save();
    res.status(201).json({ msg: "Cuota generada exitosamente", cuota: nuevaCuota });
  } catch (error) {
    if (error.code === 11000) {
        return res.status(400).json({ msg: "Ya existe una cuota para este alumno en ese mes/año." });
    }
    res.status(500).json({ msg: "Error al generar cuota", error: error.message });
  }
};

// 2. Registrar Pago (Admin)
export const registrarPago = async (req, res) => {
  try {
    const { id } = req.params; // ID de la cuota
    const { metodoPago } = req.body;

    const cuota = await Cuota.findById(id);
    if (!cuota) return res.status(404).json({ msg: "Cuota no encontrada" });

    cuota.estado = "pagado";
    cuota.fechaPago = new Date();
    cuota.metodoPago = metodoPago || "efectivo";
    
    await cuota.save();

    // IMPORTANTE: Al pagar, verificamos si podemos desbloquear al alumno
    const estaHabilitado = await actualizarEstadoAcceso(cuota.alumno);

    res.json({ 
        msg: "Pago registrado. Estado del alumno actualizado.", 
        cuota,
        acceso_alumno: estaHabilitado ? "HABILITADO" : "BLOQUEADO (Aún tiene deudas)"
    });

  } catch (error) {
    res.status(500).json({ msg: "Error al registrar pago", error: error.message });
  }
};

// 3. Marcar como Vencida (Admin o Proceso Automático)
// Esto bloquea al alumno si no ha pagado
export const marcarVencida = async (req, res) => {
    try {
        const { id } = req.params;
        const cuota = await Cuota.findById(id);
        
        if (!cuota) return res.status(404).json({ msg: "Cuota no encontrada" });
        if (cuota.estado === 'pagado') return res.status(400).json({ msg: "No se puede vencer una cuota pagada" });

        cuota.estado = "vencido";
        await cuota.save();

        // Al vencerse, recalculamos (seguramente lo bloquee)
        await actualizarEstadoAcceso(cuota.alumno);

        res.json({ msg: "Cuota marcada como vencida. Alumno bloqueado si corresponde." });

    } catch (error) {
        res.status(500).json({ msg: "Error al actualizar cuota" });
    }
};

// 4. Ver Cuotas de un Alumno (Para el panel del Admin)
export const getCuotasPorAlumno = async (req, res) => {
    try {
        const { id } = req.params; // ID del alumno
        const cuotas = await Cuota.find({ alumno: id }).sort({ anio: -1, mes: -1 });
        res.json(cuotas);
    } catch (error) {
        res.status(500).json({ msg: "Error al obtener cuotas" });
    }
};

// 5. Ver mis cuotas (Para el Alumno)
export const getMisCuotas = async (req, res) => {
    try {
        const cuotas = await Cuota.find({ alumno: req.user.id }).sort({ anio: -1, mes: -1 });
        res.json(cuotas);
    } catch (error) {
        res.status(500).json({ msg: "Error al obtener mis cuotas" });
    }
};