import { CartModel } from "../models/cart.model.js";
import { CartProductsDetailsModel} from "../models/cartProductsDetails.model.js";
import { ProductModel } from "../models/product.model.js";
import { createError } from "../utils/utils.js";

/*Este servicio une ambos modelos(cart model y cartProductDetails model) y define la lógica del negocio, es decir, cómo se comporta el carrito cuando el usuario desea  agregar un producto , desde la verificacion de si tiene un carrito o no, la creacion del carrito, la busqueda en la BD del producto que se quiere agregar y la verificacion de su existencia o no, la verificacion de si ese prodcuto existente ya esta en el carro o no (agregandolo o modificando cantidad) validacion de stock antes de agregar y finalmente mostrando el carrito  pero con los prodcutos agregados. 
Lo mismo si se desa actualizar la cantidad del carrito o eliminar productos del mismo.
Aqui vamos a trabajar con  metodos creados tanto en cartModel como en cartProdcuctsDetailsModel y hasta en prodcutModel(diferentes modelos que tenemos)que trabajan con diferentes tablas de la BD respectivamente (carrito - carritoproducto - product) */

//SERVICIO QUE TIENE LA LOGICA PARA AGREGAR UN PRODCUTO AL CARRITO.

export const addCartItemService = async (idUsuario, idProducto, cantidad) => {
  let idCarrito;
  let result;
  try {
    const carritoExistente = await CartModel.findOne({ idUsuario }); //Armamos la logica para ver si el usuario tiene o no un carrito, por eso usamos el metodo findOne que busca por idUsuario, si este devuelve algo es porque tiene un carrito.
    if (!carritoExistente) {
      //Sino hay carrito con ese idUsuario entonces lo creamos.
      idCarrito = await CartModel.create(idUsuario); //Con este metodo create creamos el nuevo carrito con los datos basicos del mismo, aqui creamos un nuevo registro en la bd carrito, es un carrito vacio y aun no agregamos ningun producto. OJOOO.
    } else {
      idCarrito = carritoExistente.idCarrito;
    }

    //Luego de crear el carrito debemos buscar el  producto que se quiere agregar, por eso usamos findById, que es un metodo de productModel (que busca por id en la tabla de producto), vamos ver entonces si en la tabla de la BD llamada producto, existe el producto.
    const product = await ProductModel.findByID(idProducto);

    if (!product) throw createError(404, "No se encontró el producto"); //Sino existe ningun producto con ese id, lanzamos un error.

    //Si existe dicho producto en la tabla producto, es decir si es un prodcuto existente entonces hay que ver como siguiente paso si  el producto ya esta agregado al carrito o no. Para eso usamos el metodo checkItemInCart que tenemos en el modelo CartProductsDetailsModel y pasandole el idProducto y Idcarrito obtenemos la info de la tabla carritoproducto.
    const itemInCart = await CartProductsDetailsModel.checkItemInCart(
      idProducto,
      idCarrito
    );

    if (!itemInCart) {
      //Si el metodo de arriba no devulve la row (es decir que el producto no esta agregado al carrito) entonces :

      //Agregamos el nuevo producto al carrito pero antes vemos el stock.
      if (cantidad > product.stock)
        throw createError(400, "Ha superado el stock disponible.");

      //AHORA SI LO AGREGAMOS
      //Seteamos la data del producto a insertar creando un objeto con esa informacion.

      const cartItem = {
        cantidad, //me llega por parametro y es la cantidad a agregar.
        precioProductoCarrito: product.precio, //La variable product creada arriba es el resutlado de : await ProductModel.findByID(idProducto) que me da un objeto con las propiedades de el producto que vamos a querer agregar, de ahi sacamos el precio.
        subtotalProductoCarrito: product.precio * cantidad, //Idem linea de arriba pero le multiplicamos por la cantidad.
        idProducto, //Llega por parametro
        idCarrito, //Llega por parametro
      };

      result = await CartProductsDetailsModel.addItem(cartItem); // Con este metodo finalmente se agrega el prodcuto al carrito.
    } else {
      //Pero si  el metodo como ya dijimos devulve la row entonces el producto ya se encuentra en el carrito, vamos a actualizarlo entonces:

      const nuevaCantidad = itemInCart.cantidad + cantidad;
      if (nuevaCantidad > product.stock)
        //Verificacion previa del stock. Recordar quela variable product es un objeto que surge del resultado de la busqueda de prodcutos en la bd.
        throw createError(400, "Ha superado el stock disponible.");
      // Seteamos la nueva cantidad y por ende el nuevo subtotal. (Necesitamso el precio para hacer el subtotal, obvio)
      const updatedData = {
        cantidad: nuevaCantidad,
        precioProductoCarrito: product.precio,
        subtotalProductoCarrito: product.precio * nuevaCantidad,
      };
      //ACTUALIZAMOS...
      result = await CartProductsDetailsModel.updatedItem(
        //Metodo del modeloCartProductsDetailsModel para actualizar un prodcuto que ya estaba en el carrito. Recibe por parametro: updateData, idProd, idCarrito. Este metodo da como resultado: result.affectedRows > 0;
        //
        updatedData,
        idProducto,
        idCarrito
      );
    }
    if (!result)
      // Sino hay filas afectadas en la bd es porque no se pudo actualizar el producto por alguna razon.
      throw createError(
        500,
        "Error en el servidor al intentar agregar el producto al carrito"
      );

    //Devolvemos el carrito actualizado y ahora con los productos que tiene dentro, esto lo logramos gracias al metodo FindItemsInCart que devuelve el carrito con todos los prodcutos adentro.
    const cart = await CartModel.findByID(idCarrito); //Obtenermos toda la info del carrito.
    const items = await findItemsInCartService(idCarrito);
    // Retornamos el carrito con sus productos actualizados
    return { cart, items };
  } catch (error) {
    console.error("Error en addCartItemService:", error);

    // Si es un error con status (creado con createError), lo relanzamos tal cual
    if (error.status) throw error;

    // Si no, lo envolvemos en un error 500 genérico
    throw createError(
      500,
      "Error interno en el servidor al procesar el carrito."
    );
  }
};

