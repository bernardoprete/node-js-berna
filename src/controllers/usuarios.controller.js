//LOGICA DE LA APP - VAMOS  A HACER UN PEQUEÑO CAMBIO EN EL TITULO DE ESTE ARCHIVO DE VSC CODE.

import fs from "fs/promises";
import url from "url";
import path from "path";

const JWT_SECRET = "miapp2025+";

import bcrypt from "bcryptjs";
import { crearTokenDeAcceso } from "../libs/jwt.js";
import jwt from "jsonwebtoken";

// ruta robusta

const __filename = url.fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const pathArchivoUsuarios = path.join(__dirname, "..", "data", "usuarios.json"); //Nueva manera de unir las rutas con express.

// Funciones

//VER USUARIOS (GET)
export const getUsuarios = async (req, res, next) => {
  const limit = req.query.limit;

  let listadoUsuarios; // Inicialmente la dejo vacia

  try {
    const contenidoJSON = JSON.parse(
      await fs.readFile(pathArchivoUsuarios, "utf8")
    );
    if (limit) {
      listadoUsuarios = contenidoJSON.slice(0, limit);
    } else {
      listadoUsuarios = contenidoJSON;
    }

    res.status(200).json(listadoUsuarios);
  } catch (error) {
    console.error(error);
    if (error.code === "ENOENT") {
      const error = new Error("Error: archivo no encontrado");
      error.status = 404;
      next(error);
      //  res.status(404).json({ message: "Error: archivo no encontrado" });
    } else {
      res.status(500).json({ message: "Error al leer los usuarios" });
    }
  }
};
//BUSCAR USUARIOS POR ID (GET)
export const findUsuario = async (req, res) => {
  const id = req.params.id;
  try {
    const contenidoJSON = await fs.readFile(pathArchivoUsuarios, "utf8");
    const contenidoArchivoJs = JSON.parse(contenidoJSON);

    const busquedaUsuario = contenidoArchivoJs.find(
      (usuario) => usuario.id == id
    );

    if (busquedaUsuario) {
      res.status(200).json(busquedaUsuario);
    } else {
      throw new Error("Usuario no encontrado");
    }
  } catch (error) {
    res.status(404).json(error.message);
  }
};

// CREAR UN USUARIO (POST) LO deberia crear solo el administrador en el panel de administracion.

export const crearUsuarioComoAdmin = async (req, res) => {
  const { nombre, edad, email, password, rol } = req.body;

  try {
    //Validar el rol que me llega en body - Solo puede ser user o admin
    const rolValido = rol === "usuario" || rol === "admin";

    if (!rolValido) {
      return res.status(400).json({ message: "Rol inválido" });
    }

    const listadoUsuarios = JSON.parse(
      await fs.readFile(pathArchivoUsuarios, "utf8")
    );

    const usuarioExistente = listadoUsuarios.find(
      (usuario) => usuario.email === email
    );
    if (usuarioExistente)
      return res //Uso el return para cortar y mandar el mensaje
        .status(400)
        .json({ message: "El email ingresado ya se encuentra registrado." }); //Todo esto es en una linea por eso el if esta sin llave

    // Si el usuario no existe passamos a hashear la contraseña para incorporarla a la bd o en este caso al archivo pero hasheada.                                                                                                                                           iste hay que hashear la password - IMPORTANTE
    const hashPassword = await bcrypt.hash(password, 10); //USAMOS BCRYPT

    const nuevoUsuario = {
      //Cada propiedad son las constantes que cree arriba (linea 160) con la desestructuracion.
      id: Math.random() * 1000 + 1, // La BD lo pone de manera automatica.
      nombre,
      edad,
      email,
      password: hashPassword, // Me llega por el body.req pero la hasheo.
      rol: rol, //Ya esta validado previamente
    };

    /* 
      const nuevoUsuario = {nombre: nombre, edad: edad}
    */

    listadoUsuarios.push(nuevoUsuario);
    //Aqui paso la lista de usuarios (array de objetos) a JSON nuevamente y lo "pego" en el archivo
    await fs.writeFile(
      pathArchivoUsuarios,
      JSON.stringify(listadoUsuarios, null, 2)
    );

    res.status(200).json(nuevoUsuario); //Doy como respuesta el nuevo usuario
  } catch (error) {
    res.status(500).json(error.message); // En una linea envio el send y el status.
  }
};

// MODIFICAR UN USUARIO SIENDO ADMIN(PUT) -

