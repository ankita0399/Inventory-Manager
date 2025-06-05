import { promises as fs } from 'fs';
import path from 'path';
import { Apparel } from '../models/apparel.model';

// File paths
const apparelJsonPath = path.join(__dirname, '../data/apparel.json');

// Read inventory data from file
export async function readInventory(): Promise<Apparel[]> {
  try {
    const data = await fs.readFile(apparelJsonPath, 'utf8');
    const jsonData = JSON.parse(data);
    return jsonData.inventory || [];
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
      // If file doesn't exist, create it with default data
      await writeInventory([]);
      return [];
    }
    throw error;
  }
}

// Write inventory data to file
export async function writeInventory(inventory: Apparel[]): Promise<void> {
  try {
    await fs.writeFile(apparelJsonPath, JSON.stringify({ inventory }, null, 2), 'utf8');
  } catch (error) {
    console.error('Error writing inventory data:', error);
    throw error;
  }
}

