import { Router } from "express";
import { authRequired, adminRequired } from "../middlewares/auth.middleware.js";

import {
  getBrandBySlug,
  createBrand,
  updateBrand,
  deleteBrand,
  getBrand,
  getBrandById,
} from "../controllers/brand.controller.js";

const router = Router();

// Listar todas las marcas
router.get("/brands", [authRequired], getBrand);

// Buscar por ID
router.get("/brands/id/:id", [authRequired], getBrandById);

// Buscar por slug
router.get("/brands/slug/:slug", [authRequired, adminRequired], getBrandBySlug);

// Crear marca
router.post("/brands", [authRequired, adminRequired], createBrand);

// Actualizar marca
router.put("/brands/:id", [authRequired, adminRequired], updateBrand);

// Eliminar marca
router.delete("/brands/:id", [authRequired, adminRequired], deleteBrand);

export default router;
