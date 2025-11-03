import { categoryModel } from "../models/category.model.js";
import { createError, generarSlug } from "../utils/utils.js";
//Ver todas las categorias
export const getCategory = async (req, res, next) => {
  try {
    const result = await categoryModel.findAll();
    res.status(200).json(result);
  } catch (err) {
    if (err.status) return next(err);
    const error = createError(
      500,
      "Error interno en el servidor al intentar listar categorias."
    );
    next(error);
  }
};
//Ver categoria por id.
export const getCategoryByID = async (req, res, next) => {
  const { id } = req.params;
  try {
    const category = await categoryModel.findByID(id);
    if (!category)
      throw createError(404, "No se encontro la categoria solicitado.");
    res.status(200).json(category);
  } catch (err) {
    console.log(err);
    if (err.status) return next(err);
    const error = createError(
      500,
      "Error interno en el servidor al intentar listar la categoria."
    );
    next(error);
  }
};
//Ver categoria por slug.
export const getCategoryBySlug = async (req, res, next) => {
  const { slug } = req.params;
  try {
    const category = await categoryModel.findOne({ slug });
    if (!category)
      throw createError(404, "No se encontro la categoria solicitada.");
    res.status(200).json(category);
  } catch (err) {
    console.log(err);
    if (err.status) return next(err);
    const error = createError(
      500,
      "Error interno en el servidor al intentar listar la categoria."
    );
    next(error);
  }
};

/* export const getMovieDetail = async (req, res, next) => {   //NO VAMOS A OBTENER DETALLES DE LAS CATEGORIAS YA QUE TODOS SUS CAMPOS ESTAN CON LOS NOMBRES Y NO COM IDS.
    const { slug } = req.params;
    try {
        const pelicula = await MovieModel.findMovieDetails({ slug })
        if (!pelicula) throw createError(404, 'No se encontro la pelicula solicitada.');
        res.status(200).json(pelicula);
    } catch (err) {
        console.log(err);
        if (err.status) return next(err)
        const error = createError(500, 'Error interno en el servidor al intentar listar la pelicula.')
        next(error)
    }
} */

//Crear categoria.
export const createCategory = async (req, res, next) => {
  const { nombre, imagen, descripcion } = req.body;
  try {
    // Generar slug a partir del nombre
    const slug = await generarSlug(nombre, categoryModel);

    // Crear la categoría en la BD
    const category = await categoryModel.create({
      nombre,
      slug,
      imagen,
      descripcion,
    });

    res.status(201).json({ message: "Categoría creada con éxito.", category });
  } catch (err) {
    console.log(" Error al intentar crear la categoria:", err);
    if (err.status) return next(err);
    const error = createError(
      500,
      "Error interno en el servidor al intentar crear categoría."
    );
    next(error);
  }
};

// Actualizar categoria
export const updateCategory = async (req, res, next) => {
  const { id } = req.params;
  const data = { ...req.body };

  try {
    if (data.nombre) {
      data.slug = await generarSlug(data.nombre, categoryModel);
    }

    const updated = await categoryModel.updatePartial(id, data);

    if (!updated) {
      throw createError(404, "No se encontró la categoría a actualizar.");
    }

    res
      .status(200)
      .json({ message: "Categoría actualizada con éxito.", updated });
  } catch (err) {
    if (err.status) return next(err);
    next(createError(500, "Error interno al actualizar la categoría."));
  }
};

// Eliminar categoria
export const deleteCategory = async (req, res, next) => {
  const { id } = req.params;
  try {
    await categoryModel.deleteCategory(id);
    res.sendStatus(204);
  } catch (err) {
    if (err.status) return next(err);
    next(createError(500, "Error interno al eliminar la categoría."));
  }
};
