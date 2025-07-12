# 🔄 Polymer Trading Management System

A comprehensive web-based system for managing polymer trading operations with Google Sheets integration and WhatsApp Business API support.

## ✨ Features

### 🎯 Core Functionality
- **Session-Based Database**: Fresh product data loaded from Google Sheets on startup
- **Auto-Fill Forms**: Product selection automatically fills grade, company, and specific grade
- **Real-Time Sync**: Checks Google Sheets every 5 minutes for external updates
- **Dual WhatsApp Integration**: Sends formatted messages to accounts and logistics teams
- **Inventory Management**: Track stock levels with automatic updates
- **Deal History**: Complete transaction logging with profit/loss tracking

### 📱 WhatsApp Integration
- **Accounts Team Message**: Detailed deal information with purchase details
- **Logistics Team Message**: Simplified format for warehouse operations
- **Message Preview**: See exact messages before sending
- **API Integration**: Works with WhatsApp Business API
- **Simulation Mode**: Test without actual API calls

### 📊 Google Sheets Integration
- **Product Database**: Reads from Google Sheets as master source
- **Deal Logging**: Automatically logs every transaction
- **External Updates**: Detects changes made directly in sheets
- **Bidirectional Sync**: Add products via app, sync back to sheets

## 🚀 Quick Start

### 1. Setup Files
- Download all 8 files and upload to your web server
- Configure `config.js` with your Google Sheets ID and API key

### 2. Google Sheets Setup
Create two sheets with the exact structure:

**Sheet "Table1_2" (Product Database):**
| Column A | Column B | Column C | Column D | Column E |
|----------|----------|----------|----------|----------|
| Product Code | Grade | Company | Specific Grade | Source |

**Sheet "Main" (Deals Log):**
| A | B | C | D | E | F | G | H | I | J | K | L |
|---|---|---|---|---|---|---|---|---|---|---|---|
| Sr.No | Date | Date | Qty Sold | Rate | Product | Grade | Company | Specific Grade | Purchase Party | Purchase Qty | Rate |

### 3. Configuration
Edit `config.js`:
```javascript
const ENV_CONFIG = {
    GOOGLE_SHEETS_ID: 'your-actual-google-sheet-id',
    GOOGLE_API_KEY: 'your-actual-google-api-key',
    WHATSAPP_PHONE_ACCOUNTS: '919702507574',
    WHATSAPP_PHONE_LOGISTICS: '917977656248',
    // ... other settings
};
