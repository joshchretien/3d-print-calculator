const express = require('express');
const fs = require('fs').promises;
const path = require('path');
const session = require('express-session');
const sqlite3 = require('sqlite3').verbose();
const app = express();
const PORT = process.env.PORT || 3000;

// Database initialization - use persistent storage if available
const DB_PATH = process.env.PERSISTENT_STORAGE_PATH ? 
    `${process.env.PERSISTENT_STORAGE_PATH}/calculator.db` : 
    './calculator.db';

const db = new sqlite3.Database(DB_PATH, (err) => {
    if (err) {
        console.error('Error opening database:', err.message);
    } else {
        console.log(`Connected to SQLite database at: ${DB_PATH}`);
    }
});

// Initialize database tables
const initDatabase = () => {
    return new Promise((resolve, reject) => {
        db.serialize(() => {
            // Products table
            db.run(`CREATE TABLE IF NOT EXISTS products (
                id TEXT PRIMARY KEY,
                brand TEXT,
                model TEXT,
                style TEXT,
                filamentPerItem REAL,
                preset TEXT,
                counts TEXT,
                title TEXT,
                packaging TEXT,
                packagingByCount TEXT,
                createdOn TEXT
            )`);

            // Orders table
            db.run(`CREATE TABLE IF NOT EXISTS orders (
                id TEXT PRIMARY KEY,
                orderNumber TEXT,
                product TEXT,
                count INTEGER,
                etsyPayout REAL,
                shippingCost REAL,
                productionCost REAL,
                tjShare REAL,
                joshShare REAL,
                status TEXT,
                createdOn TEXT,
                paidOn TEXT,
                source TEXT,
                payoutId TEXT,
                items TEXT,
                returned INTEGER DEFAULT 0,
                maker TEXT
            )`);
            
            // Add returned column to existing orders table if it doesn't exist (migration)
            db.run(`ALTER TABLE orders ADD COLUMN returned INTEGER DEFAULT 0`, (err) => {
                // Ignore error if column already exists - this is expected on first creation
                if (err && !err.message.includes('duplicate column name')) {
                    // Only log if it's not the expected "duplicate column" error
                    if (!err.message.toLowerCase().includes('duplicate')) {
                        console.warn('Could not add returned column (may already exist):', err.message);
                    }
                }
            });
            
            // Add maker column to existing orders table if it doesn't exist (migration)
            db.run(`ALTER TABLE orders ADD COLUMN maker TEXT`, (err) => {
                // Ignore error if column already exists
                if (err && !err.message.includes('duplicate column name')) {
                    if (!err.message.toLowerCase().includes('duplicate')) {
                        console.warn('Could not add maker column (may already exist):', err.message);
                    }
                }
            });

            // Roll costs table
            db.run(`CREATE TABLE IF NOT EXISTS rollCosts (
                id TEXT PRIMARY KEY,
                value REAL,
                date TEXT
            )`);

            // TJ Share Percentages table
            db.run(`CREATE TABLE IF NOT EXISTS tjSharePercentages (
                id TEXT PRIMARY KEY,
                value REAL,
                date TEXT
            )`, (err) => {
                if (err) {
                    console.error('Error creating tjSharePercentages table:', err);
                } else {
                    console.log('tjSharePercentages table created successfully');
                }
            });

            // Multipliers table
            db.run(`CREATE TABLE IF NOT EXISTS multipliers (
                id TEXT PRIMARY KEY,
                preset TEXT,
                count INTEGER,
                multiplier REAL
            )`);

            // Brands table
            db.run(`CREATE TABLE IF NOT EXISTS brands (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT UNIQUE
            )`);

            // Styles table
            db.run(`CREATE TABLE IF NOT EXISTS styles (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT UNIQUE
            )`);

            // Packaging options table
            db.run(`CREATE TABLE IF NOT EXISTS packagingOptions (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT UNIQUE
            )`);

            // Settings table
            db.run(`CREATE TABLE IF NOT EXISTS settings (
                key TEXT PRIMARY KEY,
                value TEXT
            )`);

            console.log('Database tables initialized');
            resolve();
        });
    });
};

