import mysql from "mysql2/promise";
import dotenv from "dotenv";

dotenv.config(); //Esto lo que hace es leer el archivo .env que esta en la raiz.

const dbConfig = { //Todo esto define como se conecta la app a MYsql, leyendo lo que esta en el archivo .env y sino se puede leer se coloca lo posterior al or
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || 'Error DB PASSWORD',
    database: process.env.DB_NAME || 'Error DB NAME',
    port: process.env.DB_PORT || 3306,
}

console.log(dbConfig); // Aqui debugeamos para ver wi la conexion esta OK o hay errores.


export const pool = mysql.createPool({ //mysql.createPool: en vez de abrir y cerrar una conexión nueva cada vez, crea un conjunto de conexiones abiertas que se reutilizan. Esto es más eficiente y evita sobrecargar el servidor MySQL.
    ...dbConfig, //Agregamos lo que esta dentro del array llamado dbConfig (host, user, password,name y port)
    waitForConnections: true, //si todas las conexiones están ocupadas, espera en vez de tirar error.
    connectionLimit: 10, //máximo 10 conexiones simultáneas.
    queueLimit: 0 // sin límite de peticiones en espera
})