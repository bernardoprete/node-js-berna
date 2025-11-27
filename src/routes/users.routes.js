import { Router } from "express";
import {
  getUserByID,
  getUsers,
  createUser,
  deleteUser,
  verifyUser,
  loginUser,
  logOut,
  getUserByField,
  updateUser,
  getUsersBySearch,
  forgotPassword,
  resetPasswordController,
  changePasswordLogged,
} from "../controllers/users.controller.js"; // Esto esta importado en el controlador.
import { validateSchema } from "../middlewares/validationSchemas.middleware.js";
import { createUserSchema } from "../schemas/userSchema.js";
import { updateUserSchema } from "../schemas/userSchema.js";
import {
  authRequired,
  adminRequired,
  noAuthRequired,
} from "../middlewares/auth.middleware.js";
import { changePasswordSchema } from "../schemas/changePasswordSchema.js";
import {
  forgotPasswordSchema,
  resetPasswordSchema,
} from "../schemas/passwordResetSchema.js";

const router = Router();

//MOSTRAR TODOS LOS USUARIOS (GET)
router.get("/users", [authRequired, adminRequired], getUsers); // La funcion o metodo GetUsers la obtengo del controlador y usa adentro la logica de la funcion FindAll que la traigo del modelo de usuarios.
router.get("/user/search", [authRequired, adminRequired], getUserByField); // Obtener un usuario por campo - ES USER *
router.get("/users/search", getUsersBySearch); // Obtener usuarios por busqueda (Devuelve varios usuarios por busqueda total o parcial, es decir que tiene una condicion) - ES USERS*
router.get("/users/verify", verifyUser);

router.get("/users/:id", [authRequired, adminRequired], getUserByID); // La funcion o metodo GetUserById la obtengo del controlador y usa adentro la logica de la funcion FindById que la traigo del modelo de usuarios.

router.post("/users", validateSchema(createUserSchema), createUser); //Crear un usuario con todas las validaciones que hicimos mediante los esquemas.



router.post("/users/login", noAuthRequired, loginUser); //Loguear un usuario

router.post("/users/logout", [authRequired], logOut); //Desloguear un usuario

router.patch(
  "/users/:id",
  validateSchema(updateUserSchema),
  [authRequired, adminRequired],
  updateUser
); // Actualizar los datos de un usuario total o parcialemente con todas las validaciones que hicemos mediante los esquemas.

router.delete("/users/:id", [authRequired, adminRequired], deleteUser); //Eliminar un usuario ()

//CAMBIO Y RESETEO DE PASSWORD

// Solicitar codigo de recuperacion
router.post(
  "/users/forgot-password",
  noAuthRequired,
  validateSchema(forgotPasswordSchema),
  forgotPassword
);

// Resetear contraseña con codigo
router.post(
  "/users/reset-password",
  noAuthRequired,
  validateSchema(resetPasswordSchema),
  resetPasswordController
);

router.post(
  "/users/change-password",
  authRequired, //solo logueados
  validateSchema(changePasswordSchema),
  changePasswordLogged
);
export default router;
