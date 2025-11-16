import { z } from "zod";

export const createOrderSchema = z.object({
  metodo_pago: z.enum(["tarjeta", "efectivo", "transferencia"]),
  idDireccion: z.number().int().positive(),
});
