const express = require('express');
const router = express.Router();
const db = require('../db');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const { sendEmail } = require('../utils/emailService');
const config = require('../config/config');

function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) return res.status(401).json({ message: 'No token provided' });
  jwt.verify(token, config.jwt.secret, (err, user) => {
    if (err) return res.status(403).json({ message: 'Invalid token' });
    req.user = user;
    next();
  });
}

// Register endpoint (with hashing)
router.post('/register', (req, res) => {
  console.log('POST /register called with:', { email: req.body.email, password: req.body.password ? '[HIDDEN]' : 'missing' });
  const { email, password } = req.body;
  if (!email || !password) {
    console.log('Registration failed: Missing fields');
    return res.status(400).json({ message: 'Missing fields' });
  }

  // Hash the password before storing
  bcrypt.hash(password, 10, (err, hash) => {
    if (err) {
      console.error('Registration error - Password hashing failed:', err);
      return res.status(500).json({ message: 'Error hashing password' });
    }

    console.log('Password hashed successfully, inserting user...');
    db.query(
      'INSERT INTO users (email, password) VALUES (?, ?)',
      [email, hash],
      (err, results) => {
        if (err) {
          console.error('Registration error - Database error:', err);
          if (err.code === 'ER_DUP_ENTRY') {
            return res.status(400).json({ message: 'Email already registered' });
          }
          return res.status(500).json({ message: 'Database error', error: err.message });
        }
        console.log('Registration successful for email:', email);
        res.json({ message: 'Registration successful' });
      }
    );
  });
});

// Login endpoint (with JWT and fallback for legacy plain text passwords)
router.post('/login', (req, res) => {
  console.log('POST /login called with:', { email: req.body.email, password: req.body.password ? '[HIDDEN]' : 'missing' });
  const { email, password } = req.body;
  if (!email || !password) {
    console.log('Login failed: Missing fields');
    return res.status(400).json({ message: 'Missing fields' });
  }

  db.query(
    'SELECT * FROM users WHERE email = ?',
    [email],
    (err, results) => {
      if (err) {
        console.error('Login error - Database error:', err);
        return res.status(500).json({ message: 'Database error', error: err.message });
      }
      const user = results[0];
      if (!user) {
        console.log('Login failed: User not found for email:', email);
        return res.status(400).json({ message: 'Invalid credentials' });
      }

      console.log('User found, checking password...');
      // Try bcrypt compare first
      bcrypt.compare(password, user.password, (err, isMatch) => {
        if (err) {
          console.error('Login error - Password comparison error:', err);
          return res.status(500).json({ message: 'Error comparing passwords' });
        }
        if (isMatch) {
          console.log('Login successful with bcrypt for user:', email);
          // Success: login and return token
          const token = jwt.sign({ id: user.id, email: user.email }, config.jwt.secret, { expiresIn: config.jwt.expiresIn });
          // Send login notification email
          sendEmail(email, 'loginNotification')
            .then(() => {
              console.log('Login email sent successfully');
              res.json({ message: 'Login successful', token, user: { id: user.id, email: user.email, isAdmin: user.isAdmin, plan: user.plan } });
            })
            .catch((emailErr) => {
              console.log('Login successful, but email failed:', emailErr);
              res.json({ message: 'Login successful, but failed to send login email', token, user: { id: user.id, email: user.email, isAdmin: user.isAdmin, plan: user.plan } });
            });
        } else {
          console.log('Bcrypt failed, trying plain text...');
          // Fallback: check plain text (for legacy users)
          if (password === user.password) {
            console.log('Login successful with plain text for user:', email);
            // Immediately hash and update the password in DB
            bcrypt.hash(password, 10, (err, hash) => {
              if (!err) {
                db.query('UPDATE users SET password = ? WHERE id = ?', [hash, user.id]);
                console.log('Password hashed and updated in database');
              }
            });
            // Success: login and return token
            const token = jwt.sign({ id: user.id, email: user.email }, config.jwt.secret, { expiresIn: config.jwt.expiresIn });
            // Send login notification email
            sendEmail(email, 'loginNotification')
              .then(() => {
                console.log('Login email sent successfully');
                res.json({ message: 'Login successful', token, user: { id: user.id, email: user.email, isAdmin: user.isAdmin, plan: user.plan } });
              })
              .catch((emailErr) => {
                console.log('Login successful, but email failed:', emailErr);
                res.json({ message: 'Login successful, but failed to send login email', token, user: { id: user.id, email: user.email, isAdmin: user.isAdmin, plan: user.plan } });
              });
          } else {
            console.log('Login failed: Invalid password for user:', email);
            return res.status(400).json({ message: 'Invalid credentials' });
          }
        }
      });
    }
  );
});

