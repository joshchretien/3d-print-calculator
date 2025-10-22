# Changelog

All notable changes to the 3D Print Pricing Calculator will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- TBD

## [1.6.7] - 2025-01-27

### Added
- **TJ Share Percentage Management**: Added adjustable TJ share percentage field in Manage tab
- **TJ Share History Tracking**: TJ share percentages are tracked with date history like roll costs
- **Unmark Orders as Paid**: Added ability to unmark orders as paid in the Payouts section
- **Dynamic TJ Share Calculation**: Orders now use the latest TJ share percentage from history for calculations

### Technical Changes
- Added `tjSharePercentages` array to state management
- Added `ADD_TJ_SHARE_PERCENTAGE` and `UNMARK_ORDER_PAID` actions
- Added `tjSharePercentages` table to SQLite database schema
- Updated order calculation logic to use latest TJ share percentage from history
- Added "Unmark Paid" button to payouts section with confirmation dialog

### Database Changes
- Added `tjSharePercentages` table with id, value, and date columns
- Updated database migration to include default TJ share percentage (70%)
- Enhanced data persistence for TJ share percentage history

## [1.6.6] - 2025-01-27

### Added
- **eBay Source Option**: Added eBay as third source option alongside Etsy and Website
- **eBay Color Coding**: Complete green color scheme for eBay orders throughout UI
- **eBay Integration**: eBay orders display with green backgrounds and badges

### Technical Changes
- Added eBay option to Source dropdown in Add Order section
- Added eBay option to Edit Order modal Source dropdown
- Implemented green color coding for eBay orders (green-50/green-100 backgrounds)
- Added green source badges for eBay orders (green-100/green-800)
- Updated Add Order section background colors for eBay (green-50/green-200)
- Applied green color scheme to scanning instructions for eBay orders
- Extended color coding to Payouts section for eBay orders

## [1.6.5] - 2025-01-09

### Fixed
- **Migration Logic Override Issue**
  - Fixed aggressive migration logic that was overriding user multiplier changes
  - Changed from force update to conditional update (only set if missing)
  - Preserves user's custom multiplier values in both client and server
  - Resolved issue where multiplier changes were being reset to defaults

## [1.6.4] - 2025-01-09

### Fixed
- **ManageTab Multiplier Display Sync**
  - Added useEffect to sync local multipliers state with global state
  - Fixed ManageTab showing outdated multiplier values after saves
  - Ensures multiplier text area always reflects current state values
  - Resolved confusion between displayed values and actual calculations

## [1.6.3] - 2025-01-09

### Fixed
- **Multiplier Update Reactivity**
  - Fixed ProductTable not re-rendering when multipliers change in Manage tab
  - Changed useMemo dependency from [state.multipliers, mpKey] to [state.multipliers[mpKey], mpKey]
  - More precise dependency tracking for better component reactivity
  - Real-time updates when saving multiplier changes

## [1.6.2] - 2025-01-09

### Fixed
- **My Cost Calculation Precision**
  - Fixed rounding issue where My Cost was rounded before total calculation
  - Changed cost per gram display to show $0.015 (3 decimal places) instead of $0.01
  - Uses precise values for calculations, rounds only for display
  - Removed incorrect roll cost migration that was changing $15 to $10

### Changed
- **Calculation Accuracy**
  - My Cost now uses precise filament × costPerGram values
  - Total calculations use precise My Cost × multiplier
  - Display shows rounded values but calculations maintain precision
  - Improved calculation accuracy for all count tiers

## [1.6.1] - 2025-01-09

### Fixed
- **My Cost Calculation Error**
  - Fixed My Cost showing $0.10 instead of $0.0672 for 1 count
  - Fixed Total showing $5.00 instead of $3.36 for 1 count
  - Root cause: system was using $0.015 per gram but displaying $0.01
  - Added migration to ensure correct roll cost and cost per gram calculation

## [1.6.0] - 2025-01-09

### Added
- **Maker Dropdown for Orders**
  - Added Maker field to Add Order section (TJ/Josh options)
  - TJ gets 70% of profit + production cost (default behavior)
  - Josh gets 100% of (payout - shipping) + production cost when selected
  - Maker field displayed in Orders table with color coding
  - Editable in Edit Order modal

### Changed
- **Order Financial Calculations**
  - Modified payout logic based on selected maker
  - Josh selection overrides default 70/30 profit split
  - TJ gets $0 when Josh is selected as maker
  - Enhanced order object with maker field tracking

### Fixed
- **Multiplier System Updates**
  - Added new multiplier presets: "adv-5|72|108|144" and "5|72|108|144"
  - Removed old "Eufy S4" multiplier entry
  - Force update migration for correct multiplier values
  - Enhanced migration logic for preset name changes

