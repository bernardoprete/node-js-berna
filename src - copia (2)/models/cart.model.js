import { pool } from "../db.js";
import { createError } from "../utils/utils.js";

/* Cart Model : Maneja o guarda toda la informacion del carrito en si (no los productos dentro del mismo carrito) es importante saber que este modelo es basiamente la tabla carrito en nuestra BD. */

export const CartModel = {
  // Definimos una propiedad para contener/acceder al nombre de la tabla correspondiente a este modelo
  tablename: "carrito",
  // Definimos los nombre de los campos de esa tabla  en un objeto.
  fields: {
    id: "idCarrito",
    created_at: "created_at",
    updated_at: "updated_at",
    expires_at: "expires_at",
    idUsuario: "idUsuario",
  },

  async findAll() {
    /* Reutilzamos este metodo adaptandolo a la tabla carrito para traer todos los carritos (útil para debug o admin). Pero no es tan importante. */
    try {
      const [rows] = await pool.execute(`SELECT * FROM ${this.tablename}`); //El pool.execute devuelve un array con arrays adentro, uno que tiene las filas, el resultado de la consulta y el otro los metadatos (que no su usan casi nunca), entonces al hacer: [rows] -  hacemos DESESTRUCTURACION DE ARRAYS y al poner solo una variable (en este caso rows) lo que decimos es que nos muestre el primer array de esos 2, es decir el de primer indice.
      return rows; //Aqui solo devolvemos rows (sin corchete) ya que el corchete lo haciamos para hacer la desestructuracion y aqui solo mostramos el resultado.
    } catch (error) {
      throw error;
    }
  },

  async findByID(id) {
    /* Trae un carrito puntual por su ID (idCarrito). Digamos que este metodo SI es importante */
    try {
      const [rows] = await pool.execute(
        `SELECT * FROM ${this.tablename} WHERE ${this.fields.id} = ?`,
        [id]
      );
      return rows[0]; // Aqui devolvemos por convencion rows[0] porque si o si la consulta nos dara como respuesta un unico elemento, pese a eso por convencion va ese primer indice.
    } catch (error) {
      console.log("Error al obtener el carrito solicitado", error);
      throw error;
    }
  },

  async findOne(searchParams) {
    // Busca por campos dinámicos, por ejemplo { idUsuario: 4 } PeroLo mas basico es buscar por IdUsuario.
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

  //Crear carrito
  async create(idUsuario) {
    /* Crea un carrito nuevo para el usuario indicado (con su numero de id), con una fecha de expiración (2 semanas después del momento actual) y Retorna el idCarrito recién creado. */
    try {
      const sql = `
      INSERT INTO ${this.tablename}
      (${this.fields.idUsuario}, ${this.fields.expires_at})
      VALUES (?, DATE_ADD(NOW(), INTERVAL 2 WEEK))
    `;
      const [result] = await pool.execute(sql, [idUsuario]);
      return result.insertId;
    } catch (error) {
      throw error;
    }
  },
};