// Test endpoint to check if routes are working
router.get('/test-save-session', (req, res) => {
  res.json({ message: 'Save session endpoint is accessible', timestamp: new Date().toISOString() });
});

// Protect draft/session endpoints with JWT
router.post('/save-session', authenticateToken, (req, res) => {
  console.log('POST /save-session called with:', req.body);
  console.log('User making request:', req.user);
  console.log('Request headers:', req.headers);
  
  const { user_email, session_data } = req.body;
  if (!user_email || !session_data) {
    console.log('Missing user_email or session_data');
    return res.status(400).json({ message: 'Missing user_email or session_data' });
  }
  // Enforce draft limits based on user plan
  db.query(
    'SELECT plan FROM users WHERE email = ?',
    [user_email],
    (err, results) => {
      if (err) {
        console.error('Error finding user:', err);
        return res.status(500).json({ message: 'User not found or database error', error: err.message });
      }
      if (!results.length) {
        return res.status(500).json({ message: 'User not found' });
      }
      const plan = results[0].plan || 'basic';
      const draftLimit = config.plans[plan]?.draftLimit || config.plans.basic.draftLimit;
      console.log('User plan:', plan, 'Draft limit:', draftLimit);
      
              db.query(
          'SELECT COUNT(*) as draftCount FROM drafts WHERE user_email = ?',
          [user_email],
        (err2, countResults) => {
          if (err2) {
            console.error('Error counting drafts:', err2);
            return res.status(500).json({ message: 'Database error', error: err2.message });
          }
          const draftCount = countResults[0].draftCount;
          console.log('Current draft count:', draftCount, 'Limit:', draftLimit);
          if (draftCount >= draftLimit) {
            console.log('Draft limit reached for user:', user_email, 'Plan:', plan, 'Count:', draftCount, 'Limit:', draftLimit);
            return res.status(403).json({ 
              message: `Draft limit reached for your plan (${plan}). Upgrade your plan to save more drafts.`,
              details: {
                plan,
                draftLimit,
                currentDraftCount: draftCount,
                remainingDrafts: 0
              }
            });
          }
          const shareToken = uuidv4();
          console.log('About to insert draft with token:', shareToken);
          // First get the user_id, then insert the draft
          db.query(
            'SELECT id FROM users WHERE email = ?',
            [user_email],
            (err, userResult) => {
              if (err) {
                console.error('Error finding user ID:', err);
                return res.status(500).json({ message: 'Database error', error: err.message });
              }
              if (!userResult.length) {
                return res.status(500).json({ message: 'User not found' });
              }
              
              const userId = userResult[0].id;
              db.query(
                'INSERT INTO drafts (user_id, user_email, data, share_token) VALUES (?, ?, ?, ?)',
                [userId, user_email, JSON.stringify(session_data), shareToken],
                (err, result) => {
                  if (err) {
                    console.error('Error inserting draft:', err);
                    return res.status(500).json({ message: 'Database error', error: err.message });
                  }
                  console.log('Draft inserted successfully with ID:', result.insertId);
                  // Send email notification to user
                  sendEmail(user_email, 'draftCreated', result.insertId)
                    .then(() => res.json({ message: 'Session saved and email sent', sessionId: result.insertId, share_token: shareToken }))
                    .catch(() => res.json({ message: 'Session saved, but failed to send email', sessionId: result.insertId, share_token: shareToken }));
                }
              );
            }
          );
        }
      );
    }
  );
});

