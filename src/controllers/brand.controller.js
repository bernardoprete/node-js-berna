import { brandModel } from "../models/brand.model.js";
import { createError, generarSlug } from "../utils/utils.js";

// Obtener/listar marcas
export const getBrand = async (req, res, next) => {
  try {
    const result = await brandModel.findAll();
    res.status(200).json(result);
  } catch (err) {
    if (err.status) return next(err);
    const error = createError(
      500,
      "Error interno en el servidor al intentar listar las marcas."
    );
    next(error);
  }
};
//Ver marca por id.
export const getBrandById = async (req, res, next) => {
  const { id } = req.params;
  try {
    const brand = await brandModel.findByID(id);
    if (!brand) throw createError(404, "No se encontro la marca solicitada.");
    res.status(200).json(brand);
  } catch (err) {
    console.log(err);
    if (err.status) return next(err);
    const error = createError(
      500,
      "Error interno en el servidor al intentarlistar las marcas."
    );
    next(error);
  }
};
//Ver marca por slug
export const getBrandBySlug = async (req, res, next) => {
  const { slug } = req.params;
  try {
    const brand = await brandModel.findOne({ slug });
    if (!brand) throw createError(404, "No se encontro la marca solicitada.");
    res.status(200).json(brand);
  } catch (err) {
    console.log(err);
    if (err.status) return next(err);
    const error = createError(
      500,
      "Error interno en el servidor al intentar listar las marcas"
    );
    next(error);
  }
};
//Crear marca
export const createBrand = async (req, res, next) => {
  const { nombre, imagen, descripcion } = req.body;
  try {
    // Generamos el slug a partir del nombre
    const slug = await generarSlug(nombre, brandModel);

    // Creamos la marca en la BD
    const brand = await brandModel.create({
      nombre,
      slug,
      imagen,
      descripcion,
    });

    res.status(201).json({ message: "Marca creada con éxito.", brand });
  } catch (err) {
    console.log(err);
    if (err.status) return next(err);
    const error = createError(
      500,
      "Error interno en el servidor al intentar crear marca."
    );
    next(error);
  }
};

// Actualizar marca
export const updateBrand = async (req, res, next) => {
  const { id } = req.params;
  const data = { ...req.body };

  try {
    // solo si viene nombre en el body, agrego el slug
    if (data.nombre) {
      data.slug = await generarSlug(data.nombre, brandModel);
    }

    const updated = await brandModel.updatePartial(id, data);

    if (!updated) {
      throw createError(404, "No se encontró la marca a actualizar.");
    }

    res.status(200).json({ message: "Marca actualizada con éxito.", updated });
  } catch (err) {
    if (err.status) return next(err);
    next(createError(500, "Error interno al actualizar la marca."));
  }
};

// Eliminar marca
export const deleteBrand = async (req, res, next) => {
  const { id } = req.params;
  try {
    await brandModel.deleteBrand(id);
    res.sendStatus(204);
  } catch (err) {
    if (err.status) return next(err);
    next(createError(500, "Error interno al eliminar la marca."));
  }
};
