import { pool } from "../db.js";
import { CartModel } from "../models/cart.model.js";
import { CartProductsDetailsModel } from "../models/cartProductsDetails.model.js";
import { OrderModel } from "../models/order.model.js";
import { OrderProductsDetailsModel } from "../models/orderProductsDetails.model.js";
import { ProductModel } from "../models/product.model.js";
import { UserModel } from "../models/users.model.js";
import { createError } from "../utils/utils.js";
import { findItemsInCartService } from "./cart.service.js";
import { sendEmailService } from "../services/email.service.js";
import { AddressModel } from "../models/address.model.js";
import { OrderShippingModel } from "../models/OrderShippingModel.js";

//SERVICIO  QUE TIENE LA LOGICA PREVIA NECESARIA PARA CREAR UN PEDIDO Y AGREGAR LOS PRODUCTOS CORRESPONDIENTES AL MISMO.

export const createOrderService = async (
  idUsuario, //Se obtiene del req.user
  metodo_pago, //Este campo suele ser especificado por el user por eso va ser parte delo que pasamos en el body.
  idDireccion //Este campo suele ser especificado por el user por eso va ser parte delo que pasamos en el body.
) => {
  let connection;
  try {
    // 1. Obtener una conexión exlusiva del pool, y comenzar la transacción.

    connection = await pool.getConnection();
    await connection.beginTransaction(); // iniciamos la transacción
    // /* Esto hace que las siguientes consultas (hasta commit oroolback) se ejecuten de manera aislada dentro de esa conexion, si alguien compra al mismo momento mySQL mantiene ambas sesiones separadas. */

    const carrito = await CartModel.findOne({ idUsuario }); //Es necesario buscar el carrito del usuario que esta navegando.
    if (!carrito)
      throw createError(400, "El usuario no posee un carrito activo."); //Sino existe ningun carrito con ese id de usuario, lanzamos un error.

    await AddressModel.checkUserAddress(idDireccion, idUsuario); //Linea para verificar que la direccion a la que se envia el pedido sea efectivamente del usuario logueado.

    const { products, total } = await findItemsInCartService(carrito.idCarrito); //Desestructutacion

    //Aqui listamos los productos dentro del carrrito con el metodo de cartProdcutsDetailsModel (pasamos el idCarrito como parametro - este id lo obtenemos del objeto que nos da la ejecucion del metodo findOne de cartModel.). Esta variable es un array de productos.

    if (!products || products.length === 0)
      throw createError(400, "El carrito no existe o está vacío."); //Verificar si el carrito esta vacio o sino.

    for (const prod of products) {
      //--ACA ARRANCAMOS CON LA TRANSACCION
      //buscamos en cada vuelta del for que producto actual tenemos y luego averiguamos su stock, para depsues restar la cantidad que se compra y que quede el nuevo stock
      // 2. bloqueo pesimista.
      const prodActual = await ProductModel.findByIDForUpdate(
        /* Esto bloquea la fila del producto para evitar que otro usuario la modifique mientras se hace la compra.
        Es el bloqueo pesimista del que habló Manuel - Es un metodo creado en productModel.  Hace esta consulta SELECT * FROM producto WHERE idProducto = ? FOR UPDATE;
         */
        prod.idProducto,
        connection
      );
      // Verificamos si el producto no existe, o si no tiene stock suficiente, o si ya no está disponible, si es así, mandamos error.
      if (
        !prodActual ||
        prodActual.stock < prod.cantidad ||
        !prodActual.visible //campo de la bd con el que decimos que esta oculto el prod.
      ) {
        throw createError(
          409,
          `Stock insuficiente o producto deshabilitado. Producto: ${prod.idProducto}`
        );
      }
      const nuevoStock = prodActual.stock - prod.cantidad;
      //3. actualización del stock
      /* Todo esto ocurre dentro de la transacción.
      Si un producto no tiene stock, se lanza un error y se revierte todo (no se crean pedidos ni se resta stock). MUY IMPORTANTE */
      const result = await ProductModel.updatePartial(
        //ACTUALIZAMOS EN BD.
        prod.idProducto,
        { stock: nuevoStock }, //Es una desestructuracion.
        connection
      ); //Paso estos 3 datos por parametro.

      if (!result)
        throw createError(
          500,
          "Error al actualizar el stock del producto en el update."
        );
    }
    //Aqui mediante el metodo create del orderModel creamos el pedido (sin prodcutos asociados aun) y este metodo retorna su Id.
    // 4. crear la orden. OrderModel.create() recibe también la conexión, para que el INSERT INTO pedido ocurra dentro de la misma transacción.
    const newOrder = await OrderModel.create(
      {
        fecha_pedido: new Date(),
        metodo_pago,
        fecha_entrega: null,
        fecha_envio: null,
        subtotal: total,
        total,
        idUsuario,
        idDireccion,
        estado_pago: "pendiente",
      },
      connection
    );
    const idPedido = newOrder.idPedido; //Id del pedido creado. Importantee.

    // Creamos inicialmente el estado del envio del pedido como "pendiente" con este metodo. Este metodo trabaja exclusivamente con el modelo de envio de pedidos y no posee un controlador.
    await OrderShippingModel.createInitial(idPedido, connection);

    //Ahora los productos que teniamos en el carrito y que son parte de este nuevo pedido hay que agregarlos al detalle del pedido , pero para eso debemos crear el detalle del pedido (hacer un INSERT INTO en la tabla detallepedido) e ir copiando cada producto que tenemos en el carrito y agregarlo a esa tabla. MUY IMPORTANTE -

    //Recorremos el array que es la variable products (que tiene toda la info de los prodcutos del carrito) y cada prodcuto lo insertamos en la tabla detallepedido de la bd con el metodocreate que tenemos en orderProductsDetail. - IMPORTANTEE.
    //Creamos el detallePedido.
    for (const prod of products) {
      const newDetail = {
        //Hace un insert en la tabla detallepedido por cada prod existente en el carrito. // Basicamente los copia.
        cantidad: prod.cantidad,
        precioUnitario: prod.precioProductoCarrito,
        idPedido,
        idProducto: prod.idProducto,
        subtotal: prod.subtotalProductoCarrito,
      };
      try {
        //5. Crear el detalle de la orden.
        /* Cada producto del carrito se inserta en la tabla detallepedido.
        Todo usando la misma conexión, es decir la  misma transacción.
        Si falla uno solo, se revierte todo con rollback. IMPORTANTEEEEEEEEEEEEEEEEEE */
        const result = await OrderProductsDetailsModel.create(
          newDetail,
          connection //conexion.
        );
        if (!result)
          throw createError(
            500,
            "Error al intentar crear el detalle del pedido."
          );
      } catch (error) {
        console.error(
          "Error al intentar insertar el detalle del pedido.",
          error
        );
        if (error.status) throw error;
        throw createError(
          500,
          "Error al intentar acceder a los productos del carrito y sus metadatos."
        );
      }
    }

    //Por ultimo vaciamos el carrito con el metodo cleartCart. //Tambien lo hacemos en la misma conexion.
    //6. Limpiar el carrito
    await CartProductsDetailsModel.clearCartItems(
      carrito.idCarrito,
      connection
    );

    // 6.5 envíamos un email de éxito al usuario.
    // extraigo el email del usuario
    const user = await UserModel.findByID(idUsuario);

    // seteamos los datos que queremos mostrar en el template
    const emailContent = {
      title: "¡Pedido procesado con éxito!",
      message:
        "Hemos recibido tu pedido, a la brevedad obtendras más información sobre como proseguir",
      link: {
        linkURL: "http://localhost:3001/mis-compras",
        linkText: "Mis compras",
      },
    };
    const emailSend = await sendEmailService(
      user.email,
      "Orden procesada",
      emailContent
    );
    if (!emailSend)
      throw createError(
        500,
        "Error al intentar enviar el email de notificación."
      );
    // 7. Si salio todo bien, confirmar la transacción (COMMIT) SI falla algo antes de este punto se ejecuta el rollback.
    await connection.commit();

    //Devolvemos un mensaje de exito y el id del pedido creado.
    return { message: "Pedido creado correctamente.", pedido: newOrder };
  } catch (error) {
    console.error("Error al intentar crear el pedido en el servicio: ", error);
    if (connection) {
      await connection.rollback();
      console.log("Transacción revertida (ROLLBACK)");
    }

    if (error.status) throw error;
    throw createError(500, "Error interno al intentar crear el pedido.");
  } finally {
    if (connection) {
      connection.release(); //Cerramos la conexion.
    }
  }
};

