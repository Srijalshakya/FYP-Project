const nodemailer = require("nodemailer");

// Messages for admin-triggered status updates (same as before)
const getAdminOrderStatusMessage = (orderStatus, userName, equipment) => {
  switch (orderStatus.toLowerCase()) {
    case "pending":
      return `
        Hello ${userName || "Valued Customer"},<br /><br />
        Your order for <strong>${equipment}</strong> has been received and is currently pending confirmation.<br />
        We’ll notify you once it’s processed. Thank you for choosing FitMart!
      `;
    case "processing":
      return `
        Hello ${userName || "Valued Customer"},<br /><br />
        Your order for <strong>${equipment}</strong> is now being processed.<br />
        We’re preparing your items for shipment. You’ll receive another update soon. Thank you for shopping with FitMart!
      `;
    case "inprocess":
      return `
        Hello ${userName || "Valued Customer"},<br /><br />
        Your order for <strong>${equipment}</strong> is in process.<br />
        We’re working on getting your items ready. Stay tuned for more updates. Thank you for choosing FitMart!
      `;
    case "inshipping":
      return `
        Hello ${userName || "Valued Customer"},<br /><br />
        Great news! Your order for <strong>${equipment}</strong> is being shipped.<br />
        You will receive your products soon at your doorstep. Thank you for shopping with FitMart!
      `;
    case "shipped":
      return `
        Hello ${userName || "Valued Customer"},<br /><br />
        Your order for <strong>${equipment}</strong> has been shipped!<br />
        It’s on its way to you and should arrive shortly. Thank you for choosing FitMart!
      `;
    case "delivered":
      return `
        Hello ${userName || "Valued Customer"},<br /><br />
        Your order for <strong>${equipment}</strong> has been delivered successfully!<br />
        We hope you enjoy your purchase. Thank you for shopping with FitMart!
      `;
    case "cancelled":
      return `
        Hello ${userName || "Valued Customer"},<br /><br />
        We’re sorry to inform you that your order for <strong>${equipment}</strong> has been cancelled.<br />
        If you have any questions, please contact our support team. Thank you for choosing FitMart.
      `;
    case "rejected":
      return `
        Hello ${userName || "Valued Customer"},<br /><br />
        We regret to inform you that your order for <strong>${equipment}</strong> has been rejected due to unforeseen circumstances.<br />
        Please contact our support team for more details. Thank you for understanding.
      `;
    case "confirmed":
      return `
        Hello ${userName || "Valued Customer"},<br /><br />
        Your order for <strong>${equipment}</strong> has been confirmed!<br />
        We’re now preparing your items for shipment. Thank you for shopping with FitMart!
      `;
    default:
      return `
        Hello ${userName || "Valued Customer"},<br /><br />
        Your order for <strong>${equipment}</strong> has been updated to "${orderStatus}".<br />
        Thank you for choosing FitMart!
      `;
  }
};

// Messages for customer-triggered actions (place or cancel)
const getCustomerOrderMessage = (orderStatus, userName, equipment) => {
  switch (orderStatus.toLowerCase()) {
    case "pending": // When customer places an order
      return `
        Hello ${userName || "Valued Customer"},<br /><br />
        Your order for <strong>${equipment}</strong> has been placed successfully!<br />
        Thank you for shopping with us!
      `;
    case "cancelled": // When customer cancels an order
      return `
        Hello ${userName || "Valued Customer"},<br /><br />
        Your order for <strong>${equipment}</strong> has been cancelled successfully.<br />
        Thank you for choosing FitMart!
      `;
    case "confirmed": // After successful payment
      return `
        Hello ${userName || "Valued Customer"},<br /><br />
        Payment successful, your order for <strong>${equipment}</strong> has been placed successfully.<br />
        We will reach you back soon. Thank you!
      `;
    default:
      // Fallback to admin message if status is unexpected for customer action
      return getAdminOrderStatusMessage(orderStatus, userName, equipment);
  }
};

