import { Router } from "express";
import {
  eliminateUser,
  getUserByID,
  getUsers,
  postNewUser,
  putUser,
} from "../controllers/users.controller.js"; // Esto esta importado en el controlador.

const router = Router();

//MOSTRAR TODOS LOS USUARIOS (GET)
router.get("/users", getUsers); // La funcion o metodo GetUsersla obtengo del controlador y usa adentro la logica de la funcion FindAll que la traigo del modelo de usuarios.

//BUSCAR USUARIOS POR ID (GET)
router.get("/users/:id", getUserByID); // La funcion o metodo GetUserById la obtengo del controlador y usa adentro la logica de la funcion FindById que la traigo del modelo de usuarios.

router.post("/users", postNewUser);

router.put("/users/:id", putUser);

router.delete("/users/:id", eliminateUser);

export default router;
