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

const router = Router();

// Listar todos los productos
router.get("/products", getProducts);

// Buscar por ID
router.get("/products/id/:id", getProductByID); // Luego borrar el id -

// Buscar por slug
router.get("/products/slug/:slug", getProductBySlug);

// Obtener detalles del producto
router.get("/products/detail/:slug", getProductDetail);

// Obtener productos con paginacion especifica
router.get("/products/limited", getProductsLimited);

//Crear un producto
router.post("/products", createProduct);

// Actualizar producto
router.put("/products/:id", updateProduct);

// Eliminar marca
router.delete("/products/:id", deleteProduct);

/*
[authRequired, adminRequired] */

export default router;
