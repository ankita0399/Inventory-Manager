import express from 'express';
import bodyParser from 'body-parser';
import inventoryRoutes from './routes/inventory.routes';

// Create Express application
const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(bodyParser.json());

// Routes
app.use('/api/inventory', inventoryRoutes);

// Root route
app.get('/', (req, res) => {
  res.json({
    message: 'Apparel Inventory API',
    endpoints: {
      updateSingleStock: 'PUT /api/inventory/update',
      updateMultipleStock: 'PUT /api/inventory/update-multiple',
      checkOrderFulfillment: 'POST /api/inventory/check-fulfillment',
      calculateOrderCost: 'POST /api/inventory/calculate-cost',
      getAllInventory: 'GET /api/inventory',
      getApparelByCode: 'GET /api/inventory/:code'
    }
  });
});

// Error handler
app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Internal Server Error' });
});

// Start server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

export default app;
