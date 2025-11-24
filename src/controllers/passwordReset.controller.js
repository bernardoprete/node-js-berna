import {
  requestPasswordReset,
  resetPassword,
} from "../services/passwordReset.service.js";

import { createError } from "../utils/utils.js";

// Enviar codigo de recuperacion al email

export const forgotPassword = async (req, res, next) => {
  try {
    // Si el usuario esta logueado NO debe usar este endpoint (por eso usamos el tryAuth, ya que deja req.user con data o null, si existe es que esta logueado)
    if (req.user) {
      throw createError(
        403,
        "Ya estás logueado. Para cambiar tu contraseña ve a tu perfil."
      );
    }

    const { email } = req.body;

    const result = await requestPasswordReset(email);

    res.status(200).json(result);
  } catch (err) {
    if (err.status) return next(err);
    next(createError(500, "Error al solicitar el codigo de recuperacion."));
  }
};

//Resetear contraseña con código

export const resetPasswordController = async (req, res, next) => {
  try {
    if (req.user) {
      // Si el usuario esta logueado NO debe usar este endpoint (por eso usamos el tryAuth, ya que deja req.user con data o null, si existe es que esta logueado)
     throw createError(
        403,
        "Ya estás logueado. Para cambiar tu contraseña ve a tu perfil."
      );
    }

    const { email, code, newPassword, newPasswordConfirm } = req.body;

    const result = await resetPassword(
      email,
      code,
      newPassword,
      newPasswordConfirm
    );

    res.status(200).json(result);
  } catch (err) {
    if (err.status) return next(err);
    next(createError(500, "Error al intentar restablecer la contraseña."));
  }
};
