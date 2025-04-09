const mongoose = require("mongoose");

async function connectDB() {
  try {
    // Register listeners before attempting connection
    mongoose.connection.once("open", () => {
      console.log("MongoDB connected successfully!");
    });
    
    mongoose.connection.on("error", (err) => {
      console.error('MongoDB connection error:', err);
    });

    // Use environment variable for connection string with fallback
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://10.12.10.232/helpdesk');
    
    // This will print but the "once" handler above will provide more confirmation
    console.log('MongoDB connection initiated');

  } catch (error) {
    console.error('MongoDB connection failed:', error);
    process.exit(1);
  }
}

module.exports = {
  connectDB
};