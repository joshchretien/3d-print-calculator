const express = require('express');
const fs = require('fs').promises;
const path = require('path');
const app = express();
const PORT = process.env.PORT || 3000;

// ShipStation API configuration
const SHIPSTATION_API_KEY = process.env.SHIPSTATION_API_KEY || '96c1dc6ed6ff4b7398e47284ce7763de';
const SHIPSTATION_API_SECRET = process.env.SHIPSTATION_API_SECRET || '55cf2319bdb445cf8520722d3e0ee35f';
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
            // Update Prism products to include count 12
            if (product.preset === "Prism" && product.counts && !product.counts.includes(12)) {
                product.counts = [12, ...product.counts];
                updated = true;
            }
        });
    }
    
    // Migrate multipliers to include Prism count 12
    if (data.multipliers && data.multipliers.Prism && !data.multipliers.Prism["12"]) {
        data.multipliers.Prism["12"] = 15;
        updated = true;
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

        // ShipStation API call to get orders with order number filter
        const response = await fetch(`${SHIPSTATION_BASE_URL}/orders?orderNumber=${encodeURIComponent(orderNumber)}`, {
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
        
        console.log(`ShipStation API response for order ${orderNumber}:`, {
            totalOrders: data.orders?.length || 0,
            hasOrders: !!data.orders,
            fullOrderObject: data.orders?.[0] || null
        });
        
        // Since we filtered by order number, the first result should be our order
        const order = data.orders?.[0];

        if (!order || !data.orders || data.orders.length === 0) {
            return res.status(404).json({ 
                error: 'Order not found',
                message: `Order ${orderNumber} not found in ShipStation`,
                searchedOrderNumber: orderNumber
            });
        }

        // First try to get shipping cost from order fields
        let shippingCost = order.shippingAmount || 
                          order.shippingCost || 
                          order.shipmentCost || 
                          order.shippingPrice ||
                          0;
        
        // If no shipping cost found on order, try to get it from shipments
        if (!shippingCost || shippingCost === 0) {
            try {
                console.log(`No shipping cost on order, checking shipments for order ${orderNumber}...`);
                
                // Get shipments for this order
                const shipmentsResponse = await fetch(`${SHIPSTATION_BASE_URL}/shipments?orderNumber=${encodeURIComponent(orderNumber)}`, {
                    method: 'GET',
                    headers: {
                        'Authorization': `Basic ${getShipStationAuth()}`,
                        'Content-Type': 'application/json'
                    }
                });
                
                if (shipmentsResponse.ok) {
                    const shipmentsData = await shipmentsResponse.json();
                    console.log(`Shipments response for order ${orderNumber}:`, {
                        totalShipments: shipmentsData.shipments?.length || 0,
                        fullShipmentObject: shipmentsData.shipments?.[0] || null
                    });
                    
                    // Get shipping cost from first shipment
                    if (shipmentsData.shipments && shipmentsData.shipments.length > 0) {
                        const shipment = shipmentsData.shipments[0];
                        
                        // Use the correct field name from ShipStation API documentation
                        shippingCost = shipment.shipmentCost || 0;
                        
                        console.log(`Shipping cost found for order ${orderNumber}:`, {
                            shipmentId: shipment.shipmentId,
                            shipmentCost: shipment.shipmentCost,
                            finalShippingCost: shippingCost
                        });
                    }
                } else {
                    console.log(`Failed to fetch shipments for order ${orderNumber}: ${shipmentsResponse.status}`);
                }
            } catch (shipmentError) {
                console.error(`Error fetching shipments for order ${orderNumber}:`, shipmentError);
            }
        }
        
        console.log(`Shipping cost fields for order ${orderNumber}:`, {
            shippingAmount: order.shippingAmount,
            shippingCost: order.shippingCost,
            shipmentCost: order.shipmentCost,
            shippingPrice: order.shippingPrice,
            amountPaid: order.amountPaid,
            orderTotal: order.orderTotal,
            orderSubtotal: order.orderSubtotal,
            taxAmount: order.taxAmount,
            selectedCost: shippingCost
        });
        
        // Determine source from order data
        let detectedSource = 'Website'; // Default to Website
        
        // Check multiple indicators for Etsy orders
        const isEtsy = order.marketplaceId === 'etsy' || 
                      order.externalOrderNumber?.toLowerCase().includes('etsy') ||
                      order.marketplaceName?.toLowerCase().includes('etsy') ||
                      order.orderNumber?.length > 8 || // Etsy orders typically have longer numbers
                      order.advancedOptions?.storeId === 350545; // Specific store ID for Etsy
        
        if (isEtsy) {
            detectedSource = 'Etsy';
        }
        
        console.log(`Source detection for order ${orderNumber}:`, {
            marketplaceId: order.marketplaceId,
            marketplaceName: order.marketplaceName,
            externalOrderNumber: order.externalOrderNumber,
            orderNumberLength: order.orderNumber?.length,
            storeId: order.advancedOptions?.storeId,
            detectedSource: detectedSource
        });
        
        res.json({
            orderNumber: order.orderNumber,
            shippingCost: parseFloat(shippingCost),
            orderDate: order.orderDate,
            customerName: order.customer?.name,
            status: order.orderStatus,
            source: detectedSource,
            marketplaceId: order.marketplaceId,
            marketplaceName: order.marketplaceName
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
    console.log(`ShipStation API configured: ${SHIPSTATION_API_KEY && SHIPSTATION_API_SECRET ? 'Yes' : 'No'}`);
    if (SHIPSTATION_API_KEY && SHIPSTATION_API_SECRET) {
        console.log(`ShipStation API Key: ${SHIPSTATION_API_KEY.substring(0, 8)}...`);
    }
});
