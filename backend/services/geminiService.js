/**
 * Gemini Service
 * Handles integration with Google Gemini Generative AI SDK.
 * Includes fallback logic to allow testing without an active API key.
 */
const { GoogleGenerativeAI } = require('@google/generative-ai');

/**
 * Formats a plain English description into segment rules using Gemini.
 * @param {string} userInput - The user description of the audience.
 * @returns {Promise<Array>} - Array of rule objects.
 */
async function generateSegmentRules(userInput) {
  const apiKey = process.env.GEMINI_API_KEY;

  // Resilient fallback logic for demo/interview environments without configured API key
  if (!apiKey || apiKey === '' || apiKey.startsWith('your_gemini_api_key')) {
    console.warn('GEMINI_API_KEY not set. Using local mock parsing engine.');
    const rules = [];
    const lowerInput = userInput.toLowerCase();

    // Look for numbers in the string
    const numbers = userInput.match(/\d+/g);
    const firstNum = numbers ? parseInt(numbers[0], 10) : null;
    const secondNum = numbers && numbers.length > 1 ? parseInt(numbers[1], 10) : null;

    if (lowerInput.includes('spend') || lowerInput.includes('spent') || lowerInput.includes('rupees') || lowerInput.includes('rs')) {
      const val = firstNum || 2000;
      const op = lowerInput.includes('less') || lowerInput.includes('under') ? 'lt' : 'gt';
      rules.push({ field: 'totalSpend', operator: op, value: val });
    }

    if (lowerInput.includes('order') || lowerInput.includes('purchase') || lowerInput.includes('visit') || lowerInput.includes('buy')) {
      const val = secondNum || firstNum || 3;
      const op = lowerInput.includes('less') || lowerInput.includes('under') ? 'lt' : 'gte';
      rules.push({ field: 'orderCount', operator: op, value: val });
    }

    if (lowerInput.includes('day') || lowerInput.includes('month') || lowerInput.includes('last order') || lowerInput.includes('since')) {
      let days = firstNum || 30;
      if (lowerInput.includes('month')) {
        const months = firstNum || 1;
        days = months * 30;
      }
      const op = lowerInput.includes('recent') || lowerInput.includes('within') ? 'lt' : 'gt';
      rules.push({ field: 'daysSinceLastOrder', operator: op, value: days });
    }

    // Default rule if nothing matches
    if (rules.length === 0) {
      rules.push({ field: 'totalSpend', operator: 'gt', value: 5000 });
    }

    return rules;
  }

  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

    const prompt = `You are a CRM segmentation assistant. Convert the following plain English description into a JSON array of segment rules.

Available fields:
- totalSpend (number, in rupees)
- orderCount (number)
- daysSinceLastOrder (number, in days)

Available operators: gt, lt, gte, lte, eq

User description: "${userInput}"

Respond ONLY with a valid JSON array like this:
[
  { "field": "totalSpend", "operator": "gt", "value": 2000 },
  { "field": "daysSinceLastOrder", "operator": "gt", "value": 60 }
]

No explanation. No markdown. Just the JSON array.`;

    const result = await model.generateContent(prompt);
    const responseText = result.response.text().trim();

    // Clean markdown wrapping if present
    const cleanedJson = responseText
      .replace(/^```json\s*/i, '')
      .replace(/```\s*$/, '')
      .trim();

    const rules = JSON.parse(cleanedJson);
    if (!Array.isArray(rules)) {
      throw new Error('Gemini did not return an array');
    }
    return rules;
  } catch (error) {
    console.error('Gemini API segment parsing error:', error);
    throw new Error('AI was unable to parse segment rules. Please try again or construct manually.');
  }
}

/**
 * Drafts a marketing message from user goal description.
 * @param {string} userDescription - User-input marketing goal.
 * @returns {Promise<string>} - Drafted campaign message copy.
 */
async function generateMessageDraft(userDescription) {
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey || apiKey === '' || apiKey.startsWith('your_gemini_api_key')) {
    console.warn('GEMINI_API_KEY not set. Using local mock copywriting engine.');
    return `Hey {{name}}, we notice you love our brand! Grab a special discount code SAVE20 on your next purchase. Shop now: bit.ly/shop-xeno`;
  }

  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

    const prompt = `You are a marketing copywriter for a retail brand. Write a short, personalized WhatsApp/SMS marketing message based on this campaign goal:

"${userDescription}"

Rules:
- Use {{name}} as placeholder for customer name
- Keep it under 160 characters
- Make it warm, friendly, and action-oriented
- Include a call to action
- No hashtags

Respond with ONLY the message text. No explanation.`;

    const result = await model.generateContent(prompt);
    return result.response.text().trim();
  } catch (error) {
    console.error('Gemini API copywriting error:', error);
    throw new Error('AI copywriting service was unable to draft message. Please write manually.');
  }
}

module.exports = {
  generateSegmentRules,
  generateMessageDraft
};