// Populate database with your current data
const populateDatabase = () => {
    return new Promise((resolve, reject) => {
        db.serialize(() => {
            // Check if database is already populated
            db.get("SELECT COUNT(*) as count FROM products", (err, row) => {
                if (err) {
                    console.error('Error checking database:', err);
                    reject(err);
                    return;
                }

                if (row.count > 0) {
                    console.log('Database already populated, skipping initialization');
                    resolve();
                    return;
                }

                // Check if we have persistent data file
                const PERSISTENT_FILE_PATH = process.env.PERSISTENT_STORAGE_PATH ? 
                    `${process.env.PERSISTENT_STORAGE_PATH}/persistent-data.json` : 
                    'persistent-data.json';
                fs.access(PERSISTENT_FILE_PATH).then(async () => {
                    try {
                        const persistentData = await fs.readFile(PERSISTENT_FILE_PATH, 'utf8');
                        if (persistentData && persistentData.trim() !== '') {
                            console.log('Found persistent data file, restoring...');
                            const data = JSON.parse(persistentData);
                            saveDataToDatabase(data).then(() => {
                                console.log('Data restored from persistent file successfully');
                                resolve();
                            }).catch(reject);
                            return;
                        }
                    } catch (error) {
                        console.log('Error reading persistent data file:', error.message);
                    }
                }).catch(() => {
                    console.log('No persistent data file found, using defaults');
                });

                // Check if we have data in environment variables (persistent storage)
                const envData = process.env.CALCULATOR_DATA;
                if (envData) {
                    console.log('Found data in environment variables, restoring...');
                    try {
                        const data = JSON.parse(envData);
                        saveDataToDatabase(data).then(() => {
                            console.log('Data restored from environment variables successfully');
                            resolve();
                        }).catch(reject);
                        return;
                    } catch (error) {
                        console.error('Error parsing environment data:', error);
                    }
                }

                console.log('Populating database with your current data...');

                // Your current data
                const currentData = {
                    products: [
                        {
                            "id": "aqq52e9i",
                            "brand": "Eufy",
                            "model": "E120",
                            "style": "8MM",
                            "filamentPerItem": 6.72,
                            "preset": "1|5|30|60|90|120",
                            "counts": [1, 5, 30, 60, 90, 120],
                            "title": "Eufy E120 — 8MM",
                            "packagingByCount": {
                                "1": "WT-ENV",
                                "5": "OR-ENV",
                                "30": "BLK-ENV",
                                "60": "BLK-ENV",
                                "90": "6x6x6",
                                "120": "7x7x7"
                            }
                        },
                        {
                            "id": "q3ta1fse",
                            "brand": "Eufy",
                            "model": "E120",
                            "style": "Advanced",
                            "filamentPerItem": 20.6,
                            "preset": "adv-1|5|30|60|90|120",
                            "counts": [1, 5, 30, 60, 90, 120],
                            "title": "Eufy E120 — Advanced",
                            "packagingByCount": {
                                "1": "WT-ENV",
                                "5": "OR-ENV",
                                "30": "6x6x6",
                                "60": "7x7x7",
                                "90": "18x12x2",
                                "120": "18x12x2"
                            }
                        },
                        {
                            "id": "0bzaxnpv",
                            "brand": "Eufy",
                            "model": "E22",
                            "style": "8MM",
                            "filamentPerItem": 7.94,
                            "preset": "1|5|30|60|90|120",
                            "counts": [1, 5, 30, 60, 90, 120],
                            "title": "Eufy E22 — 8MM",
                            "packagingByCount": {
                                "1": "WT-ENV",
                                "5": "OR-ENV",
                                "30": "BLK-ENV",
                                "60": "BLK-ENV",
                                "90": "6x6x6",
                                "120": "7x7x7"
                            }
                        },
                        {
                            "id": "z6gm5t98",
                            "brand": "Eufy",
                            "model": "E22",
                            "style": "Advanced",
                            "filamentPerItem": 22.83,
                            "preset": "adv-1|5|30|60|90|120",
                            "counts": [1, 5, 30, 60, 90, 120],
                            "title": "Eufy E22 — Advanced",
                            "packaging": "WT-ENV",
                            "packagingByCount": {
                                "1": "WT-ENV",
                                "5": "OR-ENV",
                                "30": "6x6x6",
                                "60": "9x9x9",
                                "90": "18x12x2",
                                "120": "18x12x2"
                            }
                        }
                        // Add more products as needed
                    ],
                    brands: ["Govee", "Eufy", "Nanoleaf"],
                    styles: ["Advanced", "8MM", "Regular", "Power Supply"],
                    rollCosts: [
                        { "id": "awv33vyq", "value": 25, "date": "2025-10-01" },
                        { "id": "uizfkci6", "value": 15, "date": "2025-10-01" },
                        { "id": "5blqs3nt", "value": 15, "date": "2025-10-04" }
                    ],
                    multipliers: {
                        "1|5|30|60|90|120": { 1: 49.5, 5: 30, 30: 22, 60: 18.5, 90: 16.5, 120: 14.5 },
                        "1|5|12|36|72|108": { 1: 49.5, 5: 30, 12: 25, 36: 20, 72: 17.5, 108: 14 },
                        "adv-1|5|30|60|90|120": { 1: 19.5, 5: 11.5, 30: 9, 60: 7.5, 90: 6.5, 120: 6 },
                        "adv-1|5|12|36|72|108": { 1: 19.5, 5: 11.5, 12: 10.75, 36: 10, 72: 9, 108: 7.75 },
                        "Power Supply": { 1: 39 },
                        "Prism": { 12: 15, 36: 13.18, 54: 12.65, 72: 12.15 },
                        "Nanoleaf Advanced": { 1: 19.5, 30: 9 },
                        "Nanoleaf 8MM": { 1: 39.5, 30: 17 }
                    },
                    packagingOptions: ["WT-ENV", "OR-ENV", "BLK-ENV", "6x6x6", "7x7x7", "9x9x9", "18x12x2", "18x12x4"],
                    globalDiscount: 25
                };

                // Insert products
                const insertProduct = db.prepare(`INSERT INTO products 
                    (id, brand, model, style, filamentPerItem, preset, counts, title, packaging, packagingByCount, createdOn)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`);

                currentData.products.forEach(product => {
                    insertProduct.run(
                        product.id,
                        product.brand,
                        product.model,
                        product.style,
                        product.filamentPerItem,
                        product.preset,
                        JSON.stringify(product.counts),
                        product.title,
                        product.packaging || null,
                        JSON.stringify(product.packagingByCount || {}),
                        product.createdOn || new Date().toISOString()
                    );
                });
                insertProduct.finalize();

                // Insert brands
                currentData.brands.forEach(brand => {
                    db.run("INSERT OR IGNORE INTO brands (name) VALUES (?)", [brand]);
                });

                // Insert styles
                currentData.styles.forEach(style => {
                    db.run("INSERT OR IGNORE INTO styles (name) VALUES (?)", [style]);
                });

                // Insert roll costs
                const insertRollCost = db.prepare("INSERT INTO rollCosts (id, value, date) VALUES (?, ?, ?)");
                currentData.rollCosts.forEach(rollCost => {
                    insertRollCost.run(rollCost.id, rollCost.value, rollCost.date);
                });
                insertRollCost.finalize();

                // Insert TJ share percentages
                if (currentData.tjSharePercentages && currentData.tjSharePercentages.length > 0) {
                    try {
                        const insertTjShare = db.prepare("INSERT INTO tjSharePercentages (id, value, date) VALUES (?, ?, ?)");
                        currentData.tjSharePercentages.forEach(tjShare => {
                            insertTjShare.run(tjShare.id, tjShare.value, tjShare.date);
                        });
                        insertTjShare.finalize();
                        console.log('TJ share percentages inserted successfully');
                    } catch (error) {
                        console.error('Error inserting TJ share percentages:', error);
                    }
                }

                // Insert multipliers
                const insertMultiplier = db.prepare("INSERT INTO multipliers (id, preset, count, multiplier) VALUES (?, ?, ?, ?)");
                Object.entries(currentData.multipliers).forEach(([preset, counts]) => {
                    Object.entries(counts).forEach(([count, multiplier]) => {
                        insertMultiplier.run(`${preset}-${count}`, preset, parseInt(count), multiplier);
                    });
                });
                insertMultiplier.finalize();

                // Insert packaging options
                currentData.packagingOptions.forEach(option => {
                    db.run("INSERT OR IGNORE INTO packagingOptions (name) VALUES (?)", [option]);
                });

                // Insert settings
                db.run("INSERT INTO settings (key, value) VALUES (?, ?)", ["globalDiscount", currentData.globalDiscount.toString()]);

                console.log('Database populated successfully with your current data');
                resolve();
            });
        });
    });
};

