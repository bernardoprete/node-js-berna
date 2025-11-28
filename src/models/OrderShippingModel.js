import { pool } from "../db.js";
import { createError } from "../utils/utils.js";

/* 
  Este modelo se encarga de manejar TODAS las consultas relacionadas
  al envío del pedido. 
  Este modelo SIEMPRE se usa junto con OrderModel.

*/

export const OrderShippingModel = {
  // Nombre de la tabla
  tablename: "pedido_envio",

  // Campos de la tabla
  fields: {
    idEnvio: "idEnvio",
    idPedido: "idPedido",
    fecha_envio: "fecha_envio",
    fecha_entrega: "fecha_entrega",
    costo_envio: "costo_envio",
    codigo_seguimiento: "codigo_seguimiento",
    metodo_envio: "metodo_envio",
    estado_envio: "estado_envio",
  },

  //  Este método se ejecuta AUTOMÁTICAMENTE cuando se crea un pedido. Como manejamos el costo de envio e impuestos?

  async createInitial(idPedido, connection) {
    try {
      const sql = `
        INSERT INTO ${this.tablename}
        (idPedido, estado_envio, costo_envio)
        VALUES (?, 'pendiente', 0)
      `;

      await connection.execute(sql, [idPedido]);

      return true;
    } catch (error) {
      console.log("Error al crear el envío inicial del pedido:", error);
      throw createError(
        500,
        "Error al intentar crear el registro inicial de envío."
      );
    }
  },

  //Muestra los datos del envío asociados a un pedido. Es util si el admin quiere ver información completa del envío.
  async findByOrderId(idPedido) {
    try {
      const sql = `
        SELECT * 
        FROM ${this.tablename}
        WHERE idPedido = ?
      `;

      const [rows] = await pool.execute(sql, [idPedido]);
      return rows[0] || null;
    } catch (error) {
      console.log("Error al buscar datos del envío por ID de pedido:", error);
      throw createError(
        500,
        "Error al obtener la información del envío para este pedido."
      );
    }
  },
};

//Hay que seguir creando los metodos para actualizar a los diferentes estados en la BD.