//SERVICIO QUE TIENE LA LOGICA NECESARIA PARA QUE SE OBTENGAN/TRAIGAN TODOS LOS PEDIDOS DE UN USUARIO ESPECIFICO  (POR SU ID USUARIO) CON POSIBLE FILTRO Y ORDENAMIENTO, A LA VEZ EL RESULTADO ESTA PAGINADO , ESTOS PEDIDOS SIN PRODS AGREGADOS.
export const getAllClientOrdersService = async (
  idUsuario,
  page,
  limit,
  offset,
  filters
) => {
  try {
    // Construimos dinámicamente las condiciones de busqueda y parámetros. Por defecto, seteamos que el primer filtro
    const whereConditions = ["pe.idUsuario = ?"];
    const queryParams = [idUsuario];
    // Verificamos los diferentes filtros que llegan.
    if (filters.producto) {
      whereConditions.push(
        `prod.nombre LIKE ? OR prod.descripcionCorta LIKE ? OR prod.descripcionLarga LIKE ?`
      );

      const searchParam = `%${filters.producto}%`;
      queryParams.push(searchParam, searchParam, searchParam);
    }

    if (filters.categoria) {
      whereConditions.push(`c.nombre = ?`);
      queryParams.push(filters.categoria);
    }

    if (filters.fechaInicio && filters.fechaFin) {
      // convertir de string a fecha, para poder comparar los valores. (si la fecha de inicio es mayor, entonces, filtramos.)
      const fechaInicio = new Date(filters.fechaInicio);
      const fechaFin = new Date(filters.fechaFin);
      if (fechaInicio > fechaFin)
        throw createError(
          400,
          "Error en la petición, la fecha de inicio no puede ser mayor a la fecha de fin."
        );

      whereConditions.push(`fecha_pedido BETWEEN ? AND ?`);
      const fechaInicioSQL = `${filters.fechaInicio} 00:00:00`;
      const fechaFinSQL = `${filters.fechaFin} 23:59:59`;
      queryParams.push(fechaInicioSQL, fechaFinSQL);
      console.log(fechaInicioSQL, fechaFinSQL);
    }

    if (filters.estadoPago) {
      whereConditions.push(`pe.estado_pago = ?`);
      queryParams.push(filters.estadoPago);
    }

    if (filters.metodoPago) {
      whereConditions.push(`pe.metodo_pago = ?`);
      queryParams.push(filters.metodoPago);
    }

    if (filters.estadoPedido) {
      whereConditions.push(`pe.estado = ?`);
      queryParams.push(filters.estadoPedido);
    }

    // Concatenar las condiciones de busqueda (por defecto, si o si hay 1.)
    const whereClause = `WHERE ${whereConditions.join(" AND ")}`;

    let orderClause = "ORDER BY fecha_pedido DESC"; // orden por defecto.

    if (filters.sortBy) {
      const validSortFields = [
        "fecha_pedido",
        "total",
        "estado",
        "metodo_pago",
        "estado_pago",
      ];

      const sortDirection = filters.sortDirection === "desc" ? "DESC" : "ASC";

      if (validSortFields.includes(filters.sortBy)) {
        orderClause = `ORDER BY pe.${filters.sortBy} ${sortDirection}`;
      }
    }

    // Columnas que quiero obtener de la ORDEN del Cliente.
    const orderColumns = [
      Object.values(OrderModel.fields)
        .filter(
          (field) =>
            field != OrderModel.fields.idUsuario &&
            field != OrderModel.fields.idDireccion
        )
        .map((column) => `pe.${column}`),
      "d.direccionLinea1",
      "d.ciudad",
    ].join(", ");

    const finalParams = [...queryParams, String(limit), String(offset)];

    // llamar al método del modelo para listar las ordenes paginadas y filtradas - PARTE MAS IMPORTANTE DEL METODO - DONDE SE LLAMA AL MODELO QUE EJECUTA LA CONSULTA
    const orders = await OrderModel.findAllClientOrders(
      finalParams,
      whereClause,
      orderClause,
      orderColumns
    );

    // Metadata de la paginación

    const totalOrders = await OrderModel.paginationData(
      whereClause,
      queryParams
    );

    const totalPages = Math.ceil(totalOrders / limit);
    const pagination = {
      totalOrders,
      totalPages,
      currentPage: page,
      limit,
      hasNextPage: page < totalPages,
      hasPrevPage: page > 1,
    };
    return {
      orders,
      pagination,
    };
  } catch (error) {
    console.error("Error al intentar acceder a las ordenes cliente:", error);
    if (error.status) throw error;
    throw createError(
      500,
      "Error al intentar acceder a las ordenes cliente y sus metadatos."
    );
  }
};

