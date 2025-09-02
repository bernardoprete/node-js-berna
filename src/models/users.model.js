import { pool } from "../db.js";
import bcrypt from "bcryptjs";

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

  /* DESAROLLAR LOS MÉTODOS create, update, delete */

  //DESAROLLO DEL METODO CREATE (CREAR UN USUARIO) - POST

  async createUser({ idRol, nombre, apellido, password, email }) {
    // Verificar si el email existe en la bd
    const [rows] = await pool.execute(
      "SELECT idUsuario FROM producto.usuario WHERE email = ?",
      [email]
    );
    if (rows.length > 0) {
      //Si te da mas de 0 es porque hay un mail en la bd.

      const err = new Error("Email ya registrado");
      err.status = 400;
      throw err;
    }

    //Hashear password
    const hashPassword = await bcrypt.hash(password, 10);

    // Insertar en la bd al nuevo usuario
    const [result] = await pool.execute(
      `INSERT INTO producto.usuario (idRol, nombre, apellido, password, email)
       VALUES (?, ?, ?, ?, ?)`,
      [idRol, nombre, apellido, hashPassword, email]
    );

    // Devolver los datos del nuevo usuario.
    return {
      id: result.insertId,
      nombre,
      apellido,
      email,
      idRol,
    };
  },

  //DESAROLLO DEL METODO UPDATE (MODIFICAR UN USUARIO) - PUT

  async updateUser(id, { idRol, nombre, apellido, email }) {
    const [res] = await pool.execute(
      `UPDATE producto.usuario 
       SET idRol = ?, nombre = ?, apellido = ?, email = ?
       WHERE idUsuario = ?`,
      [idRol, nombre, apellido, email, id] // parámetros en orden
    );

    if (res.affectedRows === 0) {
      throw new Error("Usuario no encontrado"); //Buscado de google, me dice res.affectrdRows cuantas filas fueron afectadas en la consulta sql. Me sirve para validar si algo se actualizo o no.
    }

    // Traer usuario actualizado (sin contraseña)
    const [rows] = await pool.execute(
      "SELECT nombre, apellido, email, idRol FROM producto.usuario WHERE idUsuario = ?",
      [id]
    );

    return rows[0]; //Devuelvo un solo usuario (obvio el actualziado)
  },

  //DESAROLLO DEL METODO DELETE (BORRAR UN USUARIO) - DELETE

  async deleteUser(id) {
    const [res] = await pool.execute(
      `DELETE FROM producto.usuario WHERE idUsuario = ?`,
      [id]
    );

    if (res.affectedRows === 0) {
      throw new Error("Usuario no encontrado"); //Buscado de google, me dice res.affectrdRows cuantas filas fueron afectadas en la consulta sql. Me sirve para validar si algo se actualizo o no.
    }

    return "Usuario eliminado correctamente";
  },
};
