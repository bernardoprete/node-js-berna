import dotenv from "dotenv";
import express from "express";
import cookieParser from "cookie-parser";
import usersRoutes from "./routes/users.routes.js";
import brandRoutes from "./routes/brand.routes.js";
import categoryRoutes from "./routes/category.routes.js";
import productRoutes from "./routes/product.routes.js";
import cartRoutes from "./routes/cart.routes.js";
import orderRoutes from "./routes/order.routes.js";
import addressRoutes from "./routes/address.routes.js"
import passwordResetRoutes from "./routes/passwordReset.routes.js"



dotenv.config();

const app = express();
const port = process.env.PORT || 3000; // VARIABLES DE ENTORNO que tienen info sensible y que estan guardadas en la raiz de la app en archivo .env - En este caso el puerto.

// me permite parsear el body a JSON, directamente me asigna la data dentro de req.body
app.use(express.json());
// me permite parsear formularios HTML.
app.use(express.urlencoded({ extended: true }));
// Middleware para parsear cookies
app.use(cookieParser());

// middleware personalizado.
app.use((req, res, next) => {
  console.log(`URL Solicitada: ${req.url} - Método: ${req.method}`);
  next();
});

//RUTAS
app.use("/api", usersRoutes);
app.use("/api", brandRoutes);
app.use("/api", categoryRoutes);
app.use("/api", productRoutes);
app.use("/api", cartRoutes);
app.use("/api", orderRoutes);
app.use("/api", addressRoutes);
app.use("/api", passwordResetRoutes);







// MIDDLEWARE PARA CONTROLAR RUTAS NO ENCONTRADAS -> 404. SIEMPRE AL FINAL.
app.use((req, res, next) => {
  res.status(404).json({
    message: `La ruta solicitada no fue encontrada: ${req.url} + ${req.method}`,
  });
});

// Manejador de errores
app.use((err, req, res, next) => {
  console.log("----- Middleware manejador de errores ----");
  console.log(`URL Solicitada: ${req.url} - Método: ${req.method}`);
  console.log("Stack trace:", err.stack); // especifica donde ocurrio el error

  // Especificar el codigo de estado de la respuesta
  const statusCode = err.status || 500;

  // enviar la respuesta al cliente
  res.status(statusCode).json({
    error: {
      message: err.message || "Error interno del servidor",
      // stack: err.stack // debemos identificar si estamos en etapa de desarrollo o produccion.
    },
  });
});

app.listen(port, () => {
  console.log("Server Express listo, escuchando http://localhost:" + port);
});
