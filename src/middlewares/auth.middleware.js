import { verificarTokenDeAcceso } from "../libs/jwt.js";

export const authRequired = async (req, res, next) => { // PARA REALIZAR ACCIONES TENGO QEU ESTAR SI O SI LOGEADO
  // extraer el token de la cookie. * Para poder acceder a una cookie necesito parsear.
  const { token } = req.cookies;

  if (!token) {
    const err = new Error();
    err.status = 401;
    err.message = "Token inexistente - El usuario no está logeado";
    next(err);
  }
  try {
    const data = await verificarTokenDeAcceso(token);
    // si el token es válido, asignamos la data a una propiedad dentro de la petición.
    req.user = data;
    next();
  } catch (error) {
    const err = new Error();
    err.status = 403;
    err.message = "Token no válido.";
    next(err);
  }
};

export const adminRequired = async (req, res, next) => {
  const { rol } = req.user;
  if (rol != "admin") {
    const err = new Error();
    err.status = 403;
    err.message = "Usuario no autorizado para realizar esta acción.";
    return next(err);
  }

  next();
};
