import { pool } from "../db.js";
import { createError } from "../utils/utils.js";

export const AddressModel = {
  // Definimos una propiedad para contener/acceder al nombre de la tabla correspondiente a este modelo
  tablename: "direcciones",
  // Definimos los nombre de los campos en un objeto.
  fields: {
    id: "idDireccion",
    direccionLinea1: "direccionLinea1",
    direccionLinea2: "direccionLinea2",
    ciudad: "ciudad",
    provincia: "provincia",
    codigoPostal: "codigoPostal",
    pais: "pais",
    predeterminada: "predeterminada",
    idUsuario: "idUsuario",
    altura: "altura",
  },

  async findAll() {
    try {
      const [rows] = await pool.execute(`SELECT * FROM ${this.tablename}`);
      return rows;
    } catch (error) {
      throw error;
    }
  },
  //Busca por id de direccion.
  async findByID(id) {
    try {
      const [rows] = await pool.execute(
        `SELECT * FROM ${this.tablename} WHERE ${this.fields.id} = ?`,
        [id]
      );
      return rows[0];
    } catch (error) {
      console.log("Error al obtener la direccion solicitada", error);
      throw error;
    }
  },

  async search(searchParams) {
    ////Para probar ahora ya no busca uno sino que trae direcciones filtradas. Elimine findOne.
    try {
      if (!searchParams || Object.keys(searchParams).length === 0) {
        throw createError(
          400,
          "No se han proporcionado parámetros de búsqueda"
        );
      }

      const fields = Object.keys(searchParams);

      const conditions = fields.map((field) => `${field} LIKE ?`).join(" AND ");
      const values = fields.map((field) => `%${searchParams[field]}%`);

      const sql = `SELECT * FROM ${this.tablename} WHERE ${conditions}`;
      const [rows] = await pool.execute(sql, values);

      return rows; //  DEVOLVEMOS TODOS LOS RESULTADOS
    } catch (error) {
      throw error;
    }
  },

  //CREAR UNA DIRECCION
  async create({
    direccionLinea1,
    direccionLinea2,
    ciudad,
    provincia,
    codigoPostal,
    pais,
    predeterminada,
    idUsuario,
    altura,
  }) {
    try {
      const sql = `
      INSERT INTO ${this.tablename}
      (${this.fields.direccionLinea1},
       ${this.fields.direccionLinea2},
       ${this.fields.ciudad},
       ${this.fields.provincia},
       ${this.fields.codigoPostal},
       ${this.fields.pais},
       ${this.fields.predeterminada},
       ${this.fields.idUsuario},
       ${this.fields.altura})
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

      const [result] = await pool.execute(sql, [
        direccionLinea1,
        direccionLinea2,
        ciudad,
        provincia,
        codigoPostal,
        pais,
        predeterminada,
        idUsuario,
        altura,
      ]);

      return result.affectedRows > 0;
    } catch (error) {
      throw error;
    }
  },

  // Actualizar direccion (update parcial)
  async updatePartial(id, updateData) {
    if (!updateData || Object.keys(updateData).length === 0) {
      throw createError(
        400,
        "No se enviaron datos para actualizar la direccion."
      );
    }

    const fields = Object.keys(updateData); //Array de objetos
    const values = Object.values(updateData);

    const setData = fields.map((field) => `${field} = ?`).join(", ");
    const sql = `UPDATE ${this.tablename} SET ${setData} WHERE ${this.fields.id} = ?`;

    const [result] = await pool.execute(sql, [...values, id]); //Copio array de objetos como primer parametro

    if (result.affectedRows === 0) {
      throw createError(404, "No se encontro la direccion a actualizar.");
    }

    return result.affectedRows > 0; //True si modifico y false sino modifico.
  },

  // Eliminar direccion
  async deleteAddress(id) {
    const sql = `DELETE FROM ${this.tablename} WHERE ${this.fields.id} = ?`;
    const [result] = await pool.execute(sql, [id]);

    if (result.affectedRows === 0) {
      throw createError(404, "No se encontro la direccion a eliminar.");
    }

    return result.affectedRows > 0; //Devuelve true si elimino o false sino elimino
  },

  // Metodo para ver si el id de direccion que yo quiera buscar coincide con el id del usuario. Se usa para corroborar si la direccion de envio que se coloca en el body coindice con alguna de las direcciones dle usuario logueado al generar un pedido.

  async checkUserAddress(id, idUsuario) {
    try {
      const sql = `SELECT  * FROM ${this.tablename}
     WHERE ${this.fields.id} = ? AND ${this.fields.idUsuario} = ?`;
      const [rows] = await pool.execute(sql, [id, idUsuario]);

      if (rows.length === 0) {
        throw createError(
          400,
          "No se encontro la direccion o la misma no pertenece al usuario"
        );
      }

      return rows.length > 0; //Devuelve true si elimino o false sino elimino
    } catch (error) {
      console.log(error);
      throw error;
    }
  },

  async findByUserId(idUsuario) {
  try {
    const sql = `SELECT * FROM ${this.tablename} WHERE ${this.fields.idUsuario} = ?`;
    const [rows] = await pool.execute(sql, [idUsuario]);
    return rows;
  } catch (error) {
    throw error;
  }
}

};