const sendOrderStatusEmail = async ({ email, userName, orderId, orderStatus, equipment, triggeredBy = "admin" }) => {
  try {
    console.log("Sending order status email with:", {
      to: email,
      userName,
      orderId,
      orderStatus,
      equipment,
      triggeredBy,
      emailUser: process.env.EMAIL_USERNAME ? "Set (hidden)" : "NOT SET",
      emailPass: process.env.EMAIL_PASSWORD ? "Set (hidden)" : "NOT SET",
    });

    if (!email) {
      console.error("No email provided for sending order status email.");
      return false;
    }

    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USERNAME,
        pass: process.env.EMAIL_PASSWORD,
      },
    });

    // Verify the transporter configuration
    await transporter.verify();
    console.log("SMTP transporter verified successfully for email:", email);

    const orderIdString = orderId.toString(); // Convert ObjectId to string

    // Choose the message based on who triggered the email
    const statusMessage = triggeredBy === "customer"
      ? getCustomerOrderMessage(orderStatus, userName, equipment)
      : getAdminOrderStatusMessage(orderStatus, userName, equipment);

    console.log("Generated email message:", statusMessage);

    const mailOptions = {
      from: '"FitMart" <noreply@fitmart.com>',
      to: email,
      subject: `Order Status Update - Order #${orderIdString.slice(-6)}`,
      html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px; background-color: #f9f9f9;">
        <div style="text-align: center; margin-bottom: 20px;">
          <h1 style="color: #4a4a4a; font-size: 24px; margin: 0;">FitMart</h1>
          <p style="color: #777; font-size: 14px; margin: 5px 0;">Your Trusted Gym Equipment Store</p>
        </div>
        <h3 style="color: #4a4a4a; font-size: 18px; margin-bottom: 15px;">Order Status Update</h3>
        <p style="color: #4a4a4a; font-size: 16px; margin-bottom: 10px;">
          Order ID: <strong>#${orderIdString.slice(-6)}</strong>
        </p>
        <div style="padding: 15px; background-color: #ffffff; border-radius: 5px; text-align: center; font-size: 18px; font-weight: bold; margin: 20px 0; border: 1px solid #e0e0e0;">
          <span style="color: #4a4a4a;">Equipment:</span> ${equipment}<br />
          <span style="color: #4a4a4a;">Status:</span> 
          <span style="color: ${
            orderStatus === "delivered" ? "#28a745" : 
            orderStatus === "cancelled" ? "#dc3545" : 
            orderStatus === "shipped" || orderStatus === "inShipping" ? "#007bff" : 
            "#6c757d"
          };">
            ${orderStatus.charAt(0).toUpperCase() + orderStatus.slice(1)}
          </span>
        </div>
        <p style="color: #4a4a4a; font-size: 16px; margin-bottom: 15px;">
          ${statusMessage}
        </p>
        <p style="color: #4a4a4a; font-size: 16px; margin-bottom: 20px;">
          If you have any questions, feel free to contact our support team at 
          <a href="mailto:support@fitmart.com" style="color: #007bff;">support@fitmart.com</a>.
        </p>
        <div style="text-align: center; margin-top: 30px;">
          <p style="color: #777; font-size: 12px;">© ${new Date().getFullYear()} FitMart. All rights reserved.</p>
          <p style="color: #777; font-size: 12px;">This is an automated email, please do not reply directly.</p>
        </div>
      </div>
      `,
    };

    console.log("Mail options prepared:", {
      from: mailOptions.from,
      to: mailOptions.to,
      subject: mailOptions.subject,
    });

    const info = await transporter.sendMail(mailOptions);
    console.log(`Order status email sent successfully to ${email}, messageId: ${info.messageId}`);
    return true;
  } catch (error) {
    console.error("Error sending order status email:", error.message);
    console.error("SMTP configuration:", {
      user: process.env.EMAIL_USERNAME ? "Set (hidden)" : "NOT SET",
      pass: process.env.EMAIL_PASSWORD ? "Set (hidden)" : "NOT SET",
    });
    console.error("Full error details:", error);
    return false;
  }
};

module.exports = sendOrderStatusEmail;