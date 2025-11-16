import nodemailer from "nodemailer";

export const transport = nodemailer.createTransport({
  host: "smtp.resend.com",
  port: 587,
  auth: {
    user: "resend",
    pass: "re_c2XiqW1S_AxThVfcynhPkUb5WdpPFU4CS",
  },
});
