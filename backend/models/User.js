/**
 * User Mongoose model.
 *
 *   email    — required, unique string
 *   password — required string (hashed)
 */
const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    trim: true,
    lowercase: true
  },
  password: {
    type: String,
    required: [true, 'Password is required']
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('User', userSchema);
