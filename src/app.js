import express from "express";

import usuariosRoutes from "./routes/usuarios.routes.js"; // Variable creada por mi con cualquier nombre y exportada de usuarios.routers.
import productosRouters from "./routes/productos.routes.js"; // Variable creada por mi para importar las funciones llamadas en productos.routers.js y que su logica esta en productos.controller.js

const app = express();
const port = 3005;

//MIDDLEWARES QUE SE APLICAN A TODA LA APP : POR ESO ESTAN AQUI.
// me permite parsear el body a JSON, directamente me asigna la data dentro de req.body
app.use(express.json());
// me permite parsear formularios HTML.
app.use(express.urlencoded({ extended: true }));

// middleware personalizado para ver de ejemplo.
app.use((req, res, next) => {
  console.log(`URL Solicitada: ${req.url} - Método: ${req.method}`);
  next();
});

//RUTAS -- ESTO TAMBIEN ES UN MIDDLEWAREt AUNQUE NO PAREZCA.
app.use("/api", usuariosRoutes); // IMPORTANTE : // Todas las rutas comienzan con /api
app.use("/api", productosRouters);

// MIDDLEWARE PARA CONTROLAR RUTAS NO ENCONTRADAS -> 404. SIEMPRE AL FINAL. (LO DEJO ACA PORQUE ES PARA TODAS LAS RUTAS DE LA APP)
app.use((req, res, next) => {
  res.status(404).json({
    message: `La ruta solicitada no fue encontrada: ${req.url} + ${req.method}`,
  });
});

app.listen(port, () => {
  console.log("Server Express listo, escuchando http://localhost:" + port);
});
