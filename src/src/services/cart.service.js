import { CartModel } from "../models/cart.model.js";
import { ProductModel } from "../models/product.model.js";
import { createError } from "../utils/utils.js";

export const addCartItemService = async (idUsuario, idProducto, cantidad) => {
  try {
    const carritoExistente = await CartModel.findOne({ idUsuario });
    //Cheuqeamos si el user posee un carrito o no lo posee (y lo creamos sino lo tiene)
    if (!carritoExistente) {
      const idCarrito = await CartModel.create(idUsuario);
    } else {
      const idCarrito = carritoExistente.idCarrito;
    }

    //Busqueda del producto que se quiere agregar.

    const product = await ProductModel.findByID(idProducto);
    if (!product) throw createError(400, "No se encontro el producto");

    
  } catch (error) {}
};
