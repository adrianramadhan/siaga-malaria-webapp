import { type NextRequest, NextResponse } from "next/server";
import nodemailer from "nodemailer";

export async function POST(request: NextRequest) {
  try {
    // Parse request body
    let body;
    try {
      body = await request.json();
    } catch (parseError) {
      console.error("Error parsing request body:", parseError);
      return NextResponse.json(
        { error: "Invalid request body" },
        { status: 400 }
      );
    }

    const {
      name,
      email,
      phone,
      organization,
      role,
      subject,
      message,
      newsletter,
    } = body;

    // Validate required fields
    if (!name || !email || !subject || !message) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: "Invalid email format" },
        { status: 400 }
      );
    }

    // Check if environment variables are set
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASSWORD) {
      console.error("Email environment variables not configured");
      return NextResponse.json(
        { error: "Email service not configured" },
        { status: 500 }
      );
    }

    // Create transporter with error handling
    let transporter;
    try {
      transporter = nodemailer.createTransport({
        service: "gmail",
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASSWORD,
        },
      });

      // Verify transporter configuration
      await transporter.verify();
    } catch (transporterError) {
      console.error("Error creating email transporter:", transporterError);
      return NextResponse.json(
        { error: "Email service configuration error" },
        { status: 500 }
      );
    }

    // Email content for the admin
    const adminEmailContent = `
<!DOCTYPE html>
<html>
<head>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background-color: #15803d; color: white; padding: 20px; text-align: center; }
        .content { padding: 20px; background-color: #f9f9f9; }
        .field { margin-bottom: 15px; }
        .label { font-weight: bold; color: #15803d; }
        .value { margin-top: 5px; }
        .footer { text-align: center; padding: 20px; font-size: 12px; color: #666; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h2>🔬 Siaga Malaria Nusantara - New Contact Form Submission</h2>
        </div>
        <div class="content">
            <div class="field">
                <div class="label">Name:</div>
                <div class="value">${name}</div>
            </div>
            <div class="field">
                <div class="label">Email:</div>
                <div class="value">${email}</div>
            </div>
            ${
              phone
                ? `<div class="field"><div class="label">Phone:</div><div class="value">${phone}</div></div>`
                : ""
            }
            ${
              organization
                ? `<div class="field"><div class="label">Organization:</div><div class="value">${organization}</div></div>`
                : ""
            }
            ${
              role
                ? `<div class="field"><div class="label">Role:</div><div class="value">${role}</div></div>`
                : ""
            }
            <div class="field">
                <div class="label">Subject:</div>
                <div class="value">${subject}</div>
            </div>
            <div class="field">
                <div class="label">Message:</div>
                <div class="value" style="white-space: pre-wrap;">${message}</div>
            </div>
            <div class="field">
                <div class="label">Newsletter Subscription:</div>
                <div class="value">${newsletter ? "Yes" : "No"}</div>
            </div>
            <div class="field">
                <div class="label">Submitted at:</div>
                <div class="value">${new Date().toLocaleString("id-ID", {
                  timeZone: "Asia/Jakarta",
                })}</div>
            </div>
        </div>
        <div class="footer">
            <p>This email was sent from the Siaga Malaria Nusantara contact form.</p>
        </div>
    </div>
</body>
</html>
    `;

    // Email content for auto-reply to user
    const userEmailContent = `
<!DOCTYPE html>
<html>
<head>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background-color: #15803d; color: white; padding: 20px; text-align: center; }
        .content { padding: 20px; }
        .footer { text-align: center; padding: 20px; font-size: 12px; color: #666; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h2>🔬 Thank you for contacting Siaga Malaria Nusantara</h2>
        </div>
        <div class="content">
            <p>Dear ${name},</p>
            <p>Thank you for reaching out to us regarding: <strong>${subject}</strong></p>
            <p>We have received your message and our team will review it carefully. We typically respond within 24 hours during business days.</p>
            <p>If your inquiry is urgent, especially if it relates to a medical emergency, please contact your local healthcare provider immediately.</p>
            <p>Best regards,<br>
            The Siaga Malaria Nusantara Team</p>
        </div>
        <div class="footer">
            <p>Siaga Malaria Nusantara - AI-powered malaria detection system</p>
            <p>This is an automated response. Please do not reply to this email.</p>
        </div>
    </div>
</body>
</html>
    `;

    try {
      // Send email to admin
      await transporter.sendMail({
        from: process.env.EMAIL_USER,
        to: "adrianramadhan881@gmail.com",
        subject: `[Siaga Malaria] New Contact Form: ${subject}`,
        html: adminEmailContent,
        replyTo: email,
      });

      // Send auto-reply to user
      await transporter.sendMail({
        from: process.env.EMAIL_USER,
        to: email,
        subject: "Thank you for contacting Siaga Malaria Nusantara",
        html: userEmailContent,
      });

      return NextResponse.json(
        {
          success: true,
          message: "Email sent successfully",
        },
        { status: 200 }
      );
    } catch (emailError) {
      console.error("Error sending email:", emailError);
      return NextResponse.json(
        {
          error: "Failed to send email",
          details: "Please try again later or contact us directly",
        },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("Unexpected error in contact API:", error);
    return NextResponse.json(
      {
        error: "Internal server error",
        message: "An unexpected error occurred",
      },
      { status: 500 }
    );
  }
}

// Handle other HTTP methods
export async function GET() {
  return NextResponse.json({ error: "Method not allowed" }, { status: 405 });
}
