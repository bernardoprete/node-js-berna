import { createError } from "../utils/utils.js";
import { addCartItemService } from "../services/cart.service.js";
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
    const productos = await CartProductsDetailsModel.findItemsInCart({ idCarrito: carrito.idCarrito });

    // Devolver todo junto
    res.status(200).json({
      idCarrito: carrito.idCarrito,
      idUsuario,
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

  try {
    //Delegamos toda la lógica al service para poder agregar un producto al carrito
    const carritoActualizado = await addCartItemService(idUsuario, idProducto, cantidad);

    //Devolvemos el carrito con sus productos
    res.status(200).json(carritoActualizado);
  } catch (err) {
    console.log(err);
    if (err.status) return next(err);
    next(createError(500, "Error interno al intentar agregar el producto al carrito."));
  }
};
