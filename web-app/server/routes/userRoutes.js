const express = require('express');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const User = require('../models/User');
const Cart = require('../models/Cart');
const { protect } = require('../middleware/auth');
const sendEmail = require('../utils/sendEmail');

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
  throw new Error('Missing JWT_SECRET environment variable');
}

const hashOtp = (otp) => crypto.createHash('sha256').update(otp).digest('hex');
const signupOtpStore = new Map();
const escapeRegex = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const base64UrlEncode = (value) =>
  Buffer.from(String(value), 'utf8')
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/g, '');

const base64UrlDecode = (value) => {
  const raw = String(value || '')
    .replace(/-/g, '+')
    .replace(/_/g, '/');
  const pad = raw.length % 4 === 0 ? '' : '='.repeat(4 - (raw.length % 4));
  return Buffer.from(raw + pad, 'base64').toString('utf8');
};

const getSafeRedirectPath = (intendedUrl, fallback = '/') => {
  if (!intendedUrl || typeof intendedUrl !== 'string') return fallback;
  const redirectUrl = intendedUrl.trim();
  const isLoginRoute =
    redirectUrl === '/login' ||
    redirectUrl.startsWith('/login?') ||
    redirectUrl.startsWith('/login#');

  if (!redirectUrl.startsWith('/') || redirectUrl.startsWith('//') || isLoginRoute) {
    return fallback;
  }

  return redirectUrl;
};

const httpsRequestJson = (url, { method = 'GET', headers = {}, body } = {}) =>
  new Promise((resolve, reject) => {
    const https = require('https');
    const parsed = new URL(url);

    const req = https.request(
      {
        protocol: parsed.protocol,
        hostname: parsed.hostname,
        port: parsed.port || 443,
        path: parsed.pathname + parsed.search,
        method,
        headers
      },
      (res) => {
        let data = '';
        res.on('data', (chunk) => {
          data += chunk;
        });
        res.on('end', () => {
          const isOk = res.statusCode >= 200 && res.statusCode < 300;
          try {
            const json = data ? JSON.parse(data) : {};
            if (!isOk) {
              const err = new Error(`HTTP ${res.statusCode}`);
              err.statusCode = res.statusCode;
              err.response = json;
              return reject(err);
            }
            resolve(json);
          } catch (e) {
            const err = new Error('Invalid JSON response');
            err.statusCode = res.statusCode;
            err.raw = data;
            reject(err);
          }
        });
      }
    );

    req.on('error', reject);
    if (body) {
      req.write(body);
    }
    req.end();
  });


// Generate JWT Token
const generateToken = (id, tokenVersion = 0) => {
  return jwt.sign({ id, tokenVersion }, JWT_SECRET, {
    expiresIn: '30d'
  });
};

const authRateStore = new Map();
const authRateLimit = (req, res, next) => {
  const ip = req.headers['x-forwarded-for']?.split(',')[0]?.trim() || req.ip || req.socket?.remoteAddress || 'unknown';
  const now = Date.now();
  const windowMs = 10 * 60 * 1000;
  const maxAttempts = 25;

  const current = authRateStore.get(ip) || { count: 0, resetAt: now + windowMs };
  if (now > current.resetAt) {
    current.count = 0;
    current.resetAt = now + windowMs;
  }
  current.count += 1;
  authRateStore.set(ip, current);

  if (current.count > maxAttempts) {
    return res.status(429).json({ message: 'Too many requests. Please try again later.' });
  }

  next();
};

const getClientIp = (req) => {
  const forwarded = req.headers['x-forwarded-for'];
  if (typeof forwarded === 'string' && forwarded.trim()) {
    return forwarded.split(',')[0].trim();
  }
  return req.socket?.remoteAddress || req.ip || '';
};

const stampLoginActivity = async (user, req) => {
  user.lastLoginAt = new Date();
  user.lastLoginIp = getClientIp(req);
  user.lastLoginUserAgent = String(req.headers['user-agent'] || '').slice(0, 300);
  await user.save();
};

