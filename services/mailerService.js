import dotenv from "dotenv";
import Brevo from "@getbrevo/brevo";

dotenv.config();

const apiInstance = new Brevo.TransactionalEmailsApi();
apiInstance.setApiKey(
  Brevo.TransactionalEmailsApiApiKeys.apiKey,
  process.env.BREVO_API_KEY
);

const sender = {
  email: "pavanadityakumarg2004@gmail.com", // verified sender
  name: "BeCults Team",
};

export const sendOTPEmail = async (email, otp, fullName) => {
  try {
    const emailData = {
      sender,
      to: [{ email }],
      subject: "Your Password Reset Code - BeCults",
      htmlContent: `
        <h2>Password Reset Request</h2>
        <p>Hi ${fullName},</p>
        <h1 style="letter-spacing:5px">${otp}</h1>
        <p>This code expires in 10 minutes.</p>
      `,
    };

    await apiInstance.sendTransacEmail(emailData);
    console.log("✓ OTP Email sent");
    return { success: true };
  } catch (error) {
    console.error("✗ OTP Email error:", error.response?.body || error);
    throw error;
  }
};

export const sendWelcomeEmail = async (email, fullName) => {
  try {
    await apiInstance.sendTransacEmail({
      sender,
      to: [{ email }],
      subject: "Welcome to BeCults!",
      htmlContent: `
        <h1>Welcome to BeCults 🎉</h1>
        <p>Hi ${fullName},</p>
        <a href="${process.env.FRONTEND_URL}/login">Login Now</a>
      `,
    });

    console.log("✓ Welcome email sent");
  } catch (error) {
    console.error("✗ Welcome email error:", error.response?.body || error);
    throw error;
  }
};

export const sendOAuthWelcomeEmail = async (email, fullName, provider) => {
  try {
    await apiInstance.sendTransacEmail({
      sender,
      to: [{ email }],
      subject: `Welcome via ${provider}!`,
      htmlContent: `
        <h1>Welcome to BeCults 🎉</h1>
        <p>Hi ${fullName},</p>
        <p>Account created using ${provider}.</p>
      `,
    });

    console.log("✓ OAuth welcome email sent");
  } catch (error) {
    console.error("✗ OAuth welcome email error:", error.response?.body || error);
    throw error;
  }
};

export const sendAdminInvitationEmail = async (email, password, inviterName) => {
  try {
    await apiInstance.sendTransacEmail({
      sender,
      to: [{ email }],
      subject: "Admin Access Invitation - BeCults",
      htmlContent: `
        <h2>Admin Invitation</h2>
        <p>Invited by: ${inviterName}</p>
        <p>Email: ${email}</p>
        <p>Password: ${password}</p>
        <a href="${process.env.FRONTEND_URL}/admin/login">
          Login to Admin Panel
        </a>
      `,
    });

    console.log("✓ Admin invitation email sent");
  } catch (error) {
    console.error("✗ Admin email error:", error.response?.body || error);
    throw error;
  }
};

export default {
  sendOTPEmail,
  sendWelcomeEmail,
  sendOAuthWelcomeEmail,
  sendAdminInvitationEmail,
};
