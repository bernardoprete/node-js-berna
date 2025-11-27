import { z } from "zod";

// SCHEMA PARA CAMBIAR CONTRASEÑA ESTANDO LOGUEADO
export const changePasswordSchema = z
  .object({
    currentPassword: z
      .string({
        message: "La contraseña actual es requerida y debe ser un string.",
      })
      .trim()
      .min(6, {
        message: "La contraseña actual debe tener al menos 6 caracteres.",
      }),

    newPassword: z
      .string({
        message: "La nueva contraseña es requerida y debe ser un string.",
      })
      .trim()
      .min(6, {
        message: "La nueva contraseña debe tener al menos 6 caracteres.",
      }),

    newPasswordConfirm: z
      .string({
        message: "La confirmación de la nueva contraseña es requerida.",
      })
      .trim()
      .min(6, { message: "La confirmación debe tener al menos 6 caracteres." }),
  })
  //Validación Zod extra para que newPassword == newPasswordConfirm
  .refine((data) => data.newPassword === data.newPasswordConfirm, { // pasa la validacion si da true, sino te da el mensaje de error.
    message: "Las nuevas contraseñas no coinciden.",
    path: ["newPasswordConfirm"],
  });