// Get data from database
const getDataFromDatabase = () => {
    return new Promise((resolve, reject) => {
        const data = {
            products: [],
            orders: [],
            rollCosts: [],
            tjSharePercentages: [],
            brands: [],
            styles: [],
            packagingOptions: [],
            multipliers: {},
            globalDiscount: 25
        };

        // Get products
        db.all("SELECT * FROM products", (err, products) => {
            if (err) {
                reject(err);
                return;
            }
            
            data.products = products.map(product => ({
                ...product,
                counts: JSON.parse(product.counts || '[]'),
                packagingByCount: JSON.parse(product.packagingByCount || '{}')
            }));

            // Get brands
            db.all("SELECT name FROM brands", (err, brands) => {
                if (err) {
                    reject(err);
                    return;
                }
                data.brands = brands.map(b => b.name);

                // Get styles
                db.all("SELECT name FROM styles", (err, styles) => {
                    if (err) {
                        reject(err);
                        return;
                    }
                    data.styles = styles.map(s => s.name);

                    // Get packaging options
                    db.all("SELECT name FROM packagingOptions", (err, packaging) => {
                        if (err) {
                            console.warn('Error fetching packaging options, using defaults:', err);
                            data.packagingOptions = ["WT-ENV", "OR-ENV", "BLK-ENV", "6x6x6", "7x7x7", "9x9x9", "18x12x2", "18x12x4"];
                        } else {
                            data.packagingOptions = packaging && packaging.length > 0 
                                ? packaging.map(p => p.name) 
                                : ["WT-ENV", "OR-ENV", "BLK-ENV", "6x6x6", "7x7x7", "9x9x9", "18x12x2", "18x12x4"];
                        }

                        // Get roll costs
                        db.all("SELECT * FROM rollCosts", (err, rollCosts) => {
                            if (err) {
                                reject(err);
                                return;
                            }
                            data.rollCosts = rollCosts;

                            // Get TJ share percentages
                            db.all("SELECT * FROM tjSharePercentages", (err, tjSharePercentages) => {
                                if (err) {
                                    console.error('Error fetching TJ share percentages:', err);
                                    data.tjSharePercentages = []; // Default to empty array if table doesn't exist
                                } else {
                                    data.tjSharePercentages = tjSharePercentages || [];
                                }

                                // Get multipliers
                                db.all("SELECT * FROM multipliers", (err, multipliers) => {
                                    if (err) {
                                        reject(err);
                                        return;
                                    }
                                    
                                    multipliers.forEach(mult => {
                                        if (!data.multipliers[mult.preset]) {
                                            data.multipliers[mult.preset] = {};
                                        }
                                        data.multipliers[mult.preset][mult.count] = mult.multiplier;
                                    });

                                    // Get orders
                                    db.all("SELECT * FROM orders", (err, orders) => {
                                        if (err) {
                                            reject(err);
                                            return;
                                        }
                                        
                                        data.orders = orders.map(order => ({
                                            ...order,
                                            items: order.items ? JSON.parse(order.items) : undefined,
                                            returned: order.returned === 1 || order.returned === true,
                                            maker: order.maker || null
                                        }));

                                        // Get global discount
                                        db.get("SELECT value FROM settings WHERE key = 'globalDiscount'", (err, setting) => {
                                            if (err) {
                                                reject(err);
                                                return;
                                            }
                                            data.globalDiscount = setting ? parseInt(setting.value) : 25;
                                            resolve(data);
                                        });
                                    });
                                });
                            });
                        });
                    });
                });
            });
        });
    });
};

