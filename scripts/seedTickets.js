require('dotenv').config();
const mongoose = require('mongoose');
const Ticket = require('../models/ticket');
const User = require('../models/user');

// Sample ticket data
const sampleTickets = [
    {
        title: 'Printer not working',
        description: 'The office printer on the 2nd floor is not responding to print jobs',
        status: 'Open',
        priority: 'Medium',
        category: 'Hardware',
    },
    {
        title: 'Email server down',
        description: 'Users unable to send or receive emails since 9 AM',
        status: 'In Progress',
        priority: 'High',
        category: 'Network',
    },
    {
        title: 'Software license expired',
        description: 'Adobe Creative Suite license needs renewal',
        status: 'Open',
        priority: 'Low',
        category: 'Software',
    },
    {
        title: 'New employee setup',
        description: 'Need workstation setup for new hire starting next week',
        status: 'Open',
        priority: 'Medium',
        category: 'Other',
    },
    {
        title: 'Server backup failed',
        description: 'Last night\'s automated backup process failed',
        status: 'Resolved',
        priority: 'High',
        category: 'System',
    }
];

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI)
    .then(() => console.log('Connected to MongoDB...'))
    .catch(err => {
        console.error('Could not connect to MongoDB...', err);
        process.exit(1);
    });

async function seedDatabase() {
    try {
        // Clear existing tickets
        await Ticket.deleteMany({});
        console.log('Cleared existing tickets');

        // Find a user to assign tickets to (preferably an admin)
        const admin = await User.findOne({ role: 'admin' });
        if (!admin) {
            console.log('No admin user found. Please create an admin user first.');
            process.exit(1);
        }

        // Add user reference to each ticket
        const ticketsWithUser = sampleTickets.map(ticket => ({
            ...ticket,
            createdBy: admin._id,
            assignedTo: admin._id
        }));

        // Insert sample tickets
        await Ticket.insertMany(ticketsWithUser);
        console.log('Sample tickets inserted successfully');

        // Disconnect from database
        await mongoose.disconnect();
        console.log('Database connection closed');
        process.exit(0);
    } catch (error) {
        console.error('Error seeding database:', error);
        process.exit(1);
    }
}

seedDatabase(); 