## [1.5.9] - 2025-01-09

### Fixed
- **Old Multiplier Entry Cleanup**
  - Added migration to explicitly remove old "Eufy S4" multiplier entry
  - Ensures clean multiplier data structure
  - Prevents old data from interfering with new preset structure

## [1.5.8] - 2025-01-09

### Added
- **WooCommerce API Integration**
  - Automatic payout amount lookup for website orders
  - Auto-population of product line items from WooCommerce
  - Smart product mapping from WooCommerce to internal catalog
  - Count extraction from variant names (e.g., "90 Brackets" → 90)
  - Fallback to manual entry when mapping fails

### Changed
- **Order Source Detection**
  - Source field automatically updates based on scanned order number
  - Etsy orders default to Etsy source
  - Website orders default to Website source
  - Enhanced order workflow with smart source detection

### Technical
- Added WooCommerce API endpoints with proper authentication
- Enhanced ShipStation integration with improved error handling
- Improved order scanning workflow with multiple API integrations

## [1.5.7] - 2025-01-09

### Added
- **Custom Domain Support**
  - Application now runs at root domain (dashboard.deliciosadecor.com)
  - Removed /calculator-standalone.html from URL
  - Logo links to custom domain
  - Clean URL structure for professional appearance

### Changed
- **Server Configuration**
  - Modified root route to serve main application directly
  - Updated login redirects to use root domain
  - Enhanced domain configuration for Kinsta deployment

### Fixed
- **URL Structure**
  - Resolved issue where full path was showing in browser
  - Clean domain display in address bar
  - Proper routing for all application pages

## [1.4.5] - 2025-10-09

### Added
- **Kinsta Persistent Storage Integration**
  - SQLite database now uses Kinsta's persistent storage volume
  - Database file stored at `/var/lib/data/calculator.db`
  - Persistent data backup file for additional data safety
  - Environment variable configuration for storage path

### Changed
- **Data Persistence Architecture**
  - Migrated from ephemeral file system to persistent storage
  - Database and data files now survive deployments and restarts
  - Enhanced server startup with persistent storage path logging
  - Improved data restoration process from persistent storage

### Fixed
- **Critical Data Loss Issue**
  - Resolved persistent data loss during Kinsta deployments
  - Fixed SQLite database being wiped on every server restart
  - Implemented true data persistence across all deployment cycles
  - Data now survives container rebuilds and scaling events

### Technical Improvements
- **Storage Configuration**
  - Added `PERSISTENT_STORAGE_PATH` environment variable support
  - Fallback to local paths when persistent storage not configured
  - Enhanced database initialization with path logging
  - Improved error handling for storage operations

## [1.4.4] - 2025-10-09

### Changed
- **Persistent Storage Configuration**
  - Updated database path to use Kinsta persistent storage
  - Added environment variable support for storage configuration
  - Prepared application for Kinsta persistent storage integration

### Technical
- Database and persistent files now use configurable storage paths
- Enhanced logging for database and storage operations

## [1.3.3] - 2025-01-09

### Added
- **Auto-Refresh System**
  - Automatic version checking every 30 seconds
  - Update notifications with auto-refresh functionality
  - Manual refresh button in header
  - Version indicator showing current version
  - Cache-busting headers to prevent stale content

### Fixed
- **Data Persistence Issues**
  - Enhanced data migration and saving process
  - Automatic backup creation for corrupted data files
  - Improved error handling for data file operations
  - Ensures data is never lost during updates or deployments

## [1.3.2] - 2025-01-09

### Added
- **Custom Login Page**
  - Modern, branded login interface replacing browser popup
  - Glass-morphism design with gradient background
  - Deliciosa Decor logo integration from CDN
  - Session-based authentication system
  - Professional login form with error handling

### Changed
- **Authentication System**
  - Replaced HTTP Basic Auth with session-based authentication
  - Improved middleware ordering for proper authentication enforcement
  - Enhanced security with session management
  - Added logout functionality with session destruction
- **Login Page Branding**
  - Updated to use official Deliciosa Decor logo
  - Removed redundant text for cleaner design
  - Improved visual hierarchy and user experience

### Fixed
- **Authentication Enforcement**
  - Fixed middleware order to properly require login for main application
  - Resolved issue where static files bypassed authentication
  - Ensured unauthenticated users are redirected to login page
  - Fixed authentication loop issues

## [1.2.0] - 2025-01-03

### Added
- **ShipStation API Integration**
  - Automatic shipping cost lookup via ShipStation API
  - Real-time API connectivity with loading indicators
  - Error handling and user feedback for API failures
  - Environment variable configuration for API credentials
