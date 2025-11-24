import { z } from "zod";

//SCHEMA PARA CREAR UNA DIRECCION
export const createAddressSchema = z.object({
  direccionLinea1: z
    .string({ message: "La dirección principal es obligatoria." })
    .trim()
    .min(3, { message: "La dirección debe tener al menos 3 caracteres." }),

  direccionLinea2: z
    .string()
    .trim()
    .min(3, {
      message: "La dirección secundaria debe tener al menos 3 caracteres.",
    })
    .optional()
    .nullable(),

  ciudad: z
    .string()
    .trim()
    .min(2, { message: "La ciudad debe tener al menos 2 caracteres." })
    .optional()
    .nullable(),

  provincia: z
    .string()
    .trim()
    .min(2, { message: "La provincia debe tener al menos 2 caracteres." })
    .optional()
    .nullable(),

  codigoPostal: z
    .string({ message: "El código postal es obligatorio." })
    .trim()
    .min(1, { message: "Debe ingresar un código postal válido." }),

  pais: z
    .string()
    .trim()
    .min(2, { message: "El país debe tener al menos 2 caracteres." })
    .optional()
    .nullable(),

  predeterminada: z.number().int().min(0).max(1).default(1).optional(),

  altura: z
    .number({ message: "La altura es obligatoria." })
    .int({ message: "La altura debe ser un número entero." })
    .positive({ message: "La altura debe ser positiva." }),
});

//SCHEMA PARA ACTUALIZAR UNA DIRECCION

export const updateAddressSchema = z.object({
  id: z
    .string()
    .trim()
    .pipe(
      z.coerce
        .number({ message: "El ID debe ser un número." })
        .int({ message: "El ID debe ser un número entero." })
        .positive({ message: "El ID debe ser positivo." })
    ),

  direccionLinea1: z
    .string()
    .trim()
    .min(3, { message: "La dirección debe tener al menos 3 caracteres." })
    .optional(),

  direccionLinea2: z
    .string()
    .trim()
    .min(3, {
      message: "La dirección secundaria debe tener al menos 3 caracteres.",
    })
    .optional(),

  ciudad: z
    .string()
    .trim()
    .min(2, { message: "La ciudad debe tener al menos 2 caracteres." })
    .optional(),

  provincia: z
    .string()
    .trim()
    .min(2, { message: "La provincia debe tener al menos 2 caracteres." })
    .optional(),

  codigoPostal: z
    .string()
    .trim()
    .min(1, { message: "Debe ingresar un código postal válido." })
    .optional(),

  pais: z
    .string()
    .trim()
    .min(2, { message: "El país debe tener al menos 2 caracteres." })
    .optional(),

  predeterminada: z.number().int().min(0).max(1).optional(),

  altura: z.number().int().positive().optional(),
});
