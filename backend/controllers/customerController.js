/**
 * Customer Controller
 * Handles customer retrieval, seeding demo data, and CSV customer/order imports.
 */
const { Readable } = require('stream');
const csv = require('csv-parser');
const Customer = require('../models/Customer');
const Order = require('../models/Order');
const { seedDatabase } = require('../seed/seedData');

/**
 * Get all customers with search filtering and pagination.
 * GET /api/customers
 */
async function getCustomers(req, res) {
  try {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.max(1, parseInt(req.query.limit, 10) || 20);
    const search = req.query.search || '';

    // Build case-insensitive text search filter for name or email
    const filter = {};
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } }
      ];
    }

    const total = await Customer.countDocuments(filter);
    const customers = await Customer.find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit);

    res.status(200).json({
      success: true,
      customers,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to retrieve customers.', error: error.message });
  }
}

/**
 * Import customers from an uploaded CSV file.
 * POST /api/customers/import
 */
async function importCustomers(req, res) {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'Please upload a CSV file.' });
    }

    const customers = [];
    const stream = Readable.from(req.file.buffer.toString());

    stream.pipe(csv())
      .on('data', (row) => {
        // Normalize CSV keys (case insensitive / trimmed)
        const normalizedRow = {};
        Object.keys(row).forEach(key => {
          normalizedRow[key.trim().toLowerCase()] = row[key] ? row[key].trim() : '';
        });
        customers.push(normalizedRow);
      })
      .on('end', async () => {
        let importedCount = 0;
        let skippedCount = 0;

        for (const customerData of customers) {
          const email = customerData.email;
          if (!email) {
            skippedCount++;
            continue;
          }

          const name = customerData.name || email.split('@')[0];
          const phone = customerData.phone || '';
          const totalSpend = Number(customerData.totalspend) || 0;
          const orderCount = Number(customerData.ordercount) || 0;
          const lastOrderDate = customerData.lastorderdate ? new Date(customerData.lastorderdate) : null;

          try {
            // Upsert customer by unique email
            await Customer.findOneAndUpdate(
              { email: email.toLowerCase() },
              {
                name,
                phone,
                totalSpend,
                orderCount,
                lastOrderDate
              },
              { upsert: true, new: true }
            );
            importedCount++;
          } catch (err) {
            console.error(`Error importing customer ${email}:`, err.message);
            skippedCount++;
          }
        }

        res.status(200).json({
          success: true,
          message: `CSV import completed successfully.`,
          summary: {
            totalRows: customers.length,
            imported: importedCount,
            skipped: skippedCount
          }
        });
      })
      .on('error', (err) => {
        res.status(500).json({ success: false, message: 'Error parsing customer CSV file.', error: err.message });
      });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error during customer import.', error: error.message });
  }
}

/**
 * Import orders from an uploaded CSV file, link to customers, and recalculate metrics.
 * POST /api/orders/import
 */
async function importOrders(req, res) {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'Please upload a CSV file.' });
    }

    const orders = [];
    const stream = Readable.from(req.file.buffer.toString());

    stream.pipe(csv())
      .on('data', (row) => {
        // Normalize CSV keys
        const normalizedRow = {};
        Object.keys(row).forEach(key => {
          normalizedRow[key.trim().toLowerCase()] = row[key] ? row[key].trim() : '';
        });
        orders.push(normalizedRow);
      })
      .on('end', async () => {
        let importedCount = 0;
        let skippedCount = 0;

        for (const orderData of orders) {
          const email = orderData.customeremail;
          const amount = Number(orderData.amount);
          const date = orderData.date ? new Date(orderData.date) : new Date();
          const items = orderData.items || '';

          if (!email || isNaN(amount)) {
            skippedCount++;
            continue;
          }

          try {
            // Find existing customer or create a placeholder customer
            let customer = await Customer.findOne({ email: email.toLowerCase() });

            if (!customer) {
              // Create default placeholder customer for this order
              const defaultName = email.split('@')[0];
              customer = new Customer({
                name: defaultName.charAt(0).toUpperCase() + defaultName.slice(1),
                email: email.toLowerCase(),
                phone: 'N/A',
                totalSpend: amount,
                orderCount: 1,
                lastOrderDate: date
              });
              await customer.save();
            } else {
              // Update customer metrics
              customer.totalSpend += amount;
              customer.orderCount += 1;
              
              if (!customer.lastOrderDate || date > customer.lastOrderDate) {
                customer.lastOrderDate = date;
              }
              await customer.save();
            }

            // Create Order linked to customer
            const newOrder = new Order({
              customerId: customer._id,
              customerEmail: customer.email,
              amount,
              date,
              items
            });
            await newOrder.save();
            importedCount++;
          } catch (err) {
            console.error(`Error importing order for email ${email}:`, err.message);
            skippedCount++;
          }
        }

        res.status(200).json({
          success: true,
          message: `Orders CSV import completed successfully.`,
          summary: {
            totalRows: orders.length,
            imported: importedCount,
            skipped: skippedCount
          }
        });
      })
      .on('error', (err) => {
        res.status(500).json({ success: false, message: 'Error parsing orders CSV file.', error: err.message });
      });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error during order import.', error: error.message });
  }
}

/**
 * Seed the database with 100 mock Indian customers and orders.
 * POST /api/customers/seed
 */
async function seedCustomers(req, res) {
  try {
    const summary = await seedDatabase();
    res.status(200).json({
      success: true,
      message: 'Database successfully seeded with mock Indian customers and orders.',
      data: summary
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to seed database.', error: error.message });
  }
}

module.exports = {
  getCustomers,
  importCustomers,
  importOrders,
  seedCustomers
};
