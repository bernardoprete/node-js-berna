import { Router } from "express";
import {
  deleteUsuario,
  findUsuario,
  getUsuarios,
  loginUsuario,
  logoutUsuario,
  postUsuario,
  putUsuario,
  registrarUsuario,
  verificarUsuarioLogeado, //IMPORTANTE IMPORTAR TODAS LAS FUNCIONES
} from "../controllers/usuarios.controller.js";
import {
  validarDatosUsuario, // IMPORTANTE IMPORTAR TODOS LOS MIDDLEWARES.
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

// REGISTRO DE USUARIO - PRIMERA VEZ
router.post("/usuarios/register", registrarUsuario);

// LOGIN DE USUARIO -
router.post("/usuarios/login", loginUsuario);

// LOGOUT DE USUARIO
router.post("/usuarios/logout", logoutUsuario);

// LOGOUT DE USUARIO
router.post("/usuarios/verificar", verificarUsuarioLogeado);

export default router;
