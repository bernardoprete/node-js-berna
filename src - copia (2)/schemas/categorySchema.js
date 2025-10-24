import { z } from "zod";

// SCHEMA PARA LA CREACION DE UNA CATEGORIA

export const createCategorySchema = z.object({
  nombre: z
    .string("El nombre es requerido y debe ser un string.")
    .trim()
    .min(3, { message: "El nombre debe contener al menos 3 caracteres" }),

  // imgPrincipal: requerido, string no vacío. (Podría ser URL o nombre de archivo)
  imagen: z
    .string("La imagen es requerida y debe ser un string.")
    .trim()
    .min(1, { message: "La imagen es requerida." }),

  descripcion: z
    .string("La descripción es requerida y debe ser un string.")
    .trim()
    .min(10, {
      message: "La descripción  debe tener al menos 10 caracteres.",
    })
    .max(50, "La descripcion debe tener como maximo 50 caracteres "),
});

// SCHEMA PARA LA MODIFICACION DE UNA CATEGORIA

export const updateCategorySchema = z.object({
  //Esto es para req.params no para el body ya que no permite el body insertar id.
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
    .optional(), // El optional me permite que este campo este o no este. CLAVEEEEEEE

  imagen: z
    .string("La imagen es requerida y debe ser un string.")
    .trim()
    .min(1, { message: "La imagen es requerida." })
    .optional(), // El optional me permite que este campo este o no este.

  descripcion: z
    .string("La descripción es requerida y debe ser un string.")
    .trim()
    .min(10, {
      message: "La descripción  debe tener al menos 10 caracteres.",
    })
    .max(50, "La descripcion debe tener como maximo 50 caracteres ")
    .optional(), // El optional me permite que este campo este o no este.
});
