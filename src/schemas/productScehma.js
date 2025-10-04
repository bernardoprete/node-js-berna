import { z } from "zod";

// (Opcional) Un regex simple para SKU: mayúsculas, números y guiones, 3–30 chars.
// - ^ y $ anclan el patrón al inicio/fin.
// - [A-Z0-9-] permite letras mayúsculas, dígitos y guiones.
// - {3,30} exige entre 3 y 30 caracteres.
const skuRegex = /^[A-Z0-9-]{3,30}$/;

//SCHEMA PARA LA CREACION DE UN PRODUCTO

export const createProductSchema = z.object({
  nombre: z
    .string("El nombre es requerido y debe ser un string.")
    .trim()
    .min(3, { message: "El nombre debe contener al menos 3 caracteres." }),

  // descripcionCorta: requerido, string con mínimo/máximo razonable.
  descripcionCorta: z
    .string("La descripción corta es requerida y debe ser un string.")
    .trim()
    .min(10, {
      message: "La descripción corta debe tener al menos 10 caracteres.",
    })
    .max(200, {
      message: "La descripción corta no debe superar 200 caracteres.",
    }),

  // descripcionLarga: requerido, string mas extenso.
  descripcionLarga: z
    .string("La descripción larga es requerida y debe ser un string.")
    .trim()
    .min(20, {
      message: "La descripción larga debe tener al menos 20 caracteres.",
    })
    .max(2000, {
      message: "La descripción larga no debe superar 2000 caracteres.",
    }),

  // precio: Tiene que ser numero positivo
  // .coerce.number() intenta convertir de string a número (p.ej. "15000" a 15000).
  // .gt(0) -> mayor a 0.
  precio: z.coerce
    .number({ message: "El precio debe ser un número." })
    .gt(0, { message: "El precio debe ser mayor a 0." }),

  // precioOferta: opcional, número positivo si viene en el body.

  precioOferta: z.coerce
    .number({ message: "El precio de oferta debe ser un número." })
    .min(0, { message: "El precio de oferta debe ser mayor a 0." })
    .optional(),

  // Aca no deberia validar que la fecha de ofertaHasta sea > que la fecha de creacion de la oferta?
  ofertaHasta: z.coerce //lleva de string a date
    .date({ message: "La fecha de oferta no es valida (usa YYYY-MM-DD)." })
    .optional(),

  // stock: requerido, entero >= 0.
  stock: z.coerce
    .number({ message: "El stock debe ser un numero." })
    .int({ message: "El stock debe ser un número entero." })
    .min(0, { message: "El stock no puede ser negativo." }),

  // imgPrincipal: requerido, string no vacío. (Podría ser URL o nombre de archivo)
  imgPrincipal: z
    .string("La imagen principal es requerida y debe ser un string.")
    .trim()
    .min(1, { message: "La imagen principal es requerida." }),

  // sku: opcional, restringido por regex (solo si lo mandan).
  sku: z
    .string({ message: "El SKU debe ser un string." })
    .trim()
    .regex(skuRegex, {
      message: "El SKU debe tener 3-30 caracteres en [A-Z 0-9 -] (mayúsculas).",
    })
    .optional(),

  idMarca: z.coerce
    .number({ message: "El idMarca debe ser un número." })
    .int({ message: "El idMarca debe ser un número entero." })
    .positive({ message: "El idMarca debe ser un entero positivo." }),

  idCategoria: z.coerce
    .number({ message: "El idCategoria debe ser un número." })
    .int({ message: "El idCategoria debe ser un número entero." })
    .positive({ message: "El idCategoria debe ser un entero positivo." }),
});

//DUDAS
// Si mandan precioOferta y Precio entonces precioOferta debe ser < precio -- HAY QUE VALIDAR ACA ?
// Si viene oferta hasta entonces esa fecha debe ser si o si un dia futuro al de hoy.




//SCHEMA PARA LA MODIFICACION DE UN PRODUCTO

