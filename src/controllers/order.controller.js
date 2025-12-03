import { createError } from "../utils/utils.js";
import {
  createOrderService,
  findItemsInOrderService,
  findOrderDetailsAdminService,
  getAllClientOrdersService,
  getAllOrdersSystemService,
} from "../services/order.service.js";

/* EL controlador puede conectarse a ambos modelos (orderModel y OrderProdcutDetailsModel) directamente pero tambien sepuede conectar por medio del cart.service - El controlador recibe la info ejecuta el metodo (ya sea que provenga de algun modelo o del servicio) y da respuesta. NO APLICA LOGICA  */

// CONTROLADOR PARA CREAR EL PEDIDO COMPLETO DEL USUARIO (CON PRODUCTOS)
export const createOrder = async (req, res, next) => {
  const { idUsuario } = req.user;
  const { metodo_pago, idDireccion } = req.body;

  try {
    const result = await createOrderService(
      idUsuario,
      metodo_pago,
      idDireccion
    );
    res.status(201).json(result);
  } catch (error) {
    if (error.status) return next(error);
    next(createError(500, "Error interno al intentar crear el pedido."));
  }
};

//CONTROLADOR PARA OBTENER TODAS LAS ORDENES DE UN CLIENTE / USUARIO LOGUEADO (PAGINADAS/FILTRADAS)
export const getAllClientOrders = async (req, res, next) => {
  const { idUsuario } = req.user; // Obtenemos el idUsuario del token
  // Extraemos si vienen seteados los parámetros para la paginación
  const page =
    parseInt(req.query.page) && req.query.page >= 1
      ? parseInt(req.query.page)
      : 1;
  const limit =
    parseInt(req.query.limit) && req.query.limit >= 1
      ? parseInt(req.query.limit)
      : 5;
  const offset = (page - 1) * limit;
  const filters = {
    producto: req.query.producto || null,
    categoria: req.query.categoria || null,
    fechaInicio: req.query.fecha_inicio || null,
    fechaFin: req.query.fecha_fin || null,
    sortBy: req.query.sort_by || "fecha_pedido",
    sortDirection: req.query.sort_direction || "desc",
    estadoPago: req.query.estado_pago || null,
    metodoPago: req.query.metodo_pago || null,
    estadoPedido: req.query.estado_pedido || null,
  };

  const cleanFilters = Object.fromEntries(
    Object.entries(filters).filter(([key, value]) => {
      //Elimina del objeto cualquier filtro vacío (null, undefined, o string vacío).
      return value !== null && value !== undefined && value !== "";
    })
  );

  try {
    const result = await getAllClientOrdersService(
      idUsuario,
      page,
      limit,
      offset,
      cleanFilters
    );
    // Enviamos la respuesta
    res.status(200).json(result);
  } catch (error) {
    console.error("Error al intentar listar los pedidos:", error);
    if (error.status) return next(error);
    next(createError(500, "Error interno al intentar listar los pedidos."));
  }
};

///CONTROLADOR PARA OBTENER DETALLE DE PRODUCTOS DEL USUARIO LOGUEADO (MEDIANTE ID DE ALGUNO DE SUS PEDIDOS). AQUI EL USER PUEDE VER SOLO LOS DETALLES DE SUS PEDIDOS.
export const getOrderDetailUser = async (req, res, next) => {
  const { idPedido } = req.params; // Obtenemos el id del pedido desde la URL.
  const { idUsuario } = req.user;

  // Llamamos al servicio que contiene la logica completa en order.service
  const pedidoCompleto = await findItemsInOrderService(idPedido, idUsuario);

  // Si todo sale bien devolvemos el resultado.
  res.status(200).json(pedidoCompleto);
  try {
  } catch (error) {
    console.error("Error al obtener el pedido del usuario:", error);
    if (error.status) return next(error);
    next(createError(500, "Error interno al intentar obtener el pedido."));
  }
};
// ------------------------------------------------------------------CONTROLADOR PARA ADMINISTRADOR ----------------------------------------------------------

//CONTROLADOR PARA OBTENER TODAS LAS ORDENES DEL SISTEMA (PAGINADAS Y CON POSIBLES FILTROS Y ORDENAMIENTO)

export const getAllOrdersSystem = async (req, res, next) => {
  // Extraemos si vienen seteados los parámetros para la paginación
  const page =
    parseInt(req.query.page) && req.query.page >= 1
      ? parseInt(req.query.page)
      : 1;
  const limit =
    parseInt(req.query.limit) && req.query.limit >= 1
      ? parseInt(req.query.limit)
      : 5;
  const offset = (page - 1) * limit;

  //FILTROS
  const filters = {
    producto: req.query.producto || null,
    categoria: req.query.categoria || null,
    fechaInicio: req.query.fecha_inicio || null,
    fechaFin: req.query.fecha_fin || null,
    sortBy: req.query.sort_by || "fecha_pedido",
    sortDirection: req.query.sort_direction || "desc",
    estadoPago: req.query.estado_pago || null,
    metodoPago: req.query.metodo_pago || null,
    estadoPedido: req.query.estado_pedido || null,
    cliente: req.query.cliente || null,
  };

  const cleanFilters = Object.fromEntries(
    Object.entries(filters).filter(([key, value]) => {
      //Elimina del objeto cualquier filtro vacío (null, undefined, o string vacío).
      return value !== null && value !== undefined && value !== "";
    })
  );

  try {
    const result = await getAllOrdersSystemService(
      // Llamado directamente al servicio
      page,
      limit,
      offset,
      cleanFilters
    );
    // Enviamos la respuesta
    res.status(200).json(result);
  } catch (error) {
    console.error("Error al intentar listar los pedidos:", error);
    if (error.status) return next(error);
    next(createError(500, "Error interno al intentar listar los pedidos."));
  }
};

