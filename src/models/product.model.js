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
      const [rows] = await pool.execute(`SELECT * FROM ${this.tablename}`); //El pool.execute devuelve un array con arrays adentro, uno que tiene las filas, el resultado de la consulta y el otro los metadatos (que no su usan casi nunca), entonces al hacer: [rows] -  hacemos DESESTRUCTURACION DE ARRAYS y al poner solo una variable (en este caso rows) lo que decimos es que nos muestre el primer array de esos 2, es decir el de primer indice.
      return rows; //Aqui solo devolvemos rows (sin corchete) ya que el corchete lo haciamos para hacer la desestructuracion y aqui solo mostramos el resultado.
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
      return rows[0]; // Aqui devolvemos por convencion rows[0] porque si o si la consulta nos dara como respuesta un unico elemento, pese a eso por convencion va ese primer indice.
    } catch (error) {
      console.log("Error al obtener el genero solicitado", error);
      throw error;
    }
  },

  //METODO NECESARIO PARA LA TRANSACCION SQL.
  async findByIDForUpdate(id, connection) {
    try {
      const [rows] = await connection.execute(
        `SELECT * FROM ${this.tablename} WHERE ${this.fields.id} = ? FOR UPDATE` /* Esto bloquea la fila del producto para evitar que otro usuario la modifique mientras se hace la compra.
Es el bloqueo pesimista del que hablo Manuel */,
        [id]
      );
      return rows[0]; // Aqui devolvemos por convencion rows[0] porque si o si la consulta nos dara como respuesta un unico elemento, pese a eso por convencion va ese primer indice.
    } catch (error) {
      console.log("Error al obtener el genero solicitado", error);
      throw error;
    }
  },

  async findOne(searchParams) {
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

  async findProductDetails(searchParams) {
    //Este método tiene la función de devolver el detalle completo de un producto, con su marca y categoría, haciendo un JOIN entre tres tablas:  producto, categoria, y marca. La clave es que podemos pasarle como parametros de busqueda varios campos y reutilizarlo por ende varias veces.En el comtroler por ejm lo utilizamos solo pasando el SLUG.
    try {
      if (!searchParams || Object.keys(searchParams).length === 0)
        //Sino hay parametros de busqueda o es false, null undefined o si el objeto donde estan las claves esta vacio.
        throw createError(
          400,
          "No se han proporcionado parametros de busqueda"
        );

      const fields = Object.keys(searchParams);
      const values = Object.values(searchParams);

      const conditions = fields.map((field) => `p.${field} = ?`).join(" AND ");

      // Selecciono los campos/columnas de la tabla productos - El .filter() recorre el array  y elimina ciertos campos que no queremos mostrar ni seleccionar. (En este caso eliminara los created y updated at y el visible y el nombre - Deja pasar a todos lo qeu sean distintosa e esso 4 campos )
      const productColumns = Object.values(this.fields) // ponemos el this para recalcar que hacemos referencia a los values de los fields que nosotros definimos arriba como un objeto, hacemos referecia a este objeto y no a la variable fields que creamos mas abajo (linea 79).
        .filter(
          (field) =>
            field != this.fields.created_at &&
            field != this.fields.updated_at &&
            field != this.fields.visible &&
            field != this.fields.nombre
        )
        .map((column) => `p.${column}`) //Ahora que tenés el listado de columnas válidas, hay que anteponerles el alias de la tabla (p.) para que el SQL sepa que esas columnas pertenecen a la tabla producto. Aqui p es el alias de producto (que es el nombre de la tabla) ["p.idProducto","p.descripcionCorta",  "p.stock","p.precio",...ETC]
        .join(", "); //Con JOIN Ahora ese array de columnas se convierte en un string separado por comas, para poder insertarlo dentro del SELECT. Quedaria : "p.idProducto, p.descripcionCorta, p.descripcionLarga, p.stock, p.precio, p.slug, p.precioOferta, p.ofertaHasta, p.imgPrincipal, p.idMarca, p.sku, p.idCategoria"

      const sql = `SELECT ${productColumns}, p.nombre AS producto, c.nombre AS categoria, m.nombre AS marca FROM ${this.tablename} AS p 
            INNER JOIN categoria AS c ON c.idCategoria = p.idCategoria
            INNER JOIN marca AS m ON m.idMarca = p.idMarca
            WHERE ${conditions}`;

      const [rows] = await pool.execute(sql, values);

      return rows[0];
    } catch (error) {
      throw error;
    }
  },

  //METODO PARA LA CREACION DE UN PRODUCTO.

  async create({
    //Esto que estoy haciendo aca es desestructuracion de objetos directamente en el parametro.  - Significa que este método espera un objeto como argumento
    nombre,
    descripcionCorta,
    descripcionLarga,
    stock,
    slug,
    precio,
    precioOferta = null, // Si precio oferta no esta en el body que se va a pasar para crear el producto, este campo queda como nulo y no como undefined que por sql rompe el back.
    ofertaHasta = null, //Idem arriba
    imgPrincipal,
    visible = true, //Idem arriba.
    sku = null,
    idMarca,
    idCategoria,
  }) {
    // Seleccionar aquellos campos sobre los cuales queremos trabajar, en este caso, a la hora de insertar un nuevo producto, los campos created_at y updated_at son automaticos desde la bd, entonces, no los tenemos que tener en cuenta, tenemos dos opciones, o lo ponemos uno por uno en la consulta sql, o filtramos. Aca filtraremos.
    const columns = Object.values(this.fields).filter(
      //Object.values(this.fields) devuelve un array con todos los nombres reales de columnas de la tabla producto. .filter(...) elimina los campos que no se deben insertar manualmente.
      (field) =>
        field != this.fields.created_at &&
        field != this.fields.updated_at &&
        field != this.fields.id
    );
    // ['nombre','precio', 'slug',etc..]

    const placeholders = columns.map((column) => `?`).join(", "); //.map() crea un array de "?" del mismo largo que columns. Luego .join(", ") los une con comas.
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
      /*INSERT INTO producto (
  nombre, descripcionCorta, descripcionLarga, stock, precio, slug, precioOferta, ofertaHasta, imgPrincipal, visible,idMarca, sku, idCategoria) VALUES(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?) */

      // ARRAY VALUES: Este array debe estar en el mismo orden que las columnas para que los ? se reemplacen correctamente.

      const [result] = await pool.execute(sql, values); //Cuando la consulta no devuelve filas, sino que afecta datos (por ejemplo INSERT, UPDATE o DELETE), el primer elemento ya no es un array, sino un objeto especial llamado OkPacket. EJM  {
      /*fieldCount: 0,
  affectedRows: 1,
  insertId: 42, CLAVE YA QUE ME PERMITE VER EL ID DE ESE REGISTRO
  info: "",
  serverStatus: 2,
  warningStatus: 0
} */

      const product = await this.findByID(result.insertId); // puedo ver el nuevo producto que se acaba de crear con el metodo findById.
      return product; //Devuelvo el producto.
    } catch (error) {
      throw error;
    }
  },

  //METODOS PARA PAGINACION

  async findAllLimit(page, limit, offset, filters) {
    //El metodo hace todo el proceso completo, desde construir la query hasta devolver el resultado listo para el controlador.
    try {
      // Construimos dinámicamente las condiciones de busqueda y parámetros
      const whereConditions = []; //whereConditions: guarda fragmentos de condiciones SQL (strings).
      const queryParams = []; //queryParams: guarda los valores reales para los ?.

      // Verificamos los diferentes filtros que llegan. Es decir Evalúa qué filtros que podrian venir en filters.

      if (filters.categoria) {
        //Si vino filters.categoria, agrega al WHERE: c.nombre = ? y agregar a los parametros de la query (En la url) la categoria
        whereConditions.push(`c.nombre = ?`);
        queryParams.push(filters.categoria);
      }

      if (filters.marca) {
        //Al igual que categoria pero con este filtro
        whereConditions.push(`m.nombre = ?`);
        queryParams.push(filters.marca);
      }

      if (filters.precioMin) {
        //Al igual que categoria pero con este filtro
        whereConditions.push(`${this.fields.precio} >= ?`);
        queryParams.push(filters.precioMin);
      }

      if (filters.precioMax) {
        //Al igual que categoria pero con este filtro
        whereConditions.push(`${this.fields.precio} <= ?`);
        queryParams.push(filters.precioMax);
      }

      if (filters.busqueda) {
        //Es especial ya que la busqueda se realiza por nombre o descripcion corta y entra el LIKE. Si en el objeto filters existe la clave busqueda y tiene algún valor (no es undefined, null ni vacío),entonces aplicá este bloque.
        whereConditions.push(
          `${this.fields.nombre} LIKE ? OR ${this.fields.descripcionCorta} LIKE ?`
        );

        const busquedaParm = `%${filters.busqueda}%`; //Esto crea un string que incluye los comodines % antes y después del valor que mandó el usuario. EJm pasar de : filters.busqueda = "zapatilla" a busquedaParm = "%zapatilla%"

        //Agrega los valores reales al array queryParams
        queryParams.push(busquedaParm, busquedaParm); ////Porque la condición SQL tiene dos ?: Porque la condición SQL tiene dos ?:Entonces necesitás dos valores en el mismo orden en el array de parámetrosporque se puede buscar por nombre OR por descripcionCorta.
      }

      // whereConditions = ['idCategoria = ?', 'idMarca = ?', ..]
      // Concatenar las condiciones de busqueda
      const whereClause =
        whereConditions.length > 0 //Si las condiciones no son vacias.
          ? `WHERE ${whereConditions.join(" AND ")}` //construye el where final agregando AND si es necesario.
          : "";

      //ORDER BY
      /* Construir dinámicamente el ORDER BY - Es decir el orden por el cual se mostraran los resultados de la consulta SQL */

      let orderClause = "ORDER BY created_at DESC"; // orden por defecto. - Es decir que si el user no pasa ningun orden como parametros de consulta el orden se establecera por el ultimo producto creado (se mostrara primero) y en forma descendente.
      if (filters.sortBy) {
        //Filter.orderBy puede llegar en los filters o no , estos filtros los establecimos en el CONTROLLER y los enviamos por parametros cuando llamamos a este metodo.
        const validSortFields = [
          //Permite ordenar dinámicamente (por precio, nombre, fecha, etc.). - Si no se pasa nada, ordena por defecto: últimos productos creados primero.
          "nombre",
          "precio",
          "created_at",
          "updated_at",
          "stock",
        ];
        const sortDirection = filters.sortDirection === "desc" ? "DESC" : "ASC"; // El otro parametros de consulta que puede venir o no - Si se cumple la condicion sera DESC sino ASC el orden.

        if (validSortFields.includes(filters.sortBy)) {
          // Si alguno de los campos de ordenamiento validos estan incluidos en el parametro filters que llega entonces reemplazamos la variable orderClause y agregamos la direccion tmb para que quede completa y ya PUEDA SER UTILIZADA.
          orderClause = `ORDER BY ${filters.sortBy} ${sortDirection}`;
        }
      }

      // Selecciono los campos/columnas de la tabla producto - Voy a filtrar o hacer que no se vean en wste caso 4 campos.
      const productColumns = Object.values(this.fields)
        .filter(
          (field) =>
            field != this.fields.created_at &&
            field != this.fields.updated_at &&
            field != this.fields.visible &&
            field != this.fields.nombre // lo filtramos de aca porque le colocamos un alias de forma manual.
        )
        .map((column) => `p.${column}`) //A cada elemento le agregamos un p (alias de la tabla producto)
        .join(", ");

      const finalParams = [...queryParams, String(limit), String(offset)]; //Preparamos parametros finales de la consulta/query

      const finalQuery = `SELECT 
        ${productColumns}, p.nombre AS producto, c.nombre AS categoria, m.nombre AS marca 
        FROM ${this.tablename} AS p 
        INNER JOIN categoria AS c ON c.idCategoria = p.idCategoria
        INNER JOIN marca AS m ON m.idMarca = p.idMarca 
        ${whereClause} 
        ${orderClause} 
        LIMIT ? OFFSET ?`;
      /* 
        EJM:  filters = { categoria: 'Calzado', precioMin: 10000 }
        page = 2, limit = 5, offset = 5
        finalParams = ['Calzado', 10000, '5', '5']
      */

      const [products] = await pool.execute(finalQuery, finalParams); //Ejecucion de la consulta.

      //Calcular el total de productos (para la paginación) //Esto ejecuta una segunda consulta pero sin LIMIT ni OFFSET, solo para saber cuántos productos hay en total que cumplen los filtros.
      const [resultTotal] = await pool.execute(
        `SELECT COUNT(${this.fields.id}) as count
        FROM ${this.tablename} AS p 
        INNER JOIN categoria AS c ON c.idCategoria = p.idCategoria
        INNER JOIN marca AS m ON m.idMarca = p.idMarca 
        ${whereClause}
        `,
        queryParams
      );

      //Calculamos las paginas y retornamos la estructura completa
      const totalProducts = resultTotal[0].count;
      const totalPages = Math.ceil(totalProducts / limit);

      return {
        products,
        pagination: {
          totalProducts,
          totalPages,
          currentPage: page,
          limit,
          hasNextPage: page < totalPages,
          hasPrevPage: page > 1,
        },
      };
    } catch (error) {
      throw error;
    }
  },

  //FINDALLLIMIT2 - PAGINACION VERSION SIMPLIFICADA
  //Este método hace solo la parte del SELECT,sin armar filtros ni contar totales.Básicamente es una versión simplificada o reutilizable de findAllLimit pensada para cuando ya   tenés todos los componentes armados desde afuera (por ejemplo, desde un servicio o un método superior).

  async findAllLimit2(finalParams, whereClause, orderClause, productColumns) {
    try {
      const finalQuery = `SELECT 
        ${productColumns}, p.nombre AS producto, c.nombre AS categoria, m.nombre AS marca 
        FROM ${this.tablename} AS p 
        INNER JOIN categoria AS c ON c.idCategoria = p.idCategoria
        INNER JOIN marca AS m ON m.idMarca = p.idMarca 
        ${whereClause} 
        ${orderClause} 
        LIMIT ? OFFSET ?`;

      const [products] = await pool.execute(finalQuery, finalParams);
      return products;
    } catch (error) {
      throw error;
    }
  },

  //PAGINATION DATA -  Este método hace solo la parte del conteo total (el “COUNT” de productos). Es decir “Dame solo el total de productos que cumplen este filtro”.Sirve cuando querés separar la obtención de productos del conteo total,por ejemplo si vas a combinar datos de varias tablas o hacer paginación más avanzada.
  async paginationData(whereClause, queryParams) {
    console.log(queryParams);

    try {
      const [resultTotal] = await pool.execute(
        `SELECT COUNT(${this.fields.id}) as count
        FROM ${this.tablename} AS p 
        INNER JOIN categoria AS c ON c.idCategoria = p.idCategoria
        INNER JOIN marca AS m ON m.idMarca = p.idMarca 
        ${whereClause}
        `,
        queryParams
      );
      return resultTotal[0].count;
    } catch (error) {
      throw error;
    }
  },

  // Actualizar producto (update parcial)
  async updatePartial(id, updateData, connection = pool) {
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
