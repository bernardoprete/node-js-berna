import { Router } from "express";
import {
  deleteProducto,
  findProducto,
  getProducto,
  postProducto,
  putProducto,
} from "../controllers/productos.controller.js";
import {
  validarDatosProducto,
  validarIdPost,
  validarIdParams,
} from "../middlewares/productos.middleware.js";

const router = Router();

router.use((req, res, next) => {
  // MIDDLEWARE A NIVEL ENRUTADOR PARA VER SOLO DE EJEMPLO

  console.log("#### MIDDLEWARE EJECUTADO PARA TODAS LAS RUTAS /productos");
  next();
});

// MOSTRAR TODOS LOS PRODUCTOS (GET)
router.get("/productos", getProducto);

// MOSTRAR PRODUCTO POR ID (GET)
router.get("/productos/:id", validarIdParams, findProducto);

// AGREGAR PRODUCTO (POST)
router.post("/productos", validarDatosProducto, validarIdPost, postProducto);

// MODIFICAR UN PRODUCTO (PUT)
router.put(
  "/productos/:id",
  validarDatosProducto,
  validarIdParams,
  putProducto
);

// ELIMINAR PRODUCTO (DELETE)
router.delete("/productos/:id", validarIdParams, deleteProducto);

export default router; // Exporto esto aca para importarlo en app y poder relacionar las funciones que aqui llamo y que su logica esta en controlador.
