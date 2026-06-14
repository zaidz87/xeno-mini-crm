/**
 * AI Controller
 * Orchestrates API endpoints for natural language segment extraction and marketing message drafting.
 */
const { generateSegmentRules, generateMessageDraft } = require('../services/geminiService');

/**
 * Convert plain English to segment rules.
 * POST /api/ai/segment
 */
async function parseSegmentRules(req, res) {
  try {
    const { userInput } = req.body;
    if (!userInput || userInput.trim() === '') {
      return res.status(400).json({
        success: false,
        message: 'userInput description is required.'
      });
    }

    const rules = await generateSegmentRules(userInput);
    res.status(200).json({
      success: true,
      rules
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to extract rules using AI.',
      error: error.message
    });
  }
}

/**
 * Draft marketing campaign message from goal description.
 * POST /api/ai/message
 */
async function generateMessage(req, res) {
  try {
    const { userDescription } = req.body;
    if (!userDescription || userDescription.trim() === '') {
      return res.status(400).json({
        success: false,
        message: 'userDescription goal is required.'
      });
    }

    const message = await generateMessageDraft(userDescription);
    res.status(200).json({
      success: true,
      message
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to draft message using AI.',
      error: error.message
    });
  }
}

module.exports = {
  parseSegmentRules,
  generateMessage
};
