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
import { validateSchema } from "../middlewares/validationSchemas.middleware.js";
import { createBrandSchema, updateBrandSchema } from "../schemas/brandSchema.js";

const router = Router();

// Listar todas las marcas
router.get("/brands", getBrand);

// Buscar por ID
router.get("/brands/id/:id", [authRequired, adminRequired], getBrandById); // Luego borrar el id -

// Buscar por slug
router.get("/brands/slug/:slug", [authRequired, adminRequired], getBrandBySlug);

// Crear marca
router.post(
  "/brands" [authRequired, adminRequired],
  validateSchema(createBrandSchema),
  createBrand
);

// Actualizar marca
router.put(
  "/brands/:id",
  [authRequired, adminRequired] , validateSchema(updateBrandSchema),
  updateBrand
);

// Eliminar marca
router.delete("/brands/:id", [authRequired, adminRequired], deleteBrand);

export default router;