export const putUsuarioComoAdmin = async (req, res) => {
  const id = req.params.id;
  const modificaciones = { ...req.body }; //IMP - Ahora tengo la copia del objeto req.body (lo hago para no modificar el objeto original y trabajar con mas seguridad)

  try {
    const listaUsuarios = JSON.parse(
      await fs.readFile(pathArchivoUsuarios, "utf8")
    );

    const usuarioSolicitado = listaUsuarios.find((usuario) => usuario.id == id);

    if (!usuarioSolicitado) {
      throw new Error("Usuario no encontrado en la base de datos");
    }

    const usuarioModificado = { ...usuarioSolicitado, ...modificaciones };
    const posicionUsuario = listaUsuarios.findIndex(
      (usuario) => usuario.id == id
    );
    listaUsuarios[posicionUsuario] = usuarioModificado;

    await fs.writeFile(
      pathArchivoUsuarios,
      JSON.stringify(listaUsuarios),
      "utf8"
    );

    res.status(200).json(usuarioModificado);
  } catch (error) {
    res.status(404).json({ message: error.message });
  }
};

// BORRAR UN USUARIO (DELETE)
export const deleteUsuario = async (req, res) => {
  const id = req.params.id;
  try {
    const listadoUsuarios = JSON.parse(
      await fs.readFile(pathArchivoUsuarios, "utf8")
    );

    const indiceUsuarioBorrable = listadoUsuarios.findIndex(
      (usuario) => usuario.id == id
    );

    if (indiceUsuarioBorrable === -1) {
      throw new Error("Usuario no encontrado en la base de datos");
    } else {
      listadoUsuarios.splice(indiceUsuarioBorrable, 1);
      await fs.writeFile(
        pathArchivoUsuarios,
        JSON.stringify(listadoUsuarios),
        "utf8"
      );
      res.status(200).json({ message: "Usuario eliminado correctamente" });
    }
  } catch (error) {
    res.status(404).json(error);
  }
};

// REGISTRAR UN USUARIO
export const registrarUsuario = async (req, res) => {
  const { nombre, edad, email, password, rol } = req.body; // desestructuracion. Aca esta la info que me llega del body de la request.
  try {
    // verificar que el campo que utilizamos para identificar al usuario, no exista en la BD
    //Es decir que no exista el nombre de usuario o mail con el que se identifica. (En este caso el MAIL)
    const listadoUsuarios = JSON.parse(
      await fs.readFile(pathArchivoUsuarios, "utf8")
    );
    const usuarioExistente = listadoUsuarios.find(
      (usuario) => usuario.email == email
    );
    if (usuarioExistente)
      return res //Uso el return para cortar y mandar el mensaje
        .status(400)
        .json({ message: "El email ingresado ya se encuentra registrado." }); //Todo esto es en una linea por eso el if esta sin llave

    // Si el usuario no existe passamos a hashear la contraseña para incorporarla a la bd o en este caso al archivo pero hasheada.                                                                                                                                           iste hay que hashear la password - IMPORTANTE
    const hashPassword = await bcrypt.hash(password, 10); //USAMOS BCRYPT
    const nuevoUsuario = {
      //Cada propiedad son las constantes que cree arriba (linea 160) con la desestructuracion.
      id: Math.random() * 1000 + 1, // La BD lo pone de manera automatica.
      nombre,
      edad,
      email,
      password: hashPassword, // Me llega por el body.req pero la hasheo.
      rol: "usuario",
    };

    listadoUsuarios.push(nuevoUsuario);
    //Aqui paso la lista de usuarios (array de objetos) a JSON nuevamente y lo "pego" en el archivo
    await fs.writeFile(
      pathArchivoUsuarios,
      JSON.stringify(listadoUsuarios, null, 2)
    );

    res.status(200).json(nuevoUsuario); //Doy como respuesta el nuevo usuario
  } catch (error) {
    res.status(500).json(error.message);
  }
};

//LOGUEAR UN USUARIO
export const loginUsuario = async (req, res) => {
  const { email, password } = req.body; // Desestructuracion. // IMPORTANTE saber que el email y el password son los que ingresa el usuario, no tienen anda que ver a los hwchosen la funcion hecha arriba , el password es plano y debe ser hasheado para comparar.

  try {
    const listadoUsuarios = JSON.parse(
      await fs.readFile(pathArchivoUsuarios, "utf8") // Parseamos la lista de usuarios a array de objetos y la leemos.
    );

    const usuario = listadoUsuarios.find((usuario) => usuario.email === email); //Buscamos con find que nos devuelve el objeto si algun mail coincide con el email ingresado por el usuario (o username).
    if (!usuario) return res.status(400).json({ message: "Email incorrecto." }); // Si el mail del usuario (podria ser tambien en otro caso el username) NO  esta en la bd o en la lista , damos la respuesta en JSON y cortamos con return.
    // SI EXISTE USUARIO EN LA BD O ARCHIVO:
    // a través de bcrypt es comparar las password (password plano + hash )
    // bcrypt hashea la password plana, y la compara con la de la BD(ya está hashada) IMPORTANTE
    const passValida = await bcrypt.compare(password, usuario.password); // el compare devuelve un TRUE o FALSE.
    if (!passValida)
      // Digo, si es false:
      return res.status(400).json({ message: "Password incorrecto." });
    //Si es true, LO QUE HAGO ES PREPARAR la información que va a incluirse dentro del JWT (el token).

    const { id, nombre, rol } = usuario; // Desestructuro nuevamente //  CREO EN VERDAD 3 VARIABLES NUEVAS QUE SACO DEL USUARIO EXISTENTE :const id = usuario.id; const nombre = usuario.nombre; const rol = usuario.rol;

    const data = { id, nombre, rol }; // CREO un nuevo objeto con 3 propiedades PARA GENERAR EL JWT (el token) ES IMPORTANTE SABER QUE ESTOS OBJETOS SE LLENAN CON LOS DATOS DE LAS VARIABLES CREADAS ARRIBA Y NO ESTAN VACIOS, ENTONCES ID = ID DEL USUARIO POR EJM Y ASI SUCESAIVAMENTE. (No almacenar datos sensibles)
    // login exitoso.
    // debemos crear el token para poder validar en futuras peticiones que el usuario está logeado.
    // en data no debemos almacenar datos 'sensibles'
    const token = await crearTokenDeAcceso(data); // FUNCION QUE IMPORTO DE LA CARPETA LIBS/JWT.JS (IMPORTADO PARTE SUPERIOR) y le paso data como parametro.
    res.cookie("token", token); // Esta línea crea una cookie en el navegador del usuario llamada "token" y le asigna como valor el JWT que generamos. Así, en cada request futura, el navegador envía automáticamente esa cookie al servidor.
    res.status(200).json(data); // Respuesta con la data en JSON.
  } catch (error) {
    res.status(500).json(error.message);
  }
};

