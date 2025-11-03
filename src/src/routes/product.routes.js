import { Router } from "express";
import { authRequired, adminRequired } from "../middlewares/auth.middleware.js";
import {
  createProduct,
  deleteProduct,
  getProductByID,
  getProductBySlug,
  getProductDetail,
  getProducts,
  getProductsLimited,
  updateProduct,
} from "../controllers/product.controller.js";
import { validateSchema } from "../middlewares/validationSchemas.middleware.js";
import { createProductSchema } from "../schemas/productScehma.js";
import { updateProductSchema } from "../schemas/productScehma.js";

const router = Router();

// Listar todos los productos
router.get("/products", getProducts);

// Buscar por ID
router.get("/products/id/:id", [authRequired, adminRequired], getProductByID); // Luego borrar el id -

// Buscar por slug
router.get("/products/slug/:slug", getProductBySlug);

// Obtener detalles del producto - Hay que pasarle el slug para poder hacerlo.
router.get("/products/detail/:slug", getProductDetail);

// Obtener productos con paginacion especifica
router.get(
  "/products/limited",

  getProductsLimited
); //.........products/limited?page=1&limit=2 (Esta es la parte final de la ruta)

//Crear un producto
router.post(
  "/products",
  [authRequired, adminRequired],
  validateSchema(createProductSchema),
  createProduct
);

// Actualizar producto
router.put(
  "/products/:id",
  [authRequired, adminRequired],
  validateSchema(updateProductSchema),
  updateProduct
);

// Eliminar producto
router.delete("/products/:id", [authRequired, adminRequired], deleteProduct);

/*
[authRequired, adminRequired] */

export default router;
