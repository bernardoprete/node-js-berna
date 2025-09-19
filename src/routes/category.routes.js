import { Router } from "express";
import { authRequired, adminRequired } from "../middlewares/auth.middleware.js";

import {
  getCategoryByID,
  getCategoryBySlug,
  createCategory,
  updateCategory,
  deleteCategory,
  getCategory
} from "../controllers/category.controller.js";

const router = Router();

// Listar todas
router.get("/categories", getCategory);

// Buscar por ID
router.get("/categories/id/:id", [authRequired], getCategoryByID);

// Buscar por slug
router.get("/categories/slug/:slug", [authRequired], getCategoryBySlug);

// Crear categoria
router.post("/categories",[authRequired,adminRequired], createCategory);

// Actualizar categoria
router.put("/categories/:id",[authRequired,adminRequired], updateCategory);

// Eliminar categoria
router.delete("/categories/:id", [authRequired,adminRequired], deleteCategory);

export default router;
