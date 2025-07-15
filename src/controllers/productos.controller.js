//LOGICA DE PRODUCTOS

import fs from "fs/promises";
import url from "url";
import path from "path";

// ruta robusta

const __filename = url.fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const pathArchivoProductos = path.join(
  __dirname,
  "..",
  "data",
  "productos.json"
); //Nueva manera de unir las rutas con express.

// Funciones
//OBTENER- VER PRODUCTOS (GET)
export const getProducto = async (req, res) => {
  //Modifique el ejm y ahora tiene un limit si el usuario asi lo desea.
  const limit = req.query.limit; //Esta variable se consigue capturando en la ruta los query params ?limit=2 por ejm
  console.log(limit);
  let listadoProdcutos; // Inicialmente la dejo vacia

  try {
    const contenidoJSON = JSON.parse(
      await fs.readFile(pathArchivoProductos, "utf8")
    );
    if (limit) {
      listadoProdcutos = contenidoJSON.slice(0, limit);
    } else {
      listadoProdcutos = contenidoJSON;
    }

    res.status(200).json(listadoProdcutos);
  } catch (error) {
    console.error(error);
    if (error.code === "ENOENT") {
      res.status(404).json({ message: "Error: archivo no encontrado" });
    } else {
      res.status(500).json({ message: "Error al leer los usuarios" });
    }
  }
};

// BUSCAR UN USUARIO PRODUCTO (POR ID - GET)

export const findProducto = async (req, res) => {
  const id = req.params.id;
  try {
    const contenidoJSON = await fs.readFile(pathArchivoProductos, "utf8");
    const contenidoArchivoJs = JSON.parse(contenidoJSON);

    const busquedaProducto = contenidoArchivoJs.find(
      (producto) => producto.id == id
    );

    if (busquedaProducto) {
      res.status(200).json(busquedaProducto);
    } else {
      throw new Error("Producto no encontrado");
    }
  } catch (error) {
    res.status(404).json(error.message);
  }
};

// CREAR UN PRODUCTO (POST)

export const postProducto = async (req, res) => {
  const { id, nombre, categoria, precio, stock } = req.body;
  try {
    const listadoProdcutos = JSON.parse(
      await fs.readFile(pathArchivoProductos, "utf8")
    );

    const nuevoProducto = { id, nombre, categoria, precio, stock };
    /* 
      const nuevoProducto = {nombre: nombre, categoria: cateogria, precio: precio, stock: stock...}
    */

    const productoExistente = listadoProdcutos.find(
      (producto) => producto.id == id
    );

    if (productoExistente) {
      throw new Error("El Id ingresado ya corresponde a un producto existente");
    }

    listadoProdcutos.push(nuevoProducto);

    await fs.writeFile(
      pathArchivoProductos,
      JSON.stringify(listadoProdcutos, null, 2)
    );

    res.status(200);
    res.send(nuevoProducto); // Modo en 2 lineas con res.send
  } catch (error) {
    res.status(500).json(error.message); // En una linea envio el send y el status.
  }
};

// MODIFICAR UN PRODUCTO (PUT)

export const putProducto = async (req, res) => {
  const id = req.params.id;
  const modificaciones = req.body;
  try {
    const listadoProdcutos = JSON.parse(
      await fs.readFile(pathArchivoProductos, "utf8")
    );

    const productoSolicitado = listadoProdcutos.find(
      (producto) => producto.id == id
    );

    if (!productoSolicitado) {
      throw new Error("Producto no encontrado en la base de datos");
    }

    const productoModificado = { ...productoSolicitado, ...modificaciones };
    const posicionProducto = listadoProdcutos.findIndex(
      (producto) => producto.id == id
    );
    listadoProdcutos[posicionProducto] = productoModificado;

    await fs.writeFile(
      pathArchivoProductos,
      JSON.stringify(listadoProdcutos),
      "utf8"
    );

    res.status(200).json(productoModificado);
  } catch (error) {
    res.status(404).json({ message: error.message });
  }
};

// BORRAR UN PRODUCTO (DELETE)
export const deleteProducto = async (req, res) => {
  const id = req.params.id;
  try {
    const listadoProdcutos = JSON.parse(
      await fs.readFile(pathArchivoProductos, "utf8")
    );

    const indiceProductoBorrable = listadoProdcutos.findIndex(
      (producto) => producto.id == id
    );

    if (indiceProductoBorrable === -1) {
      throw new Error("Producto no encontrado en la base de datos");
    } else {
      listadoProdcutos.splice(indiceProductoBorrable, 1);
      await fs.writeFile(
        pathArchivoProductos,
        JSON.stringify(listadoProdcutos),
        "utf8"
      );
      res.status(200).json({ message: "Producto eliminado correctamente" });
    }
  } catch (error) {
    res.status(404).json(error);
  }
};
