# 3D Print Pricing Calculator & Business Management System

[![Node.js](https://img.shields.io/badge/Node.js-18.x-green.svg)](https://nodejs.org/)
[![React](https://img.shields.io/badge/React-18.x-blue.svg)](https://reactjs.org/)
[![License](https://img.shields.io/badge/License-Private-red.svg)]()

A comprehensive business management system designed specifically for 3D printing operations, featuring advanced pricing calculations, order management, packaging optimization, and financial analytics.

## 🌟 Features

### 📊 **Product Management**
- **Dynamic Product Creation**: Add products with customizable pricing tiers
- **Advanced Filtering**: Filter by brand, style, or custom criteria
- **Smart Sorting**: Sort by date added, title, or custom parameters
- **Product Duplication**: One-click product cloning for rapid expansion
- **Model Editing**: Full CRUD operations for product models
- **Multi-tier Pricing**: Support for complex pricing structures (1, 5, 12, 30, 60, 90, 120+ units)

### 📦 **Packaging Management**
- **Per-Row Packaging**: Individual packaging selection for each quantity tier
- **Visual Packaging Tables**: Brand-organized tables with color-coded packaging types
- **Envelope Dimensions**: Built-in reference for envelope sizing
- **Packaging Options**: Customizable packaging types (WT-ENV, OR-ENV, BLK-ENV, custom boxes)
- **Brand Grouping**: Organized display by brand with style variations

### 💰 **Order Management & Financial Analytics**
- **Multi-Line Orders**: Add multiple products to single orders
- **Dynamic Quantity Input**: Special handling for power supply products
- **Financial Calculations**: Automated profit sharing with adjustable TJ/Josh split percentages
- **Cost Tracking**: Production cost, shipping, and profit analysis
- **Payment Status**: Track paid vs. unpaid orders
- **Payout Management**: Group orders by payment date with detailed breakdowns
- **Revenue Analytics**: Total earnings, production costs, and profit margins
- **Automated Order Entry**: Complete barcode scanning workflow with full auto-population
- **API Integration**: Real-time data from ShipStation and WooCommerce
- **Smart Product Matching**: Automatic product and count detection from WooCommerce orders
- **Source Detection**: Automatic Etsy, Website, and eBay order identification
- **Order Search**: Quick search by order number to find and edit orders
- **Returns Management**: Mark orders as returned with automatic payout adjustments
- **Maker Attribution**: Assign orders to TJ or Josh for production cost tracking
- **Scan Date Tracking**: Track when each order was scanned for sorting and analysis

### 🔧 **Data Management**
- **Import/Export**: JSON-based data portability
- **Brand & Style Management**: Dynamic brand and style configuration
- **Global Discount Settings**: Centralized discount management
- **Roll Cost Tracking**: Historical filament cost tracking
- **Data Persistence**: File-based storage with API endpoints

### 🔒 **Security & Deployment**
- **HTTP Basic Authentication**: Secure access control
- **Environment Variables**: Configurable authentication credentials
- **Production Ready**: Optimized for Kinsta hosting
- **Custom Domain Support**: Professional domain configuration

## 🚀 Live Demo

**Production URL**: [dashboard.deliciosadecor.com](https://dashboard.deliciosadecor.com) *(Custom domain setup pending)*

**Kinsta URL**: [d-print-calculator-hi9gi.kinsta.app](https://d-print-calculator-hi9gi.kinsta.app)

## 🛠️ Technology Stack

### Frontend
- **React 18.x**: Modern UI with hooks and functional components
- **Tailwind CSS**: Utility-first styling framework
- **Custom Components**: Reusable, optimized React components
- **State Management**: useReducer for complex state handling

### Backend
- **Node.js 18.x**: Server-side JavaScript runtime
- **Express.js**: Web application framework with 10MB body parser limit
- **SQLite3**: Persistent database storage with Kinsta persistent volumes
- **CORS**: Cross-origin resource sharing
- **ShipStation API**: Shipping cost integration and order lookup
- **WooCommerce API**: Order data, payout calculation, and line item processing
- **Smart Data Processing**: Intelligent product matching and count extraction
- **Async Operation Handling**: Proper SQLite prepared statement completion tracking

### Deployment
- **Kinsta**: Professional hosting platform
- **Persistent Storage**: SQLite database mounted at `/var/lib/data`
- **GitHub**: Version control and CI/CD
- **Custom Domain**: dashboard.deliciosadecor.com
- **SSL/TLS**: Automatic HTTPS encryption
- **Auto-Deploy**: Automatic deployment on GitHub push

## 📁 Project Structure

```
3d-print-calculator/
├── calculator-standalone.html    # Main React application
├── server.js                     # Node.js backend server
├── data.json                     # Application data storage
├── package.json                  # Dependencies and scripts
├── .gitignore                   # Git ignore rules
└── README.md                    # Project documentation
```

## 🔧 Installation & Setup

### Prerequisites
- Node.js 18.x or higher
- Git for version control

### Local Development
```bash
# Clone the repository
git clone https://github.com/joshchretien/3d-print-calculator.git

# Navigate to project directory
cd 3d-print-calculator

# Install dependencies
npm install

# Start the development server
npm start

# Application will be available at http://localhost:3000
```

### Environment Variables
Create a `.env` file for local development:
```env
AUTH_USERNAME=admin
AUTH_PASSWORD=your-secure-password
PORT=3000
```

## 📊 Business Logic

### Financial Calculations
- **Profit**: `Etsy Payout - Shipping Cost - Production Cost`
- **TJ Share**: `(Profit × 0.7) + Production Cost`
- **Josh Share**: `Profit × 0.3`
- **Validation**: `TJ Share + Josh Share + Shipping Cost = Etsy Payout`

### Pricing Structure
- **Multi-tier Pricing**: Supports complex pricing matrices
- **Brand-specific Multipliers**: Customizable pricing per brand
- **Advanced Mounts**: Special pricing for advanced configurations
- **Power Supplies**: Fixed pricing with dynamic quantity input

## 🚀 Complete Automation Workflow

### 📱 **Barcode Scanning → Complete Order Entry**
1. **Scan Order Barcode** → Auto-populates order number
2. **ShipStation Lookup** → Auto-populates shipping cost
3. **WooCommerce Integration** → Auto-populates payout amount
4. **Smart Product Matching** → Auto-populates product selection
5. **Count Detection** → Auto-populates quantity counts
6. **Source Detection** → Auto-sets Etsy/Website source
7. **Click Add Order** → Done! 🎉

### 🔄 **Supported Order Types**
- **Etsy Orders**: ShipStation shipping cost + manual product entry
- **Website Orders**: ShipStation shipping + WooCommerce payout + auto-product detection
- **Mixed Orders**: Full automation with intelligent source detection

## 🎯 Use Cases

### For 3D Printing Businesses
- **Product Catalog Management**: Organize and price 3D printed products
- **Automated Order Processing**: Complete barcode-to-order workflow
- **Financial Tracking**: Monitor profitability and cost structures
- **Packaging Optimization**: Efficient packaging selection and planning

### For E-commerce Operations
- **Multi-vendor Support**: Handle different product lines and brands
- **Inventory Management**: Track product variations and quantities
- **Customer Service**: Quick access to order history and details
- **Business Analytics**: Revenue and profit analysis

## 🔄 Version History

### v1.8.1 - Enhanced Payout Workflow & Returns Management (January 2025)
- ✅ **Shift-Click Selection**: Select multiple orders by clicking first order, then shift-clicking last order to select range
- ✅ **Payout Confirmation Modal**: Comprehensive payout summary modal before processing payouts
- ✅ **Payout Summary Display**: Shows total orders, Etsy payout, shipping costs, production costs, and final TJ/Josh payouts
- ✅ **Pending Return Subtractions**: Renamed Returns section to "Pending Return Subtractions" for clarity
- ✅ **Optional Returns Inclusion**: Checkbox in payout modal to include/exclude pending returns from current payout
- ✅ **Returns Tracking**: Returns automatically removed from pending list when included in a payout
- ✅ **Dynamic Payout Button**: "Mark Selected Paid" button shows order count and TJ payout amount in real-time
- ✅ **Calculation Fixes**: Fixed payout calculations to correctly handle returns and base amounts
- ✅ **Returns Persistence**: Returns are tracked with payout IDs to prevent double-counting

### v1.8.0 - Reports Tab & Enhanced Analytics (January 2025)
- ✅ **Comprehensive Reports Tab**: New dedicated reporting section with Summary, TJ, and Josh breakdowns
- ✅ **Date Range Filtering**: Monthly (default), Today, Yesterday, Last 7/14/30 Days, This Month/Year
- ✅ **Summary Section**: Total orders by source, total payouts, shipping costs, production costs with monthly breakdowns
- ✅ **TJ & Josh Sections**: Individual earnings, paid, owed, production costs, and orders fulfilled with source breakdowns
- ✅ **Monthly Bar Charts**: Visual representation of monthly data distribution with percentages
- ✅ **Order Search**: Quick search functionality to find and edit orders by order number
- ✅ **Returns Management**: Mark orders as returned with automatic deduction from payouts
- ✅ **Scan Date Column**: Added date tracking for order scanning and sorting
- ✅ **Last Order Badges**: Display last Etsy, Website, and eBay orders in Add Order section
- ✅ **Source Breakdowns**: Visual bar charts showing order distribution by source (Etsy, Website, eBay)
- ✅ **Maker Field Persistence**: Added maker column to database for TJ/Josh order attribution
- ✅ **Packaging Options Fallback**: Automatic fallback to default packaging options if database is empty

### v1.7.1 - Critical Database Persistence Fixes (January 2025)
- ✅ **HTTP 413 Payload Too Large Fix**: Increased Express body parser limit to 10MB
- ✅ **Database Async Completion**: Fixed SQLite prepared statement completion tracking
- ✅ **Proper State Persistence**: Ensures all database writes complete before API response
- ✅ **Kinsta Persistent Storage**: Database stored at `/var/lib/data` mount point
- ✅ **Production Stability**: Resolved data loss issues on refresh

### v1.6.9 - Bulk Operations & TJ Share Management (January 2025)
- ✅ **Bulk Edit TJ Share**: Apply TJ share percentage to multiple orders at once
- ✅ **Historical TJ Share Tracking**: Track changes in TJ share over time
- ✅ **Bulk Unmark Paid**: Unmark multiple orders as paid simultaneously
- ✅ **EST Timezone Support**: All dates/times use Eastern Standard Time

### v1.6.8 - Unmark Paid & Timezone Fixes (January 2025)
- ✅ **Bulk Unmark Paid Orders**: Select multiple orders to unmark as paid
- ✅ **Master Checkbox**: Select all orders in a payout group
- ✅ **EST Timezone**: Fixed date accuracy to use America/New_York timezone

### v1.6.7 - TJ Share Percentage Management (January 2025)
- ✅ **TJ Share Tracking**: Historical TJ share percentage tracking with dates
- ✅ **Unmark Orders as Paid**: Ability to unmark individual orders
- ✅ **Dynamic Split Calculation**: Uses latest TJ share from history for new orders
- ✅ **TJ Share UI**: Manage TJ share percentages in Manage tab

### v1.6.6 - eBay Source Support (January 2025)
- ✅ **eBay Source**: Added eBay as third source option (Etsy, Website, eBay)
- ✅ **Green Color Coding**: Complete eBay theme throughout application
- ✅ **Source Dropdown**: Updated order source selection UI

### v1.5.9-v1.6.5 - Multiplier & Calculation Fixes (January 2025)
- ✅ **Multiplier Reactivity**: Changes in Manage tab update product calculations immediately
- ✅ **Calculation Precision**: Fixed rounding errors in "My Cost" and "Total" calculations
- ✅ **Preset Management**: Renamed "Eufy S4" to "adv-5|72|108|144" and added new preset
- ✅ **New Presets**: Added "5|72|108|144" with multipliers 5:30, 72:20, 108:18, 144:16
- ✅ **1 Count Support**: Added 1 count with multiplier 50 to both new presets
- ✅ **Cost Display**: Fixed "Cost per gram" to show $0.015 instead of $0.01

### v1.3.1 - Complete Automation & Smart Product Matching (January 2025)
- ✅ **Smart Product Matching**: Automatic product detection from WooCommerce line items
- ✅ **Intelligent Count Extraction**: Advanced parsing of product variations and attributes
- ✅ **Full Order Auto-Population**: Complete order entry with product, count, and quantity
- ✅ **Enhanced Debugging**: Comprehensive logging for troubleshooting and optimization
- ✅ **Multi-Method Extraction**: Robust count detection from variations, meta_data, and product names
- ✅ **Production Workflow**: Complete scan-to-order automation for maximum efficiency

### v1.3.0 - WooCommerce API Integration (January 2025)
- ✅ **WooCommerce API Integration**: Automatic payout calculation for Website orders
- ✅ **Stripe Fee Detection**: Real-time Stripe fee calculation and payout deduction
- ✅ **Source Auto-Detection**: Automatic Etsy vs Website order source identification
- ✅ **Complete Order Automation**: Scan → Auto-populate all fields (source, shipping, payout)
- ✅ **Debounced API Calls**: Optimized barcode scanning with 1.5s delay
- ✅ **Default Orders Tab**: Application now opens to Orders tab by default
- ✅ **Enhanced Error Handling**: Comprehensive API error handling and logging
- ✅ **Production Ready**: Full integration with deliciosadecor.com WooCommerce store

### v1.2.0 - ShipStation API Integration (January 2025)
- ✅ **ShipStation API Integration**: Automatic shipping cost lookup
- ✅ **Enhanced Add Order Workflow**: Always-visible order number field for barcode scanning
- ✅ **Auto-Expand Functionality**: Order details auto-expand after successful API lookup
- ✅ **Prism Product Support**: Added Prism 12 count with 15x multiplier
- ✅ **Visual Feedback**: Loading indicators and error handling for API calls
- ✅ **Improved UX**: Smart auto-focus and barcode-friendly interface
- ✅ **Data Migration**: Fixed Prism count 12 missing from existing products
- ✅ **Authentication Fix**: Resolved password protection looping issue

### v1.0.4 - Nanoleaf Product Support (October 2025)
- ✅ Added Nanoleaf brand preset with 1 and 30 count options
- ✅ Custom pricing multipliers: 1 count (19.5x), 30 count (8x)
- ✅ Filament-based cost calculation for Nanoleaf products
- ✅ Replaced application title with Deliciosa Decor logo

### v1.0.3 - Logo Integration (October 2025)
- ✅ Added Deliciosa Decor logo to replace text title
- ✅ Created assets folder for logo storage
- ✅ Updated header branding

### v1.0.2 - Logo Integration (October 2025)
- ✅ Added Deliciosa Decor logo to replace text title
- ✅ Created assets folder for logo storage
- ✅ Updated header branding

### v1.0.1 - Auto-Deploy Setup (October 2025)
- ✅ Enabled automatic deployment on GitHub commits
- ✅ Set up professional development workflow
- ✅ Local development with instant testing

### v1.0.0 - Initial Release (October 2025)
- ✅ Complete product management system
- ✅ Advanced order tracking with financial calculations
- ✅ Packaging management with visual tables
- ✅ Authentication and security
- ✅ Kinsta deployment with custom domain support
- ✅ GitHub integration and version control

## 🤝 Contributing

This is a private business application. For feature requests or bug reports, please contact the development team.

## 📝 License

This project is proprietary software developed for Deliciosa Decor. All rights reserved.

## 👨‍💻 Development Team

**Lead Developer**: Josh Chretien  
**Company**: Deliciosa Decor  
**Contact**: orders@deliciosadecor.com

---

*Built with ❤️ for the 3D printing community*