// Save data to database
const saveDataToDatabase = (data) => {
    return new Promise((resolve, reject) => {
        db.serialize(() => {
            let operationsCount = 0;
            let completedOperations = 0;
            let hasError = false;

            const checkComplete = () => {
                completedOperations++;
                if (completedOperations === operationsCount && !hasError) {
                    console.log('All data saved to database successfully');
                    console.log('Data saved to database and ready for environment backup');
                    resolve();
                }
            };

            const handleError = (err) => {
                if (!hasError) {
                    hasError = true;
                    console.error('Error saving to database:', err);
                    reject(err);
                }
            };

            // Clear existing data
            operationsCount++;
            db.run("DELETE FROM products", (err) => { 
                if (err) console.error('Error clearing products:', err);
                checkComplete();
            });
            operationsCount++;
            db.run("DELETE FROM orders", (err) => { 
                if (err) console.error('Error clearing orders:', err);
                checkComplete();
            });
            operationsCount++;
            db.run("DELETE FROM rollCosts", (err) => { 
                if (err) console.error('Error clearing rollCosts:', err);
                checkComplete();
            });
            operationsCount++;
            db.run("DELETE FROM tjSharePercentages", (err) => { 
                if (err) console.error('Error clearing tjSharePercentages:', err);
                checkComplete();
            });
            operationsCount++;
            db.run("DELETE FROM brands", (err) => { 
                if (err) console.error('Error clearing brands:', err);
                checkComplete();
            });
            operationsCount++;
            db.run("DELETE FROM styles", (err) => { 
                if (err) console.error('Error clearing styles:', err);
                checkComplete();
            });
            operationsCount++;
            db.run("DELETE FROM packagingOptions", (err) => { 
                if (err) console.error('Error clearing packagingOptions:', err);
                checkComplete();
            });
            operationsCount++;
            db.run("DELETE FROM multipliers", (err) => { 
                if (err) console.error('Error clearing multipliers:', err);
                checkComplete();
            });
            operationsCount++;
            db.run("DELETE FROM settings", (err) => { 
                if (err) console.error('Error clearing settings:', err);
                checkComplete();
            });

            // Insert products
            if (data.products && data.products.length > 0) {
                operationsCount++;
                const insertProduct = db.prepare(`INSERT INTO products 
                    (id, brand, model, style, filamentPerItem, preset, counts, title, packaging, packagingByCount, createdOn)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`);

                data.products.forEach(product => {
                    insertProduct.run(
                        product.id,
                        product.brand,
                        product.model,
                        product.style,
                        product.filamentPerItem,
                        product.preset,
                        JSON.stringify(product.counts || []),
                        product.title,
                        product.packaging || null,
                        JSON.stringify(product.packagingByCount || {}),
                        product.createdOn || new Date().toISOString()
                    );
                });
                insertProduct.finalize((err) => {
                    if (err) handleError(err);
                    else checkComplete();
                });
            }

            // Insert orders
            if (data.orders && data.orders.length > 0) {
                operationsCount++;
                const insertOrder = db.prepare(`INSERT INTO orders 
                    (id, orderNumber, product, count, etsyPayout, shippingCost, productionCost, tjShare, joshShare, status, createdOn, paidOn, source, payoutId, items, returned, maker)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`);

                data.orders.forEach(order => {
                    insertOrder.run(
                        order.id,
                        order.orderNumber,
                        order.product,
                        order.count,
                        order.etsyPayout,
                        order.shippingCost,
                        order.productionCost,
                        order.tjShare,
                        order.joshShare,
                        order.status,
                        order.createdOn,
                        order.paidOn,
                        order.source,
                        order.payoutId,
                        order.items ? JSON.stringify(order.items) : null,
                        order.returned ? 1 : 0,
                        order.maker || null
                    );
                });
                insertOrder.finalize((err) => {
                    if (err) {
                        console.error('Error saving orders:', err);
                        handleError(err);
                    } else {
                        console.log(`Orders saved successfully: ${data.orders.length} entries`);
                        checkComplete();
                    }
                });
            }

            // Insert brands
            if (data.brands && data.brands.length > 0) {
                operationsCount++;
                const insertBrand = db.prepare("INSERT INTO brands (name) VALUES (?)");
                data.brands.forEach(brand => {
                    insertBrand.run([brand]);
                });
                insertBrand.finalize((err) => {
                    if (err) handleError(err);
                    else checkComplete();
                });
            }

            // Insert styles
            if (data.styles && data.styles.length > 0) {
                operationsCount++;
                const insertStyle = db.prepare("INSERT INTO styles (name) VALUES (?)");
                data.styles.forEach(style => {
                    insertStyle.run([style]);
                });
                insertStyle.finalize((err) => {
                    if (err) handleError(err);
                    else checkComplete();
                });
            }

            // Insert roll costs
            if (data.rollCosts && data.rollCosts.length > 0) {
                operationsCount++;
                const insertRollCost = db.prepare("INSERT INTO rollCosts (id, value, date) VALUES (?, ?, ?)");
                data.rollCosts.forEach(rollCost => {
                    insertRollCost.run(rollCost.id, rollCost.value, rollCost.date);
                });
                insertRollCost.finalize((err) => {
                    if (err) handleError(err);
                    else checkComplete();
                });
            }

            // Insert TJ share percentages
            if (data.tjSharePercentages && data.tjSharePercentages.length > 0) {
                operationsCount++;
                const insertTjShare = db.prepare("INSERT INTO tjSharePercentages (id, value, date) VALUES (?, ?, ?)");
                data.tjSharePercentages.forEach(tjShare => {
                    insertTjShare.run(tjShare.id, tjShare.value, tjShare.date);
                });
                insertTjShare.finalize((err) => {
                    if (err) {
                        console.error('Error saving TJ share percentages:', err);
                        handleError(err);
                    } else {
                        console.log(`TJ share percentages saved successfully: ${data.tjSharePercentages.length} entries`);
                        checkComplete();
                    }
                });
            }

            // Insert multipliers
            if (data.multipliers) {
                operationsCount++;
                const insertMultiplier = db.prepare("INSERT INTO multipliers (id, preset, count, multiplier) VALUES (?, ?, ?, ?)");
                Object.entries(data.multipliers).forEach(([preset, counts]) => {
                    Object.entries(counts).forEach(([count, multiplier]) => {
                        insertMultiplier.run(`${preset}-${count}`, preset, parseInt(count), multiplier);
                    });
                });
                insertMultiplier.finalize((err) => {
                    if (err) handleError(err);
                    else checkComplete();
                });
            }

            // Insert packaging options
            if (data.packagingOptions && data.packagingOptions.length > 0) {
                operationsCount++;
                const insertPackaging = db.prepare("INSERT INTO packagingOptions (name) VALUES (?)");
                data.packagingOptions.forEach(option => {
                    insertPackaging.run([option]);
                });
                insertPackaging.finalize((err) => {
                    if (err) handleError(err);
                    else checkComplete();
                });
            }

            // Insert settings
            if (data.globalDiscount !== undefined) {
                operationsCount++;
                db.run("INSERT INTO settings (key, value) VALUES (?, ?)", ["globalDiscount", data.globalDiscount.toString()], (err) => {
                    if (err) handleError(err);
                    else checkComplete();
                });
            }
        });
    });
};

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
// Increase body size limit to handle large state objects (10MB should be plenty)
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Cache-busting middleware to prevent browser caching
app.use((req, res, next) => {
    // For HTML files, prevent caching
    if (req.path.endsWith('.html')) {
        res.set({
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'Pragma': 'no-cache',
            'Expires': '0'
        });
    }
    // For JS and CSS files, add version-based cache busting
    else if (req.path.endsWith('.js') || req.path.endsWith('.css')) {
        res.set({
            'Cache-Control': 'public, max-age=0',
            'ETag': `"${Date.now()}"`
        });
    }
    next();
});

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
        return res.redirect('/');
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
        res.json({ success: true, redirect: '/' });
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

