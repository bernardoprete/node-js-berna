import { Router } from "express";

import { adminRequired, authRequired } from "../middlewares/auth.middleware.js";
import {
  createOrder,
  getAllOrders,
  getAllOrdersAdmin,
  getOrderDetailsAdmin,
  getOrderDetailUser,
} from "../controllers/order.controller.js";

const router = Router(); 


//USERS NORMALES
router.get("/order", [authRequired], getAllOrders); //Obtener todos los pedidos del usuario autenticado(IdUsuario)  con direccion de envio (sin detalle de productos) ----y hacer otra ruta para que yo usuario  pueda ver los detalles de mi compra (con productos y por IdPedido)

router.get("/user/order/:idPedido", [authRequired], getOrderDetailUser); //  Con esta ruta siendo  usuario  puedo  ver los detalles de mi compra (prodcutos) y el total de mi pedido , por medio de IdPedido.



//USERS ADMINISTRADOR/ES
router.get("/admin/order", [authRequired, adminRequired], getAllOrdersAdmin); //Obtener todos los pedidos del sitema  y con detalles de direccion de envio pero sin detalles de prodcutos.

router.get(
  "/admin/order/:idPedido",
  [authRequired],
  [adminRequired],
  getOrderDetailsAdmin
); // Obtenemos de un pedido particular (por su idPedido) toda la info completa, con datos de usuario, direccion de envio y productos.




//CREACION DE UN PEDIDO
router.post("/order", [authRequired], createOrder); //Crear un nuevo pedido.

export default router;
