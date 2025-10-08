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
- **Financial Calculations**: Automated profit sharing (70/30 split)
- **Cost Tracking**: Production cost, shipping, and profit analysis
- **Payment Status**: Track paid vs. unpaid orders
- **Payout Management**: Group orders by payment date with detailed breakdowns
- **Revenue Analytics**: Total earnings, production costs, and profit margins
- **Barcode Scanning**: Quick order entry with automatic data population
- **API Integration**: Real-time data from ShipStation and WooCommerce

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
- **Express.js**: Web application framework
- **CORS**: Cross-origin resource sharing
- **File System API**: JSON-based data persistence
- **ShipStation API**: Shipping cost integration
- **WooCommerce API**: Order data and payout integration

### Deployment
- **Kinsta**: Professional hosting platform
- **GitHub**: Version control and CI/CD
- **Custom Domain**: dashboard.deliciosadecor.com
- **SSL/TLS**: Automatic HTTPS encryption

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

## 🎯 Use Cases

### For 3D Printing Businesses
- **Product Catalog Management**: Organize and price 3D printed products
- **Order Processing**: Streamline order fulfillment workflow
- **Financial Tracking**: Monitor profitability and cost structures
- **Packaging Optimization**: Efficient packaging selection and planning

### For E-commerce Operations
- **Multi-vendor Support**: Handle different product lines and brands
- **Inventory Management**: Track product variations and quantities
- **Customer Service**: Quick access to order history and details
- **Business Analytics**: Revenue and profit analysis

## 🔄 Version History

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
