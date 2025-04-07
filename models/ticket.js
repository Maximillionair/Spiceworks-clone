const mongoose = require('mongoose');

const TicketSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Please provide a title'],
    trim: true,
    maxlength: [100, 'Title cannot be more than 100 characters']
  },
  description: {
    type: String,
    required: [true, 'Please provide a description'],
    trim: true,
    maxlength: [1000, 'Description cannot be more than 1000 characters']
  },
  category: {
    type: String,
    required: [true, 'Please select a category'],
    enum: [
      'Hardware Issue',
      'Software Issue',
      'Network Issue',
      'Account Issue',
      'Other'
    ]
  },
  status: {
    type: String,
    enum: ['Åpen', 'Under arbeid', 'Løst'],
    default: 'Åpen'
  },
  priority: {
    type: String,
    enum: ['Low', 'Medium', 'High', 'Critical'],
    default: 'Medium'
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  },
  history: [
    {
      status: {
        type: String,
        enum: ['Åpen', 'Under arbeid', 'Løst']
      },
      updatedAt: {
        type: Date,
        default: Date.now
      },
      updatedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      }
    }
  ]
});

// Add to history before updating ticket status
TicketSchema.pre('findOneAndUpdate', async function(next) {
  const docToUpdate = await this.model.findOne(this.getQuery());
  
  // If status is being updated
  if (this._update.status && this._update.status !== docToUpdate.status) {
    // Create history entry if status is changing
    const historyEntry = {
      status: this._update.status,
      updatedAt: Date.now(),
      updatedBy: this._update.updatedBy || docToUpdate.user // Fallback to user if updatedBy not provided
    };
    
    // Add to history array
    this._update.$push = { history: historyEntry };
  }
  
  // Update the updatedAt timestamp
  this._update.updatedAt = Date.now();
  
  next();
});

module.exports = mongoose.model('Ticket', TicketSchema);