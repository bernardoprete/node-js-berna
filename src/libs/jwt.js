import jwt from "jsonwebtoken";
const JWT_SECRET = "miapp2025+"; //Se usa para firmar el token.

export const crearTokenDeAcceso = (data) => {
  // Capturo por parametro data del llamante a esta funcion (esta en usuarios.controllers) - LOGINUSUARIO.
  return new Promise((resolve, reject) => {
    //Devuelve una promesa porque jwt.sign() no es asincrona
    jwt.sign(data, JWT_SECRET, { expiresIn: "1d" }, (err, token) => {
      //JWT.SIGN()es el que construye el token - Se pasan 3 parametros y un callback
      if (err) {
        reject(err);
      }
      resolve(token);
    });
    // si hubo error, se rechaza; si todo está bien, se resuelve con el token generado.
  });
};

export const verificarTokenDeAcceso = (token) => {
  return new Promise((resolve, reject) => {
    jwt.verify(token, JWT_SECRET, (err, data) => {
      if (err) {
        reject(err);
      }
      resolve(data);
    });
  });
};
