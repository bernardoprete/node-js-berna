//LOGICA DE LA APP

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
  console.log(limit);
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

// CREAR UN USUARIO (POST)

export const postUsuario = async (req, res) => {
  const { nombre, edad } = req.body;
  try {
    const listadoUsuarios = JSON.parse(
      await fs.readFile(pathArchivoUsuarios, "utf8")
    );
    const nuevoUsuario = { nombre, edad };
    /* 
      const nuevoUsuario = {nombre: nombre, edad: edad}
    */
    listadoUsuarios.push(nuevoUsuario);

    await fs.writeFile(
      pathArchivoUsuarios,
      JSON.stringify(listadoUsuarios, null, 2)
    );

    res.status(200);
    res.send(nuevoUsuario); // Modo en 2 lineas con res.send
  } catch (error) {
    res.status(500).json(error.message); // En una linea envio el send y el status.
  }
};

// MODIFICAR UN USUARIO (PUT)

export const putUsuario = async (req, res) => {
  const id = req.params.id;
  const modificaciones = req.body;
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
      rol,
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

    const usuario = listadoUsuarios.find((usuario) => usuario.email === email); //Buscamso con find que nos devuelve el objeto si algun mail coincide con el email ingresado por el usuario (o username).
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

//USUARIO YA LOGUEADO ENTRA A LA APP
export const verificarUsuarioLogeado = async (req, res) => {
  // extraer el token de la cookie. * Para poder acceder a una cookie necesito parsear.
  const { token } = req.cookies; // es igual a const token = req.cookies.token

  if (!token) res.status(401).json({ message: "El usuario no está logeado" }); // Si no hay token respondemos un estado 401 Unauthorized.
  //Si hay token: Hay que verificar si el token es valido..
  jwt.verify(token, JWT_SECRET, (err, data) => {
    if (err) {
      throw new Error("Error: token invalido.");
    }
    res.status(200).json(data); // La data tiene la info del usuario (rol, nombre, id)
  });
};
