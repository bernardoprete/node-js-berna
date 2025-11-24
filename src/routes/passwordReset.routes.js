import { Router } from "express";
import {
  forgotPassword,
  resetPasswordController,
} from "../controllers/passwordReset.controller.js";
import { validateSchema } from "../middlewares/validationSchemas.middleware.js";
import {
  forgotPasswordSchema,
  resetPasswordSchema,
} from "../schemas/passwordResetSchema.js";
import { tryAuth } from "../middlewares/auth.middleware.js";

const router = Router();

// Solicitar codigo de recuperacion
router.post(
  "/users/forgot-password",
  [tryAuth],
  validateSchema(forgotPasswordSchema),
  forgotPassword
);

// Resetear contraseña con codigo
router.post(
  "/users/reset-password",
  [tryAuth],
  validateSchema(resetPasswordSchema),
  resetPasswordController
);

export default router;