//SERVICIO QUE TIENE LA LOGICA PARA ACTUALIZAR EL CARRITO (MODIFICA CANTIDADES)

/**
 * Verifica que el producto este en el carrito, y modifica dicho producoto.
 * @param {Int} idUsuario - Id del Usuario
 * @param {Int} idProducto - Id del producto que se quiere agregar
 * @param {Int} cantidad - Cantidad de producto a modificar
 *
 * @returns {Object} - Objeto que contiene toda la info del carrito.
 */
export const updateCartItemService = async (
  idUsuario,
  idProducto,
  cantidad
) => {
  try {
    const existedCart = await CartModel.findOne({ idUsuario });
    // chequeamos si existe el carrito
    if (!existedCart) throw createError(400, "El usuario no posee un carrito.");
    //Si existe obtenemos el id de carrito.
    const { idCarrito } = existedCart;
    // verificamos si el productoa agregar existe.
    const product = await ProductModel.findByID(idProducto); //Lo buscamos por id de producto y para eso usamos el modelo de producto. IMPORTANTE.
    if (!product) throw createError(400, "El producto no existe.");
    //Si existe tambien el prodcuto a agregar entonces verificamos si el producto ya está en el carrito.
    const itemInCart = await CartProductsDetailsModel.checkItemInCart(
      //Metodo para chequear si esta un item en el carrito o no.
      idProducto,
      idCarrito
    );
    if (!itemInCart)
      //SI el producto no esta en el carrito lanzamos un error.
      throw createError(
        400,
        "El producto no se encuentra en el carrito del usuario."
      );

    // Si el prodcuto esta en el carrito entonces chequeamos que la cantidad nueva no supere el stock.
    if (cantidad > product.stock)
      throw createError(400, "El stock del producto fue superado");

    //Ahora vamos a encerrar en un objeto la nueva data que nos queda (la cantidad nueva) y sus modificaciones (el subtotal , el precio se mantiene, obvio.)
    const updatedData = {
      cantidad, //Viene por parametro y es la nueva cantidad
      precioProductoCarrito: itemInCart.precioProductoCarrito, // lo obtenemos de la variable itemInCart (que utilza el metodo checkIteminCart que nos devuelve de la tabla carritoprodcuto toda la info del prod y por ende su precio.)
      subtotalProductoCarrito: cantidad * itemInCart.precioProductoCarrito, // Modifcamos la cantidad y por ende recalculamos subtotal.
    };

    //Finalmente ...
    const result = await CartProductsDetailsModel.updatedItem(
      //Mediante este metodo aplicamos la consulta sql (update).
      updatedData,
      idProducto,
      idCarrito
    );
    if (!result)
      throw createError(
        500,
        "Ha ocurrido un error interno al intentar modificar el producto."
      );

    //Para hacerlo mas completo...

    const cart = await CartModel.findByID(idCarrito); //Obtenermos toda la info del carrito (Recordemos que es poca info y sin los prodcutos)
    const items = await findItemsInCartService(idCarrito); // Retornamos el carrito con sus productos actualizados - Aqui ya tenemos los prodcutos actualzados.
    return { cart, items }; // RETORNAMOS UN OBJETO CON LA INFO DEL CARRITO  Y SUS PRODCUTOS CON MONTO TOTAL Y CANTIDAD DE PRODUCTOS. - TODO JUNTO.
  } catch (error) {
    console.error("Error en addCartItemService:", error);

    // Si es un error con status (creado con createError), lo relanzamos tal cual
    if (error.status) throw error;

    // Si no, lo envolvemos en un error 500 genérico
    throw createError(
      500,
      "Error interno en el servidor al procesar el carrito."
    );
  }
};