// Apply authentication to all routes except login and static assets
app.use((req, res, next) => {
    // Allow access to login page and API login
    if (req.path === '/login' || req.path === '/api/login') {
        return next();
    }
    // Allow access to static assets (CSS, JS, images) without authentication
    if (req.path.startsWith('/assets/') || req.path.endsWith('.css') || req.path.endsWith('.js') || req.path.endsWith('.png') || req.path.endsWith('.jpg') || req.path.endsWith('.ico')) {
        return next();
    }
    requireAuth(req, res, next);
});

// Serve static files after authentication middleware
app.use(express.static('.'));

// Default data structure with your current products embedded
const DEFAULT_DATA = {
    products: [
        {
            "id": "z6gm5t98",
            "brand": "Eufy",
            "model": "E22",
            "style": "Advanced",
            "filamentPerItem": 22.83,
            "preset": "adv-1|5|30|60|90|120",
            "counts": [1, 5, 30, 60, 90, 120],
            "title": "Eufy E22 - Advanced",
            "packaging": "WT-ENV",
            "packagingByCount": {
                "1": "WT-ENV",
                "5": "WT-ENV",
                "30": "WT-ENV",
                "60": "WT-ENV",
                "90": "WT-ENV",
                "120": "WT-ENV"
            }
        }
    ],
    orders: [],
    rollCosts: [],
    tjSharePercentages: [
        { id: "historical-tj-share-2024-12-01", value: 70, date: "2024-12-01" },
        { id: "default-tj-share", value: 70, date: "2025-01-01" }
    ],
    multipliers: {
        "1|5|30|60|90|120": { 1: 6.5, 5: 3.5, 30: 2, 60: 1.8, 90: 1.6, 120: 1.5 },
        "Prism": { 12: 15, 36: 19.5, 54: 11.5, 72: 10.75 },
        "Nanoleaf Advanced": { 1: 19.5, 30: 8 },
        "Nanoleaf 8MM": { 1: 49.5, 30: 22 },
        "adv-5|72|108|144": { 1: 50, 5: 11, 72: 10, 108: 9.5, 144: 9 },
        "5|72|108|144": { 1: 50, 5: 30, 72: 20, 108: 18, 144: 16 }
    }
};

