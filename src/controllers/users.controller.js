import { pool } from "../db.js"; // Vamos a utilizar el pool de conexiones
import { crearTokenDeAcceso } from "../libs/jwt.js";
import { UserModel } from "../models/users.model.js";
import {
  changePasswordLoggedService,
  createUserService,
  verifyUserService,
} from "../services/user.services.js";
import { compareStringHash, createError } from "../utils/utils.js";
import {
  requestPasswordReset,
  resetPassword,
} from "../services/user.services.js";

// CONSULTA DEL MODELO DE USUARIOS  - VER TODOS LOS USUARIOS (GET)
export const getUsers = async (req, res, next) => {
  try {
    const result = await UserModel.findAll(); // Uso el modelo.
    res.status(200).json(result);
  } catch (err) {
    if (err.status) return next(err);
    const error = createError(
      500,
      "Error interno en el servidor al intentar listar al usuario."
    );
    next(error);
  }
};

// VER UN USUARIO POR SU ID (GET)
export const getUserByID = async (req, res, next) => {
  const { id } = req.params; //Desestructuro el id de los req.params

  try {
    const user = await UserModel.findByID(id); // Utilizo el UserModel
    if (!user) throw createError(404, "No se encontro al usuario solicitado.");

    res.status(200).json(user);
  } catch (err) {
    console.log(err);
    if (err.status) return next(err);
    const error = createError(
      500,
      "Error interno en el servidor al intentar listar al usuario."
    );
    next(error);
  }
};

export const getUserByField = async (req, res, next) => {
  try {
    const user = await UserModel.findOne(req.query);
    res.status(200).json({ user });
  } catch (err) {
    console.log(err);
    if (err.status) return next(err);
    const error = createError(
      500,
      "Error interno en el servidor al intentar encontrar al usuario."
    );
    next(error);
  }
};

export const getUsersBySearch = async (req, res, next) => {
  try {
    const users = await UserModel.findAllBySearch(req.query);

    if (!users || users.length === 0) {
      return next(
        createError(404, "No se encontraron usuarios con esos criterios")
      );
    }

    res.status(200).json(users);
  } catch (err) {
    console.log("Error en getUsersBySearch:", err.message);
    next(createError(500, "Error interno al intentar buscar usuarios"));
  }
};

//CREAR UN USUARIO

export const createUser = async (req, res, next) => {
  try {
    const user = await createUserService(req.body);
    res.status(201).json({ message: "Usuario creado con éxito.", user });
  } catch (err) {
    console.log(err);

    if (err.status) return next(err);
    const error = createError(
      500,
      "Error interno en el servidor al intentar listar al usuario."
    );
    next(error);
  }
};

//MODIFICAR UN USUARIO
export const updateUser = async (req, res, next) => {
  try {
    console.log("DATOS DEL BODY FILTRADOS POR SCHEMA", req.body);
    console.log(req.params.id);

    const updateUser = await UserModel.updatePartial(req.params.id, req.body);
    res
      .status(200)
      .json({ message: "Usuario modificado correctamente", user: updateUser });
  } catch (err) {
    console.log(err);
    if (err.status) return next(err);
    const error = createError(
      500,
      "Error interno en el servidor al intentar ACTUALIZAR al usuario."
    );
    next(error);
  }
};

//BORRAR UN USARIO

export const deleteUser = async (req, res, next) => {
  try {
    await UserModel.deleteUser(req.params.id);

    return res.sendStatus(204);
  } catch (err) {
    console.log("Error en deleteUser controller:", err);

    if (err.status) return next(err);

    next(
      createError(
        500,
        "Error interno en el servidor al intentar eliminar al usuario."
      )
    );
  }
};

// AUTH PROCESS DE USUARIO - VERIFICAR UN USUARIO (DESPUES DE CREARLO)

