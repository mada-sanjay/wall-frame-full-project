const express = require('express');
const cors = require('cors');
const app = express();
app.use(cors());
app.use(express.json({ limit: '50mb' }));

// Import routes
const authRoutes = require('./routes/auth');
app.use('/api', authRoutes);

app.listen(5000, () => console.log('Backend running on http://localhost:5000')); 