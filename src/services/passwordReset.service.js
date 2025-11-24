import { createError } from "../utils/utils.js";
import { UserModel } from "../models/users.model.js";
import PasswordResetModel from "../models/passwordReset.model.js";
import bcrypt from "bcryptjs";
import { sendEmailService } from "./email.service.js";

export const requestPasswordReset = async (email) => {
  //Solicitar codigo de recuperacion de password.
  const user = await UserModel.findOne({ email }); //Buscar user por mail.

  if (!user) throw createError(404, "El email no pertenece a ningun usuario.");

  const code = Math.floor(100000 + Math.random() * 900000); //Creamos codigo aleatorio de 6 digitos.
  const expires = new Date(Date.now() + 3 * 60 * 1000); //Dura 3 min.

  //Guardamos en la BD.
  await PasswordResetModel.createResetRequest(user.idUsuario, code, expires);

  // Enviar mail usando el template base
  await sendEmailService(user.email, "Código de recuperación de contraseña", {
    title: "Recuperación de contraseña",
    message: `Tu código es: <strong>${code}</strong>.`,
    link: null, // Puedo ponerlo null ya que no requiero de ningun link.
  });
  return { message: "Código de recuperación enviado al correo." };
};

// RESETEAR PASSWORD
// Este metodo "recibe" lo que el user manda en el body (si el mail esta ok, si el codigo es el correcto y si la password esta ok.)
export const resetPassword = async (
  email,
  code,
  newPassword,
  newPasswordConfirm
) => {
  const user = await UserModel.findOne({ email }); //Verificamos si el email es correcto.
  if (!user) throw createError(404, "El email no pertenece a ningun usuario.");

  const validReset = await PasswordResetModel.getValidCode(
    //Verificamos si el codigo es valido o si expiro.
    user.idUsuario,
    code
  );
  if (!validReset)
    throw createError(400, "El codigo es invalido o ha expirado.");

  //Si todo esta bien, hasheamos la nuevaPassword.
  const hashed = await bcrypt.hash(newPassword, 10);

  //Actualizar el password en la BD.
  await UserModel.updatePartial(user.idUsuario, { password: hashed });

  //Marcar el codigo como usado
  await PasswordResetModel.markAsUsed(validReset.id);

  //Enviarle mail al user para confirmar que fue actualizada la password.
  await sendEmailService(user.email, "Tu contraseña ha sido actualizada", {
    title: "Contraseña actualizada",
    message:
      "Tu contraseña fue cambiada correctamente. Si no fuiste vos, por favor contacta al soporte inmediatamente.",
    link: null,
  });

  return { message: "Contraseña actualizada correctamente." };
};
