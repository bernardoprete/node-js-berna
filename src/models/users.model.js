import { pool } from "../db.js";
import { compareStringHash, createError } from "../utils/utils.js";
import { sendEmailService } from "../services/email.service.js";

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

      const conditions = fields.map((field) => `${field} = ?`).join("AND"); // El map te devuelve un nuevo array con cada campo seguido de un ? y unido a un join que tiene AND.
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

  //DESAROLLO DEL METODO CREATE (CREAR UN USUARIO) - POST

  create: async (
    { nombre, apellido, fechaNacimiento, email, hashPassword, hashCode },
    connection
  ) => {
    try {
      const [result] = await connection.execute(
        "INSERT INTO producto.usuario (nombre,apellido,fechaNacimiento,email,idRol,password, codigoVerificacion) VALUES (?,?,?,?,?,?,?)", //Esto es todo lo que queda guardado en la bd.
        [nombre, apellido, fechaNacimiento, email, 1, hashPassword, hashCode]
      );
      const idUser = result.insertId;

      const [rows] = await connection.execute(
        "SELECT idUsuario, nombre,apellido,email,idRol FROM producto.usuario WHERE idUsuario = ?", //Esto es lo que se muestra en la bd cuando insertamos el nuevo usaurio.
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
  // DESARROLLO DEL METODO VERIFY (VERIFICAR UN USUARIO) --HABRIA QUE HACER UN SERIVICO (19/11/25)

  verify: async (id, code) => {
    try {
      // 1. Obtener los datos necesarios del usuario
      const [rows] = await pool.execute(
        "SELECT idUsuario, codigoVerificacion, emailVerificado, email, nombre FROM producto.usuario   WHERE idUsuario = ?",
        [id]
      );

      if (rows.length === 0)
        throw createError(400, "Datos de validación incorrectos.");

      const user = rows[0];

      // 2. Verificar si el usuario ya estaba verificado
      if (user.emailVerificado)
        throw createError(400, "El email ya está verificado.");

      // 3. Comparar el código ingresado con el código hasheado en BD
      const matchCode = await compareStringHash(code, user.codigoVerificacion);

      if (!matchCode)
        throw createError(400, "Código de verificación incorrecto.");

      // 4. Actualizar estado del usuario → verificado
      const [result] = await pool.execute(
        "UPDATE producto.usuario SET emailVerificado = true, codigoVerificacion = NULL WHERE idUsuario = ?",
        [id]
      );

      if (result.affectedRows === 0)
        throw createError(500, "No se pudo actualizar el estado del usuario.");

      // 5. Enviar email de confirmación
      // seteamos los datos que queremos mostrar en el template de envio de mail
      const emailContent = {
        title: "¡Notificacion de nuevo usuario!",
        message: `Felicitaciones, haz creado tu nuevo usuario correctamente, ya podes disfrutar de nuestros servicios`,
        link: {
          linkURL: `http://localhost:3001/api`,
          linkText: "Accede a la app",
        },
      };

      const emailSend = await sendEmailService(
        user.email,
        "✔ Cuenta verificada con éxito",
        emailContent
      );

      // Si falló el envío del email → No romper el flujo
      if (!emailSend) {
        console.log(
          "⚠️ Advertencia: No se pudo enviar el email de confirmación."
        );
        // ⚠️ PERO IGUAL devolvemos OK, porque el usuario ya está verificado
      }

      // 6. Retornamos true si se verificó correctamente
      return true;
    } catch (error) {
      console.log("❌ Error al intentar verificar el usuario:");
      console.log(error);
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

      // Si NO eliminó nada:
      if (result.affectedRows === 0) {
        throw createError(404, "No existe un usuario con ese ID.");
      }

      // Si eliminó, todo OK
      return true;
    } catch (error) {
      console.error("Error real al eliminar usuario:", error);
      // Si viene el error por FKs, MySQL da ER_ROW_IS_REFERENCED
      throw error;
    }
  },
};
