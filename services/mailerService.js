import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: process.env.SMTP_PORT,
  secure: process.env.SMTP_PORT === '465', // true for 465, false for other ports
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASSWORD,
  },
});

// Verify transporter connection
transporter.verify((error, success) => {
  if (error) {
    console.error('✗ Nodemailer configuration error:', error.message);
  } else {
    console.log('✓ Nodemailer is ready to send emails');
  }
});

export const sendOTPEmail = async (email, otp, fullName) => {
  try {
    const mailOptions = {
      from: `${process.env.SMTP_FROM_NAME} <${process.env.SMTP_FROM_EMAIL}>`,
      to: email,
      subject: 'Your Password Reset Code - BeCults',
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <style>
              body { font-family: Arial, sans-serif; background-color: #f4f4f4; }
              .container { max-width: 600px; margin: 0 auto; background-color: white; padding: 20px; border-radius: 8px; }
              .header { text-align: center; color: #333; }
              .content { margin: 20px 0; color: #666; }
              .otp-box { background-color: #f0f0f0; padding: 20px; text-align: center; border-radius: 8px; margin: 20px 0; }
              .otp-code { font-size: 32px; font-weight: bold; color: #007bff; letter-spacing: 5px; }
              .footer { text-align: center; color: #999; font-size: 12px; margin-top: 20px; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1>Password Reset Request</h1>
              </div>
              <div class="content">
                <p>Hi ${fullName},</p>
                <p>You requested a password reset. Use the verification code below to reset your password:</p>
              </div>
              <div class="otp-box">
                <p class="otp-code">${otp}</p>
              </div>
              <div class="content">
                <p><strong>⏱️ This code expires in 10 minutes</strong></p>
                <p>If you didn't request this reset, please ignore this email and your account will remain secure.</p>
              </div>
              <div class="footer">
                <p>&copy; 2026 BeCults. All rights reserved.</p>
              </div>
            </div>
          </body>
        </html>
      `,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('✓ Email sent:', info.response);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('✗ Error sending email:', error.message);
    throw error;
  }
};

export const sendWelcomeEmail = async (email, fullName) => {
  try {
    const mailOptions = {
      from: `${process.env.SMTP_FROM_NAME} <${process.env.SMTP_FROM_EMAIL}>`,
      to: email,
      subject: 'Welcome to BeCults!',
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <style>
              body { font-family: Arial, sans-serif; background-color: #f4f4f4; }
              .container { max-width: 600px; margin: 0 auto; background-color: white; padding: 20px; border-radius: 8px; }
              .header { text-align: center; color: #333; }
              .content { margin: 20px 0; color: #666; }
              .button { display: inline-block; background-color: #007bff; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
              .footer { text-align: center; color: #999; font-size: 12px; margin-top: 20px; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1>Welcome to BeCults! 🎉</h1>
              </div>
              <div class="content">
                <p>Hi ${fullName},</p>
                <p>Welcome to BeCults! We're thrilled to have you as part of our community.</p>
                <p>Your account has been successfully created. You can now log in and start exploring all the amazing features we have to offer.</p>
              </div>
              <div style="text-align: center;">
                <a href="${process.env.FRONTEND_URL}/login" class="button">Go to BeCults</a>
              </div>
              <div class="content">
                <p>If you have any questions, feel free to reach out to our support team.</p>
              </div>
              <div class="footer">
                <p>&copy; 2026 BeCults. All rights reserved.</p>
              </div>
            </div>
          </body>
        </html>
      `,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('✓ Welcome email sent:', info.response);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('✗ Error sending welcome email:', error.message);
    throw error;
  }
};

export const sendOAuthWelcomeEmail = async (email, fullName, provider) => {
  try {
    const mailOptions = {
      from: `${process.env.SMTP_FROM_NAME} <${process.env.SMTP_FROM_EMAIL}>`,
      to: email,
      subject: 'Welcome to BeCults via ' + provider + '!',
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <style>
              body { font-family: Arial, sans-serif; background-color: #f4f4f4; }
              .container { max-width: 600px; margin: 0 auto; background-color: white; padding: 20px; border-radius: 8px; }
              .header { text-align: center; color: #333; }
              .content { margin: 20px 0; color: #666; }
              .button { display: inline-block; background-color: #007bff; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
              .footer { text-align: center; color: #999; font-size: 12px; margin-top: 20px; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1>Welcome to BeCults! 🎉</h1>
              </div>
              <div class="content">
                <p>Hi ${fullName},</p>
                <p>Welcome to BeCults! Your account has been successfully created using ${provider}.</p>
                <p>You're all set to start exploring our amazing features and community.</p>
              </div>
              <div style="text-align: center;">
                <a href="${process.env.FRONTEND_URL}" class="button">Explore BeCults</a>
              </div>
              <div class="footer">
                <p>&copy; 2026 BeCults. All rights reserved.</p>
              </div>
            </div>
          </body>
        </html>
      `,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('✓ OAuth welcome email sent:', info.response);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('✗ Error sending OAuth welcome email:', error.message);
    throw error;
  }
};

export const sendAdminInvitationEmail = async (email, password, inviterName) => {
  try {
    const mailOptions = {
      from: `${process.env.SMTP_FROM_NAME} <${process.env.SMTP_FROM_EMAIL}>`,
      to: email,
      subject: 'Admin Access Invitation - BeCults',
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <style>
              body { font-family: Arial, sans-serif; background-color: #f4f4f4; }
              .container { max-width: 600px; margin: 0 auto; background-color: white; padding: 30px; border-radius: 8px; }
              .header { text-align: center; color: #333; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 20px; border-radius: 8px 8px 0 0; margin: -30px -30px 20px -30px; }
              .header h1 { color: white; margin: 0; }
              .content { margin: 20px 0; color: #666; line-height: 1.6; }
              .credentials-box { background-color: #f8f9fa; border-left: 4px solid #667eea; padding: 20px; margin: 20px 0; border-radius: 4px; }
              .credential-item { margin: 10px 0; }
              .credential-label { font-weight: bold; color: #333; }
              .credential-value { font-family: monospace; background-color: white; padding: 8px 12px; border-radius: 4px; display: inline-block; margin-top: 5px; color: #667eea; font-weight: bold; }
              .button { display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
              .warning-box { background-color: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 20px 0; border-radius: 4px; }
              .footer { text-align: center; color: #999; font-size: 12px; margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1>🔐 Admin Access Invitation</h1>
              </div>
              <div class="content">
                <p>Hello,</p>
                <p>You have been invited by <strong>${inviterName}</strong> to join BeCults as an administrator.</p>
                <p>Your admin account has been created. Please use the credentials below to log in:</p>
              </div>
              <div class="credentials-box">
                <div class="credential-item">
                  <div class="credential-label">Email:</div>
                  <div class="credential-value">${email}</div>
                </div>
                <div class="credential-item">
                  <div class="credential-label">Password:</div>
                  <div class="credential-value">${password}</div>
                </div>
              </div>
              <div style="text-align: center;">
                <a href="${process.env.FRONTEND_URL}/admin/login" class="button">Login to Admin Panel</a>
              </div>
              <div class="content">
                <p>If you have any questions or need assistance, please contact the system administrator.</p>
                <p>Welcome to the BeCults admin team!</p>
              </div>
              <div class="footer">
                <p>&copy; 2026 BeCults. All rights reserved.</p>
                <p>This is an automated message. Please do not reply to this email.</p>
              </div>
            </div>
          </body>
        </html>
      `,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('✓ Admin invitation email sent:', info.response);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('✗ Error sending admin invitation email:', error.message);
    throw error;
  }
};

export default {
  sendOTPEmail,
  sendWelcomeEmail,
  sendOAuthWelcomeEmail,
  sendAdminInvitationEmail,
};
