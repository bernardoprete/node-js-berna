//LOGICA DE USUARIOS

import fs from "fs/promises";
import url from "url";
import path from "path";

// ruta robusta

const __filename = url.fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const pathArchivoUsuarios = path.join(__dirname, "..", "data", "usuarios.json"); //Nueva manera de unir las rutas con express.

// Funciones
//OBTENER- VER USUARIOS (GET)
export const getUsuarios = async (req, res) => {
  //Modifique el ejm y ahora tiene un limit si el usuario asi lo desea.
  const limit = req.query.limit; //Esta variable se consigue capturando en la ruta los query params ?limit=2 por ejm
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
      res.status(404).json({ message: "Error: archivo no encontrado" });
    } else {
      res.status(500).json({ message: "Error al leer los usuarios" });
    }
  }
};

// BUSCAR UN USUARIO PARTCULAR (POR ID - GET)

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
      res.status(404).json({ message: error.message });
    }
  } catch (error) {
    res.status(404).json(error);
  }
};
