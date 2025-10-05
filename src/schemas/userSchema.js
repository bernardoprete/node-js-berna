import { z } from "zod";

const upperCaseRegex = /^(?=.*[A-Z]).+$/;

export const createUserSchema = z
  .object({
    nombre: z
      .string("El nombre es requerido y debe ser un string.")
      .trim()
      .min(3, { message: "El nombre debe contener al menos 3 caracteres" }),
    apellido: z
      .string("El nombre es requerido y debe ser un string.")
      .trim()
      .min(3, { message: "El nombre debe contener al menos 3 caracteres" }),
    email: z.email({ message: "El email ingresado no es válido" }),
    fechaNacimiento: z.coerce.date(),
    password: z
      .string("La password es requerida y debe estar en formato string")
      .trim()
      .min(6, { message: "La contraseña debe contener al menos 6 caracteres" }),
    passwordConfirm: z
      .string(
        "La confirmación de la password es requerida y debe estar en formato string"
      )
      .trim()
      .min(6, {
        message:
          "La confirmación de contraseña debe contener al menos 6 caracteres",
      }),
  })
  .refine((data) => data.password === data.passwordConfirm, {
    message: "las contraseñas no coinciden.",
    path: ["passwordConfirm"],
  })
  .refine((data) => upperCaseRegex.test(data.password), {
    message: "la contraseña debe contener al menos una mayuscula.",
    path: ["password"],
  });

export const updateUserSchema = z.object({
  //Todos los campos que aparecen aca se pueden modificar, el resto no . Por ejm nombre, apellido. fecha nac y direccion. Esto es para req.params no para el body ya que no permite el body insertar id.
  id: z
    .string()
    .trim()
    .pipe(
      z.coerce
        .number({ message: "El ID debe ser un número" })
        .int({ message: "El ID deber ser un número entero." })
        .positive({ message: "El ID debe ser un número entero positivo" })
    ),
  nombre: z
    .string("El nombre es requerido y debe ser un string.")
    .trim()
    .min(3, { message: "El nombre debe contener al menos 3 caracteres" })
    .optional(), // El optional me permite que este campo este o no este.
  apellido: z
    .string("El nombre es requerido y debe ser un string.")
    .trim()
    .min(3, { message: "El nombre debe contener al menos 3 caracteres" })
    .optional(),
  fecha_nacimiento: z.coerce.date().optional(),
  direccion: z
    .string("El nombre es requerido y debe ser un string.")
    .trim()
    .min(3, { message: "El nombre debe contener al menos 3 caracteres" })
    .optional(),
});
