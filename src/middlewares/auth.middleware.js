import { verificarTokenDeAcceso } from "../libs/jwt.js";

export const authRequired = async (req, res, next) => {
  // PARA REALIZAR ACCIONES TENGO QUE ESTAR SI O SI LOGUEADO Y MANTENERME LOGUEADO O EN SESION
  // extraer el token de la cookie. * Para poder acceder a una cookie necesito parsear.
  const { token } = req.cookies;

  if (!token) {
    const err = new Error();
    err.status = 401;
    err.message = "Token inexistente - El usuario no está logueado";
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

export const adminRequired = (req, res, next) => {
  //PARA REALIZAR CIERTAS ACCIONES SI O SI TENGO QUE SER ADMIN.
  const { idRol } = req.user;
  if (idRol !== 2) {
    const err = new Error("Usuario no autorizado para realizar esta acción.");
    err.status = 403;
    return next(err);
  }
  next();
};

//Middleware opcional: intenta autenticar pero NO bloquea si falla y por eso nos queda el token = null (no logueado) o con la data del user(logueado)
export const tryAuth = async (req, res, next) => {
  const { token } = req.cookies;

  // Si no hay token quier decir que  no está logueado
  if (!token) {
    req.user = null;
    return next();
  } //De lo contrario, si hay token y esta logueado intenta verificar el token.
  try {
    const data = await verificarTokenDeAcceso(token);

    // Si el token es valido, req.user tendra la info del usuario
    req.user = data;
    next();
  } catch (error) {
    // SI EL TOKEN ES INVALIDO, lo tratamos como usuario no logueado siendo req.user = null.
    req.user = null;
    next();
  }
};
