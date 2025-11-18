import { Router } from "express";

import { adminRequired, authRequired } from "../middlewares/auth.middleware.js";
import {
  createOrder,
  getAllClientOrders,
  getAllOrdersSystem,
  getOrderDetailsAdmin,
  getOrderDetailUser,
} from "../controllers/order.controller.js";
import { validateSchema } from "../middlewares/validationSchemas.middleware.js";
import { createOrderSchema } from "../schemas/orderSchema.js";

const router = Router();

//NORMALES
router.get("/order", [authRequired], getAllClientOrders); //Obtener todos los pedidos del usuario autenticado(IdUsuario)  con direccion de envio (sin detalle de productos).

router.get("/user/order/:idPedido", [authRequired], getOrderDetailUser); //  Con esta ruta siendo  usuario  puedo  ver los detalles de mi compra (prodcutos) y el total de mi pedido , por medio de IdPedido.

//CREACION DE UN PEDIDO
router.post(
  "/order",
  [authRequired],
  validateSchema(createOrderSchema),
  createOrder
); //Crear un nuevo pedido.

//ADMINISTRADOR/ES
router.get("/admin/order", [authRequired, adminRequired], getAllClientOrders); //Obtener todos los pedidos del cliente logueado (suponiendo que yo tengo como admin ordenes) (paginados  y con posibilidad de filtrar y ordenamiento ). ESTE LUEGO DEBERIA DESAPARECER YA QUE UN ADMIN NO DEBERIA TENER ORDENES.
router.get(
  "/admin/totalOrdersSystem",
  [authRequired, adminRequired],
  getAllOrdersSystem
); //Obtener todos los pedidos del sistema (paginados y con posibilidad de filtrar y ordenamiento)

router.get(
  "/admin/order/:idPedido",
  [authRequired],
  [adminRequired],
  getOrderDetailsAdmin
); // Obtenemos de un pedido particular (por su idPedido) y vemos el detalle solamente (productos.)  PODRIA PAGINARSE ETC (NO ESTA HECHO)

export default router;