/**
 * Busca y retorna todos los productos asociados a un carrito, además devuelve el monto total y el total de productos.
 * @param {Int} idCarrito - Id del Carrito
 * @returns {Object} - Objeto que contiene toda la info del carrito.
 */
export const findItemsInCartService = async (idCarrito) => {
  try {
    const products = await CartProductsDetailsModel.findItemsInCart(idCarrito);
    const total = products.reduce((acumulador, producto) => {
      const subtotal = parseFloat(producto.subtotalProductoCarrito);
      return acumulador + subtotal;
    }, 0 /* valor inicial del acumulador */);
    const totalItems = products.length;

    return { products, total: total.toFixed(2), totalItems };
  } catch (error) {
    console.error(
      "Error al intentar acceder a los productos del carrito y sus metadatos.",
      error
    );
    if (error.status) throw error;
    throw createError(
      500,
      "Error al intentar acceder a los productos del carrito y sus metadatos."
    );
  }
};

//SERVICIO QUE TIENE LA LOGICA PARA ELIMINAR UN PRODUCTO DEL CARRITO.

export const removeItemInCartService = async (idUsuario, idProducto) => {
  try {
    const existedCart = await CartModel.findOne({ idUsuario }); // Metodo que mediante el idUsuario me devuelve la fila con info del carrito (si devuelve la fila es porque existe.)
    if (!existedCart) throw createError(400, "El usuario no posee un carrito.");

    const { idCarrito } = existedCart; // Desestructuramos el idCarrito del carrito existente.

    // Verificamos si el producto está en el carrito
    const itemInCart = await CartProductsDetailsModel.checkItemInCart(
      idProducto,
      idCarrito
    );
    if (!itemInCart)
      //Sino esta.
      throw createError(
        400,
        "El producto no se encuentra en el carrito del usuario."
      );

    // Si esta entonces Ejecutamos la eliminacion
    const result = await CartProductsDetailsModel.removeItemInCart(
      //Metodo traido del modelo.
      idProducto,
      idCarrito
    );

    // Si no se eliminó nada  esto me devulve (affectedRows = 0)
    if (!result)
      throw createError(
        500,
        "Ha ocurrido un error interno al intentar eliminar el producto."
      );

    // Si todo sale bien, devolvemos mensaje de éxito
    return { message: "Producto eliminado del carrito correctamente." };
  } catch (error) {
    if (error.status) throw error;
    throw createError(
      500,
      "Error al intentar eliminar el producto del carrito."
    );
  }
};

//SERVICIO QUE TIENE LA LOGICA PARA BORRAR TODOS LOS PRODUCTOS DEL CARRITO.

export const clearCartItemsService = async (idUsuario) => {
  const existedCart = await CartModel.findOne({ idUsuario }); // Metodo que mediante el idUsuario me devuelve la fila con info del carrito (si devuelve la fila es porque existe.)
  if (!existedCart) throw createError(400, "El usuario no posee un carrito.");

  //Por el contrario si ese usuario posee un carrito vamos el id de ese carrito para eliminar los pprodcutos que tiene dentro - NO ELIMINAMOS EL CARRITO - OJOOO.

  const { idCarrito } = existedCart; // Desestructuramos el idCarrito del carrito existente para obtener su id.

  // Aplicamos el metodo del modelo que ejecuta la consulta sql que elimina todos los prodcutos de ese carrito en particular.

  const result = await CartProductsDetailsModel.clearCartItems(idCarrito); // El result es el resultado de aplicar el metodo qeu daba solo las filas afectadas en la consulta SQL.

  if (result === 0) throw createError(400, "El carrito ya estaba vacio."); //Si no hay ninguna fila afectada entonces el carrito ya estaba vacio.

  return {
    message: `Se eliminaron ${result} productos del carrito y este se encuentra vacio`, // Mensaje de eliminacion correcta.
  };
};
