# Changelog

All notable changes to the 3D Print Pricing Calculator will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- TBD

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
