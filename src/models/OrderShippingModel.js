import { pool } from "../db.js";
import { createError } from "../utils/utils.js";

/*
  Este modelo maneja TODA la tabla pedido_envio.
  Se usa SIEMPRE junto a OrderModel, pero nunca se mezcla.
*/

export const OrderShippingModel = {
  tablename: "pedido_envio",

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

  /*
    CREA el registro de envío cuando la orden pasa a “enviado”.
  */
  async createShippingData(
    {
      fecha_entrega = null,
      fecha_envio = null,
      costo_envio = 0,
      codigo_seguimiento = null,
      metodo_envio = null,
      estado_envio = "pendiente",
      idPedido,
    },
    connection = pool
  ) {
    try {
      const columns = Object.values(this.fields).filter(
        (field) => field !== this.fields.idEnvio
      );

      const placeholders = columns.map(() => "?").join(", ");

      const values = [
        idPedido,
        fecha_envio,
        fecha_entrega,
        costo_envio,
        codigo_seguimiento,
        metodo_envio,
        estado_envio,
      ];

      const sql = `
        INSERT INTO ${this.tablename}
          (idPedido, fecha_envio, fecha_entrega, costo_envio, codigo_seguimiento, metodo_envio, estado_envio)
        VALUES (${placeholders})
      `;

      const [result] = await connection.execute(sql, values);
      const insertedId = result.insertId;

      const [rows] = await connection.execute(
        `SELECT * FROM ${this.tablename} WHERE idEnvio = ?`,
        [insertedId]
      );

      return rows[0];
    } catch (error) {
      if (error.status) throw error;
      console.log(error);
      throw createError(
        500,
        "Error al intentar crear la información de envío del pedido."
      );
    }
  },

  /*
    ACTUALIZA dinámicamente cualquier campo del envío
    según el ID del pedido.
  */
  async updateShippingData(idPedido, updateData, connection = pool) {
    try {
      if (!updateData || Object.keys(updateData).length === 0) {
        throw createError(
          400,
          "No se enviaron datos para actualizar la información de envío."
        );
      }

      const fields = Object.keys(updateData);
      const values = Object.values(updateData);

      const setData = fields.map((field) => `${field} = ?`).join(", ");

      const sql = `
        UPDATE ${this.tablename}
        SET ${setData}
        WHERE idPedido = ?
      `;

      const [result] = await connection.execute(sql, [...values, idPedido]);

      if (result.affectedRows === 0) {
        throw createError(
          404,
          "No existe información de envío asociada a esta orden."
        );
      }

      return true;
    } catch (error) {
      if (error.status) throw error;
      console.log(error);
      throw createError(
        500,
        "Error al intentar actualizar la información del envío."
      );
    }
  },

  /*
    OBTIENE la información de envío de una orden.
    Se usa en:
      - shippedService (para evitar duplicados)
      - deliveredService (para validar entregas)
      - admin (para ver la info completa)
  */
  async findShippingByOrderId(idPedido) {
    try {
      const sql = `
        SELECT *
        FROM ${this.tablename}
        WHERE idPedido = ?
      `;

      const [rows] = await pool.execute(sql, [idPedido]);
      return rows[0] || null;
    } catch (error) {
      console.log("Error al obtener datos de envío:", error);
      throw createError(
        500,
        "Error al obtener la información del envío para este pedido."
      );
    }
  },
};
