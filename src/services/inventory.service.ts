import { 
  Apparel, 
  ApparelSize,
  InventoryUpdate, 
  Order, 
  OrderFulfillmentResult 
} from '../models/apparel.model';
import { readInventory, writeInventory } from '../utils/file-utils';

export class InventoryService {
  /**
   * Update stock quantity and price for a single apparel item
   */
  async updateStock(update: InventoryUpdate): Promise<Apparel> {
    const inventory = await readInventory();
    
    // Find if the apparel code already exists
    let apparel = inventory.find(item => item.code === update.code);
    
    if (!apparel) {
      // If apparel does not exist, create a new one
      apparel = {
        code: update.code,
        sizes: []
      };
      inventory.push(apparel);
    }
    
    // Find if the size already exists for this apparel
    const sizeIndex = apparel.sizes.findIndex(s => s.size === update.size);
    
    if (sizeIndex !== -1) {
      // Update existing size
      apparel.sizes[sizeIndex].quantity = update.quantity;
      apparel.sizes[sizeIndex].price = update.price;
    } else {
      // Add new size
      apparel.sizes.push({
        size: update.size,
        quantity: update.quantity,
        price: update.price
      });
    }
    
    await writeInventory(inventory);
    return apparel;
  }
  
  /**
   * Update stock quantity and price for multiple apparel items
   */
  async updateMultipleStock(updates: InventoryUpdate[]): Promise<Apparel[]> {
    const inventory = await readInventory();
    const updatedApparels: { [code: string]: Apparel } = {};
    
    // Process each update
    for (const update of updates) {
      // Find if the apparel code already exists
      let apparel = inventory.find(item => item.code === update.code);
      
      if (!apparel) {
        // If apparel does not exist, create a new one
        apparel = {
          code: update.code,
          sizes: []
        };
        inventory.push(apparel);
      }
      
      // Find if the size already exists for this apparel
      const sizeIndex = apparel.sizes.findIndex(s => s.size === update.size);
      
      if (sizeIndex !== -1) {
        // Update existing size
        apparel.sizes[sizeIndex].quantity = update.quantity;
        apparel.sizes[sizeIndex].price = update.price;
      } else {
        // Add new size
        apparel.sizes.push({
          size: update.size,
          quantity: update.quantity,
          price: update.price
        });
      }
      
      updatedApparels[apparel.code] = apparel;
    }
    
    await writeInventory(inventory);
    return Object.values(updatedApparels);
  }
  
  /**
   * Check if an order can be fulfilled based on current inventory
   */
  async checkOrderFulfillment(order: Order): Promise<OrderFulfillmentResult> {
    const inventory = await readInventory();
    const result: OrderFulfillmentResult = {
      canFulfill: true,
      missingItems: []
    };
    
    // Check each order item against inventory
    for (const item of order.items) {
      const apparel = inventory.find(a => a.code === item.code);
      
      if (!apparel) {
        // Apparel code not found
        result.canFulfill = false;
        result.missingItems?.push({
          code: item.code,
          size: item.size,
          requestedQuantity: item.quantity,
          availableQuantity: 0
        });
        continue;
      }
      
      const size = apparel.sizes.find(s => s.size === item.size);
      
      if (!size || size.quantity < item.quantity) {
        // Size not found or insufficient quantity
        result.canFulfill = false;
        result.missingItems?.push({
          code: item.code,
          size: item.size,
          requestedQuantity: item.quantity,
          availableQuantity: size ? size.quantity : 0
        });
      }
    }
    
    return result;
  }
  
  /**
   * Calculate the lowest cost to fulfill an order
   */
  async calculateOrderCost(order: Order): Promise<OrderFulfillmentResult> {
    const fulfillmentCheck = await this.checkOrderFulfillment(order);
    
    // If order cannot be fulfilled, return the check result
    if (!fulfillmentCheck.canFulfill) {
      return fulfillmentCheck;
    }
    
    const inventory = await readInventory();
    let totalCost = 0;
    
    // Calculate cost for each order item
    for (const item of order.items) {
      const apparel = inventory.find(a => a.code === item.code)!;
      const size = apparel.sizes.find(s => s.size === item.size)!;
      
      totalCost += size.price * item.quantity;
    }
    
    return {
      canFulfill: true,
      totalCost
    };
  }
  
  /**
   * Get all inventory items
   */
  async getAllInventory(): Promise<Apparel[]> {
    return await readInventory();
  }
  
  /**
   * Get a specific apparel item by code
   */
  async getApparelByCode(code: string): Promise<Apparel | null> {
    const inventory = await readInventory();
    const apparel = inventory.find(item => item.code === code);
    return apparel || null;
  }
}
