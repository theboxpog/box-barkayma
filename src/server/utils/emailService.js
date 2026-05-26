const nodemailer = require('nodemailer');
require('dotenv').config();
const db = require('../database');

// Helper function to get contact info from database
const getContactInfo = () => {
  return new Promise((resolve, reject) => {
    db.get('SELECT email, phone, address, email_important_message FROM contact_info WHERE id = 1', (err, row) => {
      if (err) {
        console.error('Error fetching contact info for email:', err);
        resolve({
          email: 'contact@toolrental.com',
          phone: '+972 50-123-4567',
          address: '123 Tool Street, Tel Aviv, Israel',
          email_important_message: ''
        });
      } else {
        resolve(row || {
          email: 'contact@toolrental.com',
          phone: '+972 50-123-4567',
          address: '123 Tool Street, Tel Aviv, Israel',
          email_important_message: ''
        });
      }
    });
  });
};

// Create email transporter
const createTransporter = () => {
  const user = process.env.EMAIL_USER?.trim();
  const pass = process.env.EMAIL_PASSWORD?.trim().replace(/\s+/g, '');
  if (!user || !pass) {
    console.error('⚠️  EMAIL_USER or EMAIL_PASSWORD not set in environment');
  }
  return nodemailer.createTransport({
    host: process.env.EMAIL_HOST?.trim() || 'smtp.gmail.com',
    port: parseInt(process.env.EMAIL_PORT) || 587,
    secure: false,
    auth: { user, pass },
    tls: { rejectUnauthorized: false }
  });
};