// Fallback data with your current products (embedded in server as backup)
const FALLBACK_DATA = {
    products: [
        {
            "id": "z6gm5t98",
            "brand": "Eufy",
            "model": "E22",
            "style": "Advanced",
            "filamentPerItem": 22.83,
            "preset": "adv-1|5|30|60|90|120",
            "counts": [1, 5, 30, 60, 90, 120],
            "title": "Eufy E22 - Advanced",
            "packaging": "WT-ENV",
            "packagingByCount": {
                "1": "WT-ENV",
                "5": "WT-ENV",
                "30": "WT-ENV",
                "60": "WT-ENV",
                "90": "WT-ENV",
                "120": "WT-ENV"
            }
        }
    ],
    orders: [],
    rollCosts: [],
    tjSharePercentages: [
        { id: "historical-tj-share-2024-12-01", value: 70, date: "2024-12-01" },
        { id: "default-tj-share", value: 70, date: "2025-01-01" }
    ],
    multipliers: {
        "1|5|30|60|90|120": { 1: 6.5, 5: 3.5, 30: 2, 60: 1.8, 90: 1.6, 120: 1.5 },
        "Prism": { 12: 15, 36: 19.5, 54: 11.5, 72: 10.75 },
        "Nanoleaf Advanced": { 1: 19.5, 30: 8 },
        "Nanoleaf 8MM": { 1: 49.5, 30: 22 },
        "adv-5|72|108|144": { 1: 50, 5: 11, 72: 10, 108: 9.5, 144: 9 },
        "5|72|108|144": { 1: 50, 5: 30, 72: 20, 108: 18, 144: 16 }
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
    
    // Remove old "Eufy S4" multiplier entry if it exists
    if (data.multipliers && data.multipliers["Eufy S4"]) {
        delete data.multipliers["Eufy S4"];
        updated = true;
    }
    
    // Only set default multipliers if the preset doesn't exist
    if (data.multipliers && !data.multipliers["adv-5|72|108|144"]) {
        data.multipliers["adv-5|72|108|144"] = { 1: 50, 5: 11, 72: 10, 108: 9.5, 144: 9 };
        updated = true;
    }
    if (data.multipliers && !data.multipliers["5|72|108|144"]) {
        data.multipliers["5|72|108|144"] = { 1: 50, 5: 30, 72: 20, 108: 18, 144: 16 };
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
    
    // Always save data to ensure persistence (even if no migration was needed)
    try {
        await fs.writeFile('data.json', JSON.stringify(data, null, 2));
        if (updated) {
            console.log('Data migrated and saved successfully');
        } else {
            console.log('Data validated and saved successfully');
        }
    } catch (saveError) {
        console.error('Error saving data.json:', saveError);
        // Don't throw error here, just log it and continue
    }
    
    return data;
};

// Read data from file
const readData = async () => {
    try {
        // Check if data.json exists first
        await fs.access('data.json');
        
        const data = await fs.readFile('data.json', 'utf8');
        if (!data || data.trim() === '') {
            throw new Error('data.json is empty');
        }
        
        const parsedData = JSON.parse(data);
        
        // Always migrate and save data to ensure it's up to date
        const migratedData = await migrateData(parsedData);
        console.log('Data loaded successfully from existing data.json');
        return migratedData;
    } catch (error) {
        console.log('Error reading data.json:', error.message);
        
        // Check if there are any backup files we can restore from
        try {
            const files = await fs.readdir('.');
            const backupFiles = files.filter(file => file.startsWith('data-backup-') && file.endsWith('.json'));
            
            if (backupFiles.length > 0) {
                // Sort by timestamp (newest first)
                backupFiles.sort().reverse();
                const latestBackup = backupFiles[0];
                console.log(`Found backup file: ${latestBackup}. Attempting to restore...`);
                
                try {
                    const backupData = await fs.readFile(latestBackup, 'utf8');
                    const parsedBackup = JSON.parse(backupData);
                    
                    // Restore from backup
                    await fs.writeFile('data.json', JSON.stringify(parsedBackup, null, 2));
                    console.log(`Successfully restored data from backup: ${latestBackup}`);
                    
                    // Migrate the restored data
                    const migratedData = await migrateData(parsedBackup);
                    return migratedData;
                } catch (backupError) {
                    console.log('Failed to restore from backup:', backupError.message);
                }
            }
        } catch (dirError) {
            console.log('Could not check for backup files:', dirError.message);
        }
        
        // Use fallback data with your current products if no backup could be restored
        console.log('No valid data found. Creating data.json with your embedded Eufy E22 product...');
        await fs.writeFile('data.json', JSON.stringify(DEFAULT_DATA, null, 2));
        console.log('New data.json created with embedded Eufy E22 product data');
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
    console.log('Serving calculator at root domain');
    res.sendFile(path.join(__dirname, 'calculator-standalone.html'));
});

// Get application version
app.get('/api/version', (req, res) => {
    const packageJson = require('./package.json');
    res.json({
        version: packageJson.version,
        timestamp: Date.now(),
        buildDate: new Date().toISOString()
    });
});

// Get application data from database
app.get('/api/data', async (req, res) => {
    try {
        const data = await getDataFromDatabase();
        res.json(data);
    } catch (error) {
        console.error('Error reading data:', error);
        res.status(500).json({ error: 'Failed to read data' });
    }
});

// Save application data to database and persistent storage
app.post('/api/data', async (req, res) => {
    try {
        const data = req.body;
        console.log('=== SAVING DATA ===');
        console.log(`Orders count: ${data.orders ? data.orders.length : 0}`);
        console.log(`TJ Share Percentages count: ${data.tjSharePercentages ? data.tjSharePercentages.length : 0}`);
        console.log(`Database path: ${DB_PATH}`);
        console.log(`Persistent storage path: ${process.env.PERSISTENT_STORAGE_PATH || 'not set'}`);
        
        // Save to database
        console.log('Saving to database...');
        await saveDataToDatabase(data);
        console.log('Database save completed');
        
        // Also save to a persistent file (will be in persistent storage if configured)
        const PERSISTENT_FILE_PATH = process.env.PERSISTENT_STORAGE_PATH ? 
            `${process.env.PERSISTENT_STORAGE_PATH}/persistent-data.json` : 
            'persistent-data.json';
        
        console.log(`Saving to persistent file: ${PERSISTENT_FILE_PATH}`);
        await fs.writeFile(PERSISTENT_FILE_PATH, JSON.stringify(data, null, 2));
        console.log(`Data saved to persistent file at: ${PERSISTENT_FILE_PATH}`);
        
        console.log('=== DATA SAVE COMPLETED SUCCESSFULLY ===');
        res.json({ success: true });
    } catch (error) {
        console.error('=== ERROR SAVING DATA ===');
        console.error('Error details:', error);
        console.error('Stack trace:', error.stack);
        res.status(500).json({ error: 'Failed to save data', details: error.message });
    }
});

// Create manual backup endpoint
app.post('/api/backup', async (req, res) => {
    try {
        const timestamp = Date.now();
        const backupName = `data-backup-${timestamp}.json`;
        await fs.copyFile('data.json', backupName);
        console.log(`Manual backup created: ${backupName}`);
        res.json({ success: true, backupFile: backupName });
    } catch (error) {
        console.error('Error creating backup:', error);
        res.status(500).json({ error: 'Failed to create backup' });
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

// Initialize database and start server
const startServer = async () => {
    try {
        await initDatabase();
        await populateDatabase();
        
        app.listen(PORT, () => {
            console.log(`3D Print Calculator server running on port ${PORT}`);
            console.log(`Database: SQLite (persistent across deployments)`);
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
    } catch (error) {
        console.error('Failed to start server:', error);
        process.exit(1);
    }
};

startServer();
