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

// Session configuration
app.use(session({
    secret: process.env.SESSION_SECRET || 'deliciosa-secret-key-2024',
    resave: false,
    saveUninitialized: false,
    cookie: {
        secure: false, // Set to true in production with HTTPS
        maxAge: 24 * 60 * 60 * 1000 // 24 hours
    }
}));

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static('.'));

// Session-based authentication middleware
const requireAuth = (req, res, next) => {
    if (req.session.authenticated) {
        next();
    } else {
        res.redirect('/login');
    }
};

// Login route
app.get('/login', (req, res) => {
    if (req.session.authenticated) {
        return res.redirect('/calculator-standalone.html');
    }
    res.sendFile(path.join(__dirname, 'login.html'));
});

// Login POST route
app.post('/login', (req, res) => {
    const { username, password } = req.body;
    
    // Use environment variables for authentication
    const expectedUsername = process.env.AUTH_USERNAME || 'admin';
    const expectedPassword = process.env.AUTH_PASSWORD || 'deliciosa2024';
    
    if (username === expectedUsername && password === expectedPassword) {
        req.session.authenticated = true;
        res.json({ success: true, redirect: '/calculator-standalone.html' });
    } else {
        res.status(401).json({ success: false, message: 'Invalid credentials' });
    }
});

// Logout route
app.post('/logout', (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            return res.status(500).json({ success: false, message: 'Could not log out' });
        }
        res.json({ success: true, redirect: '/login' });
    });
});

// Apply authentication to all routes except login
app.use((req, res, next) => {
    if (req.path === '/login' || req.path === '/api/login') {
        return next();
    }
    requireAuth(req, res, next);
});

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

        // If this is a Website order, also fetch WooCommerce payout info
        let wooCommerceData = null;
        if (detectedSource === 'Website') {
            try {
                console.log(`Fetching WooCommerce payout data for Website order ${orderNumber}...`);
                
                const wooResponse = await fetch(`${WOOCOMMERCE_URL}/wp-json/wc/v3/orders?search=${encodeURIComponent(orderNumber)}`, {
                    method: 'GET',
                    headers: {
                        'Authorization': `Basic ${Buffer.from(`${WOOCOMMERCE_CONSUMER_KEY}:${WOOCOMMERCE_CONSUMER_SECRET}`).toString('base64')}`,
                        'Content-Type': 'application/json'
                    }
                });

                if (wooResponse.ok) {
                    const wooOrders = await wooResponse.json();
                    const wooOrder = wooOrders?.find(o => o.number === orderNumber || o.id.toString() === orderNumber);
                    
                    if (wooOrder) {
                        const orderTotal = parseFloat(wooOrder.total);
                        
                        // Look for actual Stripe fee and payout in order meta data or fee lines
                        let stripeFee = 0;
                        let stripePayout = orderTotal; // Default to full amount if no fee found
                        
                        // Check if order has fee lines (WooCommerce stores Stripe fees here)
                        if (wooOrder.fee_lines && wooOrder.fee_lines.length > 0) {
                            const stripeFeeLine = wooOrder.fee_lines.find(fee => 
                                fee.name && fee.name.toLowerCase().includes('stripe')
                            );
                            if (stripeFeeLine) {
                                stripeFee = Math.abs(parseFloat(stripeFeeLine.total)); // Make positive
                                stripePayout = Math.round((orderTotal - stripeFee) * 100) / 100;
                            }
                        }
                        
                        // If no fee lines found, try to calculate from order meta
                        if (stripeFee === 0 && wooOrder.meta_data) {
                            const stripeFeeMeta = wooOrder.meta_data.find(meta => 
                                meta.key && (
                                    meta.key.toLowerCase().includes('stripe_fee') ||
                                    meta.key.toLowerCase().includes('payment_fee') ||
                                    meta.key.toLowerCase().includes('gateway_fee')
                                )
                            );
                            if (stripeFeeMeta) {
                                stripeFee = Math.abs(parseFloat(stripeFeeMeta.value));
                                stripePayout = Math.round((orderTotal - stripeFee) * 100) / 100;
                            }
                        }
                        
                        // Fallback to calculated fee if no actual fee found
                        if (stripeFee === 0) {
                            stripeFee = Math.round((orderTotal * 0.029 + 0.30) * 100) / 100; // 2.9% + 30¢
                            stripePayout = Math.round((orderTotal - stripeFee) * 100) / 100;
                        }
                        
                        // Process line items for auto-population
                        const lineItems = [];
                        if (wooOrder.line_items && wooOrder.line_items.length > 0) {
                            for (const item of wooOrder.line_items) {
                                const processedItem = processWooCommerceLineItem(item);
                                if (processedItem) {
                                    lineItems.push(processedItem);
                                }
                            }
                        }
                        
                        wooCommerceData = {
                            orderTotal: orderTotal,
                            stripeFee: stripeFee,
                            stripePayout: stripePayout,
                            status: wooOrder.status,
                            paymentMethod: wooOrder.payment_method,
                            lineItems: lineItems
                        };
                        
                        console.log(`WooCommerce payout data for order ${orderNumber}:`, wooCommerceData);
                    }
                }
            } catch (wooError) {
                console.error(`Error fetching WooCommerce data for order ${orderNumber}:`, wooError);
            }
        }
        
        res.json({
            orderNumber: order.orderNumber,
            shippingCost: parseFloat(shippingCost),
            orderDate: order.orderDate,
            customerName: order.customer?.name,
            status: order.orderStatus,
            source: detectedSource,
            marketplaceId: order.marketplaceId,
            marketplaceName: order.marketplaceName,
            wooCommerce: wooCommerceData
        });

    } catch (error) {
        console.error('ShipStation API error:', error);
        res.status(500).json({ 
            error: 'Failed to lookup shipping cost',
            message: error.message
        });
    }
});

