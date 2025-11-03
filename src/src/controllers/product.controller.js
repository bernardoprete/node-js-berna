import { ProductModel } from "../models/product.model.js";
import { getProductsService } from "../services/product.service.js";
import { createError, generarSlug } from "../utils/utils.js";

// METODO PARA LISTAR TODOS LOS PRODUCTOS
export const getProducts = async (req, res, next) => {
  try {
    const result = await ProductModel.findAll();
    res.status(200).json(result);
  } catch (err) {
    if (err.status) return next(err);
    const error = createError(
      500,
      "Error interno en el servidor al intentar listar productos."
    );
    next(error);
  }
};

// METODO PARA ENCONTRAR UN PRODUCTO BUSCANDOLO POR ID
export const getProductByID = async (req, res, next) => {
  const { id } = req.params;
  try {
    const producto = await ProductModel.findByID(id);
    if (!producto)
      throw createError(404, "No se encontro el producto solicitado.");
    res.status(200).json(producto);
  } catch (err) {
    console.log(err);
    if (err.status) return next(err);
    const error = createError(
      500,
      "Error interno en el servidor al intentar listar la producto."
    );
    next(error);
  }
};

// METODO PARA ENCONTRAR UN PRODUCTO BUSCANDOLO POR SLUG
export const getProductBySlug = async (req, res, next) => {
  const { slug } = req.params;
  try {
    const producto = await ProductModel.findOne({ slug });
    if (!producto)
      throw createError(404, "No se encontro la producto solicitada.");
    res.status(200).json(producto);
  } catch (err) {
    console.log(err);
    if (err.status) return next(err);
    const error = createError(
      500,
      "Error interno en el servidor al intentar listar la producto."
    );
    next(error);
  }
};

// METODO PARA ENCONTRAR TODOS LOS DETALLES DE UN PRODUCTO (HAY QUE PASARLE EL SLUG PARA QUE LO HAGA)

export const getProductDetail = async (req, res, next) => {
  const { slug } = req.params;
  try {
    const producto = await ProductModel.findProductDetails({ slug });
    if (!producto)
      throw createError(404, "No se encontro el producto solicitada.");
    res.status(200).json(producto);
  } catch (err) {
    console.log(err);
    if (err.status) return next(err);
    const error = createError(
      500,
      "Error interno en el servidor al intentar listar el producto."
    );
    next(error);
  }
};

export const createProduct = async (req, res, next) => {
  const { nombre } = req.body; // extraigo el nombre para generar el slug.
  try {
    const slug = await generarSlug(nombre, ProductModel);
    console.log(slug);
    const dataProduct = { ...req.body, slug };
    const product = await ProductModel.create(dataProduct);
    res.status(201).json({ message: "producto creado con éxito.", product });
  } catch (err) {
    console.log(err);
    if (err.status) return next(err);
    const error = createError(
      500,
      "Error interno en el servidor al intentar crear producto."
    );
    next(error);
  }
};

// CONSULTA SQL PAGINADA.

export const getProductsLimited = async (req, res, next) => {
  const page =
    parseInt(req.query.page) && req.query.page >= 1
      ? parseInt(req.query.page)
      : 1; // Parametros de consulta que debo agregar en tc si quiero ver otras paginas o cambiar el limite.

  const limit =
    parseInt(req.query.limit) && req.query.limit >= 3
      ? parseInt(req.query.limit)
      : 5; // Parametros de consulta que debo agregar en tc si quiero ver otras paginas o cambiar el limite.
  const offset = (page - 1) * limit;

  const filters = {
    categoria: req.query.categoria || null,
    marca: req.query.marca || null,
    precioMin: req.query.precio_min ? parseFloat(req.query.precio_min) : null,
    precioMax: req.query.precio_max ? parseFloat(req.query.precio_max) : null,
    busqueda: req.query.busqueda || null,
    sortBy: req.query.sort_by || "created_at",
    sortDirection: req.query.sort_direction || "desc",
  };

  console.log(filters);

  /*
  console.log(Object.entries(filters).filter((element) => {
    return element[1] !== null && element[1] !== undefined && element[1] !== ''
  }));
*/
  const cleanFilters = Object.fromEntries(
    Object.entries(filters).filter(([key, value]) => {
      //Elimina del objeto cualquier filtro vacío (null, undefined, o string vacío).
      return value !== null && value !== undefined && value !== "";
    })
  ); //Object.entries(filters) → convierte el objeto en un array de pares [clave, valor]. LUego .filter(([key, value]) => value !== null ...) → deja solo los filtros válidos. Y por ultimo Object.fromEntries(...) → vuelve a convertirlo en objeto limpio.


  try {
    const result = await getProductsService(page, limit, offset, cleanFilters); //Acá el controlador delega todo el trabajo complejo al servicio (getProductsService)
    // El servicio Construye las condiciones SQL- Ejecuta la query - Calcula la paginación total.
    //const products = await ProductModel.findAllLimit(page, limit, offset, cleanFilters);
    res.status(200).json(result);
  } catch (err) {
    console.log(err);
    if (err.status) return next(err);
    const error = createError(
      500,
      "Error interno en el servidor al intentar listar productos paginadas."
    );
    next(error);
  }
};

// Actualizar producto
export const updateProduct = async (req, res, next) => {
  const { id } = req.params;
  const data = { ...req.body };

  try {
    // solo si viene nombre en el body, agrego el slug
    if (data.nombre) {
      data.slug = await generarSlug(data.nombre, ProductModel);
    }

    const updated = await ProductModel.updatePartial(id, data);

    if (!updated) {
      throw createError(404, "No se encontró el producto a actualizar.");
    }

    res
      .status(200)
      .json({ message: "Producto actualizado con éxito.", updated });
  } catch (err) {
    if (err.status) return next(err);
    next(createError(500, "Error interno al actualizar el producto."));
  }
};

// Eliminar producto
export const deleteProduct = async (req, res, next) => {
  const { id } = req.params;
  try {
    await ProductModel.deleteProduct(id);
    res.sendStatus(204);
  } catch (err) {
    if (err.status) return next(err);
    next(createError(500, "Error interno al eliminar el producto."));
  }
};
