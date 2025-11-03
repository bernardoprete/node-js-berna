import { object } from "zod";
import { pool } from "../db.js";
import { createError } from "../utils/utils.js";

/* En este modelo se Guardan los productos específicos que están dentro de cada orden (pedido). Se relaciona con al tabla detallepedido de nuestra BD. Es vital saber que esta tabla de la bd es muy importante ya que es la que relaciona que producto(idProducto) en particular esta agregado a un pedido particular (idpedido) Cuando esto suceda (Es decir cuando un prodcuto particular se agregue a un pedido particular) esa combinacion de producto y pedido quedara fijada por un numero unico que es el id de detallePedidoo. */

export const OrderProductsDetailsModel = {
  // Definimos una propiedad para contener/acceder al nombre de la tabla correspondiente a este modelo
  tablename: "detallepedido",
  // Definimos los nombre de los campos en un objeto.
  fields: {
    id: "idDetalle",
    cantidad: "cantidad",
    precioUnitario: "precioUnitario",
    idPedido: "idPedido",
    idProducto: "idProducto",
    subtotal: "subtotal",
  },

  async findAll() {
    //Trae todos las detalles , es decir la todas las combinaciones existentes entre idPedido y idProducto que haya. (poco común en producción, más para testing). POCO IMPORTANTE.
    try {
      const [rows] = await pool.execute(`SELECT * FROM ${this.tablename}`); //El pool.execute devuelve un array con arrays adentro, uno que tiene las filas, el resultado de la consulta y el otro los metadatos (que no su usan casi nunca), entonces al hacer: [rows] -  hacemos DESESTRUCTURACION DE ARRAYS y al poner solo una variable (en este caso rows) lo que decimos es que nos muestre el primer array de esos 2, es decir el de primer indice.
      return rows; //Aqui solo devolvemos rows (sin corchete) ya que el corchete lo haciamos para hacer la desestructuracion y aqui solo mostramos el resultado.
    } catch (error) {
      throw error;
    }
  },

  async findByID(id) {
    //Busca un item específico dentro del detalle es decir un producto particular agregado a un carrito particular o sea, esa combinacion unica (por su idDetalle).
    try {
      const [rows] = await pool.execute(
        `SELECT * FROM ${this.tablename} WHERE ${this.fields.id} = ?`, //Busca por idDetalle.
        [id]
      );
      return rows[0]; // Aqui devolvemos por convencion rows[0] porque si o si la consulta nos dara como respuesta un unico elemento, pese a eso por convencion va ese primer indice.
    } catch (error) {
      console.log("Error al obtener el carrito solicitado", error);
      throw error;
    }
  },

  async findOne(searchParams) {
    //Permite buscar dinamicamente por varios parametros. Por ejm : OrderProductsDetailsModel.findOne({ idProducto: 3, idPedido: 1 })Aqui buscamos un prod particular en un pedido particular
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

  async findItemsInOrder(idPedido) {
    /* Aqui quiero Listar todos los productos de un pedido especifico  trayendo datos de la tabla producto (nombre, slug, imgPrincipal, stock).
     Aqui entonces vamos a precisar info de la tabla producto, de pedido y de la que los une detallepedido (QUE ES CLAVE)
     Esta ultima tabla es clave porque solo tendria acceso a los productos sueltos y a los pedidos sueltos pero no a pedidos que posean adentro productos, esto lo logramos haciendo una consulta SQL que combine las 3 tablas . */

    try {
      const p = {
        // Objeto para hacer mas legible la consulta sql - SON DE LA TABLA PRODUCTOS -
        id: "idProducto",
        nombre: "nombre",
        imgPrincipal: "imgPrincipal",
      };

      const sql = `
      SELECT 
        dp.${this.fields.id} AS detallePedido,
        p.${p.id} AS idProducto, 
        p.${p.nombre} AS nombre,
        p.${p.imgPrincipal} AS imgProducto,
        dp.${this.fields.cantidad} AS cantidad,
        dp.${this.fields.precioUnitario} AS precioUnitario,
        dp.${this.fields.subtotal} AS subtotaldetallePedido
      FROM ${this.tablename} AS dp
      INNER JOIN producto AS p ON p.${p.id} = dp.${this.fields.idProducto}
      WHERE dp.${this.fields.idPedido} = ?`;

      const [rows] = await pool.execute(sql, [idPedido]); //Ejectutamos la consulta.
      return rows; //Devuelve el listado con los productos que hay dentro de la orden.
    } catch (error) {
      console.log("Error al listar los productos del pedido:", error);
      throw error;
    }
  },

  //METODO PARA EN LA TABLA DETALLEPEDIDO INSERTAR LOS PRODCUTOS ADENTRO DE UN PEDIDO ESPECIFICO.
  async create({ cantidad, precioUnitario, idPedido, idProducto }) {
    try {
      console.log(
        
        {
          cantidad,
          precioUnitario,
          idPedido,
          idProducto,
        }
      );

      //IMPORTANTE: No insertamos 'subtotal' porque es una columna generada automáticamente (STORED GENERATED).
      const sql = `INSERT INTO ${this.tablename} 
      (cantidad, precioUnitario, idPedido, idProducto)
      VALUES (?, ?, ?, ?)`;

     
    

      const [result] = await pool.execute(sql, [
        cantidad,
        precioUnitario,
        idPedido,
        idProducto,
      ]);


      return result.affectedRows > 0;
    } catch (error) {
      throw createError(500, "Error al insertar producto en el pedido.");
    }
  },
};