// Helper function to process WooCommerce line items
function processWooCommerceLineItem(item) {
    try {
        const productName = item.name || '';
        const quantity = parseInt(item.quantity) || 1;
        
        // Extract simplified product info
        let simplifiedProduct = '';
        let count = '';
        
        // Product name mapping (simplified matching)
        // Note: We'll return the original product name for now and let the client-side handle matching
        // This ensures we get the exact product names that exist in the system
        simplifiedProduct = productName;
        
        // Extract count from variant/attributes - improved logic
        console.log(`Processing WooCommerce line item:`, {
            name: productName,
            variation: item.variation,
            sku: item.sku,
            meta_data: item.meta_data
        });
        
        // Try multiple methods to extract count
        if (item.variation && item.variation.length > 0) {
            // Method 1: Check variation attributes
            for (const attr of item.variation) {
                const attrValue = attr.value || '';
                console.log(`Checking variation attr: ${attr.name} = ${attrValue}`);
                
                // Look for patterns like "90 Brackets", "5 Pack", etc.
                const countMatch = attrValue.match(/(\d+)\s*(?:brackets?|pack|units?|count)/i);
                if (countMatch) {
                    count = countMatch[1];
                    console.log(`Found count in variation attr: ${count}`);
                    break;
                }
                // Look for patterns like "Just A 5 Pack!"
                const packMatch = attrValue.match(/just\s*a\s*(\d+)\s*pack/i);
                if (packMatch) {
                    count = packMatch[1];
                    console.log(`Found count in pack pattern: ${count}`);
                    break;
                }
            }
        }
        
        // Method 2: Check meta_data for variation info
        if (!count && item.meta_data) {
            for (const meta of item.meta_data) {
                const metaValue = meta.value || '';
                console.log(`Checking meta: ${meta.key} = ${metaValue}`);
                
                const countMatch = metaValue.match(/(\d+)\s*(?:brackets?|pack|units?|count)/i);
                if (countMatch) {
                    count = countMatch[1];
                    console.log(`Found count in meta: ${count}`);
                    break;
                }
            }
        }
        
        // Method 3: Extract from product name as fallback
        if (!count) {
            const countMatch = productName.match(/(\d+)\s*(?:brackets?|pack|units?|count)/i);
            if (countMatch) {
                count = countMatch[1];
                console.log(`Found count in product name: ${count}`);
            }
        }
        
        console.log(`Final extracted count: "${count}"`);
        
        // If still no count found, default to empty (user can fill manually)
        if (!count) {
            count = '';
        }
        
        return {
            productName: simplifiedProduct,
            count: count,
            quantity: quantity,
            originalProductName: productName,
            originalVariation: item.variation || []
        };
        
    } catch (error) {
        console.error('Error processing WooCommerce line item:', error);
        return null;
    }
}