export const verifyUser = async (req, res, next) => {
  const { id, code } = req.query;
  try {
    const result = await verifyUserService(id, code);

    if (!result)
      throw createError(
        400,
        "No se pudo verificar la cuenta, vuelva a intentarlo."
      );
    res.status(200).json({ message: "Cuenta verificada con éxito!" });
  } catch (err) {
    console.log(err);

    if (err.status) return next(err);
    const error = createError(
      500,
      "Error interno en el servidor al intentar verificar al usuario."
    );
    next(error);
  }
};

//LOGUEAR UN USUARIO
export const loginUser = async (req, res, next) => {
  const { email, password } = req.body;
  try {
    const user = await UserModel.findOne({ email });

    //Antes de loguear un usuario debo asegurarme que otro usuario no este logueado.

    // Primer paso: Validar los datos del usuario
    if (!user) throw createError(400, "El email ingresado es incorrecto");
    if (!user.emailVerificado)
      //En la bd arranca null.
      throw createError(400, "La cuenta no está verificada");
    const matchPassword = await compareStringHash(password, user.password); //user.password es el user que tengo en la bd con ese email.
    if (!matchPassword) throw createError(400, "Contraseña incorrecta");

    //Si esta todo OK

    const { idUsuario, nombre, apellido, idRol } = user;
    //Segundo Paso: Crear un token en base a los datos del usuario (no sensibles)
    const token = await crearTokenDeAcceso({
      idUsuario,
      nombre,
      apellido,
      email,
      idRol,
    });
    res.cookie("token", token, {
      httpOnly: true, // Este valor establece que la cookie solo sea accesible por el servidor.
      secure: false, // Cuando este valor esta en true la cookie solo se envia sobre https
      maxAge: 86400000, // Tiempo vida cookie en ms.
    });

    res.status(200).json({
      message: "Usuario logueado",
      user: { idUsuario, nombre, apellido, email, idRol },
    });
  } catch (err) {
    console.log(err);

    if (err.status) return next(err);
    const error = createError(
      500,
      "Error interno en el servidor al intentar verificar al usuario."
    );
    next(error);
  }
};

//DESLOGUEAR UN USUARIO

export const logOut = async (req, res) => {
  res.clearCookie("token");
  res.sendStatus(204);
};

/* 
  // CAMBIO DE PASSWORD POR PARTE DE LOS USUARIOS
  */

// Enviar codigo de recuperacion al email

export const forgotPassword = async (req, res, next) => {
  try {
    // Si el usuario esta logueado NO debe usar este endpoint.
    if (req.user) {
      throw createError(
        403,
        "Ya estás logueado. Para cambiar tu contraseña ve a tu perfil."
      );
    }

    const { email } = req.body;

    const result = await requestPasswordReset(email);

    res.status(200).json(result);
  } catch (err) {
    if (err.status) return next(err);
    next(createError(500, "Error al solicitar el codigo de recuperacion."));
  }
};

//Resetear contraseña con código

export const resetPasswordController = async (req, res, next) => {
  try {
    if (req.user) {
      // Si el usuario esta logueado NO debe usar este endpoint (por eso usamos el tryAuth, ya que deja req.user con data o null, si existe es que esta logueado)
      throw createError(
        403,
        "Ya estás logueado. Para cambiar tu contraseña ve a tu perfil."
      );
    }

    const { email, code, newPassword, newPasswordConfirm } = req.body;

    const result = await resetPassword(
      email,
      code,
      newPassword,
      newPasswordConfirm
    );

    res.status(200).json(result);
  } catch (err) {
    if (err.status) return next(err);
    next(createError(500, "Error al intentar restablecer la contraseña."));
  }
};

//CAMBIAR PASSWORD (ESTANDO LOGUEADO)

// CONTROLADOR: Cambiar contraseña estando logueado
export const changePasswordLogged = async (req, res, next) => {
  try {
    const idUsuario = req.user.idUsuario; // viene del token
    const { currentPassword, newPassword } = req.body;

    const result = await changePasswordLoggedService(
      idUsuario,
      currentPassword,
      newPassword
    );

    // Cerrar sesion despues del cambio
    res.clearCookie("token");

    res.status(200).json(result);
  } catch (err) {
    if (err.status) return next(err);
    next(createError(500, "Error al cambiar la contraseña."));
  }
};
