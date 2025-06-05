import request from 'supertest';
import express from 'express';
import bodyParser from 'body-parser';
import inventoryRoutes from '../routes/inventory.routes';
import { readInventory, writeInventory } from '../utils/file-utils';
import { Apparel } from '../models/apparel.model';

// Mock the file utility functions
jest.mock('../utils/file-utils');

const mockedReadInventory = readInventory as jest.Mock;
const mockedWriteInventory = writeInventory as jest.Mock;

describe('Inventory API Endpoints', () => {
  let app: express.Application;
  let mockInventory: Apparel[];

  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();
    
    // Create Express app
    app = express();
    app.use(bodyParser.json());
    app.use('/api/inventory', inventoryRoutes);
    
    // Initialize mock inventory
    mockInventory = [
      {
        code: 'TSHIRT001',
        sizes: [
          { size: 'S', quantity: 10, price: 15 },
          { size: 'M', quantity: 15, price: 15 },
          { size: 'L', quantity: 5, price: 15 }
        ]
      },
      {
        code: 'JEANS001',
        sizes: [
          { size: '30', quantity: 8, price: 45 },
          { size: '32', quantity: 12, price: 45 },
          { size: '34', quantity: 6, price: 45 }
        ]
      }
    ];
    
    // Mock the readInventory to return the mockInventory
    mockedReadInventory.mockResolvedValue(mockInventory);
    
    // Mock writeInventory to do nothing
    mockedWriteInventory.mockResolvedValue(undefined);
  });

  describe('GET /api/inventory', () => {
    it('should return all inventory items', async () => {
      const response = await request(app).get('/api/inventory');
      
      expect(response.status).toBe(200);
      expect(response.body).toEqual(mockInventory);
    });
  });
  
  describe('GET /api/inventory/:code', () => {
    it('should return a specific apparel by code', async () => {
      const response = await request(app).get('/api/inventory/TSHIRT001');
      
      expect(response.status).toBe(200);
      expect(response.body).toEqual(mockInventory[0]);
    });
    
    it('should return 404 for non-existent apparel code', async () => {
      const response = await request(app).get('/api/inventory/NONEXISTENT');
      
      expect(response.status).toBe(404);
    });
  });
  
  describe('PUT /api/inventory/update', () => {
    it('should update stock for an existing apparel', async () => {
      const updateData = {
        code: 'TSHIRT001',
        size: 'M',
        quantity: 20,
        price: 18
      };
      
      const response = await request(app)
        .put('/api/inventory/update')
        .send(updateData);
      
      expect(response.status).toBe(200);
      expect(response.body.code).toBe('TSHIRT001');
      expect(mockedWriteInventory).toHaveBeenCalled();
    });
    
    it('should return 400 for missing fields', async () => {
      const updateData = {
        code: 'TSHIRT001',
        size: 'M',
        // Missing quantity and price
      };
      
      const response = await request(app)
        .put('/api/inventory/update')
        .send(updateData);
      
      expect(response.status).toBe(400);
      expect(mockedWriteInventory).not.toHaveBeenCalled();
    });
  });
  
  describe('PUT /api/inventory/update-multiple', () => {
    it('should update multiple stock items', async () => {
      const updateData = [
        { code: 'TSHIRT001', size: 'S', quantity: 25, price: 16 },
        { code: 'JEANS001', size: '36', quantity: 10, price: 45 }
      ];
      
      const response = await request(app)
        .put('/api/inventory/update-multiple')
        .send(updateData);
      
      expect(response.status).toBe(200);
      expect(response.body.length).toBe(2);
      expect(mockedWriteInventory).toHaveBeenCalled();
    });
    
    it('should return 400 for non-array input', async () => {
      const updateData = {
        code: 'TSHIRT001',
        size: 'M',
        quantity: 20,
        price: 18
      };
      
      const response = await request(app)
        .put('/api/inventory/update-multiple')
        .send(updateData);
      
      expect(response.status).toBe(400);
      expect(mockedWriteInventory).not.toHaveBeenCalled();
    });
  });
  
  describe('POST /api/inventory/check-fulfillment', () => {
    it('should confirm order can be fulfilled when sufficient stock', async () => {
      const order = {
        id: 'ORDER001',
        items: [
          { code: 'TSHIRT001', size: 'M', quantity: 5 },
          { code: 'JEANS001', size: '32', quantity: 3 }
        ]
      };
      
      const response = await request(app)
        .post('/api/inventory/check-fulfillment')
        .send(order);
      
      expect(response.status).toBe(200);
      expect(response.body.canFulfill).toBe(true);
    });
    
    it('should return 400 for invalid order format', async () => {
      const order = {
        id: 'ORDER001',
        // Missing items array
      };
      
      const response = await request(app)
        .post('/api/inventory/check-fulfillment')
        .send(order);
      
      expect(response.status).toBe(400);
    });
  });
  
  describe('POST /api/inventory/calculate-cost', () => {
    it('should calculate correct order cost when fulfillable', async () => {
      const order = {
        id: 'ORDER001',
        items: [
          { code: 'TSHIRT001', size: 'M', quantity: 2 }, // 2 * $15 = $30
          { code: 'JEANS001', size: '32', quantity: 1 }  // 1 * $45 = $45
        ]
      };
      
      const response = await request(app)
        .post('/api/inventory/calculate-cost')
        .send(order);
      
      expect(response.status).toBe(200);
      expect(response.body.canFulfill).toBe(true);
      expect(response.body.totalCost).toBe(75); // $30 + $45 = $75
    });
  });
});
