const express = require('express');
const router = express.Router();
const db = require('../db');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const JWT_SECRET = 'your_secret_key'; // Use a strong secret in production
const { v4: uuidv4 } = require('uuid');
const { sendEmail } = require('../utils/emailService');
require('dotenv').config();

// Plan limits from environment variables
const PLAN_LIMITS = {
  basic: parseInt(process.env.BASIC_PLAN_DRAFTS) || 3,
  pro: parseInt(process.env.PRO_PLAN_DRAFTS) || 6,
  pro_max: parseInt(process.env.PRO_MAX_PLAN_DRAFTS) || 999
};

function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) return res.status(401).json({ message: 'No token provided' });
  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ message: 'Invalid token' });
    req.user = user;
    next();
  });
}

// Register endpoint (with hashing)
router.post('/register', (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ message: 'Missing fields' });
  }

  // Hash the password before storing
  bcrypt.hash(password, 10, (err, hash) => {
    if (err) return res.status(500).json({ message: 'Error hashing password' });

    db.query(
      'INSERT INTO users (email, password) VALUES (?, ?)',
      [email, hash],
      (err, results) => {
        if (err) {
          if (err.code === 'ER_DUP_ENTRY') {
            return res.status(400).json({ message: 'Email already registered' });
          }
          return res.status(500).json({ message: 'Database error', error: err });
        }
        res.json({ message: 'Registration successful' });
      }
    );
  });
});

// Login endpoint (with JWT and fallback for legacy plain text passwords)
router.post('/login', (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ message: 'Missing fields' });
  }

  db.query(
    'SELECT * FROM users WHERE email = ?',
    [email],
    (err, results) => {
      if (err) return res.status(500).json({ message: 'Database error', error: err });
      const user = results[0];
      if (!user) return res.status(400).json({ message: 'Invalid credentials' });

      // Try bcrypt compare first
      bcrypt.compare(password, user.password, (err, isMatch) => {
        if (err) return res.status(500).json({ message: 'Error comparing passwords' });
        if (isMatch) {
          // Success: login and return token
          const token = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET, { expiresIn: '2h' });
          // Send login notification email
          sendEmail(email, 'loginNotification')
            .then(() => res.json({ message: 'Login successful', token, user: { id: user.id, email: user.email, isAdmin: user.isAdmin, plan: user.plan } }))
            .catch(() => res.json({ message: 'Login successful, but failed to send login email', token, user: { id: user.id, email: user.email, isAdmin: user.isAdmin, plan: user.plan } }));
        } else {
          // Fallback: check plain text (for legacy users)
          if (password === user.password) {
            // Immediately hash and update the password in DB
            bcrypt.hash(password, 10, (err, hash) => {
              if (!err) {
                db.query('UPDATE users SET password = ? WHERE id = ?', [hash, user.id]);
              }
            });
            // Success: login and return token
            const token = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET, { expiresIn: '2h' });
            // Send login notification email
            sendEmail(email, 'loginNotification')
              .then(() => res.json({ message: 'Login successful', token, user: { id: user.id, email: user.email, isAdmin: user.isAdmin, plan: user.plan } }))
              .catch(() => res.json({ message: 'Login successful, but failed to send login email', token, user: { id: user.id, email: user.email, isAdmin: user.isAdmin, plan: user.plan } }));
          } else {
            return res.status(400).json({ message: 'Invalid credentials' });
          }
        }
      });
    }
  );
});

