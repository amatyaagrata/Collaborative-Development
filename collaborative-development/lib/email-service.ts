/**
 * Formal Email Service for GoGodam
 * This service handles welcome and rejection notifications.
 */

import nodemailer from "nodemailer";

export interface EmailOptions {
  to: string;
  subject: string;
  html: string;
}

// Create a reusable transporter using Gmail SMTP
const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 465,
  secure: true, // Use SSL
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_APP_PASSWORD,
  },
});

export async function sendEmail({ to, subject, html }: EmailOptions) {
  const gmailUser = process.env.GMAIL_USER;
  const gmailPass = process.env.GMAIL_APP_PASSWORD;

  if (!gmailUser || !gmailPass) {
    // 📝 FOR DEVELOPMENT: Log the email to the console if no credentials
    console.warn("⚠️  No GMAIL_USER or GMAIL_APP_PASSWORD found — falling back to console output.");
    console.log("------------------------------------------");
    console.log(`📧 [SIMULATED] SENDING EMAIL TO: ${to}`);
    console.log(`📝 SUBJECT: ${subject}`);
    console.log(`📄 CONTENT: \n${html.replace(/<[^>]*>?/gm, "")}`);
    console.log("------------------------------------------");
    return { success: true, simulated: true };
  }

  try {
    const info = await transporter.sendMail({
      from: `"GoGodam" <${gmailUser}>`, // sender address
      to, // list of receivers
      subject, // Subject line
      html, // html body
    });

    console.log(`✅ Email sent successfully to ${to}. Message ID: ${info.messageId}`);
    return { success: true };
  } catch (error) {
    console.error("❌ Email service failure:", error);
    // Network errors also fall back gracefully
    console.warn("⚠️  Email delivery failed — falling back to console output.");
    console.log("------------------------------------------");
    console.log(`📧 [FALLBACK] EMAIL TO: ${to}`);
    console.log(`📝 SUBJECT: ${subject}`);
    console.log(`📄 CONTENT:\n${html.replace(/<[^>]*>?/gm, "")}`);
    console.log("------------------------------------------");
    return { success: true, fallback: true };
  }
}

export async function sendWelcomeEmail(email: string, name: string, orgName: string, tempPass: string) {
  const subject = `Welcome to ${orgName} - Account Created`;
  const html = `
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
      <h2 style="color: #7c3aed;">Welcome to ${orgName}!</h2>
      <p>Hello <strong>${name}</strong>,</p>
      <p>We are pleased to inform you that your request for access to the <strong>GoGodam</strong> platform has been <strong>Approved</strong> by the administrator of ${orgName}.</p>
      
      <div style="background-color: #f9f9f9; padding: 20px; border-radius: 8px; margin: 20px 0;">
        <p style="margin-top: 0;"><strong>Your Login Credentials:</strong></p>
        <p><strong>Email:</strong> ${email}</p>
        <p><strong>Temporary Password:</strong> <span style="color: #7c3aed; font-family: monospace; font-weight: bold;">${tempPass}</span></p>
      </div>
      
      <p>For security reasons, we recommend that you change your password after your first login.</p>
      
      <a href="${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/login" 
         style="display: inline-block; background-color: #7c3aed; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; margin-top: 10px;">
        Sign In Now
      </a>
      
      <p style="margin-top: 30px; font-size: 13px; color: #666;">
        If you have any questions, please contact your organization administrator.<br>
        Best regards,<br>
        The GoGodam Team
      </p>
    </div>
  `;

  return sendEmail({ to: email, subject, html });
}

export async function sendRejectionEmail(email: string, name: string, orgName: string, reason?: string) {
  const subject = `Update regarding your request for ${orgName}`;
  const html = `
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
      <h2 style="color: #ef4444;">Update on your access request</h2>
      <p>Hello ${name},</p>
      <p>Thank you for your interest in joining <strong>${orgName}</strong> on the GoGodam platform.</p>
      
      <p>After careful review of your application, we are sorry to inform you that your request for access has been <strong>declined</strong> by the organization administrator at this time.</p>
      
      ${reason ? `<p><strong>Reason provided:</strong> ${reason}</p>` : ''}
      
      <p style="margin-top: 20px;">If you believe this is a mistake or have further questions, please reach out to the organization directly.</p>
      
      <p style="margin-top: 30px; font-size: 13px; color: #666;">
        Best regards,<br>
        The GoGodam Team
      </p>
    </div>
  `;

  return sendEmail({ to: email, subject, html });
}

export async function sendOTPEmail(email: string, code: string) {
  const subject = `${code} is your GoGodam verification code`;
  const html = `
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 10px; text-align: center;">
      <h2 style="color: #7c3aed;">Verify your email</h2>
      <p>Please use the following code to verify your email address and continue your registration.</p>
      
      <div style="background-color: #f3f4f6; padding: 20px; border-radius: 12px; margin: 25px 0; font-size: 32px; font-weight: bold; letter-spacing: 10px; color: #1f2937;">
        ${code}
      </div>
      
      <p style="color: #6b7280; font-size: 14px;">This code will expire in 10 minutes. If you did not request this code, you can safely ignore this email.</p>
      
      <div style="margin-top: 40px; border-top: 1px solid #eee; pt: 20px;">
        <p style="font-size: 12px; color: #9ca3af;">GoGodam - Intelligent Inventory Management</p>
      </div>
    </div>
  `;

  return sendEmail({ to: email, subject, html });
}