/* 
CONTROLADOR PARA OBTENER UN PEDIDO COMPLETO (CON DETALLE DE PRODUCTOS, USUARIO Y DIRECCIÓN) - ACA EL ADMIN PUEDE VER TODOS LOS PEDIDOS QUE QUIERA.
— Recibe el id del pedido por parámetros de la URL y devuelve toda la informacion combinada.
*/
export const getOrderDetailsAdmin = async (req, res, next) => {
  const { idPedido } = req.params; // Obtenemos el id del pedido desde la URL.

  try {
    // Llamamos al servicio que contiene la logica completa en order.service
    const pedidoCompleto = await findOrderDetailsAdminService(idPedido);

    // Si todo sale bien devolvemos el resultado.
    res.status(200).json(pedidoCompleto);
  } catch (error) {
    if (error.status) return next(error);
    next(
      createError(500, "Error interno al intentar obtener el pedido (ADMIN).")
    );
  }
};

/* 
  CONTROLADORES RELACIONADOS AL ESTADO DEL PEDIDO

*/

// 1- ESTADO: PENDIENTE -- Es diferente al metodo createInitial (Este cambia el estado y el otro inicial la orden de manera predeterminada.)
export const orderPending = async (req, res, next) => {
  const { id } = req.params; // ID del pedido a actualizar

  try {
    const result = await orderPendingService(id); // Llamamos al service

    res.status(200).json({
      message: "El pedido fue marcado como pendiente.",
      result,
    });
  } catch (error) {
    if (error.status) return next(error);
    next(
      createError(
        500,
        "Error interno al intentar cambiar el estado a pendiente."
      )
    );
  }
};

// 2- ESTADO: PROCESADO - Se confirma el pago y se procede a preparar el pedido.
export const orderProcessed = async (req, res, next) => {
  const { id } = req.params; // ID del pedido a actualizar

  try {
    const result = await orderProcessedService(id); // Llamamos al service

    res.status(200).json({
      message: "El pedido fue marcado como procesado.",
      result,
    });
  } catch (error) {
    if (error.status) return next(error);
    next(
      createError(
        500,
        "Error interno al intentar cambiar el estado a procesado."
      )
    );
  }
};

// 3- ESTADO: ENVIADO (SHIPPED) - Cuando el pedido es enviado a la dirección del cliente.
// Aquí además recibimos el código de seguimiento
export const orderShipped = async (req, res, next) => {
  const { id } = req.params; //idPedido
  const {
    codigo_seguimiento,
    fecha_envio,
    fecha_entrega,
    costo_envio,
    estado_envio,
    metodo_envio,
  } = req.body;
  const shipData = {
    //Necesitamos todos estos datos cuando pasamos el pedido a enviado. Aqui agrupa los datos en un objeto para pasar esto por parametro al servicio mas limpio.
    codigo_seguimiento,
    fecha_envio,
    fecha_entrega,
    costo_envio,
    estado_envio,
    metodo_envio,
  };
  try {
    const result = await orderShippedService(id, shipData);
    res.status(200).json(result);
  } catch (error) {
    if (error.status) return next(error);
    next(
      createError(500, "Error interno al intentar cambiar el estado a Enviado.")
    );
  }
};

// 4- ESTADO: ENTREGADO - Cuando el envío llega a destino. Se setea la fecha de entrega
export const orderDelivered = async (req, res, next) => {
  const { id } = req.params; // IdPedido

  //Esta info posteriormente va a venir de la api. No es seguro que esta info este en el body. 
  const { fecha_entrega, estado_envio } = req.body; 

  // Para pasar mas limpia la data por parametro armamos un objeto.
  const deliveredData = {
    fecha_entrega,
    estado_envio: estado_envio || "delivered", // Valor por defecto
  };

  try {
    const result = await orderDeliveredService(id, deliveredData);

    res.status(200).json({
      message: "El pedido fue marcado como entregado.",
      result,
    });
  } catch (error) {
    if (error.status) return next(error);
    next(
      createError(
        500,
        "Error interno al intentar marcar el pedido como entregado."
      )
    );
  }
};

// 5-ESTADO: CANCELADO
export const orderCancelled = async (req, res, next) => {
  const { id } = req.params;

  try {
    const result = await orderService.orderCancelledService(id); //Falta hacerlo
    res.status(200).json(result);
  } catch (error) {
    if (error.status) return next(error);
    next(createError(500, "Error interno al intentar cancelar el pedido."));
  }
};