//SERVICIO QUE TIENE LA LOGICA PREVIA PARA MOSTRAR LOS PRODUCTOS DE UN PEDIDO A TRAVES DE UN ID PEDIDO ESPECIFICO (MAS SU MONTO TOTAL Y CANT DE PRODUCTOS. )

export const findItemsInOrderService = async (idPedido, idUsuario) => {
  try {
    const pedido = await OrderModel.findOne({ idPedido }); // Validamos que el pedido existe y que peretence a un usuario y con esto obtenemos el idUsuario que esta en la propiedad del objeto que devuelve el metodo findOne.
    if (!pedido) {
      throw createError(404, "No se encontró el pedido solicitado.");
    }
    if (pedido.idUsuario !== idUsuario) {
      throw createError(403, "No tiene permiso para ver este pedido."); //EL user puede ver solo sus pedidos / IMPORTANTEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE
    }
    const products = await OrderProductsDetailsModel.findItemsInOrder(idPedido); //Esto me devuelve un array con productos adentro.

    const total = products.reduce((acumulador, producto) => {
      //Calculamos el subtotal de todo el pedido.
      const subtotal = parseFloat(producto.subtotaldetallePedido);
      return acumulador + subtotal;
    }, 0 /* valor inicial del acumulador */);

    const totalItems = products.length; //Cantidad total de prodcutos dentro de ese pedido. (prodcutos diferentes entre si - OJO)

    return { products, total: total.toFixed(2), totalItems }; //Retornamos un objeto con toda la info : objeto con productos - total del pedido en $ - cantidad de productos diferentes.
  } catch (error) {
    console.error(
      "Error al intentar acceder a los productos del pedido y sus metadatos:",
      error
    );
    if (error.status) throw error;
    throw createError(
      500,
      "Error al intentar acceder a los productos  del pedido y sus metadatos."
    );
  }
};

