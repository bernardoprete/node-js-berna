import { Router } from "express";
import {
  crearUsuarioComoAdmin,
  deleteUsuario,
  findUsuario,
  getUsuarios,
  loginUsuario,
  logoutUsuario,
  modificarPassword,
  putUsuarioComoAdmin,
  registrarUsuario,
  verificarUsuarioLogeado, //IMPORTANTE IMPORTAR TODAS LAS FUNCIONES
} from "../controllers/usuarios.controller.js";
import {
  // IMPORTANTE IMPORTAR TODOS LOS MIDDLEWARES.
  validarID,
  validarEdadMinima,
  validarDatosUsuarioAlRegistrar,
  validarDatosUsuarioAlModificar,
} from "../middlewares/usuarios.middleware.js";
import { adminRequired, authRequired } from "../middlewares/auth.middleware.js";

const router = Router();

router.use((req, res, next) => {
  // MIDDLEWARE A NIVEL ENRUTADOR

  console.log("#### MIDDLEWARE EJECUTADO PARA TODAS LAS RUTAS /usuarios");
  next();
});

//MOSTRAR TODOS LOS USUARIOS (GET)
router.get(
  "/usuarios/administrador",
  [authRequired, adminRequired],
  getUsuarios
);

// MOSTRAR USUARIOS POR ID (GET)
router.get(
  "/usuarios/administrador/:id",
  [authRequired, adminRequired],
  findUsuario
);

//AGREGAR USUARIO COMO ADMIN (POST)
router.post(
  "/usuarios/administrador",
  [authRequired, adminRequired, validarDatosUsuarioAlRegistrar],
  crearUsuarioComoAdmin
);

//MODIFICAR MI PASSWORD SIENDO ADMIN

router.put(
  "/usuarios/administrador/modificarpassword",
  [authRequired, adminRequired],
  modificarPassword
);

// MODIFICAR UN USUARIO COMO ADMIN(PUT)
router.put(
  "/usuarios/administrador/:id",
  [authRequired, adminRequired, validarDatosUsuarioAlModificar, validarID], //  (PARA MODIFICAR DATOS DE LOS USERS SIENDO ADMIN - EN ESTE CASO EL ADMIN NO PUEDE MODIFICAR LA CONTRASEÑA DEL USER)
  putUsuarioComoAdmin
);

//MODIFICAR  MI CONTRASEÑA SIENDO USUARIO (PUT)

router.put(
  "/usuarios/modificarpassword",
  [authRequired],
  modificarPassword // DUDA (PARA MODIFICAR MI PASSWORD SIENDO ADMIN)
);

// BORRAR UN USUARIO (DELETE)
router.delete(
  "/usuarios/administrador/:id",
  [authRequired, adminRequired],
  deleteUsuario
);

// REGISTRO DE USUARIO - PRIMERA VEZ
router.post(
  "/usuarios/register",
  [validarDatosUsuarioAlRegistrar, validarEdadMinima],
  registrarUsuario
); // registrar usuario ya valida el mail

// LOGIN DE USUARIO -
router.post("/usuarios/login", loginUsuario);

// LOGOUT DE USUARIO
router.post("/usuarios/logout", [authRequired], logoutUsuario);

// VERIFICACION DE USUARIO
router.post("/usuarios/verificar", [authRequired], verificarUsuarioLogeado);

//router.get("usuario/perfil", ,listarPerfilUsuario)

export default router;
