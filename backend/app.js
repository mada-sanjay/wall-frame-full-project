const express = require('express');
const cors = require('cors');
const app = express();
app.use(cors());
app.use(express.json({ limit: '50mb' }));

// Import routes
const authRoutes = require('./routes/auth');
const decorationRoutes = require('./routes/decorations');
app.use('/api', authRoutes);
app.use('/api/admin/decorations', decorationRoutes);

app.get('/test-log', (req, res) => {
  console.log('Test log route hit!');
  res.send('Logged to terminal!');
});

app.listen(5000, () => console.log('Backend running on http://localhost:5000')); 