const validateRegistrationPayload = ({ name, email, password, phone }) => {
  if (!name || !name.trim()) return 'Full name is required';
  if (!email || !email.trim()) return 'Email is required';
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(email).trim())) return 'Please enter a valid email address';
  if (!phone || !/^\d{10}$/.test(String(phone).trim())) return 'Phone number must be exactly 10 digits';
  if (!password || password.length < 6) return 'Password must be at least 6 characters';
  return '';
};

const sendRegisterOtpEmail = async (email, otp) => {
  const subject = 'Pinqoza Email Verification OTP';
  const text = `Your Pinqoza signup OTP is ${otp}. It will expire in 10 minutes.`;
  const html = `
    <!doctype html>
    <html>
      <body style="margin:0;padding:0;background:#f1f5f9;">
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="padding:24px 12px;font-family:Arial,'Segoe UI',sans-serif;">
          <tr>
            <td align="center">
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="560" style="max-width:560px;width:100%;background:#ffffff;border:1px solid #dbeafe;border-radius:14px;">
                <tr>
                  <td style="padding:22px 24px;background:#0f172a;border-top-left-radius:14px;border-top-right-radius:14px;">
                    <div style="font-size:12px;font-weight:700;color:#93c5fd;letter-spacing:1px;text-transform:uppercase;">Pinqoza Verification</div>
                    <div style="margin-top:8px;font-size:24px;line-height:1.2;color:#ffffff;font-weight:700;">Verify Your Email</div>
                  </td>
                </tr>
                <tr>
                  <td style="padding:24px;">
                    <div style="font-size:15px;color:#334155;line-height:1.6;">Use this OTP to complete your account creation.</div>
                    <div style="margin-top:16px;padding:18px 12px;background:#f0f9ff;border:1px solid #bae6fd;border-radius:12px;text-align:center;">
                      <div style="font-size:12px;color:#0369a1;text-transform:uppercase;letter-spacing:1px;font-weight:700;">Verification Code</div>
                      <div style="margin-top:8px;font-size:36px;line-height:1;font-weight:800;letter-spacing:8px;color:#0f172a;">${otp}</div>
                    </div>
                    <div style="margin-top:16px;font-size:14px;color:#475569;">This OTP expires in <strong>10 minutes</strong>.</div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </body>
    </html>
  `;
  await sendEmail({ to: email, subject, text, html });
};