router.put('/update-session/:id', authenticateToken, (req, res) => {
  console.log('PUT /update-session/:id called', req.params.id, req.body.user_email);
  const { id } = req.params;
  const { user_email, session_data } = req.body;
  if (!user_email || !session_data) {
    return res.status(400).json({ message: 'Missing user_email or session_data' });
  }
  db.query(
    'UPDATE drafts SET data = ? WHERE id = ? AND user_email = ?',
    [JSON.stringify(session_data), id, user_email],
    (err, result) => {
      if (err) {
        return res.status(500).json({ message: 'Database error', error: err });
      }
      if (result.affectedRows === 0) {
        return res.status(404).json({ message: 'Session not found or unauthorized' });
      }
      // Generate a new share token for updated draft
      const shareToken = uuidv4();
      db.query(
        'UPDATE drafts SET share_token = ? WHERE id = ?',
        [shareToken, id],
        (err2) => {
          if (err2) {
            console.error('Error updating share token:', err2);
          }
          res.json({ message: 'Session updated successfully', share_token: shareToken });
        }
      );
    }
  );
});

router.get('/sessions', authenticateToken, (req, res) => {
  const { user_email } = req.query;
  if (!user_email) {
    return res.status(400).json({ message: 'Missing user_email' });
  }
  db.query(
    'SELECT d.id, d.data as session_data, d.created_at, d.share_token FROM drafts d WHERE d.user_email = ? ORDER BY d.created_at DESC',
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
    'DELETE FROM drafts WHERE id = ? AND user_email = ?',
    [id, user_email],
    (err, result) => {
      if (err) {
        return res.status(500).json({ message: 'Database error', error: err });
      }
      if (result.affectedRows === 0) {
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
  db.query(
    'SELECT isAdmin FROM users WHERE id = ?',
    [userId],
    (err, results) => {
      if (err) return res.status(500).json({ message: 'Database error', error: err });
      if (!results.length || !results[0].isAdmin) {
        return res.status(403).json({ message: 'Admin access required' });
      }
      next();
    }
  );
}

// --- ADMIN ROUTES ---
// List all users
router.get('/admin/users', authenticateToken, requireAdmin, (req, res) => {
  console.log('GET /admin/users called');
  db.query(
    'SELECT id, email, isAdmin, plan, created_at FROM users',
    (err, results) => {
      if (err) {
        console.error('Error fetching users:', err);
        return res.status(500).json({ message: 'Database error', error: err.message });
      }
      console.log('Users fetched:', results.length);
      res.json({ users: results });
    }
  );
});
// Promote/demote user
router.put('/admin/users/:id/promote', async (req, res) => {
  const { id } = req.params;
  const { isAdmin } = req.body;
  console.log('PUT /admin/users/:id/promote called for ID:', id, 'isAdmin:', isAdmin);
  db.query(
    'UPDATE users SET isAdmin = ? WHERE id = ?',
    [isAdmin ? 1 : 0, id],
    (err, result) => {
      if (err) {
        console.error('Error updating admin status:', err);
        return res.status(500).json({ message: 'Failed to update admin status', error: err.message });
      }
      if (result.affectedRows === 0) {
        return res.status(404).json({ message: 'User not found' });
      }
      // Get the user's email
      db.query(
        'SELECT email FROM users WHERE id = ?',
        [id],
        async (err2, results2) => {
          if (err2 || !results2.length) {
            console.log('Admin status updated, but email not sent');
            return res.json({ message: 'Admin status updated, but email not sent' });
          }
          const userEmail = results2[0].email;
          console.log('Sending promotion email to', userEmail, 'isAdmin:', isAdmin);
          const emailSent = await sendEmail(userEmail, 'promotion', isAdmin);
          console.log('Email sent result (promotion):', emailSent);
          if (!emailSent) {
            return res.json({ message: 'Admin status updated, but failed to send email' });
          }
          res.json({ message: 'Admin status updated and email sent' });
        }
      );
    }
  );
});
// Update user plan (admin only)
router.put('/admin/users/:id/plan', authenticateToken, requireAdmin, (req, res) => {
  const { id } = req.params;
  const { plan } = req.body;
  console.log('PUT /admin/users/:id/plan called for ID:', id, 'plan:', plan);
  if (!['basic', 'pro', 'pro_max'].includes(plan)) {
    return res.status(400).json({ message: 'Invalid plan' });
  }
  db.query(
    'UPDATE users SET plan = ? WHERE id = ?',
    [plan, id],
    (err, result) => {
      if (err) {
        console.error('Error updating user plan:', err);
        return res.status(500).json({ message: 'Database error', error: err.message });
      }
      if (result.affectedRows === 0) {
        return res.status(404).json({ message: 'User not found' });
      }
      console.log('User plan updated successfully');
      res.json({ message: 'User plan updated' });
    }
  );
});
// Delete user
router.delete('/admin/users/:id', authenticateToken, requireAdmin, (req, res) => {
  const { id } = req.params;
  console.log('DELETE /admin/users/:id called for ID:', id);
  db.query(
    'DELETE FROM users WHERE id = ?',
    [id],
    (err, result) => {
      if (err) {
        console.error('Error deleting user:', err);
        return res.status(500).json({ message: 'Database error', error: err.message });
      }
      if (result.affectedRows === 0) {
        return res.status(404).json({ message: 'User not found' });
      }
      console.log('User deleted successfully');
      res.json({ message: 'User deleted' });
    }
  );
});
// List all drafts
router.get('/admin/drafts', authenticateToken, requireAdmin, (req, res) => {
  console.log('GET /admin/drafts called');
  console.log('User making request:', req.user);
  db.query(
    'SELECT d.id, d.user_email as userEmail, d.data as session_data, d.created_at, CONCAT("Draft ", d.id) as name FROM drafts d ORDER BY d.created_at DESC',
    (err, results) => {
      if (err) {
        console.error('Error fetching drafts:', err);
        return res.status(500).json({ message: 'Database error', error: err.message });
      }
      console.log('Drafts fetched:', results.length);
      res.json({ drafts: results });
    }
  );
});
// Delete draft
router.delete('/admin/drafts/:id', authenticateToken, requireAdmin, (req, res) => {
  const { id } = req.params;
  console.log('DELETE /admin/drafts/:id called for ID:', id);
  db.query(
    'DELETE FROM drafts WHERE id = ?',
    [id],
    (err, result) => {
      if (err) {
        console.error('Error deleting draft:', err);
        return res.status(500).json({ message: 'Database error', error: err.message });
      }
      if (result.affectedRows === 0) {
        return res.status(404).json({ message: 'Draft not found' });
      }
      console.log('Draft deleted successfully');
      res.json({ message: 'Draft deleted' });
    }
  );
});
// Analytics
router.get('/admin/stats', authenticateToken, requireAdmin, async (req, res) => {
  try {
    console.log('GET /admin/stats called');
    db.query(
      'SELECT COUNT(*) as userCount FROM users',
      (err, userResults) => {
        if (err) {
          console.error('Error counting users:', err);
          return res.status(500).json({ message: 'Database error', error: err.message });
        }
        db.query(
          'SELECT COUNT(*) as draftCount FROM drafts',
          (err, draftResults) => {
            if (err) {
              console.error('Error counting drafts:', err);
              return res.status(500).json({ message: 'Database error', error: err.message });
            }
            console.log('Stats - Users:', userResults[0].userCount, 'Drafts:', draftResults[0].draftCount);
            res.json({
              userCount: userResults[0].userCount,
              draftCount: draftResults[0].draftCount
            });
          }
        );
      }
    );
  } catch (err) {
    console.error('Error in stats:', err);
    res.status(500).json({ message: 'Error fetching stats', error: err });
  }
});

// Debug endpoint to check user's draft count and plan
router.get('/debug/user-drafts', authenticateToken, (req, res) => {
  const { user_email } = req.query;
  if (!user_email) {
    return res.status(400).json({ message: 'Missing user_email' });
  }
  
  db.query(
    'SELECT plan FROM users WHERE email = ?',
    [user_email],
    (err, userResults) => {
      if (err) {
        return res.status(500).json({ message: 'Database error', error: err.message });
      }
      if (!userResults.length) {
        return res.status(404).json({ message: 'User not found' });
      }
      
      const plan = userResults[0].plan || 'basic';
      const draftLimit = config.plans[plan]?.draftLimit || config.plans.basic.draftLimit;
      
      db.query(
        'SELECT COUNT(*) as draftCount FROM drafts WHERE user_email = ?',
        [user_email],
        (err2, countResults) => {
          if (err2) {
            return res.status(500).json({ message: 'Database error', error: err2.message });
          }
          
          const draftCount = countResults[0].draftCount;
          
          res.json({
            user_email,
            plan,
            draftLimit,
            currentDraftCount: draftCount,
            canSaveMore: draftCount < draftLimit,
            remainingDrafts: Math.max(0, draftLimit - draftCount)
          });
        }
      );
    }
  );
});

// Add endpoint to fetch by share_token
router.get('/shared/:token', (req, res) => {
  const token = req.params.token;
  console.log('GET /shared/:token called with token:', token);
  db.query(
    'SELECT d.*, u.email as user_email FROM drafts d JOIN users u ON d.user_id = u.id WHERE d.id = ?',
    [token.replace('share_', '')],
    (err, results) => {
      if (err) {
        console.error('Error fetching shared design:', err);
        return res.status(500).json({ error: "Error fetching design" });
      }
      if (!results.length) {
        return res.status(404).json({ error: "Design not found" });
      }
      console.log('Shared design found:', results[0].id);
      res.status(200).json(results[0]);
    }
  );
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
  db.query(
    'UPDATE users SET plan = ? WHERE id = ?',
    [plan, userId],
    (err) => {
      if (err) return res.status(500).json({ message: 'Database error', error: err });
      res.json({ message: `Plan upgraded to ${plan}` });
    }
  );
});

// USER: Request upgrade
router.post('/upgrade-request', authenticateToken, (req, res) => {
  const userId = req.user && req.user.id;
  const { requested_plan } = req.body;
  if (!userId || !['pro', 'pro_max'].includes(requested_plan)) {
    return res.status(400).json({ message: 'Invalid request' });
  }
  
  // First get the user's email and current plan
  db.query(
    'SELECT email, plan FROM users WHERE id = ?',
    [userId],
    (err, userResults) => {
      if (err) return res.status(500).json({ message: 'Database error', error: err });
      if (!userResults.length) return res.status(404).json({ message: 'User not found' });
      
      const userEmail = userResults[0].email;
      const currentPlan = userResults[0].plan;
      
      // Check for existing pending request
      db.query(
        'SELECT * FROM upgrade_requests WHERE user_email = ? AND status = "pending"',
        [userEmail],
        (err2, results) => {
          if (err2) return res.status(500).json({ message: 'Database error', error: err2 });
          if (results.length) return res.status(400).json({ message: 'You already have a pending upgrade request.' });
          
          // Insert the upgrade request with the correct fields
          db.query(
            'INSERT INTO upgrade_requests (user_email, current_plan, requested_plan) VALUES (?, ?, ?)',
            [userEmail, currentPlan, requested_plan],
            (err3) => {
              if (err3) return res.status(500).json({ message: 'Database error', error: err3 });
              // Optionally notify admin here
              res.json({ message: 'Upgrade request submitted. Awaiting admin approval.' });
            }
          );
        }
      );
    }
  );
});

// USER: Check upgrade request status
router.get('/upgrade-request/status', authenticateToken, (req, res) => {
  const userId = req.user && req.user.id;
  if (!userId) return res.status(401).json({ message: 'Unauthorized' });
  
  // Get user's email first
  db.query(
    'SELECT email FROM users WHERE id = ?',
    [userId],
    (err, userResults) => {
      if (err) return res.status(500).json({ message: 'Database error', error: err });
      if (!userResults.length) return res.status(404).json({ message: 'User not found' });
      
      const userEmail = userResults[0].email;
      
      db.query(
        'SELECT * FROM upgrade_requests WHERE user_email = ? ORDER BY created_at DESC LIMIT 1',
        [userEmail],
        (err2, results) => {
          if (err2) return res.status(500).json({ message: 'Database error', error: err2 });
          if (!results.length) return res.json({ status: 'none' });
          res.json({ status: results[0].status, requested_plan: results[0].requested_plan });
        }
      );
    }
  );
});

// USER: Cancel upgrade request
router.post('/upgrade-request/cancel', authenticateToken, (req, res) => {
  const userId = req.user && req.user.id;
  if (!userId) return res.status(401).json({ message: 'Unauthorized' });
  
  // Get user's email first
  db.query(
    'SELECT email FROM users WHERE id = ?',
    [userId],
    (err, userResults) => {
      if (err) return res.status(500).json({ message: 'Database error', error: err });
      if (!userResults.length) return res.status(404).json({ message: 'User not found' });
      
      const userEmail = userResults[0].email;
      
      db.query(
        'DELETE FROM upgrade_requests WHERE user_email = ? AND status = "pending"',
        [userEmail],
        (err2, result) => {
          if (err2) return res.status(500).json({ message: 'Database error', error: err2 });
          if (result.affectedRows === 0) {
            return res.status(400).json({ message: 'No pending upgrade request found to cancel.' });
          }
          res.json({ message: 'Upgrade request cancelled successfully.' });
        }
      );
    }
  );
});

// ADMIN: List all upgrade requests
router.get('/admin/upgrade-requests', authenticateToken, requireAdmin, (req, res) => {
  console.log('GET /admin/upgrade-requests called');
  
  // First check if the upgrade_requests table exists
  db.query(
    'SHOW TABLES LIKE "upgrade_requests"',
    (err, tables) => {
      if (err) {
        console.error('Error checking if upgrade_requests table exists:', err);
        return res.status(500).json({ message: 'Database error', error: err.message });
      }
      
      if (tables.length === 0) {
        console.log('upgrade_requests table does not exist');
        return res.json({ requests: [] });
      }
      
      console.log('upgrade_requests table exists, checking structure...');
      
      // Check what columns exist in the upgrade_requests table
      db.query(
        'DESCRIBE upgrade_requests',
        (err, columns) => {
          if (err) {
            console.error('Error describing upgrade_requests table:', err);
            return res.status(500).json({ message: 'Database error', error: err.message });
          }
          
          console.log('Available columns:', columns.map(c => c.Field));
          
          // Build query based on available columns
          let query = 'SELECT ur.id, ur.user_email, ur.current_plan, ur.requested_plan as requestedPlan, ur.status, ur.created_at';
          
          query += ' FROM upgrade_requests ur ORDER BY ur.created_at DESC';
          
          console.log('Final query:', query);
          
          db.query(query, (err2, results) => {
            if (err2) {
              console.error('Error fetching upgrade requests:', err2);
              return res.status(500).json({ message: 'Database error', error: err2.message });
            }
            
            console.log('Found', results.length, 'upgrade requests');
            if (results.length > 0) {
              console.log('Sample request data:', results[0]);
            }
            res.json({ requests: results });
          });
        }
      );
    }
  );
});

// ADMIN: Approve upgrade request
router.post('/admin/upgrade-requests/:id/approve', authenticateToken, requireAdmin, (req, res) => {
  const { id } = req.params;
  // Get request and user
  db.query(
    'SELECT * FROM upgrade_requests WHERE id = ?',
    [id],
    (err, results) => {
      if (err || !results.length) return res.status(404).json({ message: 'Request not found' });
      const reqRow = results[0];
      if (reqRow.status !== 'pending') return res.status(400).json({ message: 'Request already processed' });
      // Approve request and upgrade user
      db.query(
        'UPDATE upgrade_requests SET status = "approved", updated_at = NOW() WHERE id = ?',
        [id],
        (err2) => {
          if (err2) return res.status(500).json({ message: 'Database error', error: err2 });
          db.query(
            'UPDATE users SET plan = ? WHERE email = ?',
            [reqRow.requested_plan, reqRow.user_email],
            (err3) => {
              if (err3) return res.status(500).json({ message: 'Database error', error: err3 });
              // Notify user
              sendEmail(reqRow.user_email, 'upgradeApproved', reqRow.requested_plan);
              res.json({ message: 'Upgrade approved and user plan updated.' });
            }
          );
        }
      );
    }
  );
});

// ADMIN: Reject upgrade request
router.post('/admin/upgrade-requests/:id/reject', authenticateToken, requireAdmin, (req, res) => {
  const { id } = req.params;
  db.query(
    'SELECT * FROM upgrade_requests WHERE id = ?',
    [id],
    (err, results) => {
      if (err || !results.length) return res.status(404).json({ message: 'Request not found' });
      const reqRow = results[0];
      if (reqRow.status !== 'pending') return res.status(400).json({ message: 'Request already processed' });
      db.query(
        'UPDATE upgrade_requests SET status = "rejected", updated_at = NOW() WHERE id = ?',
        [id],
        (err2) => {
          if (err2) return res.status(500).json({ message: 'Database error', error: err2 });
          // Notify user
          sendEmail(reqRow.user_email, 'upgradeRejected', reqRow.requested_plan);
          res.json({ message: 'Upgrade request rejected.' });
        }
      );
    }
  );
});

// Get current user info
router.get('/me', authenticateToken, (req, res) => {
  const userId = req.user && req.user.id;
  if (!userId) return res.status(401).json({ message: 'Unauthorized' });
  db.query(
    'SELECT id, email, isAdmin, plan FROM users WHERE id = ?',
    [userId],
    (err, results) => {
      if (err || !results.length) return res.status(500).json({ message: 'Database error' });
      res.json({ user: results[0] });
    }
  );
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
    db.query(
      'UPDATE users SET plan = ? WHERE email = ?',
      [newPlan, userEmail],
      (err) => {
        if (err) {
          console.error('Error updating plan:', err);
          return res.status(500).json({ message: 'Failed to update plan' });
        }

        if (this.changes === 0) {
          return res.status(404).json({ message: 'User not found' });
        }

        // Send email notification
        // await sendEmail(userEmail, 'planUpgrade', newPlan); // This line is now redundant as email is sent before DB update
        
        res.json({ message: 'Plan updated successfully' });
      }
    );
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
    // Delete user's drafts (sessions table doesn't exist, so skip this)
    console.log('Skipping sessions deletion - sessions table does not exist');
    
    // Delete user account
    db.query(
      'DELETE FROM users WHERE email = ?',
      [userEmail],
      (err) => {
        if (err) {
          console.error('Error deleting account:', err);
          return res.status(500).json({ message: 'Failed to delete account' });
        }

        if (this.changes === 0) {
          return res.status(404).json({ message: 'User not found' });
        }

        res.json({ message: 'Account deleted successfully' });
      }
    );
  } catch (error) {
    console.error('Error in delete-account:', error);
    res.status(500).json({ message: 'Internal server error', error: error.message });
  }
});



// Get user's plan limit
router.get('/plan-limit', (req, res) => {
  const { user_email } = req.query;
  
  db.query(
    'SELECT plan FROM users WHERE email = ?',
    [user_email],
    (err, results) => {
      if (err) {
        console.error('Error getting plan:', err);
        return res.status(500).json({ message: 'Failed to get plan information' });
      }

      if (!results.length) {
        return res.status(404).json({ message: 'User not found' });
      }

      const limit = config.plans[results[0].plan]?.draftLimit || config.plans.basic.draftLimit;
      res.json({ limit });
    }
  );
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
  db.query(
    'SELECT email FROM users',
    (err, results) => {
      if (err) return res.status(500).json({ message: 'Failed to fetch emails', error: err.message });
      res.json({ emails: results.map(r => r.email) });
    }
  );
});













module.exports = router; 