- **Enhanced Add Order Workflow**
  - Always-visible order number field optimized for barcode scanning
  - Auto-expand order details section after successful API lookup
  - Improved user experience with visual scanning instructions
  - Smart auto-focus on order number field for seamless barcode input
- **Prism Product Support**
  - Added Prism 12 count with 15x multiplier
  - Enhanced product preset system for Prism configurations
  - Automatic data migration for existing Prism products

### Changed
- **Order Entry Process**
  - Redesigned Add Order section with two-tier layout
  - Moved source and order number to always-visible top section
  - Collapsible order details section for better workflow
  - Enhanced shipping cost field with real-time lookup status
- **Server Configuration**
  - Updated ShipStation API endpoint with proper authentication
  - Improved server startup messages with API status indicators
  - Enhanced environment variable handling for production deployment

### Fixed
- **Data Migration**
  - Fixed Prism count 12 missing from existing products
  - Improved server-side data migration for new product configurations
  - Enhanced client-side data preservation during updates
- **Authentication**
  - Resolved password protection looping issue
  - Updated authentication to use environment variables with fallbacks

## [1.0.4] - 2025-10-04

### Added
- Nanoleaf brand product support with custom preset
- 1 count option with 19.5x multiplier
- 30 count option with 8x multiplier
- Filament-based pricing calculation for Nanoleaf products

### Changed
- Updated version to 1.0.4
- Enhanced product management with brand-specific pricing

## [1.0.3] - 2025-10-04

### Added
- Deliciosa Decor logo integration
- Assets folder for logo storage
- Professional branding in application header

### Changed
- Replaced text title with company logo
- Updated header styling for logo display

## [1.0.2] - 2025-10-04

### Added
- Deliciosa Decor logo integration
- Assets folder for logo storage
- Professional branding in application header

### Changed
- Replaced text title with company logo
- Updated header styling for logo display

## [1.0.1] - 2025-10-04

### Added
- Automatic deployment on GitHub commits
- Professional development workflow setup
- Local development with instant testing capabilities

### Changed
- Updated version to 1.0.1
- Enhanced documentation with auto-deploy information

## [1.0.0] - 2025-10-04

### Added
- **Product Management System**
  - Dynamic product creation with multi-tier pricing
  - Advanced filtering by brand and style
  - Smart sorting by date added or title
  - Product duplication functionality
  - Model editing capabilities
  - Collapsible add product section

- **Packaging Management**
  - Per-row packaging selection for each quantity tier
  - Visual packaging tables organized by brand
  - Envelope dimensions reference
  - Customizable packaging options
  - Brand-grouped packaging display

- **Order Management & Financial Analytics**
  - Multi-line order support
  - Dynamic quantity input for power supply products
  - Automated financial calculations (70/30 profit split)
  - Production cost tracking
  - Payment status management
  - Payout grouping with detailed breakdowns
  - Revenue analytics and summaries

- **Data Management**
  - JSON-based import/export functionality
  - Brand and style management
  - Global discount settings
  - Roll cost tracking
  - File-based data persistence with API endpoints

- **Security & Deployment**
  - HTTP Basic Authentication
  - Environment variable configuration
  - Kinsta hosting integration
  - Custom domain support (dashboard.deliciosadecor.com)
  - GitHub repository with version control

### Technical Features
- React 18.x frontend with modern hooks
- Node.js 18.x backend with Express
- Tailwind CSS for styling
- File-based JSON storage
- CORS-enabled API endpoints
- Production-ready deployment configuration

### Business Logic
- **Financial Calculations**:
  - Profit = Etsy Payout - Shipping Cost - Production Cost
  - TJ Share = (Profit × 0.7) + Production Cost
  - Josh Share = Profit × 0.3
- **Multi-tier Pricing**: Support for 1, 5, 12, 30, 60, 90, 120+ unit pricing
- **Brand-specific Multipliers**: Customizable pricing per brand
- **Advanced Mount Pricing**: Special configurations for advanced mounts
- **Power Supply Handling**: Fixed pricing with dynamic quantity input

---

## Version Numbering

We use [Semantic Versioning](https://semver.org/) for version numbers:

- **MAJOR** version when you make incompatible API changes
- **MINOR** version when you add functionality in a backwards compatible manner
- **PATCH** version when you make backwards compatible bug fixes

## Release Notes Template

When making future changes, follow this format:

```markdown
## [X.Y.Z] - YYYY-MM-DD

### Added
- New features

### Changed
- Changes to existing functionality

### Deprecated
- Soon-to-be removed features

### Removed
- Removed features

### Fixed
- Bug fixes

### Security
- Security improvements
```
