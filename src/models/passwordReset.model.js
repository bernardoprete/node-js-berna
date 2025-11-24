import { pool } from "../db.js";
import { createError } from "../utils/utils.js";

const PasswordResetModel = {
  // Crear un nuevo codigo de recuperacion
  async createResetRequest(idUsuario, code, expires) {
    try {
      const sql = `
        INSERT INTO password_resets 
          (idUsuario, recoveryCode, expiresAt, used, created_at)
        VALUES (?, ?, ?, 0, NOW())
      `;
      const [result] = await pool.execute(sql, [idUsuario, code, expires]);
      return result.insertId;
    } catch (err) {
      throw createError(500, "Error al crear solicitud de recuperacion.");
    }
  },

  // Obtener un codigo valido (no usado y no expirado)
  async getValidCode(idUsuario, code) {
    try {
      const sql = `
        SELECT * FROM password_resets
        WHERE idUsuario = ?
        AND recoveryCode = ?
        AND used = 0
        AND expiresAt > NOW()
        ORDER BY created_at DESC
        LIMIT 1
      `;
      const [rows] = await pool.execute(sql, [idUsuario, code]);
      return rows[0];
    } catch (err) {
      throw createError(500, "Error al buscar código de recuperación.");
    }
  },

  // Marcar ese codigo como usado (ya fue enviado por mail)
  async markAsUsed(id) {
    try {
      const sql = `
        UPDATE password_resets 
        SET used = 1 
        WHERE id = ?
      `;
      await pool.execute(sql, [id]);
      return true;
    } catch (err) {
      throw createError(500, "Error al marcar el codigo como usado.");
    }
  },
};

export default PasswordResetModel;
