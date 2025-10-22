// utils/sendEmail.js
import nodemailer from "nodemailer";

export const sendEmail = async (to, subject, text) => {
  try {
    const transporter = nodemailer.createTransport({
      service: "gmail", // or any SMTP
      auth: {
        user: "dattatraypatap3@gmail.com",
        pass: "rwgk ifcs ycac fivs" // use app password for Gmail
      }
    });

    await transporter.sendMail({
      from: '"DigitalB2B" <${process.env.EMAIL_USER}>',
      to,
      subject,
      text
    });

    console.log("Email sent successfully to", to);
  } catch (err) {
    console.error("Error sending email:", err.message);
  }
};
