import express from 'express';
import { InventoryController } from '../controllers/inventory.controller';

const router = express.Router();
const inventoryController = new InventoryController();

// Vendor routes
router.put('/update', inventoryController.updateStock); // Update single apparel stock
router.put('/update-multiple', inventoryController.updateMultipleStock); // Update multiple apparel stock

// Customer routes
router.post('/check-fulfillment', inventoryController.checkOrderFulfillment); // Check if order can be fulfilled
router.post('/calculate-cost', inventoryController.calculateOrderCost); // Calculate lowest cost for order

// Utility routes
router.get('/', inventoryController.getAllInventory); // Get all inventory
router.get('/:code', inventoryController.getApparelByCode); // Get specific apparel by code

export default router;
