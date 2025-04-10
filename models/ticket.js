const mongoose = require('mongoose');

const ticketSchema = new mongoose.Schema({
    title: {
        type: String,
        required: [true, 'Title is required'],
        trim: true,
        minlength: [3, 'Title must be at least 3 characters long'],
        maxlength: [100, 'Title cannot exceed 100 characters']
    },
    description: {
        type: String,
        required: [true, 'Description is required'],
        trim: true,
        minlength: [10, 'Description must be at least 10 characters long']
    },
    status: {
        type: String,
        enum: ['Open', 'Assigned', 'In Progress', 'Resolved', 'Closed'],
        default: 'Open'
    },
    priority: {
        type: String,
        enum: ['Low', 'Medium', 'High', 'Critical'],
        required: [true, 'Priority is required']
    },
    category: {
        type: String,
        enum: ['Hardware', 'Software', 'Network', 'Account', 'Other'],
        required: [true, 'Category is required']
    },
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: [true, 'User is required']
    },
    assignedTo: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    assignedRole: {
        type: String,
        enum: ['first_line', 'second_line'],
        default: 'first_line'
    },
    feedback: {
        rating: {
            type: Number,
            min: 1,
            max: 5
        },
        comment: {
            type: String,
            trim: true
        },
        submittedAt: {
            type: Date
        }
    },
    comments: [{
        content: {
            type: String,
            required: [true, 'Comment content is required'],
            trim: true
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
        isInternal: {
            type: Boolean,
            default: false
        }
    }],
    history: [{
        field: String,
        oldValue: String,
        newValue: String,
        changedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        },
        changedAt: {
            type: Date,
            default: Date.now
        }
    }],
    searchableText: {
        type: String,
        select: false
    }
}, {
    timestamps: true
});

// Pre-save middleware to update searchable text
ticketSchema.pre('save', function(next) {
    this.searchableText = `${this.title} ${this.description} ${this.status} ${this.priority} ${this.category}`.toLowerCase();
    next();
});

// Instance method to add a comment
ticketSchema.methods.addComment = function(content, userId) {
    this.comments.push({
        content,
        user: userId
    });
    return this.save();
};

// Instance method to update status
ticketSchema.methods.updateStatus = function(newStatus, userId) {
    if (this.status !== newStatus) {
        this.history.push({
            field: 'status',
            oldValue: this.status,
            newValue: newStatus,
            changedBy: userId
        });
        this.status = newStatus;
    }
    return this.save();
};

// Instance method to assign ticket
ticketSchema.methods.assign = function(userId, assignedBy) {
    if (this.assignedTo?.toString() !== userId?.toString()) {
        this.history.push({
            field: 'assignedTo',
            oldValue: this.assignedTo ? this.assignedTo.toString() : 'Unassigned',
            newValue: userId ? userId.toString() : 'Unassigned',
            changedBy: assignedBy
        });
        this.assignedTo = userId;
    }
    return this.save();
};

// Pre-save middleware to update timestamps
ticketSchema.pre('save', function(next) {
    this.updatedAt = new Date();
    next();
});

// Static method to get ticket statistics
ticketSchema.statics.getStats = async function() {
    return this.aggregate([
        {
            $group: {
                _id: '$status',
                count: { $sum: 1 }
            }
        }
    ]);
};

const Ticket = mongoose.model('Ticket', ticketSchema);

module.exports = Ticket;