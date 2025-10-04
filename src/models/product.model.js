import { deleteProduct } from "../controllers/product.controller.js";
import { pool } from "../db.js";

import { createError } from "../utils/utils.js";

export const ProductModel = {
  // Definimos una propiedad para contener/acceder al nombre de la tabla correspondiente a este modelo
  tablename: "producto",
  // Definimos los nombre de los campos en un objeto.
  fields: {
    id: "idProducto",
    nombre: "nombre",
    descripcionCorta: "descripcionCorta",
    descripcionLarga: "descripcionLarga",
    stock: "stock",
    precio: "precio",
    slug: "slug",
    precioOferta: "precioOferta",
    ofertaHasta: "ofertaHasta",
    imgPrincipal: "imgPrincipal",
    visible: "visible",
    idMarca: "idMarca",
    sku: "sku",
    idCategoria: "idCategoria",
    created_at: "created_at",
    updated_at: "updated_at",
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
      console.log("Error al obtener el genero solicitado", error);
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

  async findProductDetails(searchParams) {
    try {
      if (!searchParams || Object.keys(searchParams).length === 0)
        throw createError(
          400,
          "No se han proporcionado parametros de busqueda"
        );

      const fields = Object.keys(searchParams);
      const values = Object.values(searchParams);

      const conditions = fields.map((field) => `p.${field} = ?`).join(" AND ");

      // Selecciono los campos/columnas de la tabla peliculas
      const productColumns = Object.values(this.fields)
        .filter(
          (field) =>
            field != this.fields.created_at &&
            field != this.fields.updated_at &&
            field != this.fields.visible &&
            field != this.fields.nombre
        )
        .map((column) => `p.${column}`)
        .join(", ");

      const sql = `SELECT ${productColumns}, p.nombre AS producto, c.nombre AS categoria, m.nombre AS marca FROM ${this.tablename} AS p 
            INNER JOIN categoria AS c ON c.idCategoria = p.idCategoria
            INNER JOIN marca AS m ON m.idMarca = p.idMarca
            WHERE ${conditions}`;
      const [rows] = await pool.execute(sql, values);

      /* 
            SELECT 
p.idPelicula, p.titulo, p.valor, p.fecha_estreno, p.stock, p.slug, g.genero, g.slug AS slug_genero, d.nombre AS director
FROM peliculas AS p
INNER JOIN generos AS g ON g.idGenero = p.idGenero
INNER JOIN directores AS d ON d.idDirector = p.idDirector
WHERE idPelicula = 15;
            */

      return rows[0];
    } catch (error) {
      throw error;
    }
  },

  async create({
    nombre,
    descripcionCorta,
    descripcionLarga,
    stock,
    slug,
    precio,
    precioOferta = null,
    ofertaHasta = null,
    imgPrincipal,
    visible = true,
    sku = null,
    idMarca,
    idCategoria,
  }) {
    // Seleccionar aquellos campos sobre los cuales queremos trabajar, en este caso, a la hora de insertar un nuevo producto, los campos created_at y updated_at son automaticos desde la bd, entonces, no los tenemos que tener en cuenta, tenemos dos opciones, o lo ponemos uno por uno en la consulta sql, o filtramos.
    const columns = Object.values(this.fields).filter(
      (field) =>
        field != this.fields.created_at &&
        field != this.fields.updated_at &&
        field != this.fields.id
    );
    // ['titulo','valor',etc..]
    console.log(columns);

    const placeholders = columns.map((column) => `?`).join(", ");
    console.log(placeholders);

    // ['?', '?'].join(', ') -> '?, ?, ?'
    try {
      const sql = `INSERT INTO ${this.tablename} (${columns.join(
        ", "
      )}) VALUES (${placeholders})`;
      const values = [
        nombre,
        descripcionCorta,
        descripcionLarga,
        stock,
        precio,
        slug,
        precioOferta,
        ofertaHasta,
        imgPrincipal,
        visible,
        idMarca,
        sku,
        idCategoria,
      ];
      console.log(values);

      const [result] = await pool.execute(sql, values);
      const product = await this.findByID(result.insertId);
      return product;
    } catch (error) {
      throw error;
    }
  },

  async findAllLimit(page, limit, offset) {
    try {
      // Calcular el total de productos de la BD mediante esta consulta SQL.
      const [resultTotal] = await pool.execute(
        `SELECT COUNT(${this.fields.id}) as count FROM ${this.tablename}`
      );
      /* console.log('result total', resultTotal);
             console.log('result total fila 1', resultTotal[0]);*/

      const totalProducts = resultTotal[0].count; //Como arriba desestructuro,me queda asi : resultTotal = [ { count: 42 } ] ----- aqui voy directo a obtener el numero del array (pongo[0] ya que es el unico campo que tiene ese array y con el.count llego a el numero en si ejm 42 )

      const [products] = await pool.execute(
        `SELECT * FROM ${this.tablename} LIMIT ? OFFSET ?`,
        [String(limit), String(offset)]
      );

      // calcular el total de páginas que debe mostrar el front
      const totalPages = Math.ceil(totalProducts / limit); // el método .ceil() redondea un número decimal hacia arriba.

      // META DATOS PARA LA PAGINACIÓN.

      return {
        products,
        pagination: {
          totalProducts,
          totalPages,
          currentPage: page, // Pagina actual
          limit,
          hasNextPage: page < totalPages, //Si hay proxima pagina.
          hasPrevPage: page > 1, // Si hay pagina previa.
        },
      };
    } catch (error) {
      throw error;
    }
  },

  // Actualizar producto (update parcial)
  async updatePartial(id, updateData) {
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

    const [result] = await pool.execute(sql, [...values, id]); //Copio array de objetos como primer parametro

    if (result.affectedRows === 0) {
      throw createError(404, "No se encontro el producto a actualizar.");
    }

    return result.affectedRows > 0; //True si modifico y false sino modifico.
  },

  // Eliminar producto
  async deleteProduct(id) {
    const sql = `DELETE FROM ${this.tablename} WHERE ${this.fields.id} = ?`;
    const [result] = await pool.execute(sql, [id]);

    if (result.affectedRows === 0) {
      throw createError(404, "No se encontro el producto a eliminar.");
    }

    return result.affectedRows > 0; //Devuelve true si elimino o false sino elimino
  },
};
