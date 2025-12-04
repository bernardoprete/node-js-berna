import { pool } from "../db.js";
import { createError } from "../utils/utils.js";

/* 
Order model va ser el modelo que trabaja y hace las consultas a la tabla PEDIDO de nuestra BD.
Esta tabla maneja muchos datos de cada compra que se realiza - (A TRAVÉS DEL ID DE USUARIO PARA SABER A QUIÉN PERTENECE EL PEDIDO) 
(cada pedido) pero lo más importante a saber es que NO maneja el DETALLE DE LOS PRODUCTOS que tiene cada pedido, 
eso lo maneja otra tabla (detallepedido). 
*/

export const OrderModel = {
  // Definimos una propiedad para contener/acceder al nombre de la tabla correspondiente a este modelo
  tablename: "pedido",

  // Definimos los nombre de los campos de esa tabla en un objeto.
  fields: {
    id: "idPedido",
    fecha_pedido: "fecha_pedido",
    estado: "estado",
    metodo_pago: "metodo_pago",
    subtotal: "subtotal",
    impuestos: "impuestos",
    descuentos: "descuentos",
    total: "total",
    observaciones: "observaciones",
    idUsuario: "idUsuario",
    idDireccion: "idDireccion",
    estado_pago: "estado_pago",
  },

  /* 
  Trae todos los pedidos de la tabla. 
  (Útil para debug o visualizar todos los pedidos, pero no es el método principal.)
  */
  async findAll() {
    try {
      const [rows] = await pool.execute(`SELECT * FROM ${this.tablename}`);
      return rows;
    } catch (error) {
      throw error;
    }
  },

  /* 
  Trae un pedido puntual por su ID (idPedido). 
  Este sí es un método importante.
  */
  async findByID(id) {
    try {
      const [rows] = await pool.execute(
        `SELECT * FROM ${this.tablename} WHERE ${this.fields.id} = ?`,
        [id]
      );
      return rows[0];
    } catch (error) {
      console.log("Error al obtener el pedido solicitado", error);
      throw error;
    }
  },

  /* 
  Busca un pedido por un criterio dinámico, por ejm: { idUsuario: 4 }
  Si encuentra un registro lo devuelve.
  */
  async findOne(searchParams) {
    try {
      if (!searchParams || Object.keys(searchParams).length === 0)
        throw createError(
          400,
          "No se han proporcionado parámetros de búsqueda."
        );

      const fields = Object.keys(searchParams);
      const values = Object.values(searchParams);

      const conditions = fields.map((field) => `${field} = ?`).join(" AND ");

      const sql = `SELECT * FROM ${this.tablename} WHERE ${conditions}`;
      const [rows] = await pool.execute(sql, values);
      return rows[0];
    } catch (error) {
      throw error;
    }
  },

  /* 
  MODELO PARA CREAR UN PEDIDO:
  Ahora SOLO inserta los campos que pertenecen realmente a la tabla pedido.
  Los datos del ENVÍO se crean después en la tabla pedido_envio, desde el SERVICE.
  */
  async create(
    {
      fecha_pedido,
      estado = "pendiente",
      metodo_pago,
      subtotal,
      impuestos = 0,
      descuentos = 0,
      total,
      observaciones = null,
      idUsuario,
      idDireccion,
      estado_pago,
    },
    connection
  ) {
    try {
      // Array de columnas excepto el ID autoincremental
      const columns = Object.values(this.fields).filter(
        (field) => field !== this.fields.id
      );

      // Generamos los placeholders (?, ?, ?, ...)
      const placeholders = columns.map(() => "?").join(", ");

      // Orden de los valores exactamente según el orden de las columnas
      const values = [
        fecha_pedido,
        estado,
        metodo_pago,
        subtotal,
        impuestos,
        descuentos,
        total,
        observaciones,
        idUsuario,
        idDireccion,
        estado_pago,
      ];

      const sql = `INSERT INTO ${this.tablename} (${columns.join(
        ", "
      )}) VALUES (${placeholders})`;

      const [result] = await connection.execute(sql, values);
      const orderId = result.insertId;

      const [rows] = await connection.execute(
        `SELECT * FROM ${this.tablename} WHERE ${this.fields.id} = ?`,
        [orderId]
      );

      return rows[0];
    } catch (error) {
      console.log(error);
      throw createError(500, "Error al intentar crear el pedido");
    }
  },

  /* 
  MÉTODO QUE TRAE TODOS LOS PEDIDOS DE UN CLIENTE ESPECÍFICO (POR SU ID USUARIO)
  Incluye JOINS a productos, categorías, direcciones y AHORA envío.
  */
  async findAllClientOrders(
    finalParams,
    whereClause,
    orderClause,
    orderColumns
  ) {
    try {
      const finalQuery = `
      SELECT DISTINCT
        ${orderColumns}

      FROM pedido AS pe
      INNER JOIN detallepedido AS dp ON dp.idPedido = pe.idPedido
      INNER JOIN producto AS prod ON prod.idProducto = dp.idProducto
      INNER JOIN categoria AS c ON c.idCategoria = prod.idCategoria
      INNER JOIN direcciones AS d ON d.idDireccion = pe.idDireccion

      -- Integración del envío (LEFT JOIN por si el pedido aún no tiene registro en pedido_envio)
      LEFT JOIN pedido_envio AS peenv ON peenv.idPedido = pe.idPedido

      ${whereClause}
      ${orderClause}
      LIMIT ? OFFSET ?
      `;

      const [orders] = await pool.execute(finalQuery, finalParams);
      return orders;
    } catch (error) {
      console.log("Error al obtener los pedidos del sistema:", error);
      throw createError(500, "Error al listar los pedidos del sistema.");
    }
  },

  /* 
  MÉTODO DEL ADMIN QUE LISTA TODOS LOS PEDIDOS CON INFO COMPLETA
  */
  async findAllSystemOrders(
    finalParams,
    whereClause,
    orderClause,
    orderColumns
  ) {
    try {
      const sql = `
      SELECT DISTINCT
        ${orderColumns}

      FROM pedido AS pe
      INNER JOIN detallepedido AS dp ON dp.idPedido = pe.idPedido
      INNER JOIN producto AS prod ON prod.idProducto = dp.idProducto
      INNER JOIN categoria AS c ON c.idCategoria = prod.idCategoria
      INNER JOIN direcciones AS d ON d.idDireccion = pe.idDireccion
      INNER JOIN usuario AS u ON u.idUsuario = pe.idUsuario

      -- JOIN DE ENVÍO
      LEFT JOIN pedido_envio AS peenv ON peenv.idPedido = pe.idPedido

      ${whereClause}
      ${orderClause}
      LIMIT ? OFFSET ?
      `;
      const [rows] = await pool.execute(sql, finalParams);
      return rows;
    } catch (error) {
      console.log("Error al obtener los pedidos del sistema:", error);
      throw createError(500, "Error al listar los pedidos del sistema.");
    }
  },

  /* 
  METODO PARA TRAER UN PEDIDO POR ID CON INFO DEL USUARIO, DIRECCIÓN Y AHORA DATOS DE ENVÍO.
  */
  async findByIdOrder(idPedido) {
    try {
      const sql = `
      SELECT 
        p.${this.fields.id} AS idPedido,
        p.${this.fields.fecha_pedido},
        p.${this.fields.estado},
        p.${this.fields.metodo_pago},
        p.${this.fields.total},
        p.${this.fields.subtotal},
        p.${this.fields.idUsuario},
        p.${this.fields.idDireccion},

        -- datos del usuario
        u.nombre AS nombreUsuario,
        u.apellido AS apellidoUsuario,
        u.email AS emailUsuario,

        -- direccion
        d.direccionLinea1,
        d.direccionLinea2,
        d.ciudad,
        d.provincia,
        d.codigoPostal,

        -- datos del envío
        peenv.fecha_envio AS envio_fecha_envio,
        peenv.fecha_entrega AS envio_fecha_entrega,
        peenv.costo_envio AS envio_costo_envio,
        peenv.estado_envio AS envio_estado_envio,
        peenv.codigo_seguimiento AS envio_codigo_seguimiento,
        peenv.metodo_envio AS envio_metodo_envio

      FROM ${this.tablename} AS p
      INNER JOIN usuario AS u ON p.${this.fields.idUsuario} = u.idUsuario
      LEFT JOIN direcciones AS d ON p.${this.fields.idDireccion} = d.idDireccion

      -- JOIN ENVÍO
      LEFT JOIN pedido_envio AS peenv ON peenv.idPedido = p.idPedido

      WHERE p.${this.fields.id} = ?
      `;

      const [rows] = await pool.execute(sql, [idPedido]);

      if (rows.length === 0) return null;
      return rows[0];
    } catch (error) {
      console.log(
        "Error al obtener el pedido con datos del usuario, dirección y envío:",
        error
      );
      throw error;
    }
  },

  /* 
  MÉTODO DE PAGINACIÓN QUE HACE SOLO EL COUNT TOTAL DE PEDIDOS.
  */
  async paginationData(whereClause, queryParams) {
    try {
      const [resultTotal] = await pool.execute(
        `
        SELECT COUNT(DISTINCT pe.${this.fields.id}) as count
        FROM ${this.tablename} AS pe
        INNER JOIN detallepedido AS dp ON dp.idPedido = pe.idPedido
        INNER JOIN producto AS prod ON prod.idProducto = dp.idProducto
        INNER JOIN categoria AS c ON c.idCategoria = prod.idCategoria
        INNER JOIN direcciones AS d ON d.idDireccion = pe.idDireccion
        INNER JOIN usuario AS u ON u.idUsuario = pe.idUsuario
        
        -- envío incluido opcionalmente
        LEFT JOIN pedido_envio AS peenv ON peenv.idPedido = pe.idPedido

        ${whereClause}
        `,
        queryParams
      );

      return resultTotal[0].count;
    } catch (error) {
      throw error;
    }
  },

  /* 
  MÉTODOS PARA EL CAMBIO DE ESTADO DE PEDIDOS
  */

  // MÉTODO PARA ACTUALIZAR EL PEDIDO.

  async update(id, updateData, connection = pool) {
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
      const sql = `UPDATE ${this.tablename} SET ${setData} WHERE ${this.fields.id} = ?`;

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
};
