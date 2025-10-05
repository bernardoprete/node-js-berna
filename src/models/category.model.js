import { pool } from "../db.js";
import { createError } from "../utils/utils.js";

export const categoryModel = {
  // Definimos una propiedad para contener/acceder al nombre de la tabla correspondiente a este modelo
  tablename: "categoria",
  // Definimos los nombre de los campos en un objeto.
  fields: {
    id: "idCategoria",
    nombre: "nombre",
    imagen: "imagen",
    descripcion: "descripcion",
    slug: "slug",
    /*   created_at: 'created_at',
          updated_at: 'updated_at' */
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
      console.log("Error al obtener la categoria solicitada", error);
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

  /*  async findMovieDetails(searchParams) {    //DEJO COMENTADO ESTE METODO QUE LO QUE HACE ES FILTRAR LOS CAMPOS QUE TIENEN UN ID Y TRANSFORMARLOS EN LO QUE ES ESE ID - EN ESTE CASO NO TENEMOS CAMPOS CON ID (ESTO ESTA EN LA CLASE 17/9 Y SE USO PARA LA BD DE PELICULAS)
    try {
      if (!searchParams || Object.keys(searchParams).length === 0)
        throw createError(
          400,
          "No se han proporcionado parametros de busqueda"
        );

      const fields = Object.keys(searchParams);
      const values = Object.values(searchParams);

      const conditions = fields.map((field) => `p.${field} = ?`).join(" AND ");

      // Selecciono los campos/columnas de la tabla categoria
      const categoryColumns = Object.values(this.fields)
        .filter(
          (field) =>
            field != this.fields.idDirector && field != this.fields.idGenero
        )
        .map((column) => `p.${column}`)
        .join(", ");

      const sql = `SELECT ${movieColumns}, g.genero, g.slug AS slug_genero, d.nombre AS director FROM ${this.tablename} AS p 
            INNER JOIN generos AS g ON g.idGenero = p.idGenero
            INNER JOIN directores AS d ON d.idDirector = p.idDirector
            WHERE ${conditions}`;
      const [rows] = await pool.execute(sql, values);

  

      return rows[0];
    } catch (error) {
      throw error;
    }
  }, */

  //Crear una categoria
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

  // Actualizar categoria (update parcial)
  async updatePartial(id, updateData) {
    if (!updateData || Object.keys(updateData).length === 0) {
      throw createError(
        400,
        "No se enviaron datos para actualizar la categoria."
      );
    }

    const fields = Object.keys(updateData);
    const values = Object.values(updateData); //Array de objetos

    const setData = fields.map((field) => `${field} = ?`).join(", ");
    const sql = `UPDATE ${this.tablename} SET ${setData} WHERE ${this.fields.id} = ?`;

    const [result] = await pool.execute(sql, [...values, id]); //copio el array de objetos aqui como primer parametro.

    if (result.affectedRows === 0) {
      throw createError(404, "No se encontro la categoria a actualizar.");
    }

    return result.affectedRows > 0;
  },

  // Eliminar categoria
  async deleteCategory(id) {
    const sql = `DELETE FROM ${this.tablename} WHERE ${this.fields.id} = ?`;
    const [result] = await pool.execute(sql, [id]);

    if (result.affectedRows === 0) {
      throw createError(404, "No se encontro la categoria a eliminar.");
    }

    return result.affectedRows > 0;
  },
};
