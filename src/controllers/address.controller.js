import { createError } from "../utils/utils.js";
import { AddressModel } from "../models/address.model.js";
import { getAllSystemAddressesService } from "../services/address.service.js";

// Obtener/listar direcciones de user logueado
export const getAdrress = async (req, res, next) => {
  try {
    const idUsuario = req.user.idUsuario;

    const result = await AddressModel.findByUserId(idUsuario); //Busca solo las direcciones del user logueado.
    res.status(200).json(result);
  } catch (err) {
    if (err.status) return next(err);
    const error = createError(
      500,
      "Error interno en el servidor al intentar listar las direcciones."
    );
    next(error);
  }
};
//Ver direccion por id.
export const getAddressById = async (req, res, next) => {
  const { id } = req.params;
  try {
    const address = await AddressModel.findByID(id);
    if (!address)
      throw createError(404, "No se encontro la direccion solicitada.");
    res.status(200).json(address);
  } catch (err) {
    console.log(err);
    if (err.status) return next(err);
    const error = createError(
      500,
      "Error interno en el servidor al intentar listar las direcciones."
    );
    next(error);
  }
};
export const getAddressByField = async (req, res, next) => {
  // Busca direcciones por diferentes campos. (usa query params)
  try {
    const results = await AddressModel.search(req.query);

    if (!results || results.length === 0)
      throw createError(404, "No se encontraron direcciones.");

    res.status(200).json(results);
  } catch (err) {
    next(err);
  }
};

// Crear dirección
export const createAddress = async (req, res, next) => {
  try {
    const {
      direccionLinea1,
      direccionLinea2 = null,
      ciudad = null,
      provincia = null,
      codigoPostal,
      pais = null,
      predeterminada = 1,
      altura,
    } = req.body;
    const idUsuario = req.user.idUsuario; //El id usuario lo obtenemos del req.user (esta guardado en el middleware authRequired.)

    const addressData = {
      direccionLinea1,
      direccionLinea2,
      ciudad,
      provincia,
      codigoPostal,
      pais,
      idUsuario,
      predeterminada,
      altura,
    };

    const createdAddress = await AddressModel.create(addressData);

    res.status(201).json({
      message: "Dirección creada con éxito.",
      createdAddress,
    });
  } catch (err) {
    console.log(err);

    if (err.status) return next(err);

    const error = createError(
      500,
      "Error interno en el servidor al intentar crear dirección."
    );
    next(error);
  }
};

// Actualizar direccion
export const updateAddress = async (req, res, next) => {
  const { id } = req.params;
  const data = { ...req.body }; // Aca pongo data porque tiene que ser dinamica la data que el cliente desde el front va a modificar, puede querer modificar 1 2 o varios campos, por eso la variable data se guarda con la copia (...) del req.body.
  const idUsuario = req.user.idUsuario;
  //Verificamos primero si el id que se colaca en los req.params corresponde a un id de direccion del usaurio logueado.

  try {
    const isOwner = await AddressModel.checkUserAddress(id, idUsuario);

    if (!isOwner) {
      return next(
        createError(403, "No tienes permiso para modificar esta direccion.")
      );
    }
    const updated = await AddressModel.updatePartial(id, data);

    if (!updated) {
      throw createError(404, "No se encontró la direccion a actualizar.");
    }

    res
      .status(200)
      .json({ message: "Direccion actualizada con éxito.", updated });
  } catch (err) {
    if (err.status) return next(err);
    next(createError(500, "Error interno al actualizar la direccion."));
  }
};

// Eliminar direccion
export const deleteAddress = async (req, res, next) => {
  const { id } = req.params;
  const idUsuario = req.user.idUsuario;

  try {
    const isOwner = await AddressModel.checkUserAddress(id, idUsuario);

    if (!isOwner) {
      return next(
        createError(403, "No tienes permiso para eliminar esta direccion.")
      );
    }
    await AddressModel.deleteAddress(id);
    res.sendStatus(204);
  } catch (err) {
    if (err.status) return next(err);
    next(createError(500, "Error interno al eliminar la direccion."));
  }
};

/* 
  CONTROLADOR PARA OBTENER TODAS LAS DIRECCIONES DEL SISTEMA (ADMIN)
  Paginado, con filtros dinámicos y ordenamiento.
  Similar al controlador de órdenes del sistema.
*/

export const getAllSystemAddresses = async (req, res, next) => {
  const page =
    parseInt(req.query.page) && req.query.page >= 1
      ? parseInt(req.query.page)
      : 1;
  const limit =
    parseInt(req.query.limit) && req.query.limit >= 1
      ? parseInt(req.query.limit)
      : 5;
  const offset = (page - 1) * limit;

  // Posibles filtros para buscar direcciones
  const filters = {
    usuario: req.query.usuario || null, // nombre, apellido o email
    ciudad: req.query.ciudad || null,
    provincia: req.query.provincia || null,
    codigoPostal: req.query.codigoPostal || null,
    pais: req.query.pais || null,
    sortBy: req.query.sort_by || "idDireccion",
    sortDirection: req.query.sort_direction || "asc",
  };

  const cleanFilters = Object.fromEntries(
    Object.entries(filters).filter(([_, value]) => value)
  );

  try {
    const result = await getAllSystemAddressesService(
      page,
      limit,
      offset,
      cleanFilters
    );

    res.status(200).json(result);
  } catch (error) {
    console.log(error);
    if (error.status) return next(error);
    next(createError(500, "Error interno al obtener direcciones del sistema."));
  }
};

