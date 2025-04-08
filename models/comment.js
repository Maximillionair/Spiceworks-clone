const mongoose = require('mongoose');

const commentSchema = new mongoose.Schema({
  content: {
    type: String,
    required: [true, 'Please provide comment content'],
    trim: true,
    maxlength: [500, 'Comment cannot be more than 500 characters']
  },
  ticket: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Ticket',
    required: [true, 'Please provide ticket id']
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Please provide user id']
  }
}, {
  timestamps: true
});

// Check if the model is already defined before creating a new one
module.exports = mongoose.models.Comment || mongoose.model('Comment', commentSchema);