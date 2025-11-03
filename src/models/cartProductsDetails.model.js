import { object } from "zod";
import { pool } from "../db.js";
import { createError } from "../utils/utils.js";

/* En este modelo se Guardan los productos específicos que están dentro de cada carrito. Se relaciona con al tabla carritoproductos de nuestra BD. Es vital saber que esta tabla de la bd es muy importante ya que es la que relaciona que producto(idProducto) en particular se agregar a cada carrito en particular (idcarrito) Cuando esto suceda (Es decir cuando un prodcuto particular se agregue a un carrito particular) esa combinacion de producto y carrito quedara fijada por un numero unico que es el id de carritoProducto. */
export const CartProductsDetailsModel = {
  // Definimos una propiedad para contener/acceder al nombre de la tabla correspondiente a este modelo
  tablename: "carritoproductos",
  // Definimos los nombre de los campos en un objeto.
  fields: {
    id: "idCarritoProducto",
    cantidad: "cantidad",
    precioProductoCarrito: "precioProductoCarrito",
    subtotalProductoCarrito: "subtotalProductoCarrito",
    created_at: "created_at",
    updated_at: "updated_at",
    idProducto: "idProducto",
    idCarrito: "idCarrito",
  },

  async findAll() {
    //Trae todos los items de todos los carritos (poco común en producción, más para testing). POCO IMPORTANTE.
    try {
      const [rows] = await pool.execute(`SELECT * FROM ${this.tablename}`); //El pool.execute devuelve un array con arrays adentro, uno que tiene las filas, el resultado de la consulta y el otro los metadatos (que no su usan casi nunca), entonces al hacer: [rows] -  hacemos DESESTRUCTURACION DE ARRAYS y al poner solo una variable (en este caso rows) lo que decimos es que nos muestre el primer array de esos 2, es decir el de primer indice.
      return rows; //Aqui solo devolvemos rows (sin corchete) ya que el corchete lo haciamos para hacer la desestructuracion y aqui solo mostramos el resultado.
    } catch (error) {
      throw error;
    }
  },

  async findByID(id) {
    //Busca un item específico dentro del detalle es decir un producto particular agregado a un carrito particular o sea, esa combinacion unica (por su idCarritoProducto).
    try {
      const [rows] = await pool.execute(
        `SELECT * FROM ${this.tablename} WHERE ${this.fields.id} = ?`, //Busca por idProductoCarrito.
        [id]
      );
      return rows[0]; // Aqui devolvemos por convencion rows[0] porque si o si la consulta nos dara como respuesta un unico elemento, pese a eso por convencion va ese primer indice.
    } catch (error) {
      console.log("Error al obtener el carrito solicitado", error);
      throw error;
    }
  },

  async findOne(searchParams) {
    //Permite buscar dinamicamente por varios parametros. Por ejm : CartProductsDetailsModel.findOne({ idProducto: 3, idCarrito: 1 })Aqui buscamos un prod particular en un carrito particular
    try {
      if (!searchParams || Object.keys(searchParams).length === 0)
        //Si no existen parametros de busqueda o
        throw createError(
          400,
          "No se han proporcionado parametros de busqueda"
        );
      const fields = Object.keys(searchParams); //Object.keys devuelve un array con los nombres de las claves del objeto que le pasemos por parametro, en este caso los parametros de busqueda.
      const values = Object.values(searchParams); //Object.values devuelve un array con los valores asociados a  las claves  del objeto que le pasemos por parametro, en este caso los parametros de busqueda.
      const conditions = fields.map((field) => `${field} = ?`).join(" AND "); // Del array con los nombres de las claves del obj que le damos por parametros hacemos una recorrida y devolvemos un nuevo array modificado con el nombre y el ? ejm : ["slug = ?", "visible = ?"]

      const sql = `SELECT * FROM ${this.tablename} WHERE ${conditions}`; //Aqui hacemos la consulta insertando ese array de conditions.
      const [rows] = await pool.execute(sql, values); //Aqui insertamos el array de valores donde cada indice se corresponde con cada indice de las condiciones.
      return rows[0]; //Retornamos un unico valor, por convencion.
    } catch (error) {
      throw error;
    }
  },

  async checkItemInCart(idProducto, idCarrito) {
    try {
      /* Chequea si un producto ya está en un carrito específico.
      Se usa para evitar duplicados.Este metodo devuelve toda la fila con el detalle del producto y del carrito (la combinacion) */
      const [rows] = await pool.execute(
        `SELECT * FROM ${this.tablename} WHERE ${this.fields.idProducto} = ? AND ${this.fields.idCarrito} = ?`,
        [idProducto, idCarrito]
      );
      return rows[0];
    } catch (error) {
      throw error;
    }
  },

  async addItem(cartItem) {
    /* Inserta un nuevo producto en el carrito.  INSERT INTO carritoproductos (cantidad, precioProductoCarrito, subtotalProductoCarrito, idProducto, idCarrito)
       VALUES (?, ?, ?, ?, ?)
 */
    try {
      const columns = Object.keys(cartItem); //Esto es un array de campos que se pasan por parametro y son las columnas que se van a agregar en la consulta a la bd.
      const placeholders = columns.map(() => "?").join(", ");
      const values = Object.values(cartItem); //Son los valorescorrespondientes a  las "columns" de arriba.
      const [result] = await pool.execute(
        `INSERT INTO ${this.tablename} ( ${columns.join(", ")} )  
         VALUES 
         (${placeholders})`,
        values
      );
      return result.affectedRows > 0; //Retorna true si se inserto bien o false de lo contrario.
    } catch (error) {
      console.log(
        "Error en el modelo al intetar agregar el item al carrito.",
        error
      );
      throw error;
    }
  },

  async updatedItem(updatedData, idProducto, idCarrito) {
    /* Actualiza un producto que ya estaba en el carrito (por ejemplo, aumenta cantidad). 
 La consulra SQL de ejm: 
 UPDATE carritoproductos
 SET cantidad = ?, subtotalProductoCarrito = ?
 WHERE idProducto = ? AND idCarrito = ?
 */
    try {
      const columns = Object.keys(updatedData)
        .map((column) => `${column} = ?`)
        .join(", "); //nombre = ?, cantidad = ?, ...
      const values = Object.values(updatedData);
      const [result] = await pool.execute(
        `UPDATE ${this.tablename} SET ${columns}
        WHERE ${this.fields.idProducto} = ? AND ${this.fields.idCarrito} = ? `,
        [...values, idProducto, idCarrito]
      );
      return result.affectedRows > 0;
    } catch (error) {
      console.log(
        "Error en el modelo al intetar modificar el item al carrito.",
        error
      );
      throw error;
    }
  },

  async findItemsInCart(idCarrito) {
    /* Aqui quiero Listar todos los productos de un carrito especifico  trayendo datos de la tabla producto (nombre, slug, imgPrincipal, stock).
     Aqui entonces vamos a precisar info de la tabla producto, de carrito y de la que los une prodcutocarrito (QUE ES CLAVE)
     Esta ultima tabla es clave porque solo tendria acceso a los productos sueltos y a los carritos sueltos pero no a carritos que posean adentro prodcutos, esto lo logramos haciendo uan consulta SQL que combine las 3 tablas . */
    try {
      const p = {
        // Objeto para hacer mas legible la consutla sql - SON DE LA TABLA PRODUCTOS -
        id: "idProducto",
        nombre: "nombre",
        slug: "slug",
        imgPrincipal: "imgPrincipal",
        stock: "stock",
        precio: "precio",
      };

      const sql = `
      SELECT 
        cp.${this.fields.id} AS idCarritoProducto,
        p.${p.id} AS idProducto, 
        p.${p.nombre} AS nombre,
        p.${p.slug} AS slug,
        p.${p.imgPrincipal} AS imgPrincipal,
        p.${p.stock} AS stock,
        p.${p.precio} AS precioActual,
        cp.${this.fields.cantidad} AS cantidad,
        cp.${this.fields.precioProductoCarrito} AS precioProductoCarrito,
        cp.${this.fields.subtotalProductoCarrito} AS subtotalProductoCarrito
      FROM ${this.tablename} AS cp
      INNER JOIN producto AS p ON p.${p.id} = cp.${this.fields.idProducto}
      WHERE cp.${this.fields.idCarrito} = ?`;

      const [rows] = await pool.execute(sql, [idCarrito]); //Ejectutamos la consulta.
      return rows;
    } catch (error) {
      console.log("Error al listar los productos del carrito:", error);
      throw error;
    }
  },

  async removeItemInCart(idProducto, idCarrito) {
    try {
      /* Hace la consulta SQL para eliminar determinado producto en determiando carrito */
      const [result] = await pool.execute(
        `DELETE FROM ${this.tablename} WHERE ${this.fields.idProducto} = ? AND ${this.fields.idCarrito} = ?`,
        [idProducto, idCarrito]
      );

      return result.affectedRows > 0; //Aca devuelve true si se elimino realmente una fila.
    } catch (error) {
      throw error;
    }
  },

  async clearCartItems(idCarrito, connection) {
    try {
      /* Hace la consulta SQL para limpiar/borrar todos los  productos en determiando carrito (buscado por idCarrito que llega por parametro) */
      const [result] = await connection.execute(
        `DELETE FROM ${this.tablename} WHERE ${this.fields.idCarrito} = ? `,
        [idCarrito]
      );
      return result.affectedRows > 0
    } catch (error) {
      throw error;
    }
  },
};
