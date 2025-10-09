const express = require('express');
const fs = require('fs').promises;
const path = require('path');
const session = require('express-session');
const app = express();
const PORT = process.env.PORT || 3000;

// ShipStation API configuration
const SHIPSTATION_API_KEY = process.env.SHIPSTATION_API_KEY || '96c1dc6ed6ff4b7398e47284ce7763de';
const SHIPSTATION_API_SECRET = process.env.SHIPSTATION_API_SECRET || '55cf2319bdb445cf8520722d3e0ee35f';
const SHIPSTATION_BASE_URL = 'https://ssapi.shipstation.com';

// WooCommerce API Configuration
const WOOCOMMERCE_URL = 'https://deliciosadecor.com';
const WOOCOMMERCE_CONSUMER_KEY = process.env.WOOCOMMERCE_CONSUMER_KEY || 'ck_f803a6e8b509e5cc726bbc2fc2a1116d9879f372';
const WOOCOMMERCE_CONSUMER_SECRET = process.env.WOOCOMMERCE_CONSUMER_SECRET || 'cs_b888ae2b936a35ff6f9a42542defd0d3ce3e6686';

// Simple authentication - single user
const AUTH_USERNAME = process.env.AUTH_USERNAME || 'orders@deliciosadecor.com';
const AUTH_PASSWORD = process.env.AUTH_PASSWORD || 'deliciosa2024';

// Default data structure
const DEFAULT_DATA = {
    products: [],
    orders: [],
    rollCosts: [],
    brands: [],
    styles: [],
    packagingOptions: [],
    multipliers: {},
    version: "1.4.0"
};

// Session configuration
app.use(session({
    secret: process.env.SESSION_SECRET || 'deliciosa-secret-key-2024',
    resave: false,
    saveUninitialized: false,
    cookie: {
        secure: false, // Set to true if using HTTPS
        httpOnly: true,
        maxAge: 24 * 60 * 60 * 1000 // 24 hours
    }
}));

app.use(express.json());
app.use(express.static('.'));

// Authentication middleware
const requireAuth = (req, res, next) => {
    console.log(`Auth check for ${req.path}: authenticated=${req.session.authenticated}`);
    if (req.session.authenticated) {
        return next();
    }
    console.log(`Redirecting to login from ${req.path}`);
    return res.redirect('/login');
};

// Data management functions
const readData = async () => {
    try {
        const data = await fs.readFile('data.json', 'utf8');
        return JSON.parse(data);
    } catch (error) {
        console.log('No existing data file, using defaults');
        return { ...DEFAULT_DATA };
    }
};

