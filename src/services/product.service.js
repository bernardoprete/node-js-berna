import { ProductModel } from "../models/product.model.js";

/* Qué hace este servicio  getProductsService():
Construye todos los filtros dinámicamente (exactamente igual que lo hacía findAllLimit() en el modelo).
Arma el whereClause, el orderClause y el listado de columnas.
Llama al modelo solo para ejecutar SQL, no para armarlo:
Usa ProductModel.findAllLimit2(...) para obtener los productos.
Usa ProductModel.paginationData(...) para contar el total.
Calcula la paginación y devuelve un objeto completo con productos + metadata.

En resumen: trasladó la lógica pesada de SQL desde el modelo hacia el servicio, dejando al modelo solo como capa de acceso a datos.

Yo podria del modelo borrar el metodo FindAllLimit y hacer la misma busqueda pero con esta capa de servicio.
 */

export const getProductsService = async (page, limit, offset, filters) => {
  try {
    // Construimos dinámicamente las condiciones de busqueda y parámetros
    const whereConditions = [];
    const queryParams = [];
    // Verificamos los diferentes filtros que llegan.
    if (filters.categoria) {
      whereConditions.push(`c.nombre = ?`);
      queryParams.push(filters.categoria);
    }
    if (filters.marca) {
      whereConditions.push(`m.nombre = ?`);
      queryParams.push(filters.marca);
    }
    if (filters.precioMin) {
      whereConditions.push(`${ProductModel.fields.precio} >= ?`);
      queryParams.push(filters.precioMin);
    }
    if (filters.precioMax) {
      whereConditions.push(`${ProductModel.fields.precio} <= ?`);
      queryParams.push(filters.precioMax);
    }
    if (filters.busqueda) {
      whereConditions.push(
        `${ProductModel.fields.nombre} LIKE ? OR ${ProductModel.fields.descripcionCorta} LIKE ?`
      );

      const busquedaParm = `%${filters.busqueda}%`;
      queryParams.push(busquedaParm, busquedaParm);
    }

    // whereConditions = ['idCategoria = ?', 'idMarca = ?', ..]
    // Concatenar las condiciones de busqueda
    const whereClause =
      whereConditions.length > 0
        ? `WHERE ${whereConditions.join(" AND ")}`
        : "";

    /* Construir dinámicamente el ORDER BY */

    let orderClause = "ORDER BY created_at DESC"; // orden por defecto.
    console.log(filters.sortBy);
    if (filters.sortBy) {
      const validSortFields = [
        "nombre",
        "precio",
        "created_at",
        "updated_at",
        "stock",
      ];
      const sortDirection = filters.sortDirection === "desc" ? "DESC" : "ASC";

      if (validSortFields.includes(filters.sortBy)) {
        orderClause = `ORDER BY ${filters.sortBy} ${sortDirection}`;
      }
    }

    // Selecciono los campos/columnas de la tabla producto
    const productColumns = Object.values(ProductModel.fields)
      .filter(
        (field) =>
          field != ProductModel.fields.created_at &&
          field != ProductModel.fields.updated_at &&
          field != ProductModel.fields.visible &&
          field != ProductModel.fields.nombre // lo filtramos de aca porque le colocamos un alias de forma manual.
      )
      .map((column) => `p.${column}`)
      .join(", ");

    const finalParams = [...queryParams, String(limit), String(offset)];
    // productos
    //PARTE DIFERENCIAL - Aca el modelo hace la consulta solamente - este servicio hace la logica que utilizamos previamente para armar la consulta y el comntrolador los utiliza y da una respuesta positiva o negativa. 
    const products = await ProductModel.findAllLimit2( // HASTA ACA TODO IGUAL - PERO AHORA USAMOS EL METODO FINDALLLIMIT2 (Esta en EL MODELO) //Este método hace solo la parte del SELECT,sin armar filtros ni contar totales.Básicamente es una versión simplificada o reutilizable de findAllLimit pensada para cuando ya   tenés todos los componentes armados desde afuera (por ejemplo, desde un servicio o un método superior, como en ESTE CASO.)
      finalParams,
      whereClause,
      orderClause,
      productColumns
    );
    console.log("productos", products);

    //PAGINACION 
    const totalProducts = await ProductModel.paginationData(
      whereClause,
      queryParams
    );
    const totalPages = Math.ceil(totalProducts / limit);
    const pagination = {
      totalProducts,
      totalPages,
      currentPage: page,
      limit,
      hasNextPage: page < totalPages,
      hasPrevPage: page > 1,
    };
    return {
      products,
      pagination,
    };
  } catch (err) {
    console.log(
      "Error al intentar obtener los productos desde el servicio:",
      err
    );
    throw err;
  }
};
