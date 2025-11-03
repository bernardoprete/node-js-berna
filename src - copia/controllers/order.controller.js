import { createError } from "../utils/utils.js";
import { OrderModel } from "../models/order.model.js";
import {
  createOrderService,
  findAllOrdersByUserService,
  findItemsInOrderService,
} from "../services/order.service.js";

/* EL controlador puede conectarse a ambos modelos (orderModel y OrderProdcutDetailsModel) directamente pero tambien sepuede conectar por medio del cart.service - El controlador recibe la info ejecuta el metodo (ya sea que provenga de algun modelo o del servicio) y da respuesta. NO APLICA LOGICA  */

/* CONTROLADOR PARA OBTENER TODOS LOS PEDIDOS DE UN USUARIO (SIN DETALLE DE PRODUCTOS) */
export const getAllOrders = async (req, res, next) => {
  const { idUsuario } = req.user;

  try {
    const orders = await findAllOrdersByUserService(idUsuario);
    res.status(200).json({
      pedidos: orders,
    });
  } catch (err) {
    console.log(err);
    if (err.status) return next(err);
    next(createError(500, "Error interno al intentar listar los pedidos."));
  }
};

// CONTROLADOR PARA OBTENER UN SOLO PEDIDO (IDPEDIDO) DEL USUARIO (CON DETALLE DE PRODUCTOS)
export const getOrder = async (req, res, next) => {
  const { idUsuario } = req.user;
  const { idPedido } = req.params;
  try {
    //Buscar el pedido del usuario a traves del idPedido que me llega  por parametros de consulta en la URL.
    const order = await OrderModel.findOne({ idPedido });
    if (!order) throw createError(404, "No se encontro el pedido solicitado.");
    if (order.idUsuario !== idUsuario)
      throw createError(403, "No tiene permiso para ver este pedido."); //Sino coloco esto cualquier usuario podria ver los pedidos cambiando el numero del param de consulta / IMPORTANTE

    //Si posee un pedido entonces hay que traer los productos de ese pedido con el metodo findItemsInOrderService (se le pasa el idPedido que se encuentea dentro del objeto que devuelve el metodo findOne)
    const productos = await findItemsInOrderService(idPedido);

    // Devolver todo junto en un objeto
    res.status(200).json({
      order, //Informacion del pedido (sale de la tabla pedido de la bd pero sin productos, ya que esta tabla no los maneja)
      productos, //Array con los productos del pedido, que salen de la respuesta del metodo findItemsInOrderService.
    });
  } catch (err) {
    console.log(err);
    if (err.status) return next(err);
    next(createError(500, "Error interno al intentar obtener el pedido."));
  }
};

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
