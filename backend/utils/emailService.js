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

const emailTemplates = {
  planUpgrade: (userEmail, newPlan) => ({
    subject: 'Your Wall Designer Plan Has Been Upgraded!',
    html: `
      <h2>Congratulations!</h2>
      <p>Your Wall Designer account has been upgraded to ${newPlan}.</p>
      <p>You now have access to:</p>
      <ul>
        <li>More draft slots</li>
        <li>Additional features</li>
        <li>Premium support</li>
      </ul>
      <p>Thank you for using Wall Designer!</p>
    `
  }),
  
  accountDeletion: (userEmail) => ({
    subject: 'Wall Designer Account Deletion Notice',
    html: `
      <h2>Account Deletion Notice</h2>
      <p>Your Wall Designer account has been deleted by an administrator.</p>
      <p>If you believe this was done in error, please contact our support team.</p>
    `
  }),

  draftDeletion: (userEmail, draftId) => ({
    subject: 'Wall Designer Draft Deletion Notice',
    html: `
      <h2>Draft Deletion Notice</h2>
      <p>One of your saved drafts (ID: ${draftId}) has been deleted by an administrator.</p>
      <p>If you believe this was done in error, please contact our support team.</p>
    `
  }),

  draftUpdate: (userEmail, draftId) => ({
    subject: 'Your Wall Designer Draft Was Updated',
    html: `<h2>Draft Updated</h2><p>Your draft (ID: ${draftId}) was updated successfully.</p>`
  }),

  draftSelfDeletion: (userEmail, draftId) => ({
    subject: 'Your Wall Designer Draft Was Deleted',
    html: `<h2>Draft Deleted</h2><p>You have deleted your draft (ID: ${draftId}) from your account.</p>`
  }),

  draftCreated: (userEmail, draftId) => ({
    subject: 'New Wall Designer Draft Created',
    html: `<h2>Draft Created</h2><p>You have created a new draft (ID: ${draftId}) in your account.</p>`
  }),
  loginNotification: (userEmail) => ({
    subject: 'Login Notification',
    html: `<h2>Login Alert</h2><p>Your account was just logged in. If this wasn't you, please reset your password immediately.</p>`
  })
};

const sendEmail = async (to, template, data = {}) => {
  try {
    const { subject, html } = emailTemplates[template](to, data);
    
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to,
      subject,
      html
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('Email sent:', info.messageId);
    return true;
  } catch (error) {
    console.error('Error sending email:', error);
    return false;
  }
};

module.exports = {
  sendEmail
}; 