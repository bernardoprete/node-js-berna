import { pool } from "../db.js";
import { createError } from "../utils/utils.js";

export const brandModel = {
  // Definimos una propiedad para contener/acceder al nombre de la tabla correspondiente a este modelo
  tablename: "marca",
  // Definimos los nombre de los campos en un objeto.
  fields: {
    id: "idMarca",
    nombre: "nombre",
    imagen: "imagen",
    descripcion: "descripcion",
    slug: "slug",
  },

  async findAll() {
    try {
      const [rows] = await pool.execute(`SELECT * FROM ${this.tablename}`);
      return rows;
    } catch (error) {
      throw error;
    }
  },

  async findByID(id) {
    try {
      const [rows] = await pool.execute(
        `SELECT * FROM ${this.tablename} WHERE ${this.fields.id} = ?`,
        [id]
      );
      return rows[0];
    } catch (error) {
      console.log("Error al obtener la marca solicitada", error);
      throw error;
    }
  },

  async findOne(searchParams) {
    try {
      if (!searchParams || Object.keys(searchParams).length === 0)
        throw createError(
          400,
          "No se han proporcionado parametros de busqueda"
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
  //Crear marca
  async create({ nombre, slug, imagen, descripcion }) {
    try {
      const sql = `
      INSERT INTO ${this.tablename}
      (${this.fields.nombre}, ${this.fields.slug}, ${this.fields.imagen}, ${this.fields.descripcion})
      VALUES (?, ?, ?, ?)
    `;
      const [result] = await pool.execute(sql, [
        nombre,
        slug,
        (imagen = null), // Si imagen no esta en el body que se va a pasar para crear el producto, este campo queda como nulo y no como undefined que por sql rompe el back.
        (ofertaHasta = null), //Idem arriba
        descripcion,
      ]);
      return result.affectedRows > 0;
    } catch (error) {
      throw error;
    }
  },

  // Actualizar marca (update parcial)
  async updatePartial(id, updateData) {
    if (!updateData || Object.keys(updateData).length === 0) {
      throw createError(400, "No se enviaron datos para actualizar la marca.");
    }

    const fields = Object.keys(updateData); //Array de objetos
    const values = Object.values(updateData);

    const setData = fields.map((field) => `${field} = ?`).join(", ");
    const sql = `UPDATE ${this.tablename} SET ${setData} WHERE ${this.fields.id} = ?`;

    const [result] = await pool.execute(sql, [...values, id]); //Copio array de objetos como primer parametro

    if (result.affectedRows === 0) {
      throw createError(404, "No se encontro la marca a actualizar.");
    }

    return result.affectedRows > 0; //True si modifico y false sino modifico.
  },

  // Eliminar marca
  async deleteBrand(id) {
    const sql = `DELETE FROM ${this.tablename} WHERE ${this.fields.id} = ?`;
    const [result] = await pool.execute(sql, [id]);

    if (result.affectedRows === 0) {
      throw createError(404, "No se encontro la marca a eliminar.");
    }

    return result.affectedRows > 0; //Devuelve true si elimino o false sino elimino
  },
};
