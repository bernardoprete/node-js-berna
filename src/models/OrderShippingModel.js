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

  async createOrderShippedData(
    {
      // Desestructuración del objeto...
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
      // EN EL MODELO HACERLO DE FORMA DINÁMICA:

      const values = [
        fecha_entrega,
        fecha_envio,
        costo_envio,
        codigo_seguimiento,
        metodo_envio,
        estado_envio,
        idPedido,
      ];

      const sql = `INSERT INTO pedido_envio (fecha_entrega,fecha_envio,costo_envio,codigo_seguimiento,metodo_envio,estado_envio,idPedido)
       VALUES (?,?,?,?,?,?,?)`;

      console.log("VALUES", values);

      //
      const [result] = await connection.execute(sql, values);

      // Retornamos el ID que es autoincremental generado por la BD.
      const orderShippedDataId = result.insertId;

      const [rows] = await connection.execute(
        `SELECT * FROM pedido_envio WHERE idEnvio = ?`,
        [orderShippedDataId]
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

  async updateOrderShippedData(id, updateData, connection = pool) {
    try {
      //conection o pool comun.
      if (!updateData || Object.keys(updateData).length === 0) {
        throw createError(
          400,
          "No se enviaron datos para actualizar el producto."
        );
      }

      const fields = Object.keys(updateData); //Array de objetos
      const values = Object.values(updateData);

      const setData = fields.map((field) => `${field} = ?`).join(", ");
      const sql = `UPDATE pedido_envio SET ${setData} WHERE idPedido = ?`;

      const [result] = await connection.execute(sql, [...values, id]); //Copio array de objetos como primer parametro

      if (result.affectedRows === 0) {
        throw createError(404, "No se encontro la orden a actualizar.");
      }

      return result.affectedRows > 0; //True si modifico y false sino modifico.
    } catch (error) {
      if (error.status) throw error;
      console.log(error);
      throw createError(500, "Error al intentar actualizar el pedido");
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
