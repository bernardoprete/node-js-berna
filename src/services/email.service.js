import { transport } from "../libs/email.js";
import { createError } from "../utils/utils.js";

export async function sendEmailService(toEmail, subjet, htmlContent) {
  try {
    const data = await transport.sendMail({
      from: "Ecommerce Node JS <onboarding@resend.dev>",
      to: toEmail,
      subject: subjet,
      html: htmlContent,
    });

    console.log("Email envíado correctamente:✅", data);
    return !!data;
  } catch (error) {
    console.log("Error al enviar el email ❌", error);
    if (error.status) throw error;
    throw createError(500, "Error SMTP RESEND, no se puedo enviar el email.");
  }
}
