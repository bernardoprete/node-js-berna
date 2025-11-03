import { pool } from "../db.js";
import { createError } from "../utils/utils.js";

/* Order model va ser el modelo que trabaja y hace las consultas a la tabla PEDIDO de nuestra BD - Esta tabla maneja muchos datos de cada compra que se realiza - (A TRAVES DEL ID DE USUARIO PARA SABER A QUIN PERTENECE EL PEDIDO) (cada pedido) pero lo mas importante a saber es que no maneja el DETALLE DE LOS PRODUCTOS que tiene cada pedido, eso lo maneja otra tabla. */

export const OrderModel = {
  // Definimos una propiedad para contener/acceder al nombre de la tabla correspondiente a este modelo
  tablename: "pedido",
  // Definimos los nombre de los campos de esa tabla  en un objeto.
  fields: {
    id: "idPedido",
    fecha_pedido: "fecha_pedido",
    estado: "estado",
    metodo_pago: "metodo_pago",
    fecha_entrega: "fecha_entrega",
    fecha_envio: "fecha_envio",
    costo_envio: "costo_envio",
    subtotal: "subtotal",
    impuestos: "impuestos",
    descuentos: "descuentos",
    total: "total",
    observaciones: "observaciones",
    idUsuario: "idUsuario",
    idDireccion: "idDireccion",
  },

  async findAll() {
    /* Reutilzamos este metodo adaptandolo a la tabla pedido para traer todos los pedidos (útil para debug o admin). Pero no es tan importante. */
    try {
      const [rows] = await pool.execute(`SELECT * FROM ${this.tablename}`); //El pool.execute devuelve un array con arrays adentro, uno que tiene las filas, el resultado de la consulta y el otro los metadatos (que no su usan casi nunca), entonces al hacer: [rows] -  hacemos DESESTRUCTURACION DE ARRAYS y al poner solo una variable (en este caso rows) lo que decimos es que nos muestre el primer array de esos 2, es decir el de primer indice.
      return rows; //Aqui solo devolvemos rows (sin corchete) ya que el corchete lo haciamos para hacer la desestructuracion y aqui solo mostramos el resultado.
    } catch (error) {
      throw error;
    }
  },

  async findByID(id) {
    /* Trae un pedido puntual por su ID (idPedido). Digamos que este metodo SI es importante */
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
    // Busca por campos dinámicos, por ejemplo { idUsuario: 4 } Por ende lo  mas basico es buscar por IdUsuario. Pero devulve un solo registro , esa es la diferencia.
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

  // Trae todos los pedidos de un usuario especifico (por su idUsuario) - La diferencia es que devulve todos los registros - En este caso todos los pedidos de un usuario.
  async findAllByUser(idUsuario) {
    try {
      const [rows] = await pool.execute(
        `SELECT * FROM ${this.tablename} WHERE ${this.fields.idUsuario} = ? ORDER BY ${this.fields.fecha_pedido} DESC`,
        [idUsuario]
      );
      return rows; //Retorna un array.
    } catch (error) {
      console.log("Error al obtener los pedidos del usuario:", error);
      throw error;
    }
  },

  //MODELO PARA CREAR UN PEDIDO
  async create({
    //Desestructuracion del objeto...
    fecha_pedido,
    estado = "pendiente",
    metodo_pago,
    fecha_entrega,
    fecha_envio,
    costo_envio = 0,
    subtotal,
    impuestos = 0,
    descuentos = 0,
    total,
    observaciones = null,
    idUsuario,
    idDireccion,
  }) {
    try {
      const columns = Object.values(this.fields).filter(
        (field) => field != this.fields.id
      ); //Esto es un array de campos que se pasan por parametro y son las columnas que se van a agregar en la consulta a la bd.
      const placeholders = columns.map(() => "?").join(", ");
      const values = [
        fecha_pedido,
        estado,
        metodo_pago,
        fecha_entrega,
        fecha_envio,
        costo_envio,
        subtotal,
        impuestos,
        descuentos,
        total,
        observaciones,
        idUsuario,
        idDireccion,
      ];
      const sql = `INSERT INTO ${this.tablename} (${columns.join(
        ", "
      )}) VALUES (${placeholders}) `;
      const [result] = await pool.execute(sql, values);

      return result.insertId;
    } catch (error) {}
  },
};
