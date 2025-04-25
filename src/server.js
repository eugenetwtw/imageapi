require('dotenv').config();
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const helmet = require('helmet');
const path = require('path');
const rateLimit = require('express-rate-limit');

// Import routes
const imageRoutes = require('./routes/imageRoutes');
const galleryRoutes = require('./routes/galleryRoutes');

// Initialize Express app
const app = express();
const PORT = process.env.PORT || 3000;

// Apply middleware
app.use(helmet({ contentSecurityPolicy: false })); // Disable CSP for development
app.use(cors());
app.use(express.json({ limit: '100mb' }));
app.use(express.urlencoded({ extended: true, limit: '100mb' }));
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));

// Rate limiting
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  standardHeaders: true,
  legacyHeaders: false,
  message: 'Too many requests from this IP, please try again after 15 minutes'
});

// Apply rate limiting to API routes
app.use('/api', apiLimiter);

// API routes
app.use('/api/images', imageRoutes);
app.use('/api/gallery', galleryRoutes);

// Serve static files from the public directory
app.use(express.static(path.join(__dirname, '../public')));

// Serve index.html for all other routes (SPA support)
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/index.html'));
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  const statusCode = err.statusCode || 500;
  res.status(statusCode).json({
    status: 'error',
    message: err.message || 'Internal Server Error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

// Function to try a range of ports
function tryPortRange(startPort, endPort, currentPort = startPort) {
  if (currentPort > endPort) {
    console.error(`All ports (${startPort}-${endPort}) are busy. Please close some applications and try again.`);
    return;
  }
  
  console.log(`Trying port ${currentPort}...`);
  app.listen(currentPort, () => {
    console.log(`Server running on http://localhost:${currentPort}`);
  }).on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
      console.log(`Port ${currentPort} is busy.`);
      tryPortRange(startPort, endPort, currentPort + 1);
    } else {
      console.error('Server error:', err);
    }
  });
}

// Start the server
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
}).on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    // Try with a different port
    const newPort = 3001; // Fixed port to avoid typo
    console.log(`Port ${PORT} is busy, trying with port ${newPort}...`);
    app.listen(newPort, () => {
      console.log(`Server running on http://localhost:${newPort}`);
    }).on('error', (err2) => {
      if (err2.code === 'EADDRINUSE') {
        // Try with another port
        const finalPort = 3003;
        console.log(`Port ${newPort} is also busy, trying with port ${finalPort}...`);
        app.listen(finalPort, () => {
          console.log(`Server running on http://localhost:${finalPort}`);
        }).on('error', (err3) => {
          if (err3.code === 'EADDRINUSE') {
            // Try with a range of ports
            tryPortRange(3005, 3020);
          } else {
            console.error('Server error:', err3);
          }
        });
      } else {
        console.error('Server error:', err2);
      }
    });
  } else {
    console.error('Server error:', err);
  }
});

module.exports = app; // For testing
