import { hashString } from "../utils/utils.js";
import crypto from "crypto";
import { sendEmailService } from "./email.service.js";
import { UserModel } from "../models/users.model.js";
import { createError } from "../utils/utils.js";
import { pool } from "../db.js";

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

    const verificactionCode = crypto.randomBytes(24).toString("base64url"); //  Codigo alfanumerico aleatorio que creo para poder precisamente crear el codigo de verificacion. Esto hay que enviarle por mail al usuario para que se verifique.
    console.log(verificactionCode);

    const hashCode = await hashString(verificactionCode); //Aqui hasheamos ese codigo.

    const user = await UserModel.create(
      { nombre, apellido, fechaNacimiento, email, hashCode, hashPassword },
      connection
    );

    //  Enviamos al  usuario con el codigo de verificacion.
    const emailSend = await sendEmailService(
      email,
      "Verificación de cuenta",
      `<h2>${nombre}, este es tu código de verificación:</h2>
                   <p><b>${verificactionCode}</b></p>
                   <p>Ingresalo en la página para activar tu cuenta.</p>`
    );
    if (!emailSend)
      throw createError(
        500,
        "Error al intentar enviar el email de notificación."
      );

    await connection.commit();

    return user;
  } catch (error) {
    if (connection) {
      await connection.rollback();
      console.log("Transacción revertida (ROLLBACK)");
    }

    console.log("ERROR REAL:", error);

    if (error.status) throw error;
    throw createError(500, "Error interno al intentar crear el usuario.");
  } finally {
    if (connection) {
      connection.release(); //Cerramos la conexion.
    }
  }
};
