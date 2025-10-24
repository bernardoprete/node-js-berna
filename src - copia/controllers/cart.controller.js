import { CartModel } from "../models/cart.model.js";
import { createError } from "../utils/utils.js";

// METODO PARA ENCONTRAR UN PRODUCTO BUSCANDOLO POR ID
export const getCart = async (req, res, next) => {
  const { idUsuario } = req.user; //Es un objeto con varias props, entre ellas idUsuario.
  try {
    const carrito = await CartModel.findOne({ idUsuario });
    if (!carrito)
      throw createError(404, "El usuario actualmente no posee un carrito.");
    res.status(200).json(carrito);
  } catch (err) {
    console.log(err);
    if (err.status) return next(err);
    const error = createError(
      500,
      "Error interno en el servidor al intentar acceder al carrito"
    );
    next(error);
  }
};

export const addCartItem = async (req, res, next) => {
  const { idUsuario } = req.user;
  const { idProducto, cantidad } = req.body;
  try {
    const carrito = await CartModel.findOne({ idUsuario });
    if (!carrito)
      throw createError(404, "El usuario actualmente no posee un carrito.");
    res.status(200).json(carrito);
  } catch (err) {
    console.log(err);
    if (err.status) return next(err);
    const error = createError(
      500,
      "Error interno en el servidor al intentar acceder al carrito"
    );
    next(error);
  }
};
