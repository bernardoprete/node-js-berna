import { hashString } from "../utils/utils.js";
import crypto from "crypto";
import { sendEmailService } from "./email.service.js";
import { UserModel } from "../models/users.model.js";
import { pool } from "../db.js";
import { createError } from "../utils/utils.js";
import bcrypt from "bcryptjs";

export const createUserService = async ({
  nombre,
  apellido,
  fechaNacimiento,
  email,
  password,
}) => {
  let connection;

  try {
    connection = await pool.getConnection();
    await connection.beginTransaction(); // iniciamos la transacción

    const hashPassword = await hashString(password);

    const user = await UserModel.create(
      {
        nombre,
        apellido,
        fechaNacimiento,
        email,
        hashCode: null,
        hashPassword,
      },
      connection
    );
    const verificactionCode = crypto.randomBytes(24).toString("base64url"); //  Codigo alfanumerico aleatorio que creo para poder precisamente crear el codigo de verificacion. Esto hay que enviarle por mail al usuario para que se verifique.
    console.log(verificactionCode);

    const hashCode = await hashString(verificactionCode); //Aqui hasheamos ese codigo.

    const userUpdate = await UserModel.updatePartial(
      user.idUsuario,
      { codigoVerificacion: hashCode },
      connection
    );
    // seteamos los datos que queremos mostrar en el template de envio de mail
    const emailContent = {
      title: "¡Verificacion de usuario!",
      message: `Para poder verificar tu usuario e ingresar al sistema, haz el click en el siguiente link`,
      link: {
        linkURL: `http://localhost:3001/api/users/verify?id=${user.idUsuario}&code=${verificactionCode}`,
        linkText: "Verificar usuario",
      },
    };

    const emailSend = await sendEmailService(
      email,
      "Verificación de cuenta",
      emailContent
    );

    await connection.commit(); //Todo lo que pasa despeus del commit no puede volverse atras en SQL.
    //  Enviamos al  usuario con el codigo de verificacion.

    return user; //Lo dejamos por ahora pero no es necesario tener toda la data aca.
  } catch (error) {
    if (connection) {
      await connection.rollback();
      console.log("Transacción revertida (ROLLBACK)");
    }

    console.log("ERROR", error);

    if (error.status) throw error;
    throw createError(500, "Error interno al intentar crear el usuario.");
  } finally {
    if (connection) {
      connection.release(); //Cerramos la conexion.
    }
  }
};

// SERVICIO PARA VERIFICAR AL USUARIO
export const verifyUserService = async (idUsuario, code) => {
  // 1. Obtener datos del usuario (desde el modelo)
  const user = await UserModel.verify(idUsuario);

  if (!user) throw createError(400, "Datos de validación incorrectos.");

  // 2. Verificar si ya estaba verificado
  if (user.emailVerificado)
    throw createError(400, "El email ya está verificado.");

  // 3. Comparar código ingresado vs. código hasheado
  const validCode = await bcrypt.compare(code, user.codigoVerificacion);

  if (!validCode) throw createError(400, "Código de verificación incorrecto.");

  // 4. Actualizar estado en BD
  const updated = await UserModel.markAsVerified(idUsuario);

  if (!updated)
    throw createError(500, "No se pudo actualizar el estado del usuario.");

  // 5. Enviar email de confirmación
  const emailContent = {
    title: "¡Notificación de nuevo usuario!",
    message: `¡Felicitaciones ${user.nombre}! Tu cuenta fue verificada exitosamente.`,
    link: {
      linkURL: `http://localhost:3001/api`,
      linkText: "Acceder a la app",
    },
  };

  try {
    await sendEmailService(
      user.email,
      " Cuenta verificada con éxito",
      emailContent
    );
  } catch (err) {
    console.log("No se pudo enviar el email pero el usuario está verificado.");
  }

  return { message: "Cuenta verificada con éxito." };
};

/* 
  // CAMBIO DE PASSWORD POR PARTE DE LOS USUARIOS
  */

export const requestPasswordReset = async (email) => {
  //Solicitar codigo de recuperacion de password.
  const user = await UserModel.findOne({ email }); //Buscar user por mail.

  if (!user) throw createError(404, "El email no pertenece a ningun usuario.");

  const code = Math.floor(100000 + Math.random() * 900000); //Creamos codigo aleatorio de 6 digitos.
  const expires = new Date(Date.now() + 3 * 60 * 1000); //Dura 3 min.

  //Guardamos en la BD.
  await UserModel.createResetRequest(user.idUsuario, code, expires);

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

  const validReset = await UserModel.getValidCode(
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
  await UserModel.markAsUsed(validReset.id);

  //Enviarle mail al user para confirmar que fue actualizada la password.
  await sendEmailService(user.email, "Tu contraseña ha sido actualizada", {
    title: "Contraseña actualizada",
    message:
      "Tu contraseña fue cambiada correctamente. Si no fuiste vos, por favor contacta al soporte inmediatamente.",
    link: null,
  });

  return { message: "Contraseña actualizada correctamente." };
};

//CAMBIAR PASSWORD (ESTANDO LOGUEADO)

export const changePasswordLoggedService = async (
  idUsuario,
  currentPassword,
  newPassword
) => {
  // Buscar usuario
  const user = await UserModel.findOne({ idUsuario });
  if (!user) throw createError(404, "Usuario no encontrado.");

  // Comparar contraseña actual
  const passwordMatch = await bcrypt.compare(currentPassword, user.password);
  if (!passwordMatch) {
    throw createError(400, "La contraseña actual es incorrecta.");
  }

  //Evitar que la nueva contraseña sea igual a la actual
  const isSameAsOld = await bcrypt.compare(newPassword, user.password);
  if (isSameAsOld) {
    throw createError(
      400,
      "La nueva contraseña no puede ser igual a la contraseña actual."
    );
  }

  // Hashear nueva contraseña
  const hashed = await bcrypt.hash(newPassword, 10);

  // Actualizar en BD
  await UserModel.updatePartial(idUsuario, { password: hashed });

  // Enviar email de aviso
  await sendEmailService(user.email, "Tu contraseña ha sido actualizada", {
    title: "Contraseña actualizada",
    message:
      "Tu contraseña fue cambiada correctamente. Si no fuiste vos, por favor contacta al soporte inmediatamente.",
    link: null,
  });

  //Devolver mensaje
  return {
    message: "Contraseña cambiada con exito. Vuelve a iniciar sesion.",
  };
};
