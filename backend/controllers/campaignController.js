/**
 * Campaign Controller
 * Handles campaign configuration, detailed stat aggregation, and asynchronous send orchestration.
 */
const Campaign = require('../models/Campaign');
const Segment = require('../models/Segment');
const Customer = require('../models/Customer');
const CommunicationLog = require('../models/CommunicationLog');
const { buildQuery } = require('../services/segmentEngine');
const { dispatchMessage } = require('../services/channelService');

/**
 * Get all campaigns.
 * GET /api/campaigns
 */
async function getCampaigns(req, res) {
  try {
    const campaigns = await Campaign.find({}).sort({ createdAt: -1 });
    res.status(200).json({
      success: true,
      campaigns
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to retrieve campaigns.', error: error.message });
  }
}

/**
 * Create a new campaign (saved as draft).
 * POST /api/campaigns
 */
async function createCampaign(req, res) {
  try {
    const { name, segmentId, channel, message } = req.body;

    if (!name || !segmentId || !channel || !message) {
      return res.status(400).json({ success: false, message: 'All fields (name, segmentId, channel, message) are required.' });
    }

    // Check segment and cache its name
    const segment = await Segment.findById(segmentId);
    if (!segment) {
      return res.status(404).json({ success: false, message: 'Selected segment not found.' });
    }

    const campaign = new Campaign({
      name,
      segmentId,
      segmentName: segment.name,
      channel,
      message,
      status: 'draft',
      totalAudience: segment.matchedCount,
      sent: 0,
      delivered: 0,
      failed: 0,
      opened: 0,
      clicked: 0
    });

    await campaign.save();

    res.status(201).json({
      success: true,
      message: 'Campaign draft created successfully.',
      campaign
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to create campaign.', error: error.message });
  }
}

/**
 * Get campaign detailed stats.
 * GET /api/campaigns/:id
 */
async function getCampaignDetail(req, res) {
  try {
    const campaign = await Campaign.findById(req.params.id);
    if (!campaign) {
      return res.status(404).json({ success: false, message: 'Campaign not found.' });
    }

    res.status(200).json({
      success: true,
      campaign
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to retrieve campaign details.', error: error.message });
  }
}

/**
 * Get communication logs for a specific campaign.
 * GET /api/campaigns/:id/logs
 */
async function getCampaignLogs(req, res) {
  try {
    const logs = await CommunicationLog.find({ campaignId: req.params.id })
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      logs
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to retrieve communication logs.', error: error.message });
  }
}

/**
 * Trigger sending process for a campaign.
 * POST /api/campaigns/:id/send
 */
async function sendCampaign(req, res) {
  try {
    const campaign = await Campaign.findById(req.params.id);
    if (!campaign) {
      return res.status(404).json({ success: false, message: 'Campaign not found.' });
    }

    if (campaign.status !== 'draft') {
      return res.status(400).json({ success: false, message: 'Only campaigns in draft status can be sent.' });
    }

    const segment = await Segment.findById(campaign.segmentId);
    if (!segment) {
      return res.status(404).json({ success: false, message: 'Audience segment not found.' });
    }

    // Resolve matching customers
    const query = buildQuery(segment.rules);
    const customers = await Customer.find(query);

    if (customers.length === 0) {
      campaign.status = 'completed';
      campaign.totalAudience = 0;
      campaign.sent = 0;
      await campaign.save();
      return res.status(200).json({
        success: true,
        message: 'Campaign segment contains no customers. Sending process completed with 0 messages.',
        campaign
      });
    }

    // 1. Bulk generate communication log data in 'sent' state
    const timestamp = new Date();
    const logsToCreate = customers.map(customer => {
      const personalizedMessage = campaign.message.replace(/{{name}}/g, customer.name);
      return {
        campaignId: campaign._id,
        customerId: customer._id,
        customerName: customer.name,
        customerEmail: customer.email,
        message: personalizedMessage,
        channel: campaign.channel,
        status: 'sent',
        statusHistory: [{ status: 'sent', timestamp }]
      };
    });

    // Clear any existing logs for safety, then bulk insert
    await CommunicationLog.deleteMany({ campaignId: campaign._id });
    await CommunicationLog.insertMany(logsToCreate);

    // 2. Set campaign state to sending
    campaign.status = 'sending';
    campaign.totalAudience = customers.length;
    campaign.sent = customers.length;
    campaign.delivered = 0;
    campaign.failed = 0;
    campaign.opened = 0;
    campaign.clicked = 0;
    await campaign.save();

    // 3. Initiate dispatch asynchronously without awaiting, allowing immediate response to client
    runBackgroundDispatch(campaign, customers);

    res.status(200).json({
      success: true,
      message: 'Campaign sending process started.',
      campaign
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to start campaign delivery.', error: error.message });
  }
}

/**
 * Asynchronously sends individual dispatch calls to the Channel Service.
 */
async function runBackgroundDispatch(campaign, customers) {
  for (const customer of customers) {
    const personalizedMessage = campaign.message.replace(/{{name}}/g, customer.name);
    try {
      await dispatchMessage({
        campaignId: campaign._id,
        customerId: customer._id,
        customerName: customer.name,
        message: personalizedMessage,
        channel: campaign.channel
      });
    } catch (error) {
      console.error(`Dispatch failed directly for customer ${customer.email}:`, error.message);
      
      // Update this communication log to 'failed' since dispatch was blocked
      try {
        await CommunicationLog.findOneAndUpdate(
          { campaignId: campaign._id, customerId: customer._id },
          {
            status: 'failed',
            $push: { statusHistory: { status: 'failed', timestamp: new Date() } }
          }
        );
        
        // Increment the failed counter on the Campaign
        const updatedCampaign = await Campaign.findByIdAndUpdate(
          campaign._id,
          { $inc: { failed: 1 } },
          { new: true }
        );

        // Check if all messages are now in final state (delivered + failed = totalAudience)
        if (updatedCampaign && (updatedCampaign.delivered + updatedCampaign.failed >= updatedCampaign.totalAudience)) {
          updatedCampaign.status = 'completed';
          await updatedCampaign.save();
        }
      } catch (dbErr) {
        console.error('Failed to update DB for failed dispatch:', dbErr.message);
      }
    }
  }
}

/**
 * Delete a campaign.
 * DELETE /api/campaigns/:id
 */
async function deleteCampaign(req, res) {
  try {
    const campaign = await Campaign.findByIdAndDelete(req.params.id);
    if (!campaign) {
      return res.status(404).json({ success: false, message: 'Campaign not found.' });
    }

    // Clean up communication logs associated with this campaign
    await CommunicationLog.deleteMany({ campaignId: campaign._id });

    res.status(200).json({
      success: true,
      message: 'Campaign deleted successfully.',
      deletedCampaignId: campaign._id
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to delete campaign.', error: error.message });
  }
}

module.exports = {
  getCampaigns,
  createCampaign,
  getCampaignDetail,
  getCampaignLogs,
  sendCampaign,
  deleteCampaign
};
