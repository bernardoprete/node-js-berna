import { z } from "zod";
// Verificacion de lo que se pone en el body luego de recibir el codigo de verificacion para reestablcer password
export const resetPasswordSchema = z
  .object({
    email: z.string().email({ message: "Email inválido" }),

    code: z
      .string()
      .trim()
      .min(6, { message: "El código debe tener 6 dígitos." })
      .max(6, { message: "El código debe tener 6 dígitos." }),

    newPassword: z
      .string({ message: "La nueva contraseña es obligatoria." })
      .trim()
      .min(6, { message: "Debe contener al menos 6 caracteres." }),

    newPasswordConfirm: z
      .string({ message: "La confirmación es obligatoria." })
      .trim(),
  })
  .refine((data) => data.newPassword === data.newPasswordConfirm, {
    path: ["newPasswordConfirm"],
    message: "Las contraseñas no coinciden.",
  });

// Verificacion para ver 

export const forgotPasswordSchema = z.object({
  email: z
    .string({ message: "El email es obligatorio." })
    .trim()
    .email({ message: "Debe ingresar un email válido." }),
});
