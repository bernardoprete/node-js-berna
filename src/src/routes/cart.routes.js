import { Router } from "express";
import { authRequired, adminRequired } from "../middlewares/auth.middleware.js";
import { getCart } from "../controllers/cart.controller.js";

const router = Router();

router.get("/cart", [authRequired], getCart);

export default router;
