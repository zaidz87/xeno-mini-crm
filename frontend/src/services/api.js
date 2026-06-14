/**
 * CRM API Service
 * Centralizes all Axios HTTP requests to the backend server.
 * Reads configurations from VITE_API_URL environment variable.
 */
import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const client = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Helper for multipart/form-data requests (CSV uploads)
const uploadClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'multipart/form-data'
  }
});

export const customerApi = {
  // GET /api/customers - Get paginated customers with search
  getCustomers: async (search = '', page = 1, limit = 20) => {
    const response = await client.get('/customers', {
      params: { search, page, limit }
    });
    return response.data;
  },

  // POST /api/customers/import - Upload customer CSV
  importCustomers: async (file) => {
    const formData = new FormData();
    formData.append('file', file);
    const response = await uploadClient.post('/customers/import', formData);
    return response.data;
  },

  // POST /api/customers/seed - Seed 100 fake customers and orders
  seedCustomers: async () => {
    const response = await client.post('/customers/seed');
    return response.data;
  },

  // DELETE /api/customers/clear - Clear database collections and reseed
  clearAndReseedCustomers: async () => {
    const response = await client.delete('/customers/clear');
    return response.data;
  }
};

export const orderApi = {
  // POST /api/orders/import - Upload orders CSV
  importOrders: async (file) => {
    const formData = new FormData();
    formData.append('file', file);
    const response = await uploadClient.post('/orders/import', formData);
    return response.data;
  }
};

export const segmentApi = {
  // GET /api/segments - Get all segments
  getSegments: async () => {
    const response = await client.get('/segments');
    return response.data;
  },

  // POST /api/segments - Create a new segment with rules
  createSegment: async (segmentData) => {
    const response = await client.post('/segments', segmentData);
    return response.data;
  },

  // POST /api/segments/preview - Preview customer count for unsaved rules
  previewRules: async (rules) => {
    const response = await client.post('/segments/preview', { rules });
    return response.data;
  },

  // GET /api/segments/:id/preview - Get matching customer count for saved segment
  previewSavedSegment: async (id) => {
    const response = await client.get(`/segments/${id}/preview`);
    return response.data;
  },

  // DELETE /api/segments/:id - Delete a segment
  deleteSegment: async (id) => {
    const response = await client.delete(`/segments/${id}`);
    return response.data;
  }
};

export const campaignApi = {
  // GET /api/campaigns - Get all campaigns
  getCampaigns: async () => {
    const response = await client.get('/campaigns');
    return response.data;
  },

  // POST /api/campaigns - Create a new campaign draft
  createCampaign: async (campaignData) => {
    const response = await client.post('/campaigns', campaignData);
    return response.data;
  },

  // POST /api/campaigns/:id/send - Trigger campaign message send
  sendCampaign: async (id) => {
    const response = await client.post(`/campaigns/${id}/send`);
    return response.data;
  },

  // GET /api/campaigns/:id - Get campaign details + stats
  getCampaignDetail: async (id) => {
    const response = await client.get(`/campaigns/${id}`);
    return response.data;
  },

  // GET /api/campaigns/:id/logs - Get communications logs for a campaign
  getCampaignLogs: async (id) => {
    const response = await client.get(`/campaigns/${id}/logs`);
    return response.data;
  },

  // DELETE /api/campaigns/:id - Delete a campaign
  deleteCampaign: async (id) => {
    const response = await client.delete(`/campaigns/${id}`);
    return response.data;
  }
};

export const aiApi = {
  // POST /api/ai/segment - Convert plain English text to segment rules
  parseSegmentRules: async (userInput) => {
    const response = await client.post('/ai/segment', { userInput });
    return response.data;
  },

  // POST /api/ai/message - Draft campaign message from goal description
  generateMessage: async (userDescription) => {
    const response = await client.post('/ai/message', { userDescription });
    return response.data;
  }
};