// ------------------------------------------------------------------SERVICIOS PARA ADMINISTRADOR ----------------------------------------------------------

// SERVICIO QUE MUESTRA LA LOGICA PREVIAR PARA TRAER/MOSTRAR UN PEDIDO COMPLETO (CUALQUIER PEDIDO) -  (CON DATOS DE USUARIO, DIRECCION Y PRODUCTOS) PARA EL ADMINISTRADOR.
export const findOrderDetailsAdminService = async (idPedido) => {
  try {
    //Primero buscamos el pedido principal con datos del usuario y la dirección (usa el método del modelo OrderModel).
    const order = await OrderModel.findByIdOrder(idPedido);

    // Si no existe ese pedido entonces mostramos el error.
    if (!order) throw createError(404, "No se encontró el pedido solicitado.");

    // Luego, traemos los productos que pertenecen a ese pedido usando el modelo de detalle de pedidos de OrderProdcutsDetailModel
    const productos = await OrderProductsDetailsModel.findItemsInOrder(
      idPedido
    );

    //  Calculamos el total sumando los subtotales de cada producto.
    const totalCalculado = productos.reduce(
      (acumulador, producto) =>
        acumulador + parseFloat(producto.subtotaldetallePedido || 0),
      0
    );

    //  Devolvemos un objeto con toda la informacion junta.
    return {
      productos, // Array con los productos del pedido.
      totalCalculado: totalCalculado.toFixed(2), // Total del pedido.
    };
  } catch (error) {
    console.error(
      "Error al intentar obtener el detalle completo del pedido:",
      error
    );

    if (error.status) throw error; //
    throw createError(
      500,
      "Error interno al intentar obtener el detalle del pedido ."
    );
  }
};

// SERVICIO QUE MUESTRA LA LOGICA PREVIA PARA TRAER/MOSTRAR TODOS LOS PEDIDOS DEL SISTEMA (CUALQUIER PEDIDO) PARA EL ADMINISTRADOR.

