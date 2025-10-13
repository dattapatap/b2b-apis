// utils/sendEmail.js
import nodemailer from "nodemailer";

export const sendEmail = async (to, subject, text) => {
  try {
    const transporter = nodemailer.createTransport({
      service: "gmail", // or any SMTP
      auth: {
        user: "your_email@gmail.com",
        pass: "your_app_password" // use app password for Gmail
      }
    });

    await transporter.sendMail({
      from: '"DigitalB2B" <your_email@gmail.com>',
      to,
      subject,
      text
    });

    console.log("Email sent successfully to", to);
  } catch (err) {
    console.error("Error sending email:", err.message);
  }
};
