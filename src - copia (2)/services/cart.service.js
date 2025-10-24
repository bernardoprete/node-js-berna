import { CartModel } from "../models/cart.model.js";
import { CartProductsDetailsModel } from "../models/cartProductsDetails.model.js";
import { ProductModel } from "../models/product.model.js";
import { createError } from "../utils/utils.js";

/*Este servicio une ambos modelos(cart model y cartProductDetails model) y define la lógica del negocio, es decir, cómo se comporta el carrito cuando el usuario desea  agregar un producto , desde la verificacion de si tiene un carrito o no, la creacion del carrito, la busqueda en la BD del producto que se quiere agregar y la verificacion de su existencia o no, la verificacion de si ese prodcuto existente ya esta en el carro o no (agregandolo o modificando cantidad) validacion de stock antes de agregar y finalmente mostrando el carrito  pero con los prodcutos agregados. 
Aqui vamos a trabajar con  metodos creados tanto en cartModel como en cartProdcuctsDetailsModel y hasta en prodcutModel(diferentes modelos que tenemos)que trabajan con diferentes tablas de la BD respectivamente (carrito - carritoproducto - product) */

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
    const productos = await CartProductsDetailsModel.findItemsInCart(idCarrito);

    const cart = await CartModel.findByID(idCarrito); //Obtenermos toda la info del carrito.

    // Retornamos el carrito con sus productos actualizados
    return {
      cart,
      productos, // Es el array de productos.
    };
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
