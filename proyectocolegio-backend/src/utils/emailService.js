import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: Number(process.env.EMAIL_PORT || 587),
  secure: Number(process.env.EMAIL_PORT || 587) === 465,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

export const sendPasswordResetEmail = async ({ to, resetUrl, userName }) => {
  if (!process.env.EMAIL_HOST || !process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    throw new Error("Servicio de correo no configurado. Verifica las variables EMAIL_HOST, EMAIL_USER y EMAIL_PASS.");
  }

  await transporter.sendMail({
    from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
    to,
    subject: "Restablece tu contraseña",
    html: `
      <div style="font-family: Arial, sans-serif; color: #1f2937;">
        <h2 style="color: #1d4ed8;">Recuperación de contraseña</h2>
        <p>Hola ${userName || "usuario"},</p>
        <p>Recibimos una solicitud para restablecer tu contraseña.</p>
        <p>Para continuar, haz clic en el siguiente enlace:</p>
        <p><a href="${resetUrl}" style="display: inline-block; background: #1d4ed8; color: #fff; padding: 12px 18px; border-radius: 6px; text-decoration: none;">Restablecer contraseña</a></p>
        <p>Si no solicitaste este cambio, puedes ignorar este correo.</p>
        <p style="margin-top: 24px; font-size: 12px; color: #6b7280;">Este enlace expirará en 15 minutos.</p>
      </div>
    `,
  });
};
