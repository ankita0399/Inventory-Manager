export interface Apparel {
  code: string;
  sizes: Array<ApparelSize>;
}

export interface ApparelSize {
  size: string;
  quantity: number;
  price: number;
}

export interface InventoryUpdate {
  code: string;
  size: string;
  quantity: number;
  price: number;
}

export interface Order {
  id: string;
  items: Array<OrderItem>;
}

export interface OrderItem {
  code: string;
  size: string;
  quantity: number;
}

export interface OrderFulfillmentResult {
  canFulfill: boolean;
  missingItems?: Array<{
    code: string;
    size: string;
    requestedQuantity: number;
    availableQuantity: number;
  }>;
  totalCost?: number;
}
