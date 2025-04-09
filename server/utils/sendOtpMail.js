const nodemailer = require("nodemailer");

const sendOtpMail = async (email, otp) => {
  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: "shakyasrijal12@gmail.com",
      pass: "tilp iofg pbqz qzkg", // Use App Password (not your Gmail password)
    },
  });

  const mailOptions = {
    from: "FitMart <yourgmail@gmail.com>",
    to: email,
    subject: "Your OTP Code - FitMart",
    text: `Your OTP code is: ${otp}. It will expire in 5 minutes.`,
  };

  await transporter.sendMail(mailOptions);
};

module.exports = sendOtpMail;
