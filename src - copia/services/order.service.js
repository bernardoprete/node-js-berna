import { CartModel } from "../models/cart.model.js";
import { CartProductsDetailsModel } from "../models/cartProductsDetails.model.js";
import { OrderModel } from "../models/order.model.js";
import { OrderProductsDetailsModel } from "../models/orderProductsDetails.model.js";
import { createError } from "../utils/utils.js";

//SERVICIO  QUE TIENE LA LOGICA PREVIA NECESARIA PARA CREAR UN PEDIDO Y AGREGAR LOS PRODUCTOS CORRESPONDIENTES AL MISMO.

export const createOrderService = async (
  idUsuario, //Se obtiene del req.user
  metodo_pago, //Este campo suele ser especificado por el user por eso va ser parte delo que pasamos en el body.
  idDireccion //Este campo suele ser especificado por el user por eso va ser parte delo que pasamos en el body.
) => {
  try {
    const carrito = await CartModel.findOne({ idUsuario }); //Es necesario buscar el carrito del usuario que esta navegando.
    if (!carrito)
      throw createError(400, "El usuario no posee un carrito activo."); //Sino existe ningun carrito con ese id de usuario, lanzamos un error.

    const products = await CartProductsDetailsModel.findItemsInCart(
      carrito.idCarrito
    ); //Aqui listamos los productos dentro del carrrito con el metodo de cartProdcutsDetailsModel (pasamos el idCarrito como parametro - este id lo obtenemos del objeto que nos da la ejecucion del metodo findOne de cartModel.). Esta variable es un array de productos.

    if (!products || products.length === 0)
      throw createError(400, "El carrito está vacío."); //Verificar si el carrito esta vacio o sino.

    //Calculamos el total en $ del carrito
    const total = products.reduce(
      (acumulador, producto) =>
        acumulador + parseFloat(producto.subtotalProductoCarrito),
      0
    );

    //Aqui mediante el metodo create del orderModel creamos el pedido y este metodo retorna su Id.
    const idPedido = await OrderModel.create({
      fecha_pedido: new Date(),
      metodo_pago,
      fecha_entrega: null,
      fecha_envio: null,
      subtotal,
      total,
      idUsuario,
      idDireccion,
    });

    //Ahora los productos que teniamos en el carrito y que son parte de este nuevo pedido hay que agregarlos al detalle del pedido , pero para eso debemos crear el detalle del pedido (hacer un INSERT INTO en la tabla detallepedido) e ir copiando cada producto que tenemos en el carrito y agregarlo a esa tabla. MUY IMPORTANTE -

    //Recorremos el array que es la variable products (que tiene toda la info de los prodcutos del carrito) y cada prodcuto lo insertamos en la tabla detallepedido de la bd con el metodocreate que tenemos en orderProductsDetail. - IMPORTANTEE.
    //Creamos el detallePedido.
    for (const prod of products) {
      const result = await OrderProductsDetailsModel.create({
        //Hace un insert en la tabla detallepedido por cada prod existente en el carrito. // Basicamente los copia.
        cantidad: prod.cantidad,
        precioUnitario: prod.precioProductoCarrito,
        idPedido,
        idProducto: prod.idProducto,
        subtotal: prod.subtotalProductoCarrito,
      });
    }

    //Por ultimo vaciamos el carrito con el metodo cleartCart.
    await CartProductsDetailsModel.clearCartItems(carrito.idCarrito);

    //Devolvemos un mensaje de exito y el id del pedido creado.
    return { message: "Pedido creado correctamente.", idPedido };
  } catch (error) {
    if (error.status) throw error;
    throw createError(500, "Error interno al intentar crear el pedido.");
  }
};

// SERVICIO QUE TRAE TODOS LOS PEDIDOS DE UN USUARIO EN PARTICULAR.
export const findAllOrdersByUserService = async (idUsuario) => {
  try {
    // Buscar todos los pedidos que pertenezcan al usuario - Usamos el metodo findAllByUser del orderModel.
    const orders = await OrderModel.findAllByUser(idUsuario);

    // Si el usuario no tiene ningun pedido entonces devolvemos mensaje.
    if (!orders || orders.length === 0)
      throw createError(404, "El usuario no posee pedidos registrados.");

    // Retornamos el listado de pedidos
    return orders; //Es un array ya que es el resultado del metodo findAllByUser
  } catch (error) {
    console.error("Error al intentar listar los pedidos del usuario:", error);
    if (error.status) throw error;
    throw createError(
      500,
      "Error interno al intentar obtener los pedidos del usuario."
    );
  }
};

//SERVICIO QUE BUSCA Y MUESTRA TODOS LOS PRODUCTOS DE UN PEDIDO A TRAVES DE UN IDPEDIDO ESPECIFICO (MAS SU MONTO TOTAL Y CANT DE PRODUCTOS. )

export const findItemsInOrderService = async (idPedido) => {
  try {
    const products = await OrderProductsDetailsModel.findItemsInOrder(idPedido); //Esto me devuelve un array con productos adentro.

    const total = products.reduce((acumulador, producto) => {
      //Calculamos el subtotal de todo el pedido.
      const subtotal = parseFloat(producto.subtotaldetallePedido);
      return acumulador + subtotal;
    }, 0 /* valor inicial del acumulador */);

    const totalItems = products.length; //Cantidad total de prodcutos dentro de ese pedido. (prodcutos diferentes entre si - OJO)

    return { products, total: total.toFixed(2), totalItems }; //Retornamos un objeto con toda la info : objeto con productos - total del pedido en $ - cantidad de productos diferentes.
  } catch (error) {
    console.error(
      "Error al intentar acceder a los productos del pedido y sus metadatos:",
      error
    );
    if (error.status) throw error;
    throw createError(
      500,
      "Error al intentar acceder a los productos  del pedido y sus metadatos."
    );
  }
};