// Protect draft/session endpoints with JWT
router.post('/save-session', authenticateToken, (req, res) => {
  const { user_email, session_data } = req.body;
  if (!user_email || !session_data) {
    return res.status(400).json({ message: 'Missing user_email or session_data' });
  }
  // Enforce draft limits based on user plan
  db.query('SELECT plan FROM users WHERE email = ?', [user_email], (err, userResults) => {
    if (err || !userResults.length) {
      return res.status(500).json({ message: 'User not found or database error' });
    }
    const plan = userResults[0].plan || 'basic';
    let draftLimit = 3;
    if (plan === 'pro') draftLimit = 6;
    if (plan === 'pro_max') draftLimit = Infinity;
    db.query('SELECT COUNT(*) as draftCount FROM sessions WHERE user_email = ?', [user_email], (err2, countResults) => {
      if (err2) {
        return res.status(500).json({ message: 'Database error', error: err2 });
      }
      const draftCount = countResults[0].draftCount;
      if (draftCount >= draftLimit) {
        return res.status(403).json({ message: `Draft limit reached for your plan (${plan}). Upgrade your plan to save more drafts.` });
      }
      const shareToken = uuidv4();
      db.query(
        'INSERT INTO sessions (user_email, session_data, share_token) VALUES (?, ?, ?)',
        [user_email, JSON.stringify(session_data), shareToken],
        (err, results) => {
          if (err) {
            return res.status(500).json({ message: 'Database error', error: err });
          }
          // Send email notification to user
          sendEmail(user_email, 'draftCreated', results.insertId)
            .then(() => res.json({ message: 'Session saved and email sent', sessionId: results.insertId, share_token: shareToken }))
            .catch(() => res.json({ message: 'Session saved, but failed to send email', sessionId: results.insertId, share_token: shareToken }));
        }
      );
    });
  });
});

router.put('/update-session/:id', authenticateToken, (req, res) => {
  console.log('PUT /update-session/:id called', req.params.id, req.body.user_email);
  const { id } = req.params;
  const { user_email, session_data } = req.body;
  if (!user_email || !session_data) {
    return res.status(400).json({ message: 'Missing user_email or session_data' });
  }
  db.query(
    'UPDATE sessions SET session_data = ? WHERE id = ? AND user_email = ?',
    [JSON.stringify(session_data), id, user_email],
    (err, results) => {
      if (err) {
        return res.status(500).json({ message: 'Database error', error: err });
      }
      if (results.affectedRows === 0) {
        return res.status(404).json({ message: 'Session not found or unauthorized' });
      }
      // Fetch share_token to return
      db.query('SELECT share_token FROM sessions WHERE id = ?', [id], (err2, rows) => {
        if (err2 || !rows.length) return res.json({ message: 'Session updated successfully' });
        res.json({ message: 'Session updated successfully', share_token: rows[0].share_token });
      });
    }
  );
});

router.get('/sessions', authenticateToken, (req, res) => {
  const { user_email } = req.query;
  if (!user_email) {
    return res.status(400).json({ message: 'Missing user_email' });
  }
  db.query(
    'SELECT id, session_data, created_at, share_token FROM sessions WHERE user_email = ? ORDER BY created_at DESC',
    [user_email],
    (err, results) => {
      if (err) {
        return res.status(500).json({ message: 'Database error', error: err });
      }
      res.json({ sessions: results });
    }
  );
});

router.delete('/session/:id', authenticateToken, (req, res) => {
  console.log('DELETE /session/:id called', req.params.id, req.query.user_email);
  const { id } = req.params;
  const { user_email } = req.query;
  if (!user_email) {
    return res.status(400).json({ message: 'Missing user_email' });
  }
  db.query(
    'DELETE FROM sessions WHERE id = ? AND user_email = ?',
    [id, user_email],
    (err, results) => {
      if (err) {
        return res.status(500).json({ message: 'Database error', error: err });
      }
      if (results.affectedRows === 0) {
        return res.status(404).json({ message: 'Session not found or unauthorized' });
      }
      // Send email notification to user
      console.log('About to send draft self-deletion email to', user_email, 'for draft', id);
      sendEmail(user_email, 'draftSelfDeletion', id)
        .then((result) => {
          console.log('Email sent result (user draft self-deletion):', result);
          res.json({ message: 'Draft deleted and email sent' });
        })
        .catch((err) => {
          console.log('Email send error (user draft self-deletion):', err);
          res.json({ message: 'Draft deleted, but failed to send email' });
        });
    }
  );
});

