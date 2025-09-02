//LOGICA DE LA APP 

import { pool } from "../db.js" // Vamos a utilizar el pool de conexiones
// src/controllers/users.controller.js
import { UserModel } from "../models/users.model.js"; 



// CONSULTA DEL MODELO DE USUARIOS  - VER TODOS LOS USUARIOS (GET)
export const getUsers = async (req, res) => {
  try {
const users  = await UserModel.findAll()
res.status(200).json(users);


  } catch (error) {
    console.log('Error al obtener listado de usuarios', error)
    res.status(500).json({ message: 'Error al listar usuarios' })
  }
}


// CONSULTA DEL MODELO DE USUARIOS - VER UN USUARIO POR SU ID (GET)
export const getUserByID = async (req, res) => {
  const { id } = req.params; //Desestructuro el id de los req.params

  try {
    const user = await UserModel.findByID(id) // Utilizo el UserModel
    res.status(200).json(user);
  } catch (error) {
    console.log('Error al obtener listado de usuarios', error)
    res.status(500).json({ message: 'Error al listar usuarios' })
  }
}




export const postNewUser = async (req, res) => {
  try {
    const { idRol, nombre, apellido, password, email } = req.body;

    if (!nombre || !apellido || !email || !password) {
      return res.status(400).json({ message: "Faltan campos obligatorios" }); //Validacion minima/ luego usaremos middlewares
    }

    const created = await UserModel.createUser({ idRol, nombre, apellido, password, email });

    // Aca damso la respuesta y cortamos con el return
    return res.status(201).json(created);

  } catch (error) {
    if (error.status) {
      return res.status(error.status).json({ message: error.message });
    }
    return res.status(500).json({ message: "Error interno del servidor" });
  }
}



export const putUser = async (req, res) => {
  const { id } = req.params;
  const { idRol, nombre, apellido, email } = req.body;

  try {
    const usuarioActualizado = await UserModel.updateUser(id, {
      idRol,
      nombre,
      apellido,
      email,
    });

    res.status(200).json(usuarioActualizado);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
}


export const eliminateUser = async (req,res) => {

  const {id} = req.params;

  try {
    const eliminarUsuario = await UserModel.deleteUser(id);
    res.status(200).json(eliminarUsuario)
  } catch (error) {
     res.status(400).json({ message: "El usuario no ha podido ser eliminado correctamente" });
  }
}



