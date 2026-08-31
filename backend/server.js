/**
 * Server entry point — connects to MongoDB, then boots the Express app on port 5000.
 */
require('dotenv').config();

const mongoose = require('mongoose');
const app = require('./src/app');

const PORT = process.env.PORT || 5000;

// Only start serving requests after the database connection is established.
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    console.log('MongoDB connected successfully');

    app.listen(PORT, () => {
      console.log(`Task API listening on http://localhost:${PORT}`);
    });
  })
  .catch((err) => {
    console.error('MongoDB connection error:', err.message);
    process.exit(1);
  });