export const getAllOrdersSystemService = async (
  page,
  limit,
  offset,
  filters
) => {
  try {
    // Construimos dinámicamente las condiciones de busqueda y parámetros. Por defecto, seteamos que el primer filtro
    let whereConditions = [];
    let queryParams = [];

    // Verificamos los diferentes filtros que llegan.
    if (filters.producto) {
      whereConditions.push(
        `prod.nombre LIKE ? OR prod.descripcionCorta LIKE ? OR prod.descripcionLarga LIKE ?`
      );

      const searchParam = `%${filters.producto}%`;
      queryParams.push(searchParam, searchParam, searchParam);
    }

    if (filters.categoria) {
      whereConditions.push(`c.nombre = ?`);
      queryParams.push(filters.categoria);
    }

    if (filters.fechaInicio && filters.fechaFin) {
      // convertir de string a fecha, para poder comparar los valores. (si la fecha de inicio es mayor, entonces, filtramos.)
      const fechaInicio = new Date(filters.fechaInicio);
      const fechaFin = new Date(filters.fechaFin);
      if (fechaInicio > fechaFin)
        throw createError(
          400,
          "Error en la petición, la fecha de inicio no puede ser mayor a la fecha de fin."
        );
      whereConditions.push(`fecha_pedido BETWEEN ? AND ?`);
      const fechaInicioSQL = `${filters.fechaInicio} 00:00:00`;
      const fechaFinSQL = `${filters.fechaFin} 23:59:59`;
      queryParams.push(fechaInicioSQL, fechaFinSQL);
      console.log(fechaInicioSQL, fechaFinSQL);
    }

    if (filters.estadoPago) {
      whereConditions.push(`pe.estado_pago = ?`);
      queryParams.push(filters.estadoPago);
    }

    if (filters.metodoPago) {
      whereConditions.push(`pe.metodo_pago = ?`);
      queryParams.push(filters.metodoPago);
    }

    if (filters.estadoPedido) {
      whereConditions.push(`pe.estado = ?`);
      queryParams.push(filters.estadoPedido);
    }

    if (filters.cliente) {
      whereConditions.push(
        `(u.nombre LIKE ? OR u.apellido LIKE ? OR u.email LIKE ?)`
      );

      const search = `%${filters.cliente}%`;
      queryParams.push(search, search, search);
    }

    // Concatenar las condiciones de busqueda (por defecto, si o si hay 1.)
    const whereClause =
      whereConditions.length > 0
        ? `WHERE ${whereConditions.join(" AND ")}`
        : "";

    let orderClause = "ORDER BY pe.fecha_pedido DESC"; // orden por defecto.

    if (filters.sortBy) {
      const validSortFields = [
        "fecha_pedido",
        "total",
        "estado",
        "metodo_pago",
        "estado_pago",
      ];

      const sortDirection = filters.sortDirection === "desc" ? "DESC" : "ASC";

      if (validSortFields.includes(filters.sortBy)) {
        orderClause = `ORDER BY pe.${filters.sortBy} ${sortDirection}`;
      }
    }

    // Columnas que quiero obtener de la ORDEN del Cliente.
    const orderColumns = [
      Object.values(OrderModel.fields)
        .filter((field) => field != OrderModel.fields.idUsuario)
        .map((column) => `pe.${column}`),
      "d.direccionLinea1",
      "d.ciudad",
      "u.nombre AS nombreUsuario",
      "u.apellido AS apellidoUsuario",
      "u.email AS emailUsuario",
    ].join(", ");

    const finalParams = [...queryParams, String(limit), String(offset)];

    // llamar al método del modelo para listar las ordenes paginadas y filtradas - PARTE MAS IMPORTANTE DEL METODO - DONDE SE LLAMA AL MODELO QUE EJECUTA LA CONSULTA
    const orders = await OrderModel.findAllSystemOrders(
      finalParams,
      whereClause,
      orderClause,
      orderColumns
    );

    // Metadata de la paginación

    const totalOrders = await OrderModel.paginationData(
      whereClause,
      queryParams
    );

    const totalPages = Math.ceil(totalOrders / limit);
    const pagination = {
      totalOrders,
      totalPages,
      currentPage: page,
      limit,
      hasNextPage: page < totalPages,
      hasPrevPage: page > 1,
    };
    return {
      orders,
      pagination,
    };
  } catch (error) {
    console.error("Error al intentar acceder a las ordenes cliente:", error);
    if (error.status) throw error;
    throw createError(
      500,
      "Error al intentar acceder a las ordenes cliente y sus metadatos."
    );
  }
};
