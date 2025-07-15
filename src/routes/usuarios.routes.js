import { Router } from "express";
import {
  deleteUsuario,
  findUsuario,
  getUsuarios,
  postUsuario,
  putUsuario,
} from "../controllers/usuarios.controller.js";
import {
  validarDatosUsuario,
  validarID,
} from "../middlewares/usuarios.middleware.js";

const router = Router();

router.use((req, res, next) => {
  // MIDDLEWARE A NIVEL ENRUTADOR

  console.log("#### MIDDLEWARE EJECUTADO PARA TODAS LAS RUTAS /usuarios");
  next();
});

//MOSTRAR TODOS LOS USUARIOS (GET)
router.get("/usuarios", getUsuarios);

// MOSTRAR USUARIOS POR ID (GET)
router.get("/usuarios/:id", findUsuario);

//AGREGAR USUARIO (POST)
router.post("/usuarios", validarDatosUsuario, postUsuario);

// MODIFICAR UN USUARIO (PUT)
router.put("/usuarios/:id", validarDatosUsuario, validarID, putUsuario);

// BORRAR UN USUARIO (DELETE)
router.delete("/usuarios/:id", deleteUsuario);

export default router;
