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
    console.log(verificactionCode );

    const hashCode = await hashString(verificactionCode); //Aqui hasheamos ese codigo.

    const user = await UserModel.create(
      { nombre, apellido, fechaNacimiento, email, hashCode, hashPassword },
      connection
    );

    await connection.commit(); //Todo lo que pasa despeus del commit no puede volverse atras en SQL. Haaciend
    //Pongo e commit antes de enviar el mail para qque si no se crea el user no se mande el mail, el mail se envia si o si si el user es creado.
    //La contra es que el user queda creado igual (perono verificado) - Aqui se podria hacer que el user ponga "reenviar codigo" haciendo otro endpoint. DUDAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA


    //  Enviamos al  usuario con el codigo de verificacion.

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
    if (!emailSend)
      throw createError(
        500,
        "Error al intentar enviar el email de notificación."
      );

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
