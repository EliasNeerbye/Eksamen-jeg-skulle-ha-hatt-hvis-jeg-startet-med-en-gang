/**
 * This script creates test users and tasks for demonstration purposes
 * Run with: node seed-data.js
 */

const mongoose = require('mongoose');
const User = require('./models/User');
const Task = require('./models/Task');
const crypto = require('crypto');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

// Hash password function - same as in auth.js for consistency
const hashPassword = (password) => {
  return crypto.createHash('sha256').update(password).digest('hex');
};

// Test users data
const testUsers = [
  { username: 'john', password: 'password123', isAdmin: false },
  { username: 'emma', password: 'password123', isAdmin: false },
  { username: 'sensor1', password: 'sensor123', isAdmin: true },
  { username: 'sensor2', password: 'sensor123', isAdmin: true }
];

// Days of the week
const daysOfWeek = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];

// Sample task titles and descriptions
const taskTemplates = [
  { title: 'Complete project report', description: 'Finish writing the quarterly project report and submit to the team lead.' },
  { title: 'Grocery shopping', description: 'Buy fruits, vegetables, milk, and bread from the supermarket.' },
  { title: 'Call client', description: 'Discuss project requirements and timeline with the new client.' },
  { title: 'Gym workout', description: 'Complete 30 minutes of cardio and 30 minutes of strength training.' },
  { title: 'Team meeting', description: 'Attend the weekly team meeting to discuss project progress.' },
  { title: 'Pay bills', description: 'Pay electricity, water, and internet bills before the due date.' },
  { title: 'Doctor appointment', description: 'Annual health checkup at the city clinic.' },
  { title: 'Study session', description: 'Review course materials and prepare for upcoming exam.' },
  { title: 'Clean apartment', description: 'Vacuum, dust, and clean the bathroom and kitchen.' },
  { title: 'Car maintenance', description: 'Take car for oil change and routine maintenance check.' }
];

// Function to create random tasks for a user
const createTasksForUser = async (userId) => {
  const tasks = [];
  
  // Create at least 5 tasks for the user
  for (let i = 0; i < 5; i++) {
    // Select a random task template
    const taskTemplate = taskTemplates[Math.floor(Math.random() * taskTemplates.length)];
    
    // Select a random day of the week
    const day = daysOfWeek[Math.floor(Math.random() * daysOfWeek.length)];
    
    // Create task with 30% chance of being completed and 80% chance of recurring
    const task = new Task({
      title: taskTemplate.title,
      description: taskTemplate.description,
      completed: Math.random() < 0.3,
      dayOfWeek: day,
      user: userId,
      isRecurring: Math.random() < 0.8
    });
    
    tasks.push(task);
  }
  
  // Save all tasks
  return Promise.all(tasks.map(task => task.save()));
};

// Main function to seed the database
async function seedDatabase() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');
    
    // Clear existing data
    console.log('Clearing existing users and tasks...');
    await User.deleteMany({ username: { $in: testUsers.map(user => user.username) } });
    
    // Create test users
    console.log('Creating test users...');
    const createdUsers = [];
    
    for (const userData of testUsers) {
      const user = new User({
        username: userData.username,
        password: hashPassword(userData.password),
        isAdmin: userData.isAdmin
      });
      
      const savedUser = await user.save();
      createdUsers.push(savedUser);
      console.log(`Created user: ${userData.username}`);
      
      // Create tasks for this user
      const tasks = await createTasksForUser(savedUser._id);
      console.log(`Created ${tasks.length} tasks for ${userData.username}`);
    }
    
    console.log('Database seeding completed successfully!');
    console.log('\nTest User Credentials:');
    testUsers.forEach(user => {
      console.log(`- Username: ${user.username}, Password: ${user.password}${user.isAdmin ? ' (Admin)' : ''}`);
    });
    
  } catch (error) {
    console.error('Error seeding database:', error);
  } finally {
    // Close MongoDB connection
    await mongoose.connection.close();
    console.log('MongoDB connection closed');
  }
}

// Run the seed function
seedDatabase();