// WooCommerce API - Lookup order payout
app.get('/api/woocommerce/order/:orderNumber', async (req, res) => {
    try {
        const { orderNumber } = req.params;
        
        if (!WOOCOMMERCE_CONSUMER_KEY || !WOOCOMMERCE_CONSUMER_SECRET) {
            return res.status(503).json({ 
                error: 'WooCommerce API not configured',
                message: 'Please configure WooCommerce API credentials'
            });
        }

        // WooCommerce API call to get order by number (include line items)
        const response = await fetch(`${WOOCOMMERCE_URL}/wp-json/wc/v3/orders?search=${encodeURIComponent(orderNumber)}`, {
            method: 'GET',
            headers: {
                'Authorization': `Basic ${Buffer.from(`${WOOCOMMERCE_CONSUMER_KEY}:${WOOCOMMERCE_CONSUMER_SECRET}`).toString('base64')}`,
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            throw new Error(`WooCommerce API error: ${response.status} ${response.statusText}`);
        }

        const orders = await response.json();
        
        console.log(`WooCommerce API response for order ${orderNumber}:`, {
            totalOrders: orders?.length || 0,
            orders: orders?.map(o => ({
                id: o.id,
                number: o.number,
                status: o.status,
                total: o.total,
                payment_method: o.payment_method,
                fee_lines: o.fee_lines,
                meta_data: o.meta_data?.slice(0, 5) // Show first 5 meta items for debugging
            })) || []
        });
        
        // Find the exact order by number
        const order = orders?.find(o => o.number === orderNumber || o.id.toString() === orderNumber);

        if (!order || !orders || orders.length === 0) {
            return res.status(404).json({ 
                error: 'Order not found',
                message: `Order ${orderNumber} not found in WooCommerce`,
                searchedOrderNumber: orderNumber
            });
        }

        // Get actual Stripe payout from WooCommerce order data
        const orderTotal = parseFloat(order.total);
        
        // Look for actual Stripe fee and payout in order meta data or fee lines
        let stripeFee = 0;
        let stripePayout = orderTotal; // Default to full amount if no fee found
        
        // Check if order has fee lines (WooCommerce stores Stripe fees here)
        if (order.fee_lines && order.fee_lines.length > 0) {
            const stripeFeeLine = order.fee_lines.find(fee => 
                fee.name && fee.name.toLowerCase().includes('stripe')
            );
            if (stripeFeeLine) {
                stripeFee = Math.abs(parseFloat(stripeFeeLine.total)); // Make positive
                stripePayout = Math.round((orderTotal - stripeFee) * 100) / 100;
            }
        }
        
        // If no fee lines found, try to calculate from order meta
        if (stripeFee === 0 && order.meta_data) {
            const stripeFeeMeta = order.meta_data.find(meta => 
                meta.key && (
                    meta.key.toLowerCase().includes('stripe_fee') ||
                    meta.key.toLowerCase().includes('payment_fee') ||
                    meta.key.toLowerCase().includes('gateway_fee')
                )
            );
            if (stripeFeeMeta) {
                stripeFee = Math.abs(parseFloat(stripeFeeMeta.value));
                stripePayout = Math.round((orderTotal - stripeFee) * 100) / 100;
            }
        }
        
        // Fallback to calculated fee if no actual fee found
        if (stripeFee === 0) {
            stripeFee = Math.round((orderTotal * 0.029 + 0.30) * 100) / 100; // 2.9% + 30¢
            stripePayout = Math.round((orderTotal - stripeFee) * 100) / 100;
        }
        
        console.log(`WooCommerce payout calculation for order ${orderNumber}:`, {
            orderTotal: orderTotal,
            stripeFee: stripeFee,
            stripePayout: stripePayout
        });
        
        // Process line items for auto-population
        const lineItems = [];
        if (order.line_items && order.line_items.length > 0) {
            for (const item of order.line_items) {
                const processedItem = processWooCommerceLineItem(item);
                if (processedItem) {
                    lineItems.push(processedItem);
                }
            }
        }
        
        console.log(`WooCommerce line items processed for order ${orderNumber}:`, lineItems);
        
        res.json({
            orderNumber: order.number,
            orderTotal: orderTotal,
            stripeFee: stripeFee,
            stripePayout: stripePayout,
            orderDate: order.date_created,
            status: order.status,
            paymentMethod: order.payment_method,
            customerName: order.billing?.first_name && order.billing?.last_name ? 
                         `${order.billing.first_name} ${order.billing.last_name}` : 
                         order.billing?.first_name || 'Unknown',
            lineItems: lineItems
        });

    } catch (error) {
        console.error('WooCommerce API error:', error);
        res.status(500).json({ 
            error: 'Failed to lookup WooCommerce order',
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
    console.log(`WooCommerce API configured: ${WOOCOMMERCE_CONSUMER_KEY && WOOCOMMERCE_CONSUMER_SECRET ? 'Yes' : 'No'}`);
    if (SHIPSTATION_API_KEY && SHIPSTATION_API_SECRET) {
        console.log(`ShipStation API Key: ${SHIPSTATION_API_KEY.substring(0, 8)}...`);
    }
    if (WOOCOMMERCE_CONSUMER_KEY && WOOCOMMERCE_CONSUMER_SECRET) {
        console.log(`WooCommerce URL: ${WOOCOMMERCE_URL}`);
        console.log(`WooCommerce Consumer Key: ${WOOCOMMERCE_CONSUMER_KEY.substring(0, 8)}...`);
    }
});