// Update password endpoint (secure, with bcrypt)
router.post('/update-password', (req, res) => {
  const { email, currentPassword, newPassword } = req.body;
  if (!email || !currentPassword || !newPassword) {
    return res.status(400).json({ message: 'Missing fields' });
  }

  db.query(
    'SELECT * FROM users WHERE email = ?',
    [email],
    (err, results) => {
      if (err) return res.status(500).json({ message: 'Database error', error: err });
      const user = results[0];
      if (!user) return res.status(400).json({ message: 'User not found' });

      // Compare current password with hash
      bcrypt.compare(currentPassword, user.password, (err, isMatch) => {
        if (err) return res.status(500).json({ message: 'Error comparing passwords' });
        if (!isMatch) return res.status(400).json({ message: 'Current password is incorrect' });

        // Hash the new password
        bcrypt.hash(newPassword, 10, (err, hash) => {
          if (err) return res.status(500).json({ message: 'Error hashing new password' });

          db.query(
            'UPDATE users SET password = ? WHERE email = ?',
            [hash, email],
            (err2) => {
              if (err2) return res.status(500).json({ message: 'Database error', error: err2 });
              res.json({ message: 'Password updated successfully!' });
            }
          );
        });
      });
    }
  );
});

// --- ADMIN MIDDLEWARE ---
function requireAdmin(req, res, next) {
  // req.user is set by authenticateToken
  const userId = req.user && req.user.id;
  if (!userId) return res.status(401).json({ message: 'Unauthorized' });
  db.query('SELECT isAdmin FROM users WHERE id = ?', [userId], (err, results) => {
    if (err) return res.status(500).json({ message: 'Database error', error: err });
    if (!results[0] || !results[0].isAdmin) {
      return res.status(403).json({ message: 'Admin access required' });
    }
    next();
  });
}

// --- ADMIN ROUTES ---
// List all users
router.get('/admin/users', authenticateToken, requireAdmin, (req, res) => {
  db.query('SELECT id, email, isAdmin, plan, created_at FROM users', (err, results) => {
    if (err) return res.status(500).json({ message: 'Database error', error: err });
    res.json({ users: results });
  });
});
// Promote/demote user
router.put('/admin/users/:id/promote', async (req, res) => {
  const { id } = req.params;
  const { isAdmin } = req.body;
  db.query('UPDATE users SET isAdmin = ? WHERE id = ?', [isAdmin ? 1 : 0, id], async (err, results) => {
    if (err) return res.status(500).json({ message: 'Failed to update admin status', error: err.message });
    if (results.affectedRows === 0) return res.status(404).json({ message: 'User not found' });
    // Get the user's email
    db.query('SELECT email FROM users WHERE id = ?', [id], async (err2, results2) => {
      if (err2 || !results2[0]) return res.json({ message: 'Admin status updated, but email not sent' });
      const userEmail = results2[0].email;
      console.log('Sending promotion email to', userEmail, 'isAdmin:', isAdmin);
      const emailSent = await sendEmail(userEmail, 'promotion', isAdmin);
      console.log('Email sent result (promotion):', emailSent);
      if (!emailSent) {
        return res.json({ message: 'Admin status updated, but failed to send email' });
      }
      res.json({ message: 'Admin status updated and email sent' });
    });
  });
});
// Update user plan (admin only)
router.put('/admin/users/:id/plan', authenticateToken, requireAdmin, (req, res) => {
  const { id } = req.params;
  const { plan } = req.body;
  if (!['basic', 'pro', 'pro_max'].includes(plan)) {
    return res.status(400).json({ message: 'Invalid plan' });
  }
  db.query('UPDATE users SET plan = ? WHERE id = ?', [plan, id], (err, results) => {
    if (err) return res.status(500).json({ message: 'Database error', error: err });
    res.json({ message: 'User plan updated' });
  });
});
// Delete user
router.delete('/admin/users/:id', authenticateToken, requireAdmin, (req, res) => {
  const { id } = req.params;
  db.query('DELETE FROM users WHERE id = ?', [id], (err, results) => {
    if (err) return res.status(500).json({ message: 'Database error', error: err });
    res.json({ message: 'User deleted' });
  });
});
// List all drafts
router.get('/admin/drafts', authenticateToken, requireAdmin, (req, res) => {
  db.query('SELECT id, user_email, session_data, created_at FROM sessions', (err, results) => {
    if (err) return res.status(500).json({ message: 'Database error', error: err });
    res.json({ drafts: results });
  });
});
// Delete draft
router.delete('/admin/drafts/:id', authenticateToken, requireAdmin, (req, res) => {
  const { id } = req.params;
  db.query('DELETE FROM sessions WHERE id = ?', [id], (err, results) => {
    if (err) return res.status(500).json({ message: 'Database error', error: err });
    res.json({ message: 'Draft deleted' });
  });
});
// Analytics
router.get('/admin/stats', authenticateToken, requireAdmin, async (req, res) => {
  try {
    db.query('SELECT COUNT(*) as userCount FROM users', (err, userResults) => {
      if (err) return res.status(500).json({ message: 'Database error', error: err });
      db.query('SELECT COUNT(*) as draftCount FROM sessions', (err, draftResults) => {
        if (err) return res.status(500).json({ message: 'Database error', error: err });
        res.json({
          userCount: userResults[0].userCount,
          draftCount: draftResults[0].draftCount
        });
      });
    });
  } catch (err) {
    res.status(500).json({ message: 'Error fetching stats', error: err });
  }
});