// @route   POST /api/users/register
// @desc    Register a new user
// @access  Public
router.post('/register', authRateLimit, async (req, res) => {
  try {
    const { name, email, password, phone } = req.body;

    // Check if user exists
    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ message: 'User already exists' });
    }

    // Create user
    const user = await User.create({
      name,
      email,
      password,
      phone
    });

    // Create empty cart for user
    await Cart.create({ user: user._id, items: [], totalPrice: 0, totalItems: 0 });

    // Emit real-time notification to admin
    const io = req.app.get('io');
    if (io) {
      io.emit('newUser', {
        userId: user._id,
        name: user.name,
        email: user.email,
        message: `New user registered: ${user.name}`,
        timestamp: new Date()
      });
      console.log('📡 Socket event emitted: newUser');
    }

    if (user) {
      await stampLoginActivity(user, req);
      res.status(201).json({
        _id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        isAdmin: user.isAdmin,
        token: generateToken(user._id, user.tokenVersion || 0)
      });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/users/register/send-otp
// @desc    Send signup OTP to email
// @access  Public
router.post('/register/send-otp', authRateLimit, async (req, res) => {
  try {
    const { name, email, password, phone } = req.body;
    const validationError = validateRegistrationPayload({ name, email, password, phone });
    if (validationError) {
      return res.status(400).json({ message: validationError });
    }

    const normalizedEmail = String(email).trim().toLowerCase();
    const normalizedName = String(name).trim();
    const normalizedPhone = String(phone).trim();

    const userExists = await User.findOne({ email: normalizedEmail });
    if (userExists) {
      return res.status(400).json({ message: 'User already exists' });
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    signupOtpStore.set(normalizedEmail, {
      name: normalizedName,
      email: normalizedEmail,
      phone: normalizedPhone,
      password,
      otpHash: hashOtp(otp),
      expiresAt: Date.now() + 10 * 60 * 1000
    });

    try {
      await sendRegisterOtpEmail(normalizedEmail, otp);
    } catch (mailError) {
      signupOtpStore.delete(normalizedEmail);
      console.error('Register OTP email error:', mailError);
      return res.status(500).json({ message: 'Unable to send OTP right now. Please try again later.' });
    }

    res.json({ message: 'OTP sent to your email for verification' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/users/register/verify-otp
// @desc    Verify signup OTP and create account
// @access  Public
router.post('/register/verify-otp', authRateLimit, async (req, res) => {
  try {
    const { email, otp } = req.body;
    const normalizedEmail = String(email || '').trim().toLowerCase();
    const pending = signupOtpStore.get(normalizedEmail);

    if (!pending) {
      return res.status(400).json({ message: 'No signup OTP request found. Please register again.' });
    }

    if (pending.expiresAt < Date.now()) {
      signupOtpStore.delete(normalizedEmail);
      return res.status(400).json({ message: 'OTP expired. Please request a new OTP.' });
    }

    if (!otp || hashOtp(String(otp).trim()) !== pending.otpHash) {
      return res.status(400).json({ message: 'Invalid OTP' });
    }

    const userExists = await User.findOne({ email: normalizedEmail });
    if (userExists) {
      signupOtpStore.delete(normalizedEmail);
      return res.status(400).json({ message: 'User already exists' });
    }

    const user = await User.create({
      name: pending.name,
      email: pending.email,
      password: pending.password,
      phone: pending.phone
    });

    await Cart.create({ user: user._id, items: [], totalPrice: 0, totalItems: 0 });
    signupOtpStore.delete(normalizedEmail);

    const io = req.app.get('io');
    if (io) {
      io.emit('newUser', {
        userId: user._id,
        name: user.name,
        email: user.email,
        message: `New user registered: ${user.name}`,
        timestamp: new Date()
      });
      console.log('Socket event emitted: newUser');
    }

    res.status(201).json({
      _id: user._id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      isAdmin: user.isAdmin,
      token: generateToken(user._id, user.tokenVersion || 0)
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/users/login
// @desc    Auth user & get token
// @access  Public
router.post('/login', authRateLimit, async (req, res) => {
  try {
    const { email, password } = req.body;

    const normalizedEmail = String(email || '').trim().toLowerCase();
    const user = await User.findOne({
      email: { $regex: `^${escapeRegex(normalizedEmail)}$`, $options: 'i' }
    });

    if (!user) {
      return res.status(401).json({ message: 'Invalid email' });
    }

    if (!(await user.matchPassword(password))) {
      return res.status(401).json({ message: 'Invalid password' });
    }

    await stampLoginActivity(user, req);

    res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      address: user.address,
      isAdmin: user.isAdmin,
      token: generateToken(user._id, user.tokenVersion || 0)
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/users/auth/google
// @desc    Start Google OAuth login
// @access  Public
router.get('/auth/google', async (req, res) => {
  try {
    const clientId = process.env.GOOGLE_CLIENT_ID;
    if (!clientId) {
      return res.status(500).json({ message: 'Google OAuth is not configured (missing GOOGLE_CLIENT_ID)' });
    }

    const redirectPath = getSafeRedirectPath(req.query.redirect, '/');
    const state = base64UrlEncode(JSON.stringify({ redirect: redirectPath }));

    const redirectUri =
      process.env.GOOGLE_REDIRECT_URI || `${req.protocol}://${req.get('host')}/api/users/auth/google/callback`;
    const loginHint = String(req.query.login_hint || '').trim().toLowerCase();

    const params = new URLSearchParams({
      client_id: clientId,
      redirect_uri: redirectUri,
      response_type: 'code',
      scope: 'openid email profile',
      prompt: 'select_account',
      include_granted_scopes: 'true',
      state
    });
    if (loginHint && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(loginHint)) {
      params.set('login_hint', loginHint);
    }

    res.redirect(`https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`);
  } catch (error) {
    console.error('Google OAuth start error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});


// @route   GET /api/users/auth/google/callback
// @desc    Google OAuth callback
// @access  Public
router.get('/auth/google/callback', async (req, res) => {
  const clientUrl = process.env.CLIENT_URL || 'http://localhost:3000';

  try {
    const { code, state, error } = req.query;

    if (error) {
      return res.redirect(
        `${clientUrl}/oauth/google/callback?error=${encodeURIComponent(String(error))}`
      );
    }

    if (!code) {
      return res.redirect(`${clientUrl}/oauth/google/callback?error=${encodeURIComponent('missing_code')}`);
    }

    const clientId = process.env.GOOGLE_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
    if (!clientId || !clientSecret) {
      return res.redirect(`${clientUrl}/oauth/google/callback?error=${encodeURIComponent('oauth_not_configured')}`);
    }

    const redirectUri =
      process.env.GOOGLE_REDIRECT_URI || `${req.protocol}://${req.get('host')}/api/users/auth/google/callback`;

    const tokenBody = new URLSearchParams({
      code: String(code),
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: redirectUri,
      grant_type: 'authorization_code'
    }).toString();

    const tokenResponse = await httpsRequestJson('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: tokenBody
    });

    const accessToken = tokenResponse.access_token;
    if (!accessToken) {
      return res.redirect(`${clientUrl}/oauth/google/callback?error=${encodeURIComponent('missing_access_token')}`);
    }

    const googleUser = await httpsRequestJson('https://www.googleapis.com/oauth2/v3/userinfo', {
      method: 'GET',
      headers: { Authorization: `Bearer ${accessToken}` }
    });

    const email = String(googleUser.email || '').trim().toLowerCase();
    const name = String(googleUser.name || '').trim();
    const googleId = String(googleUser.sub || '').trim();

    if (!email) {
      return res.redirect(`${clientUrl}/oauth/google/callback?error=${encodeURIComponent('missing_email')}`);
    }

    let redirectPath = '/';
    if (state) {
      try {
        const decoded = base64UrlDecode(state);
        const parsed = JSON.parse(decoded);
        redirectPath = getSafeRedirectPath(parsed.redirect, '/');
      } catch (e) {
        // ignore invalid state
      }
    }

    let user = await User.findOne({
      email: { $regex: `^${escapeRegex(email)}$`, $options: 'i' }
    });

    if (!user) {
      const registerParams = new URLSearchParams({
        google: '1',
        email,
        name: name || email.split('@')[0],
        redirect: redirectPath,
        picture: String(googleUser.picture || '')
      });
      return res.redirect(`${clientUrl}/register?${registerParams.toString()}`);
    }

    if (googleId && !user.googleId) {
      user.googleId = googleId;
      await user.save();
    }

    await stampLoginActivity(user, req);

    const token = generateToken(user._id, user.tokenVersion || 0);
    const params = new URLSearchParams({
      token,
      redirect: redirectPath,
      hint_email: email,
      hint_name: name || user.name || email.split('@')[0],
      hint_picture: String(googleUser.picture || '')
    });

    return res.redirect(`${clientUrl}/oauth/google/callback?${params.toString()}`);
  } catch (err) {
    console.error('Google OAuth callback error:', err?.response || err);
    return res.redirect(`${clientUrl}/oauth/google/callback?error=${encodeURIComponent('oauth_failed')}`);
  }
});

// @route   GET /api/users/profile
// @desc    Get user profile
// @access  Private
router.get('/profile', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-password');
    res.json(user);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PUT /api/users/profile
// @desc    Update user profile
// @access  Private
router.put('/profile', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);

    if (user) {
      user.name = req.body.name || user.name;
      user.email = req.body.email || user.email;
      user.phone = req.body.phone || user.phone;
      user.address = req.body.address || user.address;

      if (req.body.password) {
        user.password = req.body.password;
      }

      const updatedUser = await user.save();

      res.json({
        _id: updatedUser._id,
        name: updatedUser.name,
        email: updatedUser.email,
        phone: updatedUser.phone,
        address: updatedUser.address,
        isAdmin: updatedUser.isAdmin,
        token: generateToken(updatedUser._id, updatedUser.tokenVersion || 0)
      });
    } else {
      res.status(404).json({ message: 'User not found' });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/users
// @desc    Get all users
// @access  Private/Admin
router.get('/', protect, async (req, res) => {
  try {
    const users = await User.find().select('-password');
    res.json(users);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/users/delete-request
// @desc    Request account deletion (requires password, scheduled after 30 days)
// @access  Private
router.post('/delete-request', protect, async (req, res) => {
  try {
    const { password } = req.body;

    if (!password) {
      return res.status(400).json({ message: 'Password is required' });
    }

    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Verify password
    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid password' });
    }

    // Calculate delete date (30 days from now)
    const deleteAt = new Date();
    deleteAt.setDate(deleteAt.getDate() + 30);

    // Update user with delete request
    user.deleteRequestedAt = new Date();
    user.deleteAt = deleteAt;
    
    await user.save();

    res.json({ 
      message: 'Account deletion requested successfully',
      deleteAt: deleteAt
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/users/cancel-delete
// @desc    Cancel account deletion request
// @access  Private
router.post('/cancel-delete', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Check if there's a pending delete request
    if (!user.deleteRequestedAt || !user.deleteAt) {
      return res.status(400).json({ message: 'No pending deletion request' });
    }

    // Cancel the deletion request
    user.deleteRequestedAt = null;
    user.deleteAt = null;
    
    await user.save();

    res.json({ message: 'Account deletion cancelled successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/users/forgot-password
// @desc    Send password reset email
// @access  Public
router.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;
    
    const user = await User.findOne({ email });
    
    if (!user) {
      return res.status(404).json({ message: 'User not found with this email' });
    }
    
    // Get reset token
    const resetToken = user.getResetPasswordToken();
    
    await user.save();

    const clientUrl = process.env.CLIENT_URL || 'http://localhost:3000';
    const resetUrl = `${clientUrl.replace(/\/$/, '')}/reset-password/${resetToken}`;

    const subject = 'Pinqoza Password Reset';
    const text = `You requested a password reset. Please use this link to set a new password: ${resetUrl}\n\nIf you did not request this, please ignore this email.`;
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #0f172a;">Reset Your Password</h2>
        <p>You requested a password reset for your Pinqoza account.</p>
        <p>
          <a href="${resetUrl}" style="display:inline-block;padding:10px 16px;background:#0284c7;color:#fff;text-decoration:none;border-radius:8px;">
            Reset Password
          </a>
        </p>
        <p>If the button doesn't work, copy this link:</p>
        <p style="word-break: break-all;"><a href="${resetUrl}">${resetUrl}</a></p>
        <p>If you did not request this, you can safely ignore this email.</p>
      </div>
    `;

    try {
      await sendEmail({
        to: user.email,
        subject,
        text,
        html
      });
    } catch (mailError) {
      user.resetPasswordToken = undefined;
      user.resetPasswordExpire = undefined;
      await user.save();
      console.error('Forgot password email error:', mailError);
      return res.status(500).json({ message: 'Unable to send reset email right now. Please try again later.' });
    }

    res.json({ message: 'Password reset link sent to your email' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/users/logout-all-devices
// @desc    Invalidate all active sessions for this user
// @access  Private
router.post('/logout-all-devices', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    user.tokenVersion = (user.tokenVersion || 0) + 1;
    await user.save();

    res.json({ message: 'Logged out from all devices successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/users/forgot-password/send-otp
// @desc    Send password reset OTP to email
// @access  Public
router.post('/forgot-password/send-otp', async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({ message: 'User not found with this email' });
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    user.resetPasswordOtp = hashOtp(otp);
    user.resetPasswordOtpExpire = Date.now() + 10 * 60 * 1000;
    user.resetPasswordOtpVerified = false;
    await user.save();

    const subject = 'Pinqoza Password Reset OTP';
    const text = `Your Pinqoza OTP is ${otp}. It will expire in 10 minutes.`;
    const html = `
      <!doctype html>
      <html>
        <body style="margin:0;padding:0;background:#eef2ff;">
          <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background:#eef2ff;padding:24px 12px;font-family:Arial,'Segoe UI',sans-serif;">
            <tr>
              <td align="center">
                <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="560" style="width:100%;max-width:560px;background:#ffffff;border:1px solid #dbeafe;border-radius:14px;">
                  <tr>
                    <td style="padding:22px 24px;background:#0f172a;border-top-left-radius:14px;border-top-right-radius:14px;">
                      <div style="font-size:12px;font-weight:700;letter-spacing:0.8px;color:#93c5fd;text-transform:uppercase;">Pinqoza Security</div>
                      <div style="margin-top:8px;font-size:24px;line-height:1.3;font-weight:700;color:#ffffff;">Password Reset OTP</div>
                      <div style="margin-top:8px;font-size:14px;line-height:1.5;color:#bfdbfe;">Use this one-time code to reset your account password.</div>
                    </td>
                  </tr>
                  <tr>
                    <td style="padding:24px;">
                      <div style="font-size:15px;line-height:1.6;color:#334155;">Hi,</div>
                      <div style="margin-top:8px;font-size:15px;line-height:1.6;color:#334155;">
                        We received a request to reset your Pinqoza password.
                      </div>
                      <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin-top:18px;border:1px solid #bae6fd;background:#f0f9ff;border-radius:12px;">
                        <tr>
                          <td align="center" style="padding:18px 12px;">
                            <div style="font-size:12px;font-weight:700;letter-spacing:1px;color:#0369a1;text-transform:uppercase;">Verification Code</div>
                            <div style="margin-top:8px;font-size:38px;line-height:1;font-weight:800;letter-spacing:8px;color:#0f172a;">${otp}</div>
                          </td>
                        </tr>
                      </table>
                      <div style="margin-top:16px;font-size:14px;line-height:1.6;color:#475569;">
                        This code expires in <strong>10 minutes</strong>.
                      </div>
                      <div style="margin-top:6px;font-size:13px;line-height:1.6;color:#64748b;">
                        If you did not request this, please ignore this email.
                      </div>
                    </td>
                  </tr>
                  <tr>
                    <td style="padding:14px 24px;background:#f8fafc;border-top:1px solid #e2e8f0;border-bottom-left-radius:14px;border-bottom-right-radius:14px;">
                      <div style="font-size:12px;color:#64748b;">Pinqoza Support</div>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>
        </body>
      </html>
    `;

    try {
      await sendEmail({ to: user.email, subject, text, html });
    } catch (mailError) {
      console.error('Send OTP email error:', mailError);

      user.resetPasswordOtp = undefined;
      user.resetPasswordOtpExpire = undefined;
      user.resetPasswordOtpVerified = false;
      await user.save();

      const isMissingSmtpConfig = String(mailError?.message || '').includes('Missing SMTP configuration');
      const isDev = process.env.NODE_ENV !== 'production';
      const message = isMissingSmtpConfig && isDev
        ? 'Email service is not configured. Add SMTP settings in server/.env to send OTP by email.'
        : 'Unable to send OTP right now. Please try again later.';

      if (isDev) {
        const detail = String(mailError?.message || 'Unknown SMTP error');
        return res.status(500).json({ message, detail });
      }

      return res.status(500).json({ message });
    }

    res.json({ message: 'OTP sent to your email' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/users/forgot-password/verify-otp
// @desc    Verify reset OTP
// @access  Public
router.post('/forgot-password/verify-otp', async (req, res) => {
  try {
    const { email, otp } = req.body;
    const user = await User.findOne({ email });

    if (!user || !user.resetPasswordOtp || !user.resetPasswordOtpExpire) {
      return res.status(400).json({ message: 'OTP not requested or expired' });
    }

    if (user.resetPasswordOtpExpire < Date.now()) {
      user.resetPasswordOtp = undefined;
      user.resetPasswordOtpExpire = undefined;
      user.resetPasswordOtpVerified = false;
      await user.save();
      return res.status(400).json({ message: 'OTP expired. Please request a new OTP.' });
    }

    if (user.resetPasswordOtp !== hashOtp(otp)) {
      return res.status(400).json({ message: 'Invalid OTP' });
    }

    user.resetPasswordOtpVerified = true;
    await user.save();

    res.json({ message: 'OTP verified successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/users/forgot-password/reset-with-otp
// @desc    Reset password using verified OTP
// @access  Public
router.post('/forgot-password/reset-with-otp', async (req, res) => {
  try {
    const { email, otp, password } = req.body;

    if (!password || password.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters' });
    }

    const user = await User.findOne({ email });
    if (!user || !user.resetPasswordOtp || !user.resetPasswordOtpExpire) {
      return res.status(400).json({ message: 'OTP not requested or expired' });
    }

    if (user.resetPasswordOtpExpire < Date.now()) {
      user.resetPasswordOtp = undefined;
      user.resetPasswordOtpExpire = undefined;
      user.resetPasswordOtpVerified = false;
      await user.save();
      return res.status(400).json({ message: 'OTP expired. Please request a new OTP.' });
    }

    if (user.resetPasswordOtp !== hashOtp(otp)) {
      return res.status(400).json({ message: 'Invalid OTP' });
    }

    user.password = password;
    user.resetPasswordOtp = undefined;
    user.resetPasswordOtpExpire = undefined;
    user.resetPasswordOtpVerified = false;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;

    await user.save();
    res.json({ message: 'Password reset successful' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/users/reset-password/:token
// @desc    Reset password
// @access  Public
router.post('/reset-password/:token', async (req, res) => {
  try {
    const { password } = req.body;
    
    // Get hashed token
    const resetPasswordToken = crypto
      .createHash('sha256')
      .update(req.params.token)
      .digest('hex');
    
    const user = await User.findOne({
      resetPasswordToken,
      resetPasswordExpire: { $gt: Date.now() }
    });
    
    if (!user) {
      return res.status(400).json({ message: 'Invalid or expired reset token' });
    }
    
    user.password = password;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;
    
    await user.save();
    
    res.json({ message: 'Password reset successful' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/users/addresses
// @desc    Get all user addresses
// @access  Private
router.get('/addresses', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    res.json(user.addresses || []);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/users/addresses
// @desc    Add new address
// @access  Private
router.post('/addresses', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    
    const { tag, street, city, state, pincode, phone, isDefault } = req.body;
    
    // If this is set as default, unset other defaults
    if (isDefault && user.addresses) {
      user.addresses.forEach(addr => addr.isDefault = false);
    }
    
    user.addresses = user.addresses || [];
    user.addresses.push({
      tag: tag || 'home',
      street,
      city,
      state,
      pincode,
      phone,
      isDefault: isDefault || user.addresses.length === 0
    });
    
    await user.save();
    res.json(user.addresses);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PUT /api/users/addresses/:id
// @desc    Update address
// @access  Private
router.put('/addresses/:id', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    const addressId = req.params.id;
    
    const addrIndex = user.addresses.findIndex(
      a => a._id.toString() === addressId
    );
    
    if (addrIndex === -1) {
      return res.status(404).json({ message: 'Address not found' });
    }
    
    const { tag, street, city, state, pincode, phone, isDefault } = req.body;
    
    // If this is set as default, unset other defaults
    if (isDefault) {
      user.addresses.forEach(addr => addr.isDefault = false);
    }
    
    user.addresses[addrIndex] = {
      ...user.addresses[addrIndex].toObject(),
      tag: tag || user.addresses[addrIndex].tag,
      street: street || user.addresses[addrIndex].street,
      city: city || user.addresses[addrIndex].city,
      state: state || user.addresses[addrIndex].state,
      pincode: pincode || user.addresses[addrIndex].pincode,
      phone: phone || user.addresses[addrIndex].phone,
      isDefault: isDefault !== undefined ? isDefault : user.addresses[addrIndex].isDefault
    };
    
    await user.save();
    res.json(user.addresses);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   DELETE /api/users/addresses/:id
// @desc    Delete address
// @access  Private
router.delete('/addresses/:id', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    const addressId = req.params.id;
    
    user.addresses = user.addresses.filter(
      a => a._id.toString() !== addressId
    );
    
    await user.save();
    res.json(user.addresses);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PUT /api/users/addresses/:id/default
// @desc    Set default address
// @access  Private
router.put('/addresses/:id/default', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    const addressId = req.params.id;
    
    // Unset all defaults
    user.addresses.forEach(addr => {
      addr.isDefault = addr._id.toString() === addressId;
    });
    
    await user.save();
    res.json(user.addresses);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
