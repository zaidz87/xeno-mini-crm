/**
 * Database Seeder
 * Generates 100 realistic Indian customers and 3-5 orders for each,
 * linking them correctly. Can be run via CLI or imported as a function.
 */
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

const Customer = require('../models/Customer');
const Order = require('../models/Order');

// Load environment variables if run directly
if (require.main === module) {
  dotenv.config({ path: path.join(__dirname, '../.env') });
}

const FIRST_NAMES = [
  'Priya', 'Rahul', 'Ananya', 'Arjun', 'Deepika', 'Rohan', 'Sneha', 'Vikram', 
  'Pooja', 'Aditya', 'Neha', 'Kabir', 'Riya', 'Yash', 'Amit', 'Shreya', 
  'Sameer', 'Tanvi', 'Kunal', 'Divya', 'Aarav', 'Ishaan', 'Kavya', 'Siddharth',
  'Meera', 'Rishi', 'Kiran', 'Aishwarya', 'Varun', 'Neha', 'Dev', 'Tara'
];

const LAST_NAMES = [
  'Sharma', 'Verma', 'Gupta', 'Patel', 'Sen', 'Mehta', 'Joshi', 'Rao', 
  'Nair', 'Malhotra', 'Singh', 'Das', 'Chatterjee', 'Iyer', 'Reddy', 'Choudhury',
  'Saxena', 'Kapoor', 'Trivedi', 'Bhat', 'Dubey', 'Banerjee', 'Mishra', 'Gowda'
];

const ITEMS = [
  'Kurta Set', 'Saree', 'Casual Shirt', 'Denim Jeans', 'Leather Wallet',
  'Designer Watch', 'Running Shoes', 'Silver Necklace', 'Cotton T-Shirt',
  'Silk Dupatta', 'Jhumka Earrings', 'Sunglasses', 'Handbag', 'Chappals'
];

function getRandomElement(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function getRandomNumber(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function getRandomDateInLast6Months() {
  const now = new Date();
  const pastDate = new Date();
  pastDate.setMonth(now.getMonth() - getRandomNumber(0, 5));
  pastDate.setDate(getRandomNumber(1, 28));
  pastDate.setHours(getRandomNumber(0, 23), getRandomNumber(0, 59));
  return pastDate;
}

/**
 * Seeds the database with mock customers and orders.
 * Clears existing customer/order data before seeding.
 */
async function seedDatabase() {
  try {
    // Clear existing collections
    await Customer.deleteMany({});
    await Order.deleteMany({});
    console.log('Cleared existing Customer and Order collections.');

    const customersToInsert = [];
    
    // 1. Generate 100 Indian customers
    for (let i = 0; i < 100; i++) {
      const firstName = getRandomElement(FIRST_NAMES);
      const lastName = getRandomElement(LAST_NAMES);
      const name = `${firstName} ${lastName}`;
      const email = `${firstName.toLowerCase()}.${lastName.toLowerCase()}.${getRandomNumber(10, 99)}@example.com`;
      const phone = `${getRandomNumber(7, 9)}${getRandomNumber(100000000, 999999999)}`; // 10-digit realistic Indian number
      
      customersToInsert.push({
        name,
        email,
        phone,
        totalSpend: 0,
        orderCount: 0,
        lastOrderDate: null
      });
    }

    const createdCustomers = await Customer.insertMany(customersToInsert);
    console.log(`Successfully seeded ${createdCustomers.length} Customers.`);

    const ordersToInsert = [];

    // 2. Generate 3-5 orders per customer and calculate customer fields
    for (const customer of createdCustomers) {
      const orderCount = getRandomNumber(3, 5);
      let totalSpend = 0;
      let lastOrderDate = new Date(0); // far past

      for (let j = 0; j < orderCount; j++) {
        const amount = getRandomNumber(500, 8000);
        const date = getRandomDateInLast6Months();
        
        // Select 1 to 3 random items
        const itemCount = getRandomNumber(1, 3);
        const orderItems = [];
        for (let k = 0; k < itemCount; k++) {
          orderItems.push(getRandomElement(ITEMS));
        }

        ordersToInsert.push({
          customerId: customer._id,
          customerEmail: customer.email,
          amount,
          date,
          items: orderItems.join(', ')
        });

        totalSpend += amount;
        if (date > lastOrderDate) {
          lastOrderDate = date;
        }
      }

      // Update customer object with calculated stats
      customer.totalSpend = totalSpend;
      customer.orderCount = orderCount;
      customer.lastOrderDate = lastOrderDate;
      await customer.save();
    }

    const createdOrders = await Order.insertMany(ordersToInsert);
    console.log(`Successfully seeded ${createdOrders.length} Orders.`);
    
    return {
      customersCount: createdCustomers.length,
      ordersCount: createdOrders.length
    };
  } catch (error) {
    console.error('Error seeding database:', error);
    throw error;
  }
}

// Runnable from terminal command line
if (require.main === module) {
  const mongoUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/xeno-crm';
  console.log(`Seeding database using URI: ${mongoUri}`);
  
  mongoose.connect(mongoUri)
    .then(async () => {
      console.log('MongoDB connected for seeding...');
      const summary = await seedDatabase();
      console.log(`Seeding complete. Seeded ${summary.customersCount} customers and ${summary.ordersCount} orders.`);
      await mongoose.connection.close();
      process.exit(0);
    })
    .catch((err) => {
      console.error('Database connection failed:', err);
      process.exit(1);
    });
}

module.exports = {
  seedDatabase
};