// Apply data migration
const migrateData = (data) => {
    let needsSave = false;
    
    // Ensure all required fields exist
    if (!data.products) data.products = [];
    if (!data.orders) data.orders = [];
    if (!data.rollCosts) data.rollCosts = [];
    if (!data.brands) data.brands = [];
    if (!data.styles) data.styles = [];
    if (!data.packagingOptions) data.packagingOptions = [];
    if (!data.multipliers) data.multipliers = {};
    if (!data.version) data.version = "1.4.0";
    
    // Add source field to orders if missing
    data.orders.forEach(order => {
        if (!order.source) {
            order.source = 'Etsy'; // Default to Etsy for existing orders
            needsSave = true;
        }
    });
    
    // Ensure payoutId exists for paid orders
    data.orders.forEach(order => {
        if (order.isPaid && !order.payoutId) {
            order.payoutId = `payout_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
            needsSave = true;
        }
    });
    
    // Add Prism product with count 12 if missing
    const prismProduct = data.products.find(p => p.title.toLowerCase().includes('prism'));
    if (prismProduct) {
        const hasCount12 = prismProduct.counts.some(c => c.count === 12);
        if (!hasCount12) {
            prismProduct.counts.push({ count: 12, multiplier: 15 });
            needsSave = true;
        }
    }
    
    return { data, needsSave };
};

// Routes
app.get('/', (req, res) => {
    res.redirect('/calculator-standalone.html');
});

// Login routes
app.get('/login', (req, res) => {
    res.sendFile(path.join(__dirname, 'login.html'));
});

app.post('/login', async (req, res) => {
    const { username, password } = req.body;
    
    console.log(`Login attempt: username="${username}"`);
    
    if (username === AUTH_USERNAME && password === AUTH_PASSWORD) {
        req.session.authenticated = true;
        req.session.userId = 'admin';
        req.session.accessLevel = 'admin';
        console.log('Login successful');
        return res.json({ success: true, redirect: '/calculator-standalone.html' });
    } else {
        console.log('Login failed - invalid credentials');
        return res.status(401).json({ success: false, error: 'Invalid credentials' });
    }
});

app.post('/logout', (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            console.error('Error destroying session:', err);
            return res.status(500).json({ success: false });
        }
        res.clearCookie('connect.sid');
        res.json({ success: true, redirect: '/login' });
    });
});

// Protected routes
app.use(requireAuth);

// API routes
app.get('/api/data', async (req, res) => {
    try {
        const data = await readData();
        const { data: migratedData, needsSave } = migrateData(data);
        
        if (needsSave) {
            await fs.writeFile('data.json', JSON.stringify(migratedData, null, 2));
        }
        
        res.json(migratedData);
    } catch (error) {
        console.error('Error loading data:', error);
        res.status(500).json({ error: 'Failed to load data' });
    }
});

app.post('/api/data', async (req, res) => {
    try {
        await fs.writeFile('data.json', JSON.stringify(req.body, null, 2));
        res.json({ success: true });
    } catch (error) {
        console.error('Error saving data:', error);
        res.status(500).json({ error: 'Failed to save data' });
    }
});

// ShipStation API endpoint
app.get('/api/shipstation/order/:orderNumber', async (req, res) => {
    try {
        const { orderNumber } = req.params;
        console.log(`Looking up ShipStation order: ${orderNumber}`);
        
        const auth = Buffer.from(`${SHIPSTATION_API_KEY}:${SHIPSTATION_API_SECRET}`).toString('base64');
        
        const response = await fetch(`${SHIPSTATION_BASE_URL}/orders?orderNumber=${orderNumber}`, {
            headers: {
                'Authorization': `Basic ${auth}`,
                'Content-Type': 'application/json'
            }
        });
        
        if (!response.ok) {
            console.log(`ShipStation API error: ${response.status} ${response.statusText}`);
            return res.status(response.status).json({ 
                error: `ShipStation API error: ${response.status} ${response.statusText}`,
                searchedOrderNumber: orderNumber
            });
        }
        
        const data = await response.json();
        console.log(`ShipStation response: ${data.orders ? data.orders.length : 0} orders found`);
        
        if (!data.orders || data.orders.length === 0) {
            return res.status(404).json({ 
                error: `Order ${orderNumber} not found in ShipStation`,
                searchedOrderNumber: orderNumber
            });
        }
        
        const order = data.orders[0];
        let shippingCost = order.shippingAmount || 0;
        
        // If no shipping cost on order, try to get it from shipments
        if (shippingCost === 0 && order.orderId) {
            try {
                const shipmentResponse = await fetch(`${SHIPSTATION_BASE_URL}/shipments?orderId=${order.orderId}`, {
                    headers: {
                        'Authorization': `Basic ${auth}`,
                        'Content-Type': 'application/json'
                    }
                });
                
                if (shipmentResponse.ok) {
                    const shipmentData = await shipmentResponse.json();
                    if (shipmentData.shipments && shipmentData.shipments.length > 0) {
                        shippingCost = shipmentData.shipments[0].shipmentCost || 0;
                        console.log(`Found shipping cost in shipments: $${shippingCost}`);
                    }
                }
            } catch (shipmentError) {
                console.log('Error fetching shipment data:', shipmentError.message);
            }
        }
        
        // Determine source based on order number
        const source = orderNumber.startsWith('1') ? 'Website' : 'Etsy';
        
        res.json({
            orderNumber: order.orderNumber,
            shippingCost: shippingCost,
            source: source,
            orderDate: order.orderDate,
            customerEmail: order.customerEmail,
            items: order.items || []
        });
        
    } catch (error) {
        console.error('ShipStation lookup error:', error);
        res.status(500).json({ error: 'Failed to lookup order in ShipStation' });
    }
});

// WooCommerce API endpoint
app.get('/api/woocommerce/order/:orderNumber', async (req, res) => {
    try {
        const { orderNumber } = req.params;
        console.log(`Looking up WooCommerce order: ${orderNumber}`);
        
        const auth = Buffer.from(`${WOOCOMMERCE_CONSUMER_KEY}:${WOOCOMMERCE_CONSUMER_SECRET}`).toString('base64');
        
        const response = await fetch(`${WOOCOMMERCE_URL}/wp-json/wc/v3/orders?number=${orderNumber}`, {
            headers: {
                'Authorization': `Basic ${auth}`,
                'Content-Type': 'application/json'
            }
        });
        
        if (!response.ok) {
            console.log(`WooCommerce API error: ${response.status} ${response.statusText}`);
            return res.status(response.status).json({ 
                error: `WooCommerce API error: ${response.status} ${response.statusText}`,
                searchedOrderNumber: orderNumber
            });
        }
        
        const data = await response.json();
        console.log(`WooCommerce response: ${data.length} orders found`);
        
        if (!data || data.length === 0) {
            return res.status(404).json({ 
                error: `Order ${orderNumber} not found in WooCommerce`,
                searchedOrderNumber: orderNumber
            });
        }
        
        const order = data[0];
        
        // Calculate Stripe payout (Order Total - Stripe Fee)
        let stripeFee = 0;
        let actualStripeFee = 0;
        
        // Look for actual Stripe fee in fee_lines or meta_data
        if (order.fee_lines && order.fee_lines.length > 0) {
            const stripeFeeLine = order.fee_lines.find(fee => 
                fee.name && fee.name.toLowerCase().includes('stripe')
            );
            if (stripeFeeLine) {
                actualStripeFee = parseFloat(stripeFeeLine.amount) || 0;
                console.log(`Found actual Stripe fee in fee_lines: $${actualStripeFee}`);
            }
        }
        
        // If no fee_lines, check meta_data
        if (actualStripeFee === 0 && order.meta_data) {
            const stripeFeeMeta = order.meta_data.find(meta => 
                meta.key && (meta.key.includes('stripe') || meta.key.includes('fee'))
            );
            if (stripeFeeMeta) {
                actualStripeFee = parseFloat(stripeFeeMeta.value) || 0;
                console.log(`Found actual Stripe fee in meta_data: $${actualStripeFee}`);
            }
        }
        
        // Fallback to estimated fee if no actual fee found
        if (actualStripeFee === 0) {
            const orderTotal = parseFloat(order.total);
            stripeFee = (orderTotal * 0.029) + 0.30; // 2.9% + $0.30
            console.log(`Using estimated Stripe fee: $${stripeFee.toFixed(2)}`);
        } else {
            stripeFee = actualStripeFee;
        }
        
        const stripePayout = parseFloat(order.total) - stripeFee;
        
        // Process line items
        const lineItems = order.line_items.map(item => {
            return processWooCommerceLineItem(item);
        });
        
        res.json({
            orderNumber: order.number,
            orderTotal: parseFloat(order.total),
            stripeFee: stripeFee,
            stripePayout: stripePayout,
            source: 'Website',
            orderDate: order.date_created,
            customerEmail: order.billing.email,
            lineItems: lineItems
        });
        
    } catch (error) {
        console.error('WooCommerce lookup error:', error);
        res.status(500).json({ error: 'Failed to lookup order in WooCommerce' });
    }
});

// Process WooCommerce line item
function processWooCommerceLineItem(item) {
    let extractedCount = '';
    
    // Try to extract count from variation attributes first
    if (item.variation && item.variation.length > 0) {
        for (const variation of item.variation) {
            if (variation.option && variation.option.toLowerCase().includes('count')) {
                const countMatch = variation.option.match(/(\d+)/);
                if (countMatch) {
                    extractedCount = countMatch[1];
                    break;
                }
            }
        }
    }
    
    // Try meta_data if variation didn't work
    if (!extractedCount && item.meta_data) {
        for (const meta of item.meta_data) {
            if (meta.key && meta.key.toLowerCase().includes('count')) {
                const countMatch = meta.value.toString().match(/(\d+)/);
                if (countMatch) {
                    extractedCount = countMatch[1];
                    break;
                }
            }
        }
    }
    
    // Try to extract from product name as last resort
    if (!extractedCount && item.name) {
        // Look for patterns like "90 Brackets", "Just A 5 Pack!", etc.
        const countPatterns = [
            /(\d+)\s+brackets/i,
            /(\d+)\s+pack/i,
            /just\s+a\s+(\d+)\s+pack/i,
            /(\d+)\s+count/i,
            /count\s+(\d+)/i
        ];
        
        for (const pattern of countPatterns) {
            const match = item.name.match(pattern);
            if (match) {
                extractedCount = match[1];
                break;
            }
        }
    }
    
    return {
        productName: item.name,
        quantity: item.quantity,
        extractedCount: extractedCount,
        variation: item.variation || [],
        metaData: item.meta_data || []
    };
}

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});