// Send signup confirmation email
const sendSignupConfirmation = async (userEmail, userName) => {
  try {
    const transporter = createTransporter();

    const mailOptions = {
      from: `"Tool Rental System" <${process.env.EMAIL_USER}>`,
      to: userEmail,
      subject: 'Welcome to Tool Rental - Signup Confirmation',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body {
              font-family: Arial, sans-serif;
              line-height: 1.6;
              color: #333;
            }
            .container {
              max-width: 600px;
              margin: 0 auto;
              padding: 20px;
            }
            .header {
              background-color: #2563eb;
              color: white;
              padding: 20px;
              text-align: center;
              border-radius: 8px 8px 0 0;
            }
            .content {
              background-color: #f9fafb;
              padding: 30px;
              border-radius: 0 0 8px 8px;
            }
            .button {
              display: inline-block;
              background-color: #2563eb;
              color: white;
              padding: 12px 30px;
              text-decoration: none;
              border-radius: 5px;
              margin: 20px 0;
            }
            .footer {
              margin-top: 20px;
              text-align: center;
              color: #6b7280;
              font-size: 12px;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Welcome to Tool Rental!</h1>
            </div>
            <div class="content">
              <h2>Hi ${userName}!</h2>
              <p>Thank you for signing up with Tool Rental. Your account has been successfully created!</p>

              <p><strong>Your account details:</strong></p>
              <ul>
                <li>Email: ${userEmail}</li>
                <li>Account Status: Active</li>
              </ul>

              <p>You can now:</p>
              <ul>
                <li>Browse our collection of tools</li>
                <li>Check tool availability</li>
                <li>Make reservations</li>
                <li>Track your rental history</li>
              </ul>

              <div style="text-align: center;">
                <a href="${process.env.FRONTEND_URL}" class="button">
                  Start Browsing Tools
                </a>
              </div>

              <p style="margin-top: 30px;">If you have any questions or need assistance, please don't hesitate to contact our support team.</p>

              <p>Happy renting!</p>
              <p><strong>The Tool Rental Team</strong></p>
            </div>
            <div class="footer">
              <p>This is an automated message, please do not reply to this email.</p>
              <p>&copy; ${new Date().getFullYear()} Tool Rental System. All rights reserved.</p>
            </div>
          </div>
        </body>
        </html>
      `
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('Signup confirmation email sent:', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('Error sending signup confirmation email:', error);
    return { success: false, error: error.message };
  }
};

// Send password reset email
const sendPasswordReset = async (userEmail, userName, resetToken) => {
  try {
    const transporter = createTransporter();
    const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`;

    const mailOptions = {
      from: `"Tool Rental System" <${process.env.EMAIL_USER}>`,
      to: userEmail,
      subject: 'Password Reset Request - Tool Rental',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body {
              font-family: Arial, sans-serif;
              line-height: 1.6;
              color: #333;
            }
            .container {
              max-width: 600px;
              margin: 0 auto;
              padding: 20px;
            }
            .header {
              background-color: #dc2626;
              color: white;
              padding: 20px;
              text-align: center;
              border-radius: 8px 8px 0 0;
            }
            .content {
              background-color: #f9fafb;
              padding: 30px;
              border-radius: 0 0 8px 8px;
            }
            .button {
              display: inline-block;
              background-color: #dc2626;
              color: white;
              padding: 12px 30px;
              text-decoration: none;
              border-radius: 5px;
              margin: 20px 0;
            }
            .footer {
              margin-top: 20px;
              text-align: center;
              color: #6b7280;
              font-size: 12px;
            }
            .warning {
              background-color: #fef2f2;
              border-left: 4px solid #dc2626;
              padding: 15px;
              margin: 20px 0;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Password Reset Request</h1>
            </div>
            <div class="content">
              <h2>Hi ${userName}!</h2>
              <p>We received a request to reset your password for your Tool Rental account.</p>

              <p>Click the button below to reset your password:</p>

              <div style="text-align: center;">
                <a href="${resetUrl}" class="button">
                  Reset Password
                </a>
              </div>

              <p style="margin-top: 20px;">Or copy and paste this link into your browser:</p>
              <p style="word-break: break-all; background-color: #e5e7eb; padding: 10px; border-radius: 5px;">
                ${resetUrl}
              </p>

              <div class="warning">
                <p><strong>⚠️ Important Security Information:</strong></p>
                <ul>
                  <li>This link will expire in <strong>1 hour</strong></li>
                  <li>If you didn't request this reset, please ignore this email</li>
                  <li>Your password will not change unless you click the link above</li>
                </ul>
              </div>

              <p style="margin-top: 30px;">If you have any questions or concerns, please contact our support team.</p>

              <p><strong>The Tool Rental Team</strong></p>
            </div>
            <div class="footer">
              <p>This is an automated message, please do not reply to this email.</p>
              <p>&copy; ${new Date().getFullYear()} Tool Rental System. All rights reserved.</p>
            </div>
          </div>
        </body>
        </html>
      `
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('Password reset email sent:', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('Error sending password reset email:', error);
    return { success: false, error: error.message };
  }
};

// Send reservation confirmation email
const sendReservationConfirmation = async (userEmail, userName, reservationDetails, totalPaid) => {
  try {
    const transporter = createTransporter();
    const contactInfo = await getContactInfo();

    // Calculate total price
    const totalPrice = reservationDetails.reduce((sum, item) => sum + item.totalPrice, 0);
    const hasCoupon = totalPaid !== undefined && totalPaid !== null && totalPaid < totalPrice;
    const isFree = totalPaid !== undefined && totalPaid !== null && totalPaid === 0;

    // Format reservation items
    const itemsHtml = reservationDetails.map(item => `
      <tr>
        <td style="padding: 12px; border-bottom: 1px solid #e5e7eb;">
          <strong>${item.toolName}</strong>
        </td>
        <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; text-align: center;">
          ${item.quantity}
        </td>
        <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; text-align: center;">
          ${item.isFixedPrice ? '—' : new Date(item.startDate).toLocaleDateString('en-GB')}
        </td>
        <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; text-align: center;">
          ${item.isFixedPrice ? 'Fixed Price' : new Date(item.endDate).toLocaleDateString('en-GB')}
        </td>
        <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; text-align: right;">
          ₪${item.totalPrice.toFixed(2)}
        </td>
      </tr>
    `).join('');

    const mailOptions = {
      from: `"Tool Rental System" <${process.env.EMAIL_USER}>`,
      to: userEmail,
      subject: 'Reservation Confirmation - Tool Rental',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body {
              font-family: Arial, sans-serif;
              line-height: 1.6;
              color: #333;
            }
            .container {
              max-width: 600px;
              margin: 0 auto;
              padding: 20px;
            }
            .header {
              background-color: #10b981;
              color: white;
              padding: 20px;
              text-align: center;
              border-radius: 8px 8px 0 0;
            }
            .content {
              background-color: #f9fafb;
              padding: 30px;
              border-radius: 0 0 8px 8px;
            }
            .reservation-table {
              width: 100%;
              background-color: white;
              border-radius: 8px;
              margin: 20px 0;
              border-collapse: collapse;
              box-shadow: 0 1px 3px rgba(0,0,0,0.1);
            }
            .reservation-table th {
              background-color: #f3f4f6;
              padding: 12px;
              text-align: left;
              font-weight: 600;
              color: #374151;
              border-bottom: 2px solid #e5e7eb;
            }
            .total-row {
              background-color: #f9fafb;
              font-weight: bold;
            }
            .button {
              display: inline-block;
              background-color: #10b981;
              color: white;
              padding: 12px 30px;
              text-decoration: none;
              border-radius: 5px;
              margin: 20px 0;
            }
            .footer {
              margin-top: 20px;
              text-align: center;
              color: #6b7280;
              font-size: 12px;
            }
            .info-box {
              background-color: #dbeafe;
              border-left: 4px solid #3b82f6;
              padding: 15px;
              margin: 20px 0;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>✅ Reservation Confirmed!</h1>
            </div>
            <div class="content">
              <h2>Hi ${userName}!</h2>
              <p>Thank you for your reservation. Your booking has been confirmed!</p>

              <h3 style="margin-top: 30px; color: #374151;">Reservation Summary:</h3>

              <table class="reservation-table">
                <thead>
                  <tr>
                    <th>Tool</th>
                    <th style="text-align: center;">Quantity</th>
                    <th style="text-align: center;">Start Date</th>
                    <th style="text-align: center;">End Date</th>
                    <th style="text-align: right;">Price</th>
                  </tr>
                </thead>
                <tbody>
                  ${itemsHtml}
                  ${hasCoupon ? `
                  <tr style="background-color: #f9fafb;">
                    <td colspan="4" style="padding: 10px 12px; text-align: right; color: #6b7280;">
                      Original Price:
                    </td>
                    <td style="padding: 10px 12px; text-align: right; color: #6b7280; text-decoration: line-through;">
                      ₪${totalPrice.toFixed(2)}
                    </td>
                  </tr>
                  <tr style="background-color: #f9fafb;">
                    <td colspan="4" style="padding: 10px 12px; text-align: right; color: #059669;">
                      Coupon Discount:
                    </td>
                    <td style="padding: 10px 12px; text-align: right; color: #059669;">
                      -₪${(totalPrice - totalPaid).toFixed(2)}
                    </td>
                  </tr>` : ''}
                  <tr class="total-row">
                    <td colspan="4" style="padding: 12px; text-align: right;">
                      <strong>${isFree ? 'Total Paid:' : 'Total:'}</strong>
                    </td>
                    <td style="padding: 12px; text-align: right;">
                      ${isFree
                        ? '<strong style="color: #059669;">FREE 🎉</strong>'
                        : `<strong>₪${(totalPaid !== undefined && totalPaid !== null ? totalPaid : totalPrice).toFixed(2)}</strong>`}
                    </td>
                  </tr>
                </tbody>
              </table>

              <div class="info-box">
                <p><strong>📋 Important Information:</strong></p>
                <ul style="margin: 10px 0;">
                  <li>Please pick up your tools on the start date</li>
                  <li>Return the tools by the end date to avoid late fees</li>
                  <li>Bring a valid ID when picking up the tools</li>
                  <li>Tools should be returned in the same condition</li>
                </ul>
              </div>

              ${contactInfo.email_important_message ? `
              <div style="background-color: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; margin: 20px 0; border-radius: 4px;">
                <p style="margin: 0; color: #92400e;"><strong>⚠️ Important Message:</strong></p>
                <p style="margin: 10px 0 0 0; color: #78350f;">${contactInfo.email_important_message}</p>
              </div>
              ` : ''}

              <div style="text-align: center;">
                <a href="${process.env.FRONTEND_URL}/dashboard" class="button">
                  View My Reservations
                </a>
              </div>

              <p style="margin-top: 30px;">If you have any questions about your reservation, please contact our support team.</p>

              <p>Thank you for choosing Tool Rental!</p>
              <p><strong>The Tool Rental Team</strong></p>
            </div>
            <div class="footer">
              <div style="background-color: #f3f4f6; padding: 15px; border-radius: 8px; margin-bottom: 15px;">
                <p style="margin: 0 0 10px 0; font-weight: bold; color: #374151;">Contact Us:</p>
                <p style="margin: 5px 0; color: #4b5563;">📧 Email: ${contactInfo.email}</p>
                <p style="margin: 5px 0; color: #4b5563;">📞 Phone: ${contactInfo.phone}</p>
                <p style="margin: 5px 0; color: #4b5563;">📍 Address: ${contactInfo.address}</p>
              </div>
              <p>This is an automated message, please do not reply to this email.</p>
              <p>&copy; ${new Date().getFullYear()} Tool Rental System. All rights reserved.</p>
            </div>
          </div>
        </body>
        </html>
      `
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('Reservation confirmation email sent:', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('Error sending reservation confirmation email:', error);
    return { success: false, error: error.message };
  }
};

// Send new reservation notification to all admins
const sendAdminReservationNotification = async (userName, userEmail, reservationDetails, totalPaid) => {
  try {
    const adminRows = await new Promise((resolve, reject) => {
      db.all("SELECT email FROM users WHERE role IN ('admin', 'subadmin')", [], (err, rows) => {
        if (err) reject(err); else resolve(rows || []);
      });
    });

    if (!adminRows.length) return { success: true, skipped: true };

    const transporter = createTransporter();
    const totalPrice = reservationDetails.reduce((sum, item) => sum + item.totalPrice, 0);
    const isFree = totalPaid !== undefined && totalPaid !== null && totalPaid === 0;
    const hasCoupon = totalPaid !== undefined && totalPaid !== null && totalPaid < totalPrice;

    const itemsHtml = reservationDetails.map(item => `
      <tr>
        <td style="padding:10px 12px;border-bottom:1px solid #e5e7eb;">${item.toolName}</td>
        <td style="padding:10px 12px;border-bottom:1px solid #e5e7eb;text-align:center;">${item.quantity}</td>
        <td style="padding:10px 12px;border-bottom:1px solid #e5e7eb;text-align:center;">
          ${item.isFixedPrice ? 'Fixed Price' : `${new Date(item.startDate).toLocaleDateString('en-GB')} → ${new Date(item.endDate).toLocaleDateString('en-GB')}`}
        </td>
        <td style="padding:10px 12px;border-bottom:1px solid #e5e7eb;text-align:right;">₪${item.totalPrice.toFixed(2)}</td>
      </tr>
    `).join('');

    const paymentLine = isFree
      ? '<strong style="color:#059669;">FREE (Coupon)</strong>'
      : hasCoupon
        ? `<span style="text-decoration:line-through;color:#9ca3af;">₪${totalPrice.toFixed(2)}</span> &rarr; <strong style="color:#059669;">₪${totalPaid.toFixed(2)}</strong>`
        : `<strong>₪${totalPaid !== undefined && totalPaid !== null ? totalPaid.toFixed(2) : totalPrice.toFixed(2)}</strong>`;

    const adminEmails = adminRows.map(r => r.email);

    const mailOptions = {
      from: `"The Box - Reservations" <${process.env.EMAIL_USER}>`,
      to: adminEmails.join(', '),
      subject: `New Reservation — ${userName}`,
      html: `
        <!DOCTYPE html><html><body style="font-family:Arial,sans-serif;color:#333;">
          <div style="max-width:600px;margin:0 auto;padding:20px;">
            <div style="background-color:#2563eb;color:white;padding:20px;border-radius:8px 8px 0 0;text-align:center;">
              <h2 style="margin:0;">📦 New Reservation</h2>
            </div>
            <div style="background:#f9fafb;padding:24px;border-radius:0 0 8px 8px;">
              <p><strong>Customer:</strong> ${userName} (${userEmail})</p>
              <table style="width:100%;border-collapse:collapse;background:white;border-radius:8px;margin:16px 0;">
                <thead>
                  <tr style="background:#f3f4f6;">
                    <th style="padding:10px 12px;text-align:left;border-bottom:2px solid #e5e7eb;">Tool</th>
                    <th style="padding:10px 12px;text-align:center;border-bottom:2px solid #e5e7eb;">Qty</th>
                    <th style="padding:10px 12px;text-align:center;border-bottom:2px solid #e5e7eb;">Period</th>
                    <th style="padding:10px 12px;text-align:right;border-bottom:2px solid #e5e7eb;">Price</th>
                  </tr>
                </thead>
                <tbody>${itemsHtml}</tbody>
              </table>
              <p style="text-align:right;font-size:16px;">
                <strong>Paid:</strong> ${paymentLine}
              </p>
              <div style="text-align:center;margin-top:20px;">
                <a href="${process.env.FRONTEND_URL}/admin" style="background:#2563eb;color:white;padding:10px 24px;border-radius:5px;text-decoration:none;font-weight:bold;">
                  Open Admin Dashboard
                </a>
              </div>
            </div>
          </div>
        </body></html>
      `
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('✅ Admin reservation notification sent to:', adminEmails.join(', '));
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('⚠️ Failed to send admin reservation notification:', error);
    return { success: false, error: error.message };
  }
};

// Send contact form email
const sendContactEmail = async (name, email, subject, message) => {
  try {
    const transporter = createTransporter();

    const mailOptions = {
      from: `"Tool Rental System" <${process.env.EMAIL_USER}>`,
      to: process.env.EMAIL_USER, // Send to admin
      replyTo: email, // User's email
      subject: `Contact Form: ${subject}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body {
              font-family: Arial, sans-serif;
              line-height: 1.6;
              color: #333;
            }
            .container {
              max-width: 600px;
              margin: 0 auto;
              padding: 20px;
            }
            .header {
              background-color: #3b82f6;
              color: white;
              padding: 20px;
              text-align: center;
              border-radius: 8px 8px 0 0;
            }
            .content {
              background-color: #f9fafb;
              padding: 30px;
              border-radius: 0 0 8px 8px;
            }
            .info-box {
              background-color: #e0f2fe;
              border-left: 4px solid #3b82f6;
              padding: 15px;
              margin: 20px 0;
            }
            .message-box {
              background-color: white;
              border: 1px solid #e5e7eb;
              padding: 20px;
              border-radius: 5px;
              margin: 20px 0;
            }
            .footer {
              margin-top: 20px;
              text-align: center;
              color: #6b7280;
              font-size: 12px;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>📧 New Contact Form Submission</h1>
            </div>
            <div class="content">
              <div class="info-box">
                <p><strong>From:</strong> ${name}</p>
                <p><strong>Email:</strong> ${email}</p>
                <p><strong>Subject:</strong> ${subject}</p>
              </div>

              <h3 style="color: #374151;">Message:</h3>
              <div class="message-box">
                <p style="white-space: pre-wrap;">${message}</p>
              </div>

              <p style="margin-top: 30px; font-size: 14px; color: #6b7280;">
                You can reply directly to this email to respond to ${name}.
              </p>
            </div>
            <div class="footer">
              <p>This message was sent from the Tool Rental contact form.</p>
              <p>&copy; ${new Date().getFullYear()} Tool Rental System. All rights reserved.</p>
            </div>
          </div>
        </body>
        </html>
      `
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('Contact form email sent:', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('Error sending contact form email:', error);
    return { success: false, error: error.message };
  }
};

module.exports = {
  sendSignupConfirmation,
  sendPasswordReset,
  sendReservationConfirmation,
  sendAdminReservationNotification,
  sendContactEmail
};
