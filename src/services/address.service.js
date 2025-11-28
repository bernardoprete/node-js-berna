import { createError } from "../utils/utils.js";
import { AddressModel } from "../models/address.model.js";
//Buscar todas las direcciones del sistema (con filtro y paginacion)
export const getAllSystemAddressesService = async (
  page,
  limit,
  offset,
  filters
) => {
  try {
    let whereConditions = [];
    let queryParams = [];

    // Filtro por usuario (nombre, apellido o email)
    if (filters.usuario) {
      whereConditions.push(
        `(u.nombre LIKE ? OR u.apellido LIKE ? OR u.email LIKE ?)`
      );
      const search = `%${filters.usuario}%`;
      queryParams.push(search, search, search);
    }

    if (filters.ciudad) {
      whereConditions.push(`d.ciudad LIKE ?`);
      queryParams.push(`%${filters.ciudad}%`);
    }

    if (filters.provincia) {
      whereConditions.push(`d.provincia LIKE ?`);
      queryParams.push(`%${filters.provincia}%`);
    }

    if (filters.codigoPostal) {
      whereConditions.push(`d.codigoPostal LIKE ?`);
      queryParams.push(`%${filters.codigoPostal}%`);
    }

    if (filters.pais) {
      whereConditions.push(`d.pais LIKE ?`);
      queryParams.push(`%${filters.pais}%`);
    }

    const whereClause =
      whereConditions.length > 0
        ? `WHERE ${whereConditions.join(" AND ")}`
        : "";

    // Ordenamiento
    const validFields = [
      "idDireccion",
      "ciudad",
      "provincia",
      "codigoPostal",
      "pais",
    ];
    const sortDirection = filters.sortDirection === "desc" ? "DESC" : "ASC";

    let orderClause = `ORDER BY d.idDireccion ASC`;

    if (filters.sortBy && validFields.includes(filters.sortBy)) {
      orderClause = `ORDER BY d.${filters.sortBy} ${sortDirection}`;
    }

    // Columnas que precisamos o queremos
    const addressColumns = `
      d.idDireccion,
      d.direccionLinea1,
      d.direccionLinea2,
      d.altura,
      d.ciudad,
      d.provincia,
      d.codigoPostal,
      d.pais,
      d.predeterminada,
      u.idUsuario,
      u.nombre AS nombreUsuario,
      u.apellido AS apellidoUsuario,
      u.email AS emailUsuario
    `;

    const finalParams = [...queryParams, String(limit), String(offset)];

    // Consulta principal
    const addresses = await AddressModel.findAllSystemAddresses(
      finalParams,
      whereClause,
      orderClause,
      addressColumns
    );

    // Conteo total
    const totalAddresses = await AddressModel.paginationSystemAddresses(
      whereClause,
      queryParams
    );

    const totalPages = Math.ceil(totalAddresses / limit);

    return {
      addresses,
      pagination: {
        totalAddresses,
        totalPages,
        currentPage: page,
        limit,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1,
      },
    };
  } catch (error) {
    console.log(error);
    if (error.status) throw error;
    throw createError(500, "Error al obtener direcciones del sistema.");
  }
};
