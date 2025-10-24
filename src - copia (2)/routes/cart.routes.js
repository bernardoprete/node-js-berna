import { Router } from "express";
import { authRequired } from "../middlewares/auth.middleware.js";
import { getCart, addCartItem } from "../controllers/cart.controller.js";

const router = Router();

// Obtener el carrito del usuario autenticado

router.get("/cart", [authRequired], getCart);

//Agregar producto al carrito

router.post("/cart/item", [authRequired], addCartItem);

export default router;
