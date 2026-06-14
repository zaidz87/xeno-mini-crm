/**
 * Receipt Controller
 * Handles status callback webhooks from the Channel Service, updating log histories
 * and recalculating campaign metrics in real-time.
 */
const CommunicationLog = require('../models/CommunicationLog');
const Campaign = require('../models/Campaign');

/**
 * Handle delivery receipt status updates from Channel Service.
 * POST /api/receipt
 */
async function handleReceipt(req, res) {
  try {
    const { campaignId, customerId, status } = req.body;

    if (!campaignId || !customerId || !status) {
      return res.status(400).json({
        success: false,
        message: 'Missing required parameters: campaignId, customerId, status'
      });
    }

    // 1. Find communication log
    const log = await CommunicationLog.findOne({ campaignId, customerId });
    if (!log) {
      return res.status(404).json({
        success: false,
        message: `Communication log not found for campaign ${campaignId} and customer ${customerId}`
      });
    }

    // Prevent duplicate updates for the same state
    const alreadyLogged = log.statusHistory.some(history => history.status === status);
    if (alreadyLogged) {
      return res.status(200).json({
        success: true,
        message: `Status '${status}' already logged for this record.`
      });
    }

    // Save previous status to handle state transition counts correctly
    const previousStatus = log.status;

    // 2. Update status and history
    log.status = status;
    log.statusHistory.push({
      status,
      timestamp: new Date()
    });
    await log.save();

    // 3. Construct campaign update based on state transition
    const campaignUpdate = { $inc: {} };

    if (status === 'delivered' && previousStatus === 'sent') {
      campaignUpdate.$inc.delivered = 1;
    } else if (status === 'failed' && previousStatus === 'sent') {
      campaignUpdate.$inc.failed = 1;
    } else if (status === 'opened') {
      campaignUpdate.$inc.opened = 1;
      // Safeguard: if for some reason 'delivered' was skipped
      if (previousStatus === 'sent') {
        campaignUpdate.$inc.delivered = 1;
      }
    } else if (status === 'clicked') {
      campaignUpdate.$inc.clicked = 1;
      // Safeguard: if 'opened' or 'delivered' were skipped
      const hasOpened = log.statusHistory.some(h => h.status === 'opened');
      if (!hasOpened) {
        campaignUpdate.$inc.opened = 1;
      }
      if (previousStatus === 'sent') {
        campaignUpdate.$inc.delivered = 1;
      }
    }

    // Apply updates if any exist
    if (Object.keys(campaignUpdate.$inc).length > 0) {
      await Campaign.findByIdAndUpdate(campaignId, campaignUpdate);
    }

    // 4. Check if all logs have completed their delivery attempt (are no longer in 'sent' status)
    const pendingSentCount = await CommunicationLog.countDocuments({
      campaignId,
      status: 'sent'
    });

    if (pendingSentCount === 0) {
      await Campaign.findByIdAndUpdate(campaignId, { status: 'completed' });
      console.log(`Campaign ${campaignId} marked as completed.`);
    }

    res.status(200).json({
      success: true,
      message: 'Receipt processed successfully.'
    });
  } catch (error) {
    console.error('Error handling receipt:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to process delivery receipt.',
      error: error.message
    });
  }
}

module.exports = {
  handleReceipt
};
