/**
 * Channel Service Client
 * Handles communication with the standalone Channel Service server.
 */
const axios = require('axios');

/**
 * Dispatches a message request to the Channel Service.
 * @param {Object} params - The message parameters.
 * @param {string} params.campaignId - Campaign database ID.
 * @param {string} params.customerId - Customer database ID.
 * @param {string} params.customerName - Customer name.
 * @param {string} params.message - Personalized message.
 * @param {string} params.channel - "whatsapp" | "sms" | "email".
 * @returns {Promise<Object>} - Axios promise response.
 */
async function dispatchMessage({ campaignId, customerId, customerName, message, channel }) {
  const channelServiceUrl = process.env.CHANNEL_SERVICE_URL || 'http://localhost:6000';
  // Use receipt URL from env or fallback to local port 5000
  const receiptUrl = process.env.CRM_RECEIPT_URL || 'http://localhost:5000/api/receipt';

  const payload = {
    campaignId,
    customerId,
    customerName,
    message,
    channel,
    receiptUrl
  };

  try {
    const response = await axios.post(`${channelServiceUrl}/send`, payload);
    return response.data;
  } catch (error) {
    console.error(`Failed to dispatch message for customer ${customerId} in campaign ${campaignId}:`, error.message);
    throw error;
  }
}

module.exports = {
  dispatchMessage
};
