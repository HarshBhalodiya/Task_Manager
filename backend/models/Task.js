/**
 * Task Mongoose model.
 *
 *   title       — required string
 *   description — optional string
 *   completed   — boolean, defaults to false
 *   createdAt   — Date, defaults to now
 */
const mongoose = require('mongoose');

const taskSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Task title is required'],
    trim: true
  },
  description: String,
  completed: {
    type: Boolean,
    default: false
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Task', taskSchema);
