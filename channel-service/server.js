/**
 * Channel Service Simulator
 * Standalone server that acts as a simulated message dispatcher.
 * Immediately acknowledges message dispatches, then triggers async callbacks simulating:
 * 1. Delivery/Failure (85% delivered, 15% failed)
 * 2. Opens (40% of delivered)
 * 3. Clicks (25% of opened)
 * Implements exponential retries (3 attempts, 2-sec delay) if the receipt callback fails.
 */
const express = require('express');
const cors = require('cors');
const axios = require('axios');
const dotenv = require('dotenv');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 6000;

app.use(cors());
app.use(express.json());

/**
 * Retries sending status callbacks to the CRM backend up to 3 times.
 * @param {string} url - Recipient URL (receipt hook).
 * @param {Object} payload - Status object { campaignId, customerId, status }.
 * @param {number} attempt - Current retry count.
 */
async function sendReceiptCallback(url, payload, attempt = 0) {
  try {
    await axios.post(url, payload);
    console.log(`[CALLBACK SUCCESS] Campaign ${payload.campaignId} -> Customer ${payload.customerId} -> Status: ${payload.status}`);
  } catch (error) {
    console.error(`[CALLBACK ERROR] Attempt ${attempt + 1}/3 failed for Campaign ${payload.campaignId}, Customer ${payload.customerId}. Error: ${error.message}`);
    
    if (attempt < 2) {
      setTimeout(() => {
        sendReceiptCallback(url, payload, attempt + 1);
      }, 2000); // 2 seconds delay between retries
    } else {
      console.error(`[CALLBACK FAILED PERMANENTLY] Failed to send status '${payload.status}' callback after 3 attempts.`);
    }
  }
}

// POST /send - Mock dispatch handler called by CRM backend
app.post('/send', (req, res) => {
  const { campaignId, customerId, customerName, message, channel, receiptUrl } = req.body;
  const targetReceiptUrl = receiptUrl || process.env.CRM_RECEIPT_URL || 'http://localhost:5000/api/receipt';

  // Log incoming dispatch
  console.log(`[DISPATCH] Campaign: ${campaignId} | Customer: ${customerName} (${customerId}) | Channel: ${channel}`);

  // 1. Immediately acknowledge dispatch receipt
  res.status(200).json({
    success: true,
    message: `Message accepted for dispatch on ${channel}`
  });

  // 2. Perform background simulation asynchronously
  // Step A: Wait random 1000-3000ms (simulate dispatch latency)
  const dispatchDelay = Math.floor(Math.random() * 2000) + 1000;
  
  setTimeout(() => {
    // Step B: Decide outcome (85% delivered, 15% failed)
    const isDelivered = Math.random() < 0.85;
    const deliveryStatus = isDelivered ? 'delivered' : 'failed';
    
    sendReceiptCallback(targetReceiptUrl, { campaignId, customerId, status: deliveryStatus });

    if (isDelivered) {
      // Step C: Wait random 2000-5000ms (simulate customer receiving and reading message)
      const openDelay = Math.floor(Math.random() * 3000) + 2000;
      
      setTimeout(() => {
        // Decide open status (40% chance of open)
        const isOpened = Math.random() < 0.40;
        
        if (isOpened) {
          sendReceiptCallback(targetReceiptUrl, { campaignId, customerId, status: 'opened' });
          
          // Step D: Wait random 1000-3000ms (simulate customer clicking link inside)
          const clickDelay = Math.floor(Math.random() * 2000) + 1000;
          
          setTimeout(() => {
            // Decide click status (25% chance of click)
            const isClicked = Math.random() < 0.25;
            
            if (isClicked) {
              sendReceiptCallback(targetReceiptUrl, { campaignId, customerId, status: 'clicked' });
            }
          }, clickDelay);
        }
      }, openDelay);
    }
  }, dispatchDelay);
});

// Start Server
app.listen(PORT, () => {
  console.log(`Xeno Channel Service Simulator running on port ${PORT}`);
});
