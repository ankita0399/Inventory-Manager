import { InventoryService } from '../services/inventory.service';
import { readInventory, writeInventory } from '../utils/file-utils';
import { Apparel, InventoryUpdate, Order } from '../models/apparel.model';

// Mock the file utility functions
jest.mock('../utils/file-utils');

const mockedReadInventory = readInventory as jest.Mock;
const mockedWriteInventory = writeInventory as jest.Mock;

describe('InventoryService', () => {
  let inventoryService: InventoryService;
  let mockInventory: Apparel[];

  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();
    
    // Create a new instance of the service
    inventoryService = new InventoryService();
    
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

  describe('updateStock', () => {
    it('should update existing apparel and size', async () => {
      // Arrange
      const update: InventoryUpdate = {
        code: 'TSHIRT001',
        size: 'M',
        quantity: 20,
        price: 18
      };
      
      // Act
      const result = await inventoryService.updateStock(update);
      
      // Assert
      expect(result.code).toBe('TSHIRT001');
      expect(result.sizes.find(s => s.size === 'M')).toEqual({ size: 'M', quantity: 20, price: 18 });
      expect(mockedWriteInventory).toHaveBeenCalledTimes(1);
      
      // Check that inventory was updated correctly
      const updatedInventory = mockedWriteInventory.mock.calls[0][0];
      const updatedApparel = updatedInventory.find((a: Apparel) => a.code === 'TSHIRT001');
      expect(updatedApparel.sizes.find((s: any) => s.size === 'M')).toEqual({ size: 'M', quantity: 20, price: 18 });
    });
    
    it('should add a new size to existing apparel', async () => {
      // Arrange
      const update: InventoryUpdate = {
        code: 'TSHIRT001',
        size: 'XL',
        quantity: 8,
        price: 17
      };
      
      // Act
      const result = await inventoryService.updateStock(update);
      
      // Assert
      expect(result.code).toBe('TSHIRT001');
      expect(result.sizes.find(s => s.size === 'XL')).toEqual({ size: 'XL', quantity: 8, price: 17 });
      expect(mockedWriteInventory).toHaveBeenCalledTimes(1);
      
      // Check that inventory was updated correctly
      const updatedInventory = mockedWriteInventory.mock.calls[0][0];
      const updatedApparel = updatedInventory.find((a: Apparel) => a.code === 'TSHIRT001');
      expect(updatedApparel.sizes.find((s: any) => s.size === 'XL')).toEqual({ size: 'XL', quantity: 8, price: 17 });
    });
    
    it('should create a new apparel item', async () => {
      // Arrange
      const update: InventoryUpdate = {
        code: 'HOODIE001',
        size: 'L',
        quantity: 12,
        price: 30
      };
      
      // Act
      const result = await inventoryService.updateStock(update);
      
      // Assert
      expect(result.code).toBe('HOODIE001');
      expect(result.sizes).toEqual([{ size: 'L', quantity: 12, price: 30 }]);
      expect(mockedWriteInventory).toHaveBeenCalledTimes(1);
      
      // Check that inventory was updated correctly
      const updatedInventory = mockedWriteInventory.mock.calls[0][0];
      expect(updatedInventory.length).toBe(3); // Original 2 + new one
      const newApparel = updatedInventory.find((a: Apparel) => a.code === 'HOODIE001');
      expect(newApparel).toEqual({
        code: 'HOODIE001',
        sizes: [{ size: 'L', quantity: 12, price: 30 }]
      });
    });
  });
  
  describe('updateMultipleStock', () => {
    it('should update multiple stock items', async () => {
      // Arrange
      const updates: InventoryUpdate[] = [
        { code: 'TSHIRT001', size: 'S', quantity: 25, price: 16 },
        { code: 'JEANS001', size: '36', quantity: 10, price: 45 },
        { code: 'SOCKS001', size: 'ONE_SIZE', quantity: 50, price: 8 }
      ];
      
      // Act
      const result = await inventoryService.updateMultipleStock(updates);
      
      // Assert
      expect(result.length).toBe(3);
      expect(mockedWriteInventory).toHaveBeenCalledTimes(1);
      
      // Check that inventory was updated correctly
      const updatedInventory = mockedWriteInventory.mock.calls[0][0];
      expect(updatedInventory.length).toBe(3); // Original 2 + new one
      
      // Check T-shirt update
      const tshirt = updatedInventory.find((a: Apparel) => a.code === 'TSHIRT001');
      expect(tshirt.sizes.find((s: any) => s.size === 'S')).toEqual({ size: 'S', quantity: 25, price: 16 });
      
      // Check Jeans update (new size)
      const jeans = updatedInventory.find((a: Apparel) => a.code === 'JEANS001');
      expect(jeans.sizes.find((s: any) => s.size === '36')).toEqual({ size: '36', quantity: 10, price: 45 });
      
      // Check Socks (new item)
      const socks = updatedInventory.find((a: Apparel) => a.code === 'SOCKS001');
      expect(socks).toEqual({
        code: 'SOCKS001',
        sizes: [{ size: 'ONE_SIZE', quantity: 50, price: 8 }]
      });
    });
  });
  
  describe('checkOrderFulfillment', () => {
    it('should confirm order can be fulfilled when sufficient stock', async () => {
      // Arrange
      const order: Order = {
        id: 'ORDER001',
        items: [
          { code: 'TSHIRT001', size: 'M', quantity: 5 },
          { code: 'JEANS001', size: '32', quantity: 3 }
        ]
      };
      
      // Act
      const result = await inventoryService.checkOrderFulfillment(order);
      
      // Assert
      expect(result.canFulfill).toBe(true);
      expect(result.missingItems).toEqual([]);
    });
    
    it('should indicate order cannot be fulfilled due to insufficient stock', async () => {
      // Arrange
      const order: Order = {
        id: 'ORDER002',
        items: [
          { code: 'TSHIRT001', size: 'L', quantity: 10 }, // Only 5 in stock
          { code: 'JEANS001', size: '32', quantity: 3 }
        ]
      };
      
      // Act
      const result = await inventoryService.checkOrderFulfillment(order);
      
      // Assert
      expect(result.canFulfill).toBe(false);
      expect(result.missingItems).toEqual([
        { code: 'TSHIRT001', size: 'L', requestedQuantity: 10, availableQuantity: 5 }
      ]);
    });
    
    it('should indicate order cannot be fulfilled due to missing item', async () => {
      // Arrange
      const order: Order = {
        id: 'ORDER003',
        items: [
          { code: 'TSHIRT001', size: 'M', quantity: 5 },
          { code: 'HOODIE001', size: 'XL', quantity: 2 } // Does not exist
        ]
      };
      
      // Act
      const result = await inventoryService.checkOrderFulfillment(order);
      
      // Assert
      expect(result.canFulfill).toBe(false);
      expect(result.missingItems).toEqual([
        { code: 'HOODIE001', size: 'XL', requestedQuantity: 2, availableQuantity: 0 }
      ]);
    });
  });
  
  describe('calculateOrderCost', () => {
    it('should calculate correct order cost when order can be fulfilled', async () => {
      // Arrange
      const order: Order = {
        id: 'ORDER001',
        items: [
          { code: 'TSHIRT001', size: 'M', quantity: 2 }, // 2 * $15 = $30
          { code: 'JEANS001', size: '32', quantity: 1 }  // 1 * $45 = $45
        ]
      };
      
      // Act
      const result = await inventoryService.calculateOrderCost(order);
      
      // Assert
      expect(result.canFulfill).toBe(true);
      expect(result.totalCost).toBe(75); // $30 + $45 = $75
    });
    
    it('should not calculate cost when order cannot be fulfilled', async () => {
      // Arrange
      const order: Order = {
        id: 'ORDER002',
        items: [
          { code: 'TSHIRT001', size: 'L', quantity: 10 }, // Only 5 in stock
          { code: 'JEANS001', size: '32', quantity: 3 }
        ]
      };
      
      // Mock the checkOrderFulfillment method
      inventoryService.checkOrderFulfillment = jest.fn().mockResolvedValue({
        canFulfill: false,
        missingItems: [
          { code: 'TSHIRT001', size: 'L', requestedQuantity: 10, availableQuantity: 5 }
        ]
      });
      
      // Act
      const result = await inventoryService.calculateOrderCost(order);
      
      // Assert
      expect(result.canFulfill).toBe(false);
      expect(result.totalCost).toBeUndefined();
      expect(result.missingItems).toEqual([
        { code: 'TSHIRT001', size: 'L', requestedQuantity: 10, availableQuantity: 5 }
      ]);
    });
  });
});
