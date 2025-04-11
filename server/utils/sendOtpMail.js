const nodemailer = require("nodemailer");

/**
 * Sends an OTP verification email to the user
 * @param {string} email - User's email address
 * @param {number|string} otp - OTP code to be sent
 * @param {string} userName - User's name for personalized greeting
 * @returns {Promise<boolean>} - Success status of email sending
 */
const sendOtpMail = async (email, otp, userName) => {
  try {
    // Log the values being used (for debugging)
    console.log("Sending OTP email with:", {
      to: email,
      userName: userName,
      // Update these to match your .env file
      emailUser: process.env.EMAIL_USERNAME ? "Set (hidden)" : "NOT SET",  // Changed
      emailPass: process.env.EMAIL_PASSWORD ? "Set (hidden)" : "NOT SET"   // Changed
    });

    // Create nodemailer transporter
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        // Change these to match your .env variable names
        user: process.env.EMAIL_USERNAME,  // Changed from EMAIL_USER
        pass: process.env.EMAIL_PASSWORD,  // Changed from EMAIL_PASS
      },
    });

    // Create email template with userName
    const mailOptions = {
      from: '"FitMart" <noreply@fitmart.com>',
      to: email,
      subject: "Your OTP Code - FitMart",
      html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;">
        <h2 style="color: #4a4a4a;">Hello ${userName || 'Valued Customer'},</h2>
        <h3 style="color: #4a4a4a;">Welcome to FitMart!</h3>
        <p>Thank you for registering with FitMart! Please use the following OTP code to verify your email address:</p>
        <div style="padding: 10px; background-color: #f5f5f5; border-radius: 4px; text-align: center; font-size: 24px; letter-spacing: 5px; font-weight: bold; margin: 20px 0;">
          ${otp}
        </div>
        <p style="color: #777;">This code will expire in 5 minutes.</p>
        <p style="color: #777; font-size: 12px; margin-top: 30px;">If you didn't request this email, please ignore it.</p>
      </div>
      `,
    };

    // Send mail and wait for result
    const info = await transporter.sendMail(mailOptions);
    
    console.log(`OTP sent successfully to ${email}, messageId: ${info.messageId}`);
    return true;
  } catch (error) {
    console.error("Error sending OTP email:", error);
    // Return false instead of throwing, to handle failures gracefully
    return false;
  }
};

module.exports = sendOtpMail;