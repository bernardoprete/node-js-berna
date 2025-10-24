import bcrypt from "bcrypt";
import slugify from "slugify";


export const hashString = async (plainString) => {
  const saltRounds = 10;
  const hashedString = await bcrypt.hash(plainString, saltRounds);
  return hashedString;
};

export const compareStringHash = async (plainString, hashedString) => {
  const match = await bcrypt.compare(plainString, hashedString);
  return match;
};

export const createError = (status, message) => {
  const error = new Error(message);
  error.status = status;
  return error;
};

export const generarSlug = async (nombre, modelo) => {
  // el señor de los anillos  -> el-senor-de-los-anillos. ->
  let slugBase = slugify(nombre, { lower: true, strict: true });
  let finalSlug = slugBase;
  let found = false;
  let contador = 1;
  while (!found) {
    try {
      // buscamos el slug generado en la bd para chequear si existe.
      const slugExistente = await modelo.findOne({ slug: finalSlug });
      if (!slugExistente) {
        found = true;
        return finalSlug;
      }
      finalSlug = `${slugBase}-${contador}`;
      contador++;
    } catch (error) {
      console.error("Error al intentar buscar el slug en el modelo.", error);
      throw createError(
        500,
        `Error en el servidor no se pudo generar el slug en la tabla ${modelo.tablename}`
      );
    }
  }
};
