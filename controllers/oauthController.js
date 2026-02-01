import User from '../models/User.js';
import jwt from 'jsonwebtoken';
import { OAuth2Client } from 'google-auth-library';
import { sendOAuthWelcomeEmail } from '../services/mailerService.js';


const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);
// Generate JWT Token
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: '7d',
  });
};

// @desc    Google OAuth callback
// @route   POST /api/oauth/google/callback
// @access  Public
export const googleCallback = async (req, res) => {
  try {
    const { credential } = req.body;
    console.log('[Google OAuth] Request received, credential exists:', !!credential);

    if (!credential) {
      console.error('[Google OAuth] Missing credential in request body');
      return res.status(400).json({
        success: false,
        message: 'Missing required fields',
      });
    }

    console.log('[Google OAuth] Verifying credential...');
    const ticket = await client.verifyIdToken({
      idToken: credential,
      audience: process.env.GOOGLE_CLIENT_ID,
    });
    const payload = ticket.getPayload();
    console.log('[Google OAuth] Verified payload:', { email: payload.email });

    const { sub: googleId, email, name: fullName, picture } = payload;

    // Find or create user
    let user = await User.findOne({
      $or: [{ googleId }, { email }],
    });

    if (user) {
      console.log('[Google OAuth] User exists:', user._id);
      // User exists, update google info if needed
      if (!user.googleId) {
        user.googleId = googleId;
        user.authProvider = 'google';
      }
      if (picture && !user.profileImage) {
        user.profileImage = picture;
      }
      await user.save();
      console.log('[Google OAuth] User updated in DB');
    } else {
      console.log('[Google OAuth] Creating new user...');
      // Create new user
      user = await User.create({
        fullName,
        email,
        googleId,
        authProvider: 'google',
        profileImage: picture,
      });
      console.log('[Google OAuth] User created in DB:', user._id);

      // Send welcome email
      try {
        await sendOAuthWelcomeEmail(email, fullName, 'Google');
      } catch (emailError) {
        console.error('Failed to send welcome email:', emailError.message);
      }
    }

    // Generate token
    const token = generateToken(user._id);
    console.log('[Google OAuth] Token generated, auth successful');

    res.status(200).json({
      success: true,
      message: 'Google authentication successful',
      token,
      user: {
        id: user._id,
        fullName: user.fullName,
        email: user.email,
        profileImage: user.profileImage,
      },
    });
  } catch (error) {
    console.error('[Google OAuth] Error:', error.message);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const githubCallback = async (req, res) => {
  try {
    const { code, githubId, email, fullName, picture } = req.body;

    // If code is provided, exchange it for access token
    if (code) {
      console.log('[GitHub OAuth Code Exchange] Starting with code:', code?.substring(0, 10) + '...');

      // Validate GitHub credentials exist
      if (!process.env.GITHUB_CLIENT_ID || !process.env.GITHUB_CLIENT_SECRET) {
        console.error('[GitHub OAuth] Missing credentials - CLIENT_ID:', !!process.env.GITHUB_CLIENT_ID, 'CLIENT_SECRET:', !!process.env.GITHUB_CLIENT_SECRET);
        return res.status(500).json({
          success: false,
          message: 'Server not properly configured: Missing GitHub credentials',
          debug: {
            hasClientId: !!process.env.GITHUB_CLIENT_ID,
            hasClientSecret: !!process.env.GITHUB_CLIENT_SECRET,
          }
        });
      }

      console.log('[GitHub OAuth] Exchanging code for access token with CLIENT_ID:', process.env.GITHUB_CLIENT_ID?.substring(0, 5) + '...');
      
      const tokenResponse = await fetch('https://github.com/login/oauth/access_token', {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          client_id: process.env.GITHUB_CLIENT_ID,
          client_secret: process.env.GITHUB_CLIENT_SECRET,
          code,
        }),
      });

      const tokenData = await tokenResponse.json();
      console.log('[GitHub OAuth] Token response:', { hasError: !!tokenData.error, hasToken: !!tokenData.access_token });

      if (tokenData.error) {
        console.error('[GitHub OAuth] Token exchange failed:', tokenData.error, tokenData.error_description);
        return res.status(401).json({
          success: false,
          message: `Failed to exchange authorization code: ${tokenData.error_description || tokenData.error}`,
          error: tokenData.error,
        });
      }

      if (!tokenData.access_token) {
        console.error('[GitHub OAuth] No access token in response');
        return res.status(401).json({
          success: false,
          message: 'Failed to obtain access token from GitHub',
        });
      }

      const accessToken = tokenData.access_token;
      console.log('[GitHub OAuth] Access token obtained successfully');

      // Fetch user information from GitHub
      console.log('[GitHub OAuth] Fetching user info from GitHub...');
      const userResponse = await fetch('https://api.github.com/user', {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Accept': 'application/vnd.github.v3+json',
          'User-Agent': 'Becults-App',
        },
      });

      if (!userResponse.ok) {
        console.error('[GitHub OAuth] Failed to fetch user info:', userResponse.status, userResponse.statusText);
        const errorData = await userResponse.json();
        return res.status(401).json({
          success: false,
          message: 'Failed to fetch user information from GitHub',
          error: errorData.message,
        });
      }

      const githubUser = await userResponse.json();
      console.log('[GitHub OAuth] User info received:', { login: githubUser.login, id: githubUser.id });

      // Get user email if not public
      let userEmail = githubUser.email;
      if (!userEmail) {
        console.log('[GitHub OAuth] Email not public, fetching from emails endpoint...');
        const emailResponse = await fetch('https://api.github.com/user/emails', {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Accept': 'application/vnd.github.v3+json',
            'User-Agent': 'Becults-App',
          },
        });

        if (emailResponse.ok) {
          const emails = await emailResponse.json();
          console.log('[GitHub OAuth] Emails retrieved, count:', emails.length);
          const primaryEmail = emails.find(e => e.primary);
          userEmail = primaryEmail?.email || emails[0]?.email;
          console.log('[GitHub OAuth] Primary email found:', userEmail);
        } else {
          console.warn('[GitHub OAuth] Could not fetch emails endpoint:', emailResponse.status);
        }
      }

      if (!userEmail) {
        console.error('[GitHub OAuth] No email found - user must make email public or allow OAuth apps');
        return res.status(400).json({
          success: false,
          message: 'Unable to retrieve email from GitHub. Please ensure your email is visible in GitHub privacy settings (Settings > Email > Keep my email addresses private should be unchecked).',
        });
      }

      const userGithubId = githubUser.id.toString();
      const userName = githubUser.name || githubUser.login;
      const userPicture = githubUser.avatar_url;

      console.log('[GitHub OAuth] Processed user data:', { githubId: userGithubId, email: userEmail, name: userName });

      // Find or create user
      let user = await User.findOne({
        $or: [{ githubId: userGithubId }, { email: userEmail }],
      });

      if (user) {
        console.log('[GitHub OAuth] User exists:', user._id);
        // User exists, update github info if needed
        if (!user.githubId) {
          user.githubId = userGithubId;
        }
        if (!user.authProvider || user.authProvider !== 'github') {
          user.authProvider = 'github';
        }
        if (userPicture && !user.profileImage) {
          user.profileImage = userPicture;
        }
        await user.save();
        console.log('[GitHub OAuth] User updated in DB');
      } else {
        console.log('[GitHub OAuth] Creating new user...');
        // Create new user
        user = await User.create({
          fullName: userName,
          email: userEmail,
          githubId: userGithubId,
          authProvider: 'github',
          profileImage: userPicture,
        });
        console.log('[GitHub OAuth] User created in DB:', user._id);

        // Send welcome email
        try {
          await sendOAuthWelcomeEmail(userEmail, userName, 'GitHub');
          console.log('[GitHub OAuth] Welcome email sent');
        } catch (emailError) {
          console.error('[GitHub OAuth] Failed to send welcome email:', emailError.message);
        }
      }

      // Generate token
      const token = generateToken(user._id);
      console.log('[GitHub OAuth] Token generated, auth successful');

      return res.status(200).json({
        success: true,
        message: 'GitHub authentication successful',
        token,
        user: {
          id: user._id,
          fullName: user.fullName,
          email: user.email,
          profileImage: user.profileImage,
        },
      });
    }

    // Legacy endpoint handling (if githubId, email, fullName are provided directly)
    console.log('[GitHub OAuth] Legacy request received:', { email });

    if (!githubId || !email) {
      console.error('[GitHub OAuth] Missing required fields in legacy request');
      return res.status(400).json({
        success: false,
        message: 'Missing required fields',
      });
    }

    console.log('[GitHub OAuth] Processing legacy request...');
    // Find or create user
    let user = await User.findOne({
      $or: [{ githubId }, { email }],
    });

    if (user) {
      console.log('[GitHub OAuth] User exists:', user._id);
      // User exists, update github info if needed
      if (!user.githubId) {
        user.githubId = githubId;
        user.authProvider = 'github';
      }
      if (picture && !user.profileImage) {
        user.profileImage = picture;
      }
      await user.save();
      console.log('[GitHub OAuth] User updated in DB');
    } else {
      console.log('[GitHub OAuth] Creating new user...');
      // Create new user
      user = await User.create({
        fullName,
        email,
        githubId,
        authProvider: 'github',
        profileImage: picture,
      });
      console.log('[GitHub OAuth] User created in DB:', user._id);

      // Send welcome email
      try {
        await sendOAuthWelcomeEmail(email, fullName, 'GitHub');
        console.log('[GitHub OAuth] Welcome email sent');
      } catch (emailError) {
        console.error('[GitHub OAuth] Failed to send welcome email:', emailError.message);
      }
    }

    // Generate token
    const token = generateToken(user._id);
    console.log('[GitHub OAuth] Token generated, auth successful');

    res.status(200).json({
      success: true,
      message: 'GitHub authentication successful',
      token,
      user: {
        id: user._id,
        fullName: user.fullName,
        email: user.email,
        profileImage: user.profileImage,
      },
    });
  } catch (error) {
    console.error('[GitHub OAuth] Catch block error:', error.message, error.stack);
    res.status(500).json({
      success: false,
      message: error.message || 'An error occurred during GitHub authentication',
    });
  }
};
 

// @desc    Handle OAuth errors
// @route   GET /api/auth/oauth/error
// @access  Public
export const oauthError = (req, res) => {
  const { error, message } = req.query;
  res.status(400).json({
    success: false,
    message: message || error || 'OAuth authentication failed',
  });
};

export default {
  googleCallback,
  githubCallback,
  oauthError,
};