// USUARIO YA LOGUEADO SALE DE LA APP
export const logoutUsuario = async (req, res) => {
  res.clearCookie("token"); // Se borra la cookie porque el usuario toca "cerrar sesion" entonces la proxima vez que quiera ingresar debera autenticarse otra vez.
  return res.sendStatus(200);
};

//USUARIO YA LOGUEADO ENTRA A LA APP - Es cuando cerras el navegador y volves a abrilo sin cerrar sesion - Previamente pasa por el middleware que se fija si el token es valido y luego llega aca donde verificamos si ese token valido es de algun integrante del listado en la bd, lo hacemos mediante el id. Es para tenber mas seguridad.
export const verificarUsuarioLogeado = async (req, res) => {
  const { id, nombre, rol } = req.user;
  // Una vez que el middleware de authRequired confirma que hay token y le asigna la data a una propiedad dentro de la peticion entonces:
  // ..Hay que capturar esos datos que el middleware lleno con info del usuario mediante req.es como hice arriba y luego ver si ese ID que tengo es de algun usuario que deberia estar en la BD. (LO NORMAL ES QUE ESTE EN LA BD)
  //Entonces:
  try {
    const listadoUsuarios = JSON.parse(
      await fs.readFile(pathArchivoUsuarios, "utf8")
    );
    const usuarioValido = listadoUsuarios.find((usuario) => usuario.id === id);
    if (!usuarioValido)
      res
        .status(401)
        .json({ message: "El usuario no está registrado en nuestra BD." });
    // Si esta registrado entonces :
    res.status(200).json({ id: id, nombre: nombre, rol: rol }); // respondemos con un objeto
  } catch (error) {
    console.log(error);
    if (error.name == "TokenExpiredError") {
      return res
        .status(401)
        .json({ message: "No autorizado, el token ha expirado." });
    } else if (error.name == "JsonWebTokenError") {
      return res
        .status(401)
        .json({ message: "No autorizado, el token no es válido." });
    } else if (error.name == "NotBeforeError") {
      return res
        .status(401)
        .json({ message: "No autorizado, el token aún no es válido." });
    }
    res.status(500).json(error.message);
  }
};


// CAMBIAR PASSWORD SIENDO USUARIO
export const modificarPassword = async (req, res) => {
  const { password, nuevapassword } = req.body; 
  const { id } = req.user; // viene del token

  try {
    const listadoUsuarios = JSON.parse(
      await fs.readFile(pathArchivoUsuarios, "utf8")
    );

    // Buscar al usuario logueado
    const usuarioValido = listadoUsuarios.find((usuario) => usuario.id === id);
    if (!usuarioValido) {
      return res.status(404).json({ message: "Usuario no encontrado." });
    }

    // Comparar la contraseña actual ingresada con la guardada (hash)
    const passValida = await bcrypt.compare(password, usuarioValido.password);
    if (!passValida) {
      return res.status(400).json({ message: "Password incorrecto." });
    }

    // Hashear la nueva contraseña y guardarla
    const hashPassword = await bcrypt.hash(nuevapassword, 10);
    usuarioValido.password = hashPassword;

    await fs.writeFile(
      pathArchivoUsuarios,
      JSON.stringify(listadoUsuarios, null, 2)
    );

    // Renovar token (opcional)
    const { nombre, rol } = usuarioValido;
    const data = { id, nombre, rol };
    const token = await crearTokenDeAcceso(data);
    res.cookie("token", token);

    res.status(200).json({ message: "Contraseña modificada con éxito." });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

