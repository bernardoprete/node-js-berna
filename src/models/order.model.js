import { pool } from "../db.js";
import { createError } from "../utils/utils.js";

/* 
Order model va ser el modelo que trabaja y hace las consultas a la tabla PEDIDO de nuestra BD - 
Esta tabla maneja muchos datos de cada compra que se realiza - (A TRAVES DEL ID DE USUARIO PARA SABER A QUIÉN PERTENECE EL PEDIDO) 
(cada pedido) pero lo más importante a saber es que no maneja el DETALLE DE LOS PRODUCTOS que tiene cada pedido, 
eso lo maneja otra tabla.
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
    /* 
    Reutilizamos este método adaptándolo a la tabla pedido para traer todos los pedidos (útil para debug o admin). 
    Pero no es tan importante. 
    */
    try {
      const [rows] = await pool.execute(`SELECT * FROM ${this.tablename}`);
      // El pool.execute devuelve un array con arrays adentro, uno que tiene las filas,
      // el resultado de la consulta y el otro los metadatos (que no se usan casi nunca),
      // entonces al hacer: [rows] -  hacemos DESESTRUCTURACIÓN DE ARRAYS y al poner solo una variable
      // (en este caso rows) lo que decimos es que nos muestre el primer array de esos 2,
      // es decir el de primer índice.
      return rows;
      // Aquí solo devolvemos rows (sin corchete) ya que el corchete lo hacíamos para hacer la desestructuración
      // y aquí solo mostramos el resultado.
    } catch (error) {
      throw error;
    }
  },

  async findByID(id) {
    /* 
    Trae un pedido puntual por su ID (idPedido). 
    Digamos que este método SÍ es importante. 
    */
    try {
      const [rows] = await pool.execute(
        `SELECT * FROM ${this.tablename} WHERE ${this.fields.id} = ?`,
        [id]
      );
      return rows[0];
      // Aquí devolvemos por convención rows[0] porque si o si la consulta nos dará como respuesta un único elemento,
      // pese a eso por convención va ese primer índice.
    } catch (error) {
      console.log("Error al obtener el carrito solicitado", error);
      throw error;
    }
  },

  async findOne(searchParams) {
    /* 
    Busca por campos dinámicos, por ejemplo { idUsuario: 4 } 
    Por ende lo más básico es buscar por IdUsuario. 
    Pero devuelve un solo registro, esa es la diferencia.
    */
    try {
      if (!searchParams || Object.keys(searchParams).length === 0)
        // Si no existen parámetros de búsqueda:
        throw createError(
          400,
          "No se han proporcionado parámetros de búsqueda."
        );

      const fields = Object.keys(searchParams);
      // Object.keys devuelve un array con los nombres de las claves del objeto que le pasemos por parámetro,
      // en este caso los parámetros de búsqueda.
      const values = Object.values(searchParams);
      // Object.values devuelve un array con los valores asociados a las claves del objeto que le pasemos por parámetro.
      const conditions = fields.map((field) => `${field} = ?`).join(" AND ");
      // Del array con los nombres de las claves del obj que le damos por parámetros,
      // hacemos una recorrida y devolvemos un nuevo array modificado con el nombre y el ?,
      // ejm: ["slug = ?", "visible = ?"]

      const sql = `SELECT * FROM ${this.tablename} WHERE ${conditions}`;
      // Aquí hacemos la consulta insertando ese array de conditions.
      const [rows] = await pool.execute(sql, values);
      // Aquí insertamos el array de valores donde cada índice se corresponde con cada índice de las condiciones.
      return rows[0];
      // Retornamos un único valor, por convención.
    } catch (error) {
      throw error;
    }
  },

  //METODO QUE TRAE TODOS LOS PEDIDOS DE UN USUARIO ESPECIFICO (POR SU ID USUARIO) ESTOS PEDIDOS SIN PRODS AGREGADOS.
  // La diferencia es que devuelve todos los registros - En este caso todos los pedidos de un usuario y agregamos info de la tabla direccion para ya tenerla a mano y no tener que hacer un modelo de direccion.
  //LA CONSULTA SQL podria hacerla dinamica creando un objeto que represente todos los campos de la tabla producto - la *p quire decir que traiga todos los campso de la tabla prodcuto (ahorro lineas de codigo)
  async findOrderWhitAdressUser(idUsuario) {
    try {
      const sql = `
  SELECT 
  p.*, 
  d.idDireccion,
  d.direccionLinea1,
  d.direccionLinea2,
  d.ciudad,
  d.provincia,
  d.codigoPostal
FROM pedido AS p
LEFT JOIN direcciones AS d ON p.idDireccion = d.idDireccion
WHERE p.idUsuario = ?
ORDER BY p.fecha_pedido DESC

`;

      const [rows] = await pool.execute(sql, [idUsuario]);
      return rows;
    } catch (error) {
      console.log("Error al obtener los pedidos del usuario:", error);
      throw error;
    }
  },

  // MODELO PARA CREAR UN PEDIDO
  async create({
    // Desestructuración del objeto...
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
  }, connection) {
    try {
      const columns = Object.values(this.fields).filter(
        (field) => field != this.fields.id
      );
      // Esto es un array de campos que se pasan por parámetro y son las columnas que se van a agregar en la consulta a la BD.

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
      )}) VALUES (${placeholders})`;
      console.log('VALUES', values);
      
      // 
      const [result] = await connection.execute(sql, values);

      // Retornamos el ID que es autoincremental generado por la BD.
      const orderId = result.insertId;
      console.log('ORDER ID ', orderId);
      
      const [rows] = await connection.execute(`SELECT * FROM ${this.tablename} WHERE ${this.fields.id} = ?`, [orderId]);

      return rows[0];
    } catch (error) {
      console.log(error)
      throw createError(500, "Error al intentar crear el pedido");
    }
  },

  // ------------------------------------------------------------------METODOS PARA ADMINISTRADOR ----------------------------------------------------------

  // METODO QUE TRAE TODOS LOS PEDIDOS DEL SISTEMA (ADMIN) CON DIRECCION DE ENVIO PERO SIN PRODUCTOS.
  async findAllWithUserAndAddress() {
    /* 
  Este método devuelve todos los pedidos de todos los usuarios, incluyendo datos del comprador y direccion de envio.
  SIrve  para el panel de administracion donde se necesitamos ver todas las ordenes del sistema.
  */
    try {
      const sql = `
      SELECT 
        p.${this.fields.id},
        p.${this.fields.fecha_pedido},
        p.${this.fields.estado},
        p.${this.fields.metodo_pago},
        p.${this.fields.total},
        p.${this.fields.subtotal},
        p.${this.fields.idUsuario},
        p.${this.fields.idDireccion},

        u.nombre AS nombreUsuario,
        u.apellido AS apellidoUsuario,
        u.email AS emailUsuario,

        d.direccionLinea1,
        d.direccionLinea2,
        d.ciudad,
        d.provincia,
        d.codigoPostal,
        d.pais

      FROM ${this.tablename} AS p
      LEFT JOIN usuario AS u ON p.${this.fields.idUsuario} = u.idUsuario
      LEFT JOIN direcciones AS d ON p.${this.fields.idDireccion} = d.idDireccion
      ORDER BY p.${this.fields.fecha_pedido} DESC;
    `;

      const [rows] = await pool.execute(sql);
      return rows;
    } catch (error) {
      console.log("Error al obtener los pedidos del sistema:", error);
      throw createError(500, "Error al listar los pedidos del sistema.");
    }
  },

  // METODO QUE TRAE UN PEDIDO POR SU ID (idPedido) CON INFO DEL USUARIO Y DIRECCION DE ENVIO
  // Este método está pensado para el panel del ADMINISTRADOR. A diferencia del método findByID tradicional,
  // este combina información de tres tablas: pedido, usuarios y direcciones.
  // De esta manera podemos ver en un solo resultado: los datos del pedido, del comprador y su direccion asociada.
  async findByIDWithUserAndAddress(idPedido) {
    try {
      //
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
        u.nombre AS nombreUsuario,
        u.apellido AS apellidoUsuario,
        u.email AS emailUsuario,
        d.direccionLinea1,
        d.direccionLinea2,
        d.ciudad,
        d.provincia,
        d.codigoPostal
      FROM ${this.tablename} AS p
      INNER JOIN usuario AS u ON p.${this.fields.idUsuario} = u.idUsuario
      LEFT JOIN direcciones AS d ON p.${this.fields.idDireccion} = d.idDireccion
      WHERE p.${this.fields.id} = ?
      `;

      // Ejecutamos la consulta
      const [rows] = await pool.execute(sql, [idPedido]);

      // Si no hay resultados  devolvemos null
      if (rows.length === 0) return null;

      // Retornamos el primeR Y UNICO resultado
      return rows[0];
    } catch (error) {
      console.log(
        "Error al obtener el pedido con datos del usuario y dirección:",
        error
      );
      throw error;
    }
  },
};
