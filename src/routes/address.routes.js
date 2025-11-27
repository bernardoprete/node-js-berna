import { Router } from "express";
import { authRequired, adminRequired } from "../middlewares/auth.middleware.js";
import {
  createAddress,
  getAdrress,
  getAddressById,
  getAddressByField,
  updateAddress,
  deleteAddress,
} from "../controllers/address.controller.js";
import {
  createAddressSchema,
  updateAddressSchema,
} from "../schemas/addressSchema.js";
import { validateSchema } from "../middlewares/validationSchemas.middleware.js";

const router = Router();

// Listar todas las direcciones
router.get("/address", [authRequired], getAdrress);

//Falta una ruta donde pueda ver todas las direcciones del sistema (solo para admin) - paginadas y con filtro. --Preguntar si es necesario hacerla.

// Buscar por ID
router.get("/address/id/:id", [authRequired, adminRequired], getAddressById);

// Buscar por field -- quizas sea mejor que este metodo busque todas las direcciones de un usuario determinado.
router.get("/address/search", [authRequired, adminRequired], getAddressByField);

// Crear direccion
router.post(
  "/address",
  authRequired,
  validateSchema(createAddressSchema),
  createAddress
);

// Actualizar direccion
router.put(
  "/address/:id",
  authRequired,
  validateSchema(updateAddressSchema),
  updateAddress
);

// Eliminar direccion
router.delete("/address/:id", authRequired, deleteAddress);

export default router;