export const updateProductSchema = z.object({
  // id: viene de params, pero hay que validarlo igual  (string desp number y luego int positivo)
  id: z
    .string()
    .trim()
    .pipe(
      z.coerce
        .number({ message: "El ID debe ser un número." })
        .int({ message: "El ID debe ser un número entero." })
        .positive({ message: "El ID debe ser un entero positivo." })
    ),

  // Todos los demás campos son opcionales (update parcial):
  nombre: z
    .string("El nombre debe ser un string.")
    .trim()
    .min(3, { message: "El nombre debe contener al menos 3 caracteres." })
    .optional(),

  descripcionCorta: z
    .string("La descripción corta debe ser un string.")
    .trim()
    .min(10, {
      message: "La descripción corta debe tener al menos 10 caracteres.",
    })
    .max(200, {
      message: "La descripción corta no debe superar 200 caracteres.",
    })
    .optional(),

  descripcionLarga: z
    .string("La descripción larga debe ser un string.")
    .trim()
    .min(20, {
      message: "La descripción larga debe tener al menos 20 caracteres.",
    })
    .max(2000, {
      message: "La descripción larga no debe superar 2000 caracteres.",
    })
    .optional(),

  precio: z.coerce
    .number({ message: "El precio debe ser un número." })
    .gt(0, { message: "El precio debe ser mayor a 0." })
    .optional(),

  precioOferta: z.coerce
    .number({ message: "El precio de oferta debe ser un número." })
    .gt(0, { message: "El precio de oferta debe ser mayor a 0." })
    .optional(), // Aqui este precio deberia ser menor que precio, pero no lo estoy validando. OJO -------

  ofertaHasta: z.coerce
    .date({ message: "La fecha de oferta no es válida (usa YYYY-MM-DD)." })
    .optional(), // Esta fecha si o si debe ser futura con respecto al dia de la creacion de la oferta. y si hay ofertaHasta entonces en el body tiene que estar si o si PrecioOferta -- AQUI NO LO VALIDO.

  stock: z.coerce
    .number({ message: "El stock debe ser un número." })
    .int({ message: "El stock debe ser un número entero." })
    .min(0, { message: "El stock no puede ser negativo." })
    .optional(),

  imgPrincipal: z
    .string("La imagen principal debe ser un string.")
    .trim()
    .min(1, { message: "La imagen principal no puede ser vacía." })
    .optional(),

  visible: z
    .boolean({ message: "El campo 'visible' debe ser booleano." })
    .optional(),

  sku: z
    .string({ message: "El SKU debe ser un string." })
    .trim()
    .regex(skuRegex, {
      message: "El SKU debe tener 3-30 caracteres en [A-Z 0-9 -] (mayúsculas).",
    })
    .optional(),

  idMarca: z.coerce
    .number({ message: "El idMarca debe ser un número." })
    .int({ message: "El idMarca debe ser un número entero." })
    .positive({ message: "El idMarca debe ser un entero positivo." })
    .optional(),

  idCategoria: z.coerce
    .number({ message: "El idCategoria debe ser un número." })
    .int({ message: "El idCategoria debe ser un número entero." })
    .positive({ message: "El idCategoria debe ser un entero positivo." })
    .optional(),
});

// -----------------------------------------------------------------------------
// SCHEMA: PAGINACIÓN (?page=&limit=)
// -----------------------------------------------------------------------------
// Pensado para validar req.query de tu endpoint GET /products/limited.
// - .default(1/5) te permite NO mandar page/limit y que tengan valores por defecto.
// - .int().min(1) asegura que sean enteros positivos.
export const paginationSchema = z.object({
  page: z.coerce
    .number({ message: "El parámetro 'page' debe ser un número." })
    .int({ message: "El parámetro 'page' debe ser un entero." })
    .min(1, { message: "El parámetro 'page' debe ser al menos 1." })
    .default(1),
  limit: z.coerce
    .number({ message: "El parámetro 'limit' debe ser un número." })
    .int({ message: "El parámetro 'limit' debe ser un entero." })
    .min(1, { message: "El parámetro 'limit' debe ser al menos 1." })
    .default(5),
});
