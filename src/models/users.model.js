import { pool } from "../db.js";
import bcrypt from "bcryptjs";
import { compareStringHash, hashString } from "../utils/utils.js";
import crypto from "crypto";

export const UserModel = {
  // DESAROLLO DEL METODO FIND ALL (MOSTRAR/BUSCAR TODOS LOS USUARIOS) - GET

  async findAll() {
    try {
      const [rows] = await pool.execute(
        "SELECT idUsuario, nombre, apellido, email FROM producto.usuario"
      );
      return rows;
    } catch (error) {
      console.log("Error al obtener listado de usuarios", error);
      throw error;
    }
  },

  //DESAROLLO DEL METODO FIND BY ID (MOSTRAR/BUSCAR UN USUARIO POR NUMERO DE ID) - GET

  findByID: async (id) => {
    //Aqui utilizo otra sintaxis
    try {
      const [rows] = await pool.execute(
        "SELECT * FROM producto.usuario WHERE idUsuario = ?",
        [id]
      ); // Se utilizan prepared statement
      return rows[0]; // rows siempre devuelve un array de filas, donde cada fila es un objeto. En este caso pomgp rows[0] ya que como busco por id, si o si voy a recibir solo un objeto.
    } catch (error) {
      console.log("Error al obtener listado de usuarios", error);
      throw error;
    }
  },

  //METODO FIND ONE
  findOne: async (searchParams) => {
    /* 
            searchParams= {
                email:"juan@gmail.com", HAY QUE PASARLE UN OBJETO SI O SI AL METODO.
                nombre: "juan"
            }
        */
    // Object.keys(obj) -> te devuelve un arreglo con todos las propiedades/claves en formato string cada una de ellas.
    // Object.values(obj) -> te devuelve un arreglo con todos los valores del objeto.
    try {
      if (!searchParams || Object.keys(searchParams).length === 0)
        throw createError(
          400,
          "No se han proporcionado parametros de busqueda"
        );

      const fields = Object.keys(searchParams); // ["email", "nombre"]
      const values = Object.values(searchParams); // ["juan@gmail.com","juan"]

      const conditions = fields.map((field) => `${field} = ?`).join('AND'); // El map te devuelve un nuevo array con cada campo seguido de un ? y unido a un join que tiene AND.
      // ['email = ?', 'nombre = ?'].join(' AND ') -> email = ? AND nombre = ?

      const sql = `SELECT * FROM usuario WHERE ${conditions}`;
      console.log(sql);
      console.log(values);

      const [rows] = await pool.execute(sql, values);

      return rows[0];
    } catch (error) {}
  },

  findAllBySearch: async (searchParams) => {
    try {
      if (!searchParams || Object.keys(searchParams).length === 0) {
        throw createError(
          400,
          "No se han proporcionado parámetros de búsqueda"
        );
      }

      const fields = Object.keys(searchParams); // Las claves de la busqueda["nombre", "apellido"]

      const values = Object.values(searchParams); // Valores de búsqueda (los que vinieron en el body/query) ["Juan", "Pérez"]

      const conditions = fields.map((field) => `${field} LIKE ?`).join(" AND "); //  Armo las condiciones pero con LIKE ["nombre LIKE ?", "apellido LIKE ?"].join(" AND ")

      // El like necesita de %% entonces tengo que "anexarlo para que busque coincidencias parciales
      const likeValues = values.map((v) => `%${v}%`); // ["%Juan%", "%Pérez%"]

      // Query final
      const sql = `SELECT * FROM usuario WHERE ${conditions}`;
      console.log(sql);
      console.log(likeValues);

      const [rows] = await pool.execute(sql, likeValues); //No uso values sino los values modificados con %

      return rows; // Ya no coloco rows[0] sino un listado por eso va rows.
    } catch (error) {
      console.log("Error en findAllBySearch:", error.message);
      throw error;
    }
  },

  //DESAROLLO DEL METODO CREATE (CREAR UN USUARIO) - POST  - Hecho nuevamente en clase 8/9

  create: async ({ nombre, apellido, fechaNacimiento, email, password }) => {
    try {
      // F_9vRRENGyCvKVcGdijFTwoYCDg0HCzj
      const hashPassword = await hashString(password);

      const verificactionCode = crypto.randomBytes(24).toString("base64url"); //  Codigo alfanumerico aleatorio que creo para poder precisamente crear el codigo de verificacion. Esto hay que enviarle por mail al usuario para que se verifique.
      console.log(verificactionCode);

      const hashCode = await hashString(verificactionCode); //Aqui hasheamos ese codigo.

      const [result] = await pool.execute(
        "INSERT INTO producto.usuario (nombre,apellido,fechaNacimiento,email,idRol,password, codigoVerificacion) VALUES (?,?,?,?,?,?,?)", //Esto estodo lo que queda guardado en la bd.
        [nombre, apellido, fechaNacimiento, email, 1, hashPassword, hashCode]
      );
      const idUser = result.insertId;
      console.log(
        `www.dominiomipagina.com/api/users/verify?id=${idUser}&code=${verificactionCode}` //Lo que hay que enviar por email finalmente.
      );

      const [rows] = await pool.execute(
        "SELECT idUsuario, nombre,apellido,email,idRol FROM producto.usuario WHERE idUsuario = ?", //Esto es lo que se muestra en el thunder client cuando insertamos correctamente el usuario en la bd.
        [idUser]
      );

      return rows[0];
    } catch (error) {
      console.log("error al intentar crear el usuario");
      throw error;
    }
  },

  //METODO PARA MODIFICAR PARCIALMENTE DATOS - (PUT)

  updatePartial: async (id, updateData) => {
    /* 
            updateData= {
                nombre = "Pedro",
                email = "pedro@gmail.com"
            }
        */
    try {
      if (!updateData || Object.keys(updateData).length === 0)
        throw createError(
          400,
          "No se han proporcionado datos para actualizar el usuario"
        );
      const fields = Object.keys(updateData); // ["email", "nombre"] Devuelve un array con las propiedades
      const values = Object.values(updateData); // ["juan@gmail.com","juan"] Devuelve un array con los valores de la propiedades.

      const setData = fields.map((field) => `${field} = ?`).join(", "); // Unimos la data con una , para hacer la consulta sql.
      // campo = ?, otroCampo = ?
      const sql = `UPDATE usuario SET ${setData} WHERE idUsuario = ?`;
      const [result] = await pool.execute(sql, [...values, id]); // ... Spread -> "vuelco" los VALORES del arreglo values, dentro de un arreglo, y al final, agrego el id como un nuevo elemento, entonces, ["valor1","valor2", 32]; -> Si pongo values sin spread -> [["valor1","valor2"], 32]
      console.log(sql);

      // chequeamos si se actualizo correctamente
      if (result.affectedRows === 0)
        throw createError(500, "Error al intentar actualizar usuario");

      // devolvemos el usuario con los nuevos cambios
      const [rows] = await pool.execute(
        "SELECT * FROM usuario WHERE idUsuario = ?",
        [id]
      );
      return rows[0];
    } catch (error) {
      console.error("Error en actualización parcial: ", error);
      throw error;
    }
  },
  //DESAROLLO DEL METODO VERIFY (VERIFICAR UN USUARIO)

  verify: async (id, code) => {
    try {
      const [rows] = await pool.execute(
        "SELECT codigoVerificacion, emailVerificado FROM producto.usuario WHERE idUsuario = ?",
        [id]
      );

      if (rows.length === 0)
        throw createError(400, "Datos de validación incorrectos.");

      const user = rows[0]; //Esto te muestra todo el usuario seleccionado. rows es un array de objetos, cada objeto es una fila de la consulta. EJM
      /*  [
        { codigoVerificacion: "ABC123", emailVerificado: 1 }
          ] */

      if (user.emailVerificado)
        //Si ya existe un email verificado es que el usuario ya fue verificado.
        throw createError(400, "El email ya está verificado.");

      const matchCode = await compareStringHash(code, user.codigoVerificacion); // Usamos la funcion compareStringHash que hacemos en ultis.js y qu mediante bcrypt compara el codigo hasheado con el codigo

      if (!matchCode)
        throw createError(400, "Código de verificación incorrecto.");

      const [result] = await pool.execute(
        "UPDATE usuario SET emailVerificado = true, codigoVerificacion=null WHERE idUsuario = ?",
        [id]
      );

      return result.affectedRows > 0;
    } catch (error) {
      console.log(error);

      console.log("error al intentar verificar el usuario");
      throw error;
    }
  },

  //DESAROLLO DEL METODO DELETE (BORRAR UN USUARIO)

  async deleteUser(id) {
    try {
      const [result] = await pool.execute(
        `DELETE FROM producto.usuario WHERE idUsuario = ?`,
        [id]
      );

      if (result.affectedRows === 0) {
        throw createError(400, "El usuario no ha podido ser eliminado");
      }

      return result.affectedRows > 0; // true si eliminó, false si no
    } catch (error) {
      console.error("Error al eliminar usuario:", error);
      throw error;
    }
  },
};
