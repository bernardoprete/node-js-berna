import { Router } from "express";
import { authRequired } from "../middlewares/auth.middleware.js";
import {
  createOrder,
  getAllOrders,
  getOrder,
} from "../controllers/order.controller.js";

const router = Router();


router.get("/orders", [authRequired], getAllOrders); //Obtener todos los pedidos del use autenticador pero sin detalles de productos.

router.get("/order/:idPedido", [authRequired], getOrder); // Obtener el pedido completo (con productos) mediante un nro de idPedido (Solo muestra un pedido particular).

router.post("/order", [authRequired], createOrder); //Crear un nuevo pedido.

export default router;
