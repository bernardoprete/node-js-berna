import { createError } from "../utils/utils.js";
import {
  addCartItemService,
  clearCartItemsService,
  findItemsInCartService,
  removeItemInCartService,
  updateCartItemService,
} from "../services/cart.service.js";
import { CartProductsDetailsModel } from "../models/cartProductsDetails.model.js";
import { CartModel } from "../models/cart.model.js";

/* EL controlador se conecta a ambos modelos (cartModel y CartProdcutDetailsModel) directamente pero tambien se conecta por medio del cart.service - El controlador recibe la info ejecuta el metodo (ya sea que provenga de algun modelo o del servicio) y da respuesta. NO APLICA LOGICA  */

// Este metodo permite obtener el  carrito completo del usuario (con productos).
export const getCart = async (req, res, next) => {
  const { idUsuario } = req.user;
  try {
    //Buscar el carrito del usuario
    const carrito = await CartModel.findOne({ idUsuario });
    if (!carrito)
      throw createError(404, "El usuario no posee un carrito activo.");

    // Traer los productos de ese carrito con el metodo findItemsInCart (se le pasa un objeto por parametro de busqueda)
    const productos = await findItemsInCartService(carrito.idCarrito);

    // Devolver todo junto
    res.status(200).json({
      carrito,
      productos, //Array con los productos que salen de la respuesta del metodo findItemsInCart.
    });
  } catch (err) {
    console.log(err);
    if (err.status) return next(err);
    next(createError(500, "Error interno al intentar obtener el carrito."));
  }
};

// Agregar producto al carrito
export const addCartItem = async (req, res, next) => {
  const { idUsuario } = req.user;
  const { idProducto, cantidad } = req.body;

  if (isNaN(parseInt(cantidad)))
    throw createError(400, "La cantidad debe ser un valor numerico.");

  try {
    //Delegamos toda la lógica al service para poder agregar un producto al carrito
    const carritoActualizado = await addCartItemService(
      idUsuario,
      idProducto,
      parseInt(cantidad)
    );

    //Devolvemos el carrito con sus productos
    res.status(200).json(carritoActualizado);
  } catch (err) {
    console.log(err);
    if (err.status) return next(err);
    next(
      createError(
        500,
        "Error interno al intentar agregar el producto al carrito."
      )
    );
  }
};

export const updateCartItem = async (req, res, next) => {
  const { idUsuario } = req.user;
  const { idProducto, cantidad } = req.body;
  try {
    const result = await updateCartItemService(idUsuario, idProducto, cantidad);
    res.status(200).json(result);
  } catch (error) {
    console.log(err);
    if (err.status) return next(err);
    next(
      createError(
        500,
        "Error interno al intentar modificar el producto en el carrito."
      )
    );
  }
};

//CONTROLADOR PARA ELIMINAR UN PRODUCTO DEL CARRITO.

export const removeCartItem = async (req, res, next) => {
  const { idUsuario } = req.user; // Del token obtenemos el idUsuario.
  const { idProducto } = req.body; // Del body obtenemos el idProducto que queremos eliminar.

  try {
    const result = await removeItemInCartService(idUsuario, idProducto); // Llamamos al servicio que maneja toda la logica.

    //  Si el servicio responde correctamente, devolvemos su mensaje de éxito.
    res.status(200).json(result);
  } catch (error) {
    if (error.status) return next(error);
    next(
      createError(
        500,
        "Error interno al intentar eliminar el producto en el carrito."
      )
    );
  }
};

//CONTROLADOR PARA ELIMINAR TODOS LOS PRODUCTOS DEL CARRITO.

export const clearCart = async (req, res, next) => {
  const { idUsuario } = req.user; // Del token obtenemos el idUsuario.

  try {
    const result = await clearCartItemsService(idUsuario); // Llamamos al servicio que maneja toda la logica para borrar todos los productos del carrito.
    //  Si el servicio responde correctamente, devolvemos su mensaje de éxito.
    res.status(200).json(result);
  } catch (error) {
    if (error.status) return next(error);
    next(createError(500, "Error interno al intentar vaciar el carrito."));
  }
};
