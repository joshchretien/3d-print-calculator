const express = require('express');
const fs = require('fs').promises;
const path = require('path');
const app = express();
const PORT = process.env.PORT || 3000;

// ShipStation API configuration
const SHIPSTATION_API_KEY = process.env.SHIPSTATION_API_KEY || '';
const SHIPSTATION_API_SECRET = process.env.SHIPSTATION_API_SECRET || '';
const SHIPSTATION_BASE_URL = 'https://ssapi.shipstation.com';

// Middleware
app.use(express.json());
app.use(express.static('.'));

// Basic authentication middleware
const authenticate = (req, res, next) => {
    const auth = req.headers.authorization;
    if (!auth || !auth.startsWith('Basic ')) {
        res.setHeader('WWW-Authenticate', 'Basic realm="3D Print Calculator"');
        return res.status(401).send('Authentication required');
    }
    
    const credentials = Buffer.from(auth.slice(6), 'base64').toString();
    const [username, password] = credentials.split(':');
    
    // Use environment variables for authentication
    const expectedUsername = process.env.AUTH_USERNAME || 'admin';
    const expectedPassword = process.env.AUTH_PASSWORD || 'deliciosa2024';
    
    if (username === expectedUsername && password === expectedPassword) {
        next();
    } else {
        res.setHeader('WWW-Authenticate', 'Basic realm="3D Print Calculator"');
        return res.status(401).send('Invalid credentials');
    }
};

// Apply authentication to all routes
app.use(authenticate);

// Default data structure
const DEFAULT_DATA = {
    products: [],
    orders: [],
    rollCosts: [],
    multipliers: {
        "1|5|30|60|90|120": { 1: 6.5, 5: 3.5, 30: 2, 60: 1.8, 90: 1.6, 120: 1.5 },
        "Prism": { 12: 15, 36: 19.5, 54: 11.5, 72: 10.75 },
        "Nanoleaf Advanced": { 1: 19.5, 30: 8 },
        "Nanoleaf 8MM": { 1: 49.5, 30: 22 }
    }
};

// Data migration function
const migrateData = async (data) => {
    let updated = false;
    
    // Migrate product presets
    if (data.products) {
        data.products.forEach(product => {
            if (product.preset === "nanoleaf-30") {
                product.preset = "Nanoleaf Advanced";
                updated = true;
            }
        });
    }
    
    // Migrate orders to have source field
    if (data.orders) {
        data.orders.forEach(order => {
            if (!order.source) {
                order.source = 'Etsy';
                updated = true;
            }
        });
    }
    
    // Save migrated data if changes were made
    if (updated) {
        await fs.writeFile('data.json', JSON.stringify(data, null, 2));
        console.log('Data migrated and saved');
    }
    
    return data;
};

// Read data from file
const readData = async () => {
    try {
        const data = await fs.readFile('data.json', 'utf8');
        const parsedData = JSON.parse(data);
        return await migrateData(parsedData);
    } catch (error) {
        console.log('Creating new data file with defaults');
        await fs.writeFile('data.json', JSON.stringify(DEFAULT_DATA, null, 2));
        return DEFAULT_DATA;
    }
};

// ShipStation API helper function
const getShipStationAuth = () => {
    if (!SHIPSTATION_API_KEY || !SHIPSTATION_API_SECRET) {
        throw new Error('ShipStation API credentials not configured');
    }
    return Buffer.from(`${SHIPSTATION_API_KEY}:${SHIPSTATION_API_SECRET}`).toString('base64');
};

// API Routes
app.get('/', (req, res) => {
    res.redirect('/calculator-standalone.html');
});

// Get application data
app.get('/api/data', async (req, res) => {
    try {
        const data = await readData();
        res.json(data);
    } catch (error) {
        console.error('Error reading data:', error);
        res.status(500).json({ error: 'Failed to read data' });
    }
});

// Save application data
app.post('/api/data', async (req, res) => {
    try {
        await fs.writeFile('data.json', JSON.stringify(req.body, null, 2));
        res.json({ success: true });
    } catch (error) {
        console.error('Error saving data:', error);
        res.status(500).json({ error: 'Failed to save data' });
    }
});

// ShipStation API - Lookup order shipping cost
app.get('/api/shipstation/order/:orderNumber', async (req, res) => {
    try {
        const { orderNumber } = req.params;
        
        if (!SHIPSTATION_API_KEY || !SHIPSTATION_API_SECRET) {
            return res.status(503).json({ 
                error: 'ShipStation API not configured',
                message: 'Please configure ShipStation API credentials in environment variables'
            });
        }

        // ShipStation API call to get orders
        const response = await fetch(`${SHIPSTATION_BASE_URL}/orders`, {
            method: 'GET',
            headers: {
                'Authorization': `Basic ${getShipStationAuth()}`,
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            throw new Error(`ShipStation API error: ${response.status} ${response.statusText}`);
        }

        const data = await response.json();
        
        // Find the order by order number
        const order = data.orders?.find(o => 
            o.orderNumber === orderNumber || 
            o.externalOrderNumber === orderNumber ||
            o.orderKey === orderNumber
        );

        if (!order) {
            return res.status(404).json({ 
                error: 'Order not found',
                message: `Order ${orderNumber} not found in ShipStation`
            });
        }

        // Extract shipping cost from the order
        const shippingCost = order.shippingAmount || order.shippingCost || 0;
        
        res.json({
            orderNumber: order.orderNumber,
            shippingCost: parseFloat(shippingCost),
            orderDate: order.orderDate,
            customerName: order.customer?.name,
            status: order.orderStatus
        });

    } catch (error) {
        console.error('ShipStation API error:', error);
        res.status(500).json({ 
            error: 'Failed to lookup shipping cost',
            message: error.message
        });
    }
});

// ShipStation API - Test connection
app.get('/api/shipstation/test', async (req, res) => {
    try {
        if (!SHIPSTATION_API_KEY || !SHIPSTATION_API_SECRET) {
            return res.status(503).json({ 
                error: 'ShipStation API not configured',
                message: 'Please configure SHIPSTATION_API_KEY and SHIPSTATION_API_SECRET environment variables'
            });
        }

        // Test API connection with a simple request
        const response = await fetch(`${SHIPSTATION_BASE_URL}/accounts/listtags`, {
            method: 'GET',
            headers: {
                'Authorization': `Basic ${getShipStationAuth()}`,
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            throw new Error(`ShipStation API error: ${response.status} ${response.statusText}`);
        }

        res.json({ 
            success: true,
            message: 'ShipStation API connection successful'
        });

    } catch (error) {
        console.error('ShipStation API test error:', error);
        res.status(500).json({ 
            error: 'ShipStation API connection failed',
            message: error.message
        });
    }
});

// Start server
app.listen(PORT, () => {
    console.log(`3D Print Calculator server running on port ${PORT}`);
    console.log(`ShipStation API configured: ${SHIPSTATION_API_KEY ? 'Yes' : 'No'}`);
});
