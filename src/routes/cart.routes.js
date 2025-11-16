import { Router } from "express";
import { authRequired } from "../middlewares/auth.middleware.js";
import {
  getCart,
  addCartItem,
  updateCartItem,
  removeCartItem,
  clearCart,
} from "../controllers/cart.controller.js";

const router = Router();

// Obtener/Ver el carrito del usuario autenticado

router.get("/cart", [authRequired], getCart);

//Agregar producto al carrito
router.post("/cart/item", [authRequired], addCartItem);

//Actualizar carrito (modificar cantidad del carrito).
router.put("/cart/update", [authRequired], updateCartItem);

//Eliminar un item del carrito ( ejm Zapatillas Nike Air Force - Cantidad: 5) Aqui elimino directamente el item.
router.delete("/cart/remove", [authRequired], removeCartItem);

//Borrar todo el contenido del carrito - El carrito sigue activo pero vacio.
router.delete("/cart/clear", [authRequired], clearCart);

export default router;
