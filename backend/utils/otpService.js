const crypto = require('crypto');
const nodemailer = require('nodemailer');
const { mainDB } = require('../database/dbConnections');
require('dotenv').config();

// Create transporter
let transporter;

// Initialize email transporter
const initTransporter = async () => {
  if (!transporter) {
    // Check if real email is configured
    if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
      // Use real email (Gmail)
      transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASS
        }
      });
      console.log('📧 Real email configured for:', process.env.EMAIL_USER);
      
      // Verify connection
      try {
        await transporter.verify();
        console.log('✅ Email connection verified successfully');
      } catch (error) {
        console.error('❌ Email verification failed:', error.message);
        console.error('   Please check your EMAIL_PASS in .env file');
      }
    } else {
      console.log('⚠️ No email credentials found. OTP will be shown in console only.');
      return null;
    }
  }
  return transporter;
};

// Generate OTP
const generateOTP = () => {
  return crypto.randomInt(100000, 999999).toString().padStart(6, '0');
};

// Send OTP via email
const sendOTPEmail = async (email, otp, purpose = 'signup') => {
  const subject = purpose === 'signup' ? 'Email Verification' : 'Login Verification';
  const message = purpose === 'signup' 
    ? 'Thank you for registering with NexMed Healthcare! Please verify your email address.'
    : 'Use this OTP to complete your login.';

  const mailOptions = {
    from: `"NexMed Healthcare" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: `Your OTP Verification Code - ${subject}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 10px;">
        <h2 style="color: #4CAF50; text-align: center;">NexMed Healthcare Platform</h2>
        <div style="text-align: center; padding: 20px;">
          <p style="font-size: 16px; color: #333;">${message}</p>
          <div style="background-color: #f4f4f4; padding: 15px; font-size: 32px; font-weight: bold; text-align: center; letter-spacing: 5px; border-radius: 5px; margin: 20px 0;">
            ${otp}
          </div>
          <p style="color: #666; font-size: 14px;">This code will expire in <strong>10 minutes</strong>.</p>
          <p style="color: #666; font-size: 14px;">If you didn't request this, please ignore this email.</p>
        </div>
        <hr style="border: none; border-top: 1px solid #e0e0e0;">
        <small style="color: #666; display: block; text-align: center;">This is an automated message, please do not reply.</small>
      </div>
    `
  };

  const transporterInstance = await initTransporter();
  
  if (!transporterInstance) {
    // Fallback to console if no email configured
    console.log('\n🔐 =========================================');
    console.log(`🔐 OTP for ${email}: ${otp}`);
    console.log('🔐 =========================================\n');
    return { success: true, messageId: 'console-fallback' };
  }
  
  const info = await transporterInstance.sendMail(mailOptions);
  console.log(`📧 Email sent successfully to: ${email}`);
  console.log(`📧 Message ID: ${info.messageId}`);
  
  return info;
};

// Store OTP in database
const storeOTP = async (email, otp, purpose = 'signup') => {
  // Delete any existing unverified OTPs
  await new Promise((resolve, reject) => {
    mainDB.run(
      `DELETE FROM otp_verification 
       WHERE email = ? AND purpose = ? AND is_verified = 0`,
      [email, purpose],
      (err) => {
        if (err) reject(err);
        else resolve();
      }
    );
  });

  // Store new OTP
  const expiresAt = new Date();
  expiresAt.setMinutes(expiresAt.getMinutes() + 10);

  await new Promise((resolve, reject) => {
    mainDB.run(
      `INSERT INTO otp_verification (email, otp, purpose, expires_at, is_verified)
       VALUES (?, ?, ?, ?, ?)`,
      [email, otp, purpose, expiresAt.toISOString(), 0],
      (err) => {
        if (err) reject(err);
        else resolve();
      }
    );
  });
};

// Verify OTP
const verifyOTP = async (email, userOTP, purpose = 'signup') => {
  try {
    const result = await new Promise((resolve, reject) => {
      mainDB.get(
        `SELECT * FROM otp_verification 
         WHERE email = ? AND otp = ? AND purpose = ? AND is_verified = 0
         ORDER BY created_at DESC LIMIT 1`,
        [email, userOTP, purpose],
        (err, row) => {
          if (err) reject(err);
          else resolve(row);
        }
      );
    });

    if (!result) {
      return { valid: false, message: 'OTP not found or already used' };
    }

    if (new Date(result.expires_at) < new Date()) {
      await new Promise((resolve, reject) => {
        mainDB.run(
          `DELETE FROM otp_verification WHERE id = ?`,
          [result.id],
          (err) => {
            if (err) reject(err);
            else resolve();
          }
        );
      });
      return { valid: false, message: 'OTP has expired' };
    }

    await new Promise((resolve, reject) => {
      mainDB.run(
        `UPDATE otp_verification SET is_verified = 1 WHERE id = ?`,
        [result.id],
        (err) => {
          if (err) reject(err);
          else resolve();
        }
      );
    });

    return { valid: true, message: 'OTP verified successfully' };
  } catch (error) {
    console.error('Error verifying OTP:', error);
    return { valid: false, message: 'Error verifying OTP' };
  }
};

// Resend OTP
const resendOTP = async (email, purpose = 'signup') => {
  const newOTP = generateOTP();
  await storeOTP(email, newOTP, purpose);
  await sendOTPEmail(email, newOTP, purpose);
  return newOTP;
};

// Mark email as verified
const markEmailAsVerified = async (email) => {
  return new Promise((resolve, reject) => {
    mainDB.run(
      `UPDATE users SET email_verified = 1, updated_at = CURRENT_TIMESTAMP WHERE email = ?`,
      [email],
      (err) => {
        if (err) reject(err);
        else resolve();
      }
    );
  });
};

module.exports = {
  generateOTP,
  sendOTPEmail,
  storeOTP,
  verifyOTP,
  resendOTP,
  markEmailAsVerified,
  initTransporter
};