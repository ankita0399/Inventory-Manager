import { Request, Response } from 'express';
import { InventoryService } from '../services/inventory.service';
import { InventoryUpdate, Order } from '../models/apparel.model';

export class InventoryController {
  private inventoryService: InventoryService;
  
  constructor() {
    this.inventoryService = new InventoryService();
  }
  
  /**
   * Update stock quantity and price for a single apparel item
   */
  updateStock = async (req: Request, res: Response): Promise<void> => {
    try {
      const update: InventoryUpdate = req.body;
      
      // Validate input
      if (!update.code || !update.size || update.quantity === undefined || update.price === undefined) {
        res.status(400).json({ message: 'Missing required fields: code, size, quantity, price' });
        return;
      }
      
      if (update.quantity < 0 || update.price < 0) {
        res.status(400).json({ message: 'Quantity and price must be positive values' });
        return;
      }
      
      const result = await this.inventoryService.updateStock(update);
      res.status(200).json(result);
    } catch (error) {
      console.error('Error updating stock:', error);
      res.status(500).json({ message: 'Failed to update stock' });
    }
  };
  
  /**
   * Update stock quantity and price for multiple apparel items
   */
  updateMultipleStock = async (req: Request, res: Response): Promise<void> => {
    try {
      const updates: InventoryUpdate[] = req.body;
      
      // Validate input
      if (!Array.isArray(updates) || updates.length === 0) {
        res.status(400).json({ message: 'Request body must be a non-empty array of inventory updates' });
        return;
      }
      
      for (const update of updates) {
        if (!update.code || !update.size || update.quantity === undefined || update.price === undefined) {
          res.status(400).json({ 
            message: 'Each update must include required fields: code, size, quantity, price',
            invalidItem: update
          });
          return;
        }
        
        if (update.quantity < 0 || update.price < 0) {
          res.status(400).json({ 
            message: 'Quantity and price must be positive values',
            invalidItem: update
          });
          return;
        }
      }
      
      const result = await this.inventoryService.updateMultipleStock(updates);
      res.status(200).json(result);
    } catch (error) {
      console.error('Error updating multiple stock items:', error);
      res.status(500).json({ message: 'Failed to update stock items' });
    }
  };
  
  /**
   * Check if an order can be fulfilled
   */
  checkOrderFulfillment = async (req: Request, res: Response): Promise<void> => {
    try {
      const order: Order = req.body;
      
      // Validate input
      if (!order.items || !Array.isArray(order.items) || order.items.length === 0) {
        res.status(400).json({ message: 'Order must include at least one item' });
        return;
      }
      
      for (const item of order.items) {
        if (!item.code || !item.size || item.quantity === undefined || item.quantity <= 0) {
          res.status(400).json({ 
            message: 'Each order item must include valid: code, size, and positive quantity',
            invalidItem: item
          });
          return;
        }
      }
      
      const result = await this.inventoryService.checkOrderFulfillment(order);
      res.status(200).json(result);
    } catch (error) {
      console.error('Error checking order fulfillment:', error);
      res.status(500).json({ message: 'Failed to check order fulfillment' });
    }
  };
  
  /**
   * Calculate order cost
   */
  calculateOrderCost = async (req: Request, res: Response): Promise<void> => {
    try {
      const order: Order = req.body;
      
      // Validate input
      if (!order.items || !Array.isArray(order.items) || order.items.length === 0) {
        res.status(400).json({ message: 'Order must include at least one item' });
        return;
      }
      
      for (const item of order.items) {
        if (!item.code || !item.size || item.quantity === undefined || item.quantity <= 0) {
          res.status(400).json({ 
            message: 'Each order item must include valid: code, size, and positive quantity',
            invalidItem: item
          });
          return;
        }
      }
      
      const result = await this.inventoryService.calculateOrderCost(order);
      res.status(200).json(result);
    } catch (error) {
      console.error('Error calculating order cost:', error);
      res.status(500).json({ message: 'Failed to calculate order cost' });
    }
  };
  
  /**
   * Get all inventory
   */
  getAllInventory = async (_req: Request, res: Response): Promise<void> => {
    try {
      const inventory = await this.inventoryService.getAllInventory();
      res.status(200).json(inventory);
    } catch (error) {
      console.error('Error getting inventory:', error);
      res.status(500).json({ message: 'Failed to retrieve inventory' });
    }
  };
  
  /**
   * Get apparel by code
   */
  getApparelByCode = async (req: Request, res: Response): Promise<void> => {
    try {
      const { code } = req.params;
      
      if (!code) {
        res.status(400).json({ message: 'Apparel code is required' });
        return;
      }
      
      const apparel = await this.inventoryService.getApparelByCode(code);
      
      if (!apparel) {
        res.status(404).json({ message: `Apparel with code ${code} not found` });
        return;
      }
      
      res.status(200).json(apparel);
    } catch (error) {
      console.error('Error getting apparel by code:', error);
      res.status(500).json({ message: 'Failed to retrieve apparel' });
    }
  };
}