// Add endpoint to fetch by share_token
router.get('/shared/:token', (req, res) => {
  const token = req.params.token;
  db.query('SELECT * FROM sessions WHERE share_token = ?', [token], (err, results) => {
    if (err) return res.status(500).json({ error: "Error fetching design" });
    if (!results.length) return res.status(404).json({ error: "Design not found" });
    res.status(200).json(results[0]);
  });
});

// User plan upgrade endpoint (payment logic placeholder)
router.post('/upgrade-plan', authenticateToken, (req, res) => {
  const { plan } = req.body;
  const userId = req.user && req.user.id;
  if (!userId) return res.status(401).json({ message: 'Unauthorized' });
  if (!['pro', 'pro_max'].includes(plan)) {
    return res.status(400).json({ message: 'Invalid plan to upgrade' });
  }
  // Here you would integrate payment logic (e.g., Stripe)
  // For now, just update the plan
  db.query('UPDATE users SET plan = ? WHERE id = ?', [plan, userId], (err, results) => {
    if (err) return res.status(500).json({ message: 'Database error', error: err });
    res.json({ message: `Plan upgraded to ${plan}` });
  });
});

// Get current user info
router.get('/me', authenticateToken, (req, res) => {
  const userId = req.user && req.user.id;
  if (!userId) return res.status(401).json({ message: 'Unauthorized' });
  db.query('SELECT id, email, isAdmin, plan FROM users WHERE id = ?', [userId], (err, results) => {
    if (err || !results.length) return res.status(500).json({ message: 'Database error' });
    res.json({ user: results[0] });
  });
});

// Admin: Update user plan
router.post('/admin/update-plan', async (req, res) => {
  const { userEmail, newPlan } = req.body;
  
  if (!['basic', 'pro', 'pro_max'].includes(newPlan)) {
    return res.status(400).json({ message: 'Invalid plan type' });
  }

  try {
    console.log('Sending plan upgrade email to', userEmail, 'with plan', newPlan);
    const emailSent = await sendEmail(userEmail, 'planUpgrade', newPlan);
    console.log('Email sent result (plan upgrade):', emailSent);
    // Update user's plan in database
    db.query('UPDATE users SET plan = ? WHERE email = ?', [newPlan, userEmail], async function(err, results) {
      if (err) {
        console.error('Error updating plan:', err);
        return res.status(500).json({ message: 'Failed to update plan' });
      }

      if (results.affectedRows === 0) {
        return res.status(404).json({ message: 'User not found' });
      }

      // Send email notification
      // await sendEmail(userEmail, 'planUpgrade', newPlan); // This line is now redundant as email is sent before DB update
      
      res.json({ message: 'Plan updated successfully' });
    });
  } catch (error) {
    console.error('Error in update-plan:', error);
    res.status(500).json({ message: 'Internal server error', error: error.message });
  }
});

