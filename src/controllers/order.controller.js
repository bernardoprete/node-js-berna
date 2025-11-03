import { createError } from "../utils/utils.js";
import {
  createOrderService,
  findOrderDetailsAdminService,
  findOrderDetailsUserService,
} from "../services/order.service.js";
import { OrderModel } from "../models/order.model.js";

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

/* CONTROLADOR PARA OBTENER TODOS LOS PEDIDOS DE UN USUARIO CON SUS PRODUCTOS Y DIRECCIÓN */
export const getAllOrders = async (req, res, next) => {
  const { idUsuario } = req.user; // Obtenemos el idUsuario del token

  try {
    // Llamamos al modelo que obtiene los pedidos (incluyendo info de direccion de envio)
    const pedidos = await OrderModel.findOrderWhitAdressUser(idUsuario); //Directamente del modelo al controlador sin servicio. OJO.

    // Enviamos la respuesta
    res.status(200).json({
      message: `Listado de pedidos del usuario:`,
      cantidadPedidos: pedidos.length,
      pedidos: pedidos,
    });
  } catch (error) {
    console.error("Error al intentar listar los pedidos:", error);
    if (error.status) return next(error);
    next(createError(500, "Error interno al intentar listar los pedidos."));
  }
};

//CONTROLADOR PARA OBTENER UN PEDIDO ESPECÍFICO DEL USUARIO LOGUEADO (CON DETALLE DE PRODUCTOS Y DIRECCIÓN). AQUI EL USER PUEDE VER SOLO SUS PEDIDOS
export const getOrderDetailUser = async (req, res, next) => {
  const { idPedido } = req.params; // Obtenemos el id del pedido desde la URL.
  const { idUsuario } = req.user;

  // Llamamos al servicio que contiene la logica completa en order.service
  const pedidoCompleto = await findOrderDetailsUserService(idPedido, idUsuario);

  // Si todo sale bien devolvemos el resultado.
  res.status(200).json({
    message: "Detalle completo del pedido obtenido correctamente.",
    pedido: pedidoCompleto,
  });
  try {
  } catch (error) {
    console.error("Error al obtener el pedido del usuario:", error);
    if (error.status) return next(error);
    next(createError(500, "Error interno al intentar obtener el pedido."));
  }
};
// ------------------------------------------------------------------CONTROLADOR PARA ADMINISTRADOR ----------------------------------------------------------

// CONTROLADOR PARA OBTENER TODOS LOS PEDIDOS DEL SISTEMA (ADMIN) - SIN PRODUCTOS INCLUIDOS

export const getAllOrdersAdmin = async (req, res, next) => {
  try {
    // Obtenemos todos los pedidos con la info de usuario y dirección
    const orders = await OrderModel.findAllWithUserAndAddress(); //Llamamos al metodo del modelo.
    // Si no hay pedidos registrados, lanzamos un error informativo
    if (!orders || orders.length === 0)
      throw createError(404, "No existen pedidos registrados en el sistema.");

    res.status(200).json({
      message: "Listado de pedidos del sistema obtenido correctamente.",
      pedidos: orders,
      totalPedidos: orders.length,
    });
  } catch (error) {
    console.log(
      "Error al intentar listar todos los pedidos del sistema:",
      error
    );
    if (error.status) return next(error);
    next(
      createError(
        500,
        "Error interno al intentar listar los pedidos del sistema."
      )
    );
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
    res.status(200).json({
      message: "Detalle completo del pedido obtenido correctamente.",
      pedido: pedidoCompleto,
    });
  } catch (error) {
    if (error.status) return next(error);
    next(
      createError(500, "Error interno al intentar obtener el pedido (ADMIN).")
    );
  }
};
