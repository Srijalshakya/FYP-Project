const nodemailer = require("nodemailer");

const sendOtpMail = async (email, otp, userName, subject = "Your OTP Code - FitMart") => {
  try {
    console.log("Sending OTP email with:", {
      to: email,
      userName: userName,
      emailUser: process.env.EMAIL_USERNAME ? "Set (hidden)" : "NOT SET",
      emailPass: process.env.EMAIL_PASSWORD ? "Set (hidden)" : "NOT SET"
    });

    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USERNAME,
        pass: process.env.EMAIL_PASSWORD,
      },
    });

    const mailOptions = {
      from: '"FitMart" <noreply@fitmart.com>',
      to: email,
      subject,
      html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;">
        <h2 style="color: #4a4a4a;">Hello ${userName || 'Valued Customer'},</h2>
        <h3 style="color: #4a4a4a;">${subject === "Your OTP Code - FitMart" ? "Welcome to FitMart!" : "Password Reset Request"}</h3>
        <p>${subject === "Your OTP Code - FitMart" 
          ? "Thank you for registering with FitMart! Please use the following OTP code to verify your email address:" 
          : "Please use the following OTP code to reset your password:"}</p>
        <div style="padding: 10px; background-color: #f5f5f5; border-radius: 4px; text-align: center; font-size: 24px; letter-spacing: 5px; font-weight: bold; margin: 20px 0;">
          ${otp}
        </div>
        <p style="color: #777;">This code will expire in 5 minutes.</p>
        <p style="color: #777; font-size: 12px; margin-top: 30px;">If you didn't request this email, please ignore it.</p>
      </div>
      `,
    };

    const info = await transporter.sendMail(mailOptions);
    
    console.log(`OTP sent successfully to ${email}, messageId: ${info.messageId}`);
    return true;
  } catch (error) {
    console.error("Error sending OTP email:", error);
    return false;
  }
};

module.exports = sendOtpMail;