// Admin: Delete user account
router.delete('/admin/delete-account', async (req, res) => {
  const { userEmail } = req.body;

  try {
    console.log('Sending account deletion email to', userEmail);
    const emailSent = await sendEmail(userEmail, 'accountDeletion');
    console.log('Email sent result (account deletion):', emailSent);
    // Delete user's drafts
    db.query('DELETE FROM sessions WHERE user_email = ?', [userEmail]);
    
    // Delete user account
    db.query('DELETE FROM users WHERE email = ?', [userEmail], function(err, results) {
      if (err) {
        console.error('Error deleting account:', err);
        return res.status(500).json({ message: 'Failed to delete account' });
      }

      if (results.affectedRows === 0) {
        return res.status(404).json({ message: 'User not found' });
      }

      res.json({ message: 'Account deleted successfully' });
    });
  } catch (error) {
    console.error('Error in delete-account:', error);
    res.status(500).json({ message: 'Internal server error', error: error.message });
  }
});

// Admin: Delete user's draft
router.delete('/admin/delete-draft/:id', async (req, res) => {
  const { id } = req.params;
  const { userEmail } = req.query;

  try {
    console.log('Sending draft deletion email to', userEmail, 'for draft', id);
    const emailSent = await sendEmail(userEmail, 'draftDeletion', id);
    console.log('Email sent result (draft deletion):', emailSent);
    // Delete the draft
    db.query('DELETE FROM sessions WHERE id = ? AND user_email = ?', [id, userEmail], function(err, results) {
      if (err) {
        console.error('Error deleting draft:', err);
        return res.status(500).json({ message: 'Failed to delete draft' });
      }

      if (results.affectedRows === 0) {
        return res.status(404).json({ message: 'Draft not found' });
      }

      res.json({ message: 'Draft deleted successfully' });
    });
  } catch (error) {
    console.error('Error in delete-draft:', error);
    res.status(500).json({ message: 'Internal server error', error: error.message });
  }
});

// Get user's plan limit
router.get('/plan-limit', (req, res) => {
  const { user_email } = req.query;
  
  db.query('SELECT plan FROM users WHERE email = ?', [user_email], (err, results) => {
    if (err) {
      console.error('Error getting plan:', err);
      return res.status(500).json({ message: 'Failed to get plan information' });
    }

    if (!results[0]) {
      return res.status(404).json({ message: 'User not found' });
    }

    const limit = PLAN_LIMITS[results[0].plan] || PLAN_LIMITS.basic;
    res.json({ limit });
  });
});

// Test email configuration
router.post('/test-email', async (req, res) => {
  const { email } = req.body;
  
  try {
    // Send test email
    const result = await sendEmail(email, 'planUpgrade', 'Test Plan');
    
    if (result) {
      res.json({ message: 'Test email sent successfully!' });
    } else {
      res.status(500).json({ message: 'Failed to send test email' });
    }
  } catch (error) {
    console.error('Error sending test email:', error);
    res.status(500).json({ message: 'Error sending test email', error: error.message });
  }
});

// Admin: Send custom email notification to user
router.post('/admin/send-email', async (req, res) => {
  const { to, subject, message } = req.body;
  try {
    const nodemailer = require('nodemailer');
    require('dotenv').config();
    const transporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST,
      port: process.env.EMAIL_PORT,
      secure: false,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to,
      subject,
      html: `<div style='font-family:sans-serif'>${message}</div>`
    };
    await transporter.sendMail(mailOptions);
    res.json({ message: 'Email sent successfully!' });
  } catch (error) {
    console.error('Error sending admin email:', error);
    res.status(500).json({ message: 'Failed to send email', error: error.message });
  }
});

// Get all user emails for admin dropdown
router.get('/admin/user-emails', (req, res) => {
  db.query('SELECT email FROM users', (err, results) => {
    if (err) return res.status(500).json({ message: 'Failed to fetch emails', error: err.message });
    res.json({ emails: results.map(r => r.email) });
  });
});

module.exports = router; 