import { fileURLToPath } from "url";
import { transport } from "../libs/email.js";
import { createError } from "../utils/utils.js";
import fs from "fs";
import path from "path";

// Definimos la ruta relativa
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// función para cargar y procesar la plantilla HTML. 
export function getEmailTemplate(content) {
  // 1. definir la ruta del template.
  const templatePath = path.join(
    __dirname,
    "..",
    "templates",
    "email-base-template.html"
  );
  const emailTemplate = fs.readFileSync(templatePath, "utf8");
  let finalHTML = emailTemplate
    .replace("{{title}}", content.title)
    .replace("{{message}}", content.message)
    .replace("{{linkURL}}", content.link?.linkURL)
    .replace("{{linkText}}", content.link?.linkText);

  return finalHTML;
}

export async function sendEmailService(toEmail, subjet, emailContent) {
  try {
    const htmlContent = getEmailTemplate(emailContent);
    const data = await transport.sendMail({
      from: "Ecommerce Node JS <onboarding@resend.dev>",
      to: toEmail,
      subject: subjet,
      html: htmlContent, // template HTML
    });

    console.log("Email envíado correctamente:✅", data);
    return !!data;
  } catch (error) {
    console.log("Error al enviar el email ❌", error);
    if (error.status) throw error;
    throw createError(500, "Error SMTP RESEND, no se puedo enviar el email.");
  }
}
