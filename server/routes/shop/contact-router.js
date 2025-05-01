const express = require("express");
const nodemailer = require("nodemailer");
const router = express.Router();

// Check for email credentials before configuring transporter
if (!process.env.EMAIL_USERNAME || !process.env.EMAIL_PASSWORD) {
  console.error("ERROR: EMAIL_USERNAME or EMAIL_PASSWORD not set. Contact email functionality will not work.");
}

// Configure Nodemailer transporter only if credentials are available
let transporter;
if (process.env.EMAIL_USERNAME && process.env.EMAIL_PASSWORD) {
  transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.EMAIL_USERNAME,
      pass: process.env.EMAIL_PASSWORD,
    },
  });

  // Verify the transporter configuration
  transporter.verify((error, success) => {
    if (error) {
      console.error("Nodemailer configuration error:", error);
    } else {
      console.log("Nodemailer transporter is ready to send emails");
    }
  });
}

// Endpoint to handle sending messages
router.post("/send-message", async (req, res) => {
  const { name, email, message } = req.body;

  // Validate request body
  if (!name || !email || !message) {
    return res.status(400).json({
      success: false,
      message: "All fields (name, email, message) are required",
    });
  }

  // Check if transporter is available (i.e., email credentials are set)
  if (!transporter) {
    console.error("Cannot send email: Email credentials are not configured.");
    return res.status(500).json({
      success: false,
      message: "Email service is not configured. Please contact the administrator.",
    });
  }

  // Email options
  const mailOptions = {
    from: email,
    to: "shakyasrijal12@gmail.com",
    replyTo: email,
    subject: `New Contact Message from ${name} via FitMart`,
    text: `
      Name: ${name}
      Email: ${email}
      Message: ${message}
    `,
    html: `
      <h2>New Contact Message from FitMart</h2>
      <p><strong>Name:</strong> ${name}</p>
      <p><strong>Email:</strong> ${email}</p>
      <p><strong>Message:</strong> ${message}</p>
    `,
  };

  try {
    // Send email
    const info = await transporter.sendMail(mailOptions);
    console.log("Message sent successfully. Message ID:", info.messageId);
    return res.status(200).json({
      success: true,
      message: "Message sent successfully",
    });
  } catch (error) {
    console.error("Error sending email:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to send message",
      error: error.message,
    });
  }
});

module.exports = router;