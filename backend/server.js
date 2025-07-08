const express = require('express');
const cors = require('cors');
const crypto = require('crypto');
const { log } = require('./shared/logging');
const loggingMiddleware = require('./middlewares/loggingMiddleware');
const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());
app.use(loggingMiddleware);

// In-memory storage (replace with database in production)
const urlDatabase = new Map();
const statistics = new Map();

// generate random shortcode
const generateShortcode = () => {
  return crypto.randomBytes(3).toString('hex');
};

// validate URL
const isValidUrl = (url) => {
  try {
    new URL(url);
    return true;
  } catch (error) {
    return false;
  }
};

//  check if shortcode exists
const shortcodeExists = (shortcode) => {
  return urlDatabase.has(shortcode);
};

//  check if URL is expired
const isExpired = (urlData) => {
  if (!urlData.expiryDate) return false;
  return new Date() > new Date(urlData.expiryDate);
};


// Create Short URL
app.post('/shorturls', (req, res) => {
  try {
    const { url, validity, shortcode } = req.body;

    
    if (!url) {
      return res.status(400).json({ 
        error: 'URL is required' 
      });
    }

    
    if (!isValidUrl(url)) {
      return res.status(400).json({ 
        error: 'Invalid URL format' 
      });
    }

    
    let finalShortcode = shortcode;
    if (!finalShortcode) {
      
      do {
        finalShortcode = generateShortcode();
      } while (shortcodeExists(finalShortcode));
    } else {
      
      if (shortcodeExists(finalShortcode)) {
        return res.status(409).json({ 
          error: 'Shortcode already exists' 
        });
      }
    }

    
    const validityMinutes = validity || 30; // Default 30 minutes
    const expiryDate = new Date();
    expiryDate.setMinutes(expiryDate.getMinutes() + validityMinutes);

    
    const urlData = {
      originalUrl: url,
      shortcode: finalShortcode,
      validity: validityMinutes,
      createdAt: new Date().toISOString(),
      expiryDate: expiryDate.toISOString(),
      clicks: 0,
      lastAccessed: null
    };

    urlDatabase.set(finalShortcode, urlData);

    
    statistics.set(finalShortcode, {
      clicks: 0,
      lastAccessed: null,
      createdAt: urlData.createdAt
    });

    
    res.status(201).json({
      url: url,
      shortcode: finalShortcode,
      validity: validityMinutes,
      shortenedUrl: `http://localhost:${PORT}/shorturls/${finalShortcode}`,
      expiryDate: urlData.expiryDate
    });

  } catch (error) {
    console.error('Error creating short URL:', error);
    res.status(500).json({ 
      error: 'Internal server error' 
    });
  }
});

// Redirect to original URL
app.get('/shorturls/:shortcode', (req, res) => {
  try {
    const { shortcode } = req.params;

    
    if (!urlDatabase.has(shortcode)) {
      return res.status(404).json({ 
        error: 'Shortcode not found' 
      });
    }

    const urlData = urlDatabase.get(shortcode);

    
    if (isExpired(urlData)) {
      return res.status(410).json({ 
        error: 'URL has expired' 
      });
    }

    
    urlData.clicks++;
    urlData.lastAccessed = new Date().toISOString();
    
    const stats = statistics.get(shortcode);
    stats.clicks++;
    stats.lastAccessed = urlData.lastAccessed;

    
    res.redirect(urlData.originalUrl);

  } catch (error) {
    console.error('Error redirecting:', error);
    res.status(500).json({ 
      error: 'Internal server error' 
    });
  }
});


app.get('/statistics', (req, res) => {
  try {
    const allStats = [];

    for (const [shortcode, urlData] of urlDatabase) {
      const stats = statistics.get(shortcode);
      allStats.push({
        shortcode: shortcode,
        originalUrl: urlData.originalUrl,
        shortenedUrl: `http://localhost:${PORT}/shorturls/${shortcode}`,
        createdAt: urlData.createdAt,
        expiryDate: urlData.expiryDate,
        clicks: stats.clicks,
        lastAccessed: stats.lastAccessed,
        isExpired: isExpired(urlData)
      });
    }

    // Sort by creation date (newest first)
    allStats.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    res.json({
      totalUrls: allStats.length,
      urls: allStats
    });

  } catch (error) {
    console.error('Error getting statistics:', error);
    res.status(500).json({ 
      error: 'Internal server error' 
    });
  }
});


app.get('/statistics/:shortcode', (req, res) => {
  try {
    const { shortcode } = req.params;

    if (!urlDatabase.has(shortcode)) {
      return res.status(404).json({ 
        error: 'Shortcode not found' 
      });
    }

    const urlData = urlDatabase.get(shortcode);
    const stats = statistics.get(shortcode);

    res.json({
      shortcode: shortcode,
      originalUrl: urlData.originalUrl,
      shortenedUrl: `http://localhost:${PORT}/shorturls/${shortcode}`,
      createdAt: urlData.createdAt,
      expiryDate: urlData.expiryDate,
      clicks: stats.clicks,
      lastAccessed: stats.lastAccessed,
      isExpired: isExpired(urlData)
    });

  } catch (error) {
    console.error('Error getting URL statistics:', error);
    res.status(500).json({ 
      error: 'Internal server error' 
    });
  }
});


// Error handling middleware
app.use(async (err, req, res, next) => {
  console.error(err.stack);
  try {
    await log('backend', 'error', 'middleware', `Unhandled error: ${err.message}`);
  } catch (logErr) {
    console.error('Failed to log error:', logErr);
  }
  res.status(500).json({
    error: 'Something went wrong!'
  });
});

// Handle 404 for undefined routes
app.use('*', (req, res) => {
  res.status(404).json({ 
    error: 'Route not found' 
  });
});

// Start server
app.listen(PORT, async () => {
  const message = `Server running on port ${PORT}`;
  console.log(message);
  try {
    await log('backend', 'info', 'server', message);
  } catch (err) {
    console.error('Failed to log server start:', err);
  }
  console.log(`Health check: http://localhost:${PORT}/health`);
});

module.exports = app;
