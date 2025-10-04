const express = require('express');
const fs = require('fs').promises;
const path = require('path');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;
const DATA_FILE = path.join(__dirname, 'data.json');

// Middleware
app.use(cors());
app.use(express.json());

// Basic Authentication Middleware
app.use((req, res, next) => {
  const auth = { 
    login: process.env.AUTH_USERNAME || 'admin', 
    password: process.env.AUTH_PASSWORD || 'password123' 
  };
  
  const b64auth = (req.headers.authorization || '').split(' ')[1] || '';
  const [login, password] = Buffer.from(b64auth, 'base64').toString().split(':');
  
  if (login && password && login === auth.login && password === auth.password) {
    return next();
  }
  
  res.set('WWW-Authenticate', 'Basic realm="401"');
  res.status(401).send('Authentication required.');
});

// Default data structure
const DEFAULT_DATA = {
  products: [],
  brands: ["Govee", "Eufy", "Nanoleaf"],
  styles: ["Advanced", "8MM"],
  rollCosts: [{
    id: Math.random().toString(36).slice(2, 10),
    value: 25,
    date: new Date().toISOString().slice(0, 10)
  }],
  multipliers: {
    "1|5|30|60|90|120": { 1: 50.5, 5: 35.5, 30: 25.5, 60: 18.5, 90: 16.5, 120: 14.5 },
    "1|5|12|36|72|108": { 1: 50.5, 5: 35.5, 12: 30.5, 36: 25.5, 72: 22.5, 108: 20.5 },
    "adv-1|5|30|60|90|120": { 1: 20.5, 5: 12.5, 30: 8.5, 60: 7.5, 90: 6.5, 120: 6 },
    "adv-1|5|12|36|72|108": { 1: 20.5, 5: 12.5, 12: 10.5, 36: 7.5, 72: 7.5, 108: 6.5 },
    "Power Supply": { 1: 60 },
    "Prism": { 36: 19.5, 54: 11.5, 72: 10.75 },
    "Nanoleaf Advanced": { 1: 19.5, 30: 8 },
    "Nanoleaf 8MM": { 1: 49.5, 30: 22 }
  },
  orders: [],
  globalDiscount: 25,
  packagingOptions: ["WT-ENV", "OR-ENV", "BLK-ENV", "6x6x6", "7x7x7", "18x12x2"]
};

// Helper function to ensure data file exists
async function ensureDataFile() {
  try {
    await fs.access(DATA_FILE);
  } catch (error) {
    // File doesn't exist, create it with default data
    await fs.writeFile(DATA_FILE, JSON.stringify(DEFAULT_DATA, null, 2));
  }
}

// Helper function to migrate data
function migrateData(data) {
  // Migrate preset names for existing products
  if (data.products && Array.isArray(data.products)) {
    data.products = data.products.map(product => {
      if (product.preset === "nanoleaf-30") {
        return { ...product, preset: "Nanoleaf Advanced" };
      }
      return product;
    });
  }
  
  // Migrate existing orders to have Etsy source
  if (data.orders && Array.isArray(data.orders)) {
    data.orders = data.orders.map(order => {
      if (!order.source) {
        return { ...order, source: 'Etsy' };
      }
      return order;
    });
  }
  
  // Ensure all new presets are available
  if (!data.multipliers) {
    data.multipliers = {};
  }
  
  // Merge with default multipliers to ensure new presets are available
  data.multipliers = { ...DEFAULT_DATA.multipliers, ...data.multipliers };
  
  return data;
}

// Helper function to read data
async function readData() {
  try {
    const data = await fs.readFile(DATA_FILE, 'utf8');
    const parsedData = JSON.parse(data);
    return migrateData(parsedData);
  } catch (error) {
    console.error('Error reading data file:', error);
    return DEFAULT_DATA;
  }
}

// Helper function to write data
async function writeData(data) {
  try {
    await fs.writeFile(DATA_FILE, JSON.stringify(data, null, 2));
    return true;
  } catch (error) {
    console.error('Error writing data file:', error);
    return false;
  }
}

// Routes
app.get('/api/data', async (req, res) => {
  try {
    await ensureDataFile();
    const data = await readData();
    res.json(data);
  } catch (error) {
    console.error('Error getting data:', error);
    res.status(500).json({ error: 'Failed to read data' });
  }
});

app.post('/api/data', async (req, res) => {
  try {
    await ensureDataFile();
    const success = await writeData(req.body);
    if (success) {
      res.json({ success: true });
    } else {
      res.status(500).json({ error: 'Failed to save data' });
    }
  } catch (error) {
    console.error('Error saving data:', error);
    res.status(500).json({ error: 'Failed to save data' });
  }
});

// Redirect root to calculator
app.get('/', (req, res) => {
  res.redirect('/calculator-standalone.html');
});

// Serve static files
app.use(express.static(__dirname));

// Start server
app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
  console.log(`Calculator available at http://localhost:${PORT}/calculator-standalone.html`);
});