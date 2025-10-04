# Changelog

All notable changes to the 3D Print Pricing Calculator will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- TBD

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
