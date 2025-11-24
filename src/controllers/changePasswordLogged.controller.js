import { createError } from "../utils/utils.js";
import { UserModel } from "../models/users.model.js";
import bcrypt from "bcryptjs";

// CAMBIAR CONTRASEÑA ESTANDO LOGUEADO
// Este método permite que un usuario logueado cambie su propia contraseña.
// Requiere que el user sepa su contraseña actual (por seguridad).
export const changePasswordLogged = async (req, res, next) => {
  try {
    // El id del user viene del token (authRequired)
    const idUsuario = req.user.idUsuario;

    const { currentPassword, newPassword } = req.body;

    // Buscar el usuario en la BD

    const user = await UserModel.findOne({ idUsuario });
    if (!user) throw createError(404, "Usuario no encontrado.");

    //Verificar contraseña actual con bcrypt.compare
    // currentPassword = lo que escribe el usuario
    // user.password = hash guardado en la BD
    const passwordMatch = await bcrypt.compare(currentPassword, user.password);

    if (!passwordMatch) {
      throw createError(400, "La contraseña actual es incorrecta.");
    }

    // Evitar que el usuario ponga la misma contraseña como nueva
    const isSameAsOld = await bcrypt.compare(newPassword, user.password);

    if (isSameAsOld) {
      throw createError(
        400,
        "La nueva contraseña no puede ser igual a la contraseña actual."
      );
    }

    //Hasheamos la nueva contraseña
    const hashed = await bcrypt.hash(newPassword, 10);

    //Guardar nueva contraseña en la BD
    await UserModel.updatePartial(idUsuario, { password: hashed });

    //Respuesta final
    res.status(200).json({
      message: "Contraseña cambiada con exito.",
    });
  } catch (err) {
    if (err.status) return next(err);
    next(createError(500, "Error al cambiar la contraseña."));
  }
};
