import { Router } from "express";
import { authRequired } from "../middlewares/auth.middleware.js";
import { getCart, addCartItem, updateCartItem, removeCartItem, clearCart } from "../controllers/cart.controller.js";

const router = Router();

// Obtener el carrito del usuario autenticado

router.get("/cart", [authRequired], getCart);

//Agregar producto al carrito

router.post("/cart/item", [authRequired], addCartItem);

router.put("/cart/update", [authRequired], updateCartItem);

router.delete("/cart/remove", [authRequired], removeCartItem);

router.delete("/cart/clear", [authRequired], clearCart);



export default router;