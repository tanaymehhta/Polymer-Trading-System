// Environment Configuration - Replace with your actual values
const ENV_CONFIG = {
    // ===== GOOGLE SHEETS CONFIGURATION =====
    GOOGLE_SHEETS_ID: 'your-google-sheet-id-here',
    GOOGLE_API_KEY: 'your-google-api-key-here',
    
    // Sheet ranges and names
    PRODUCT_SHEET_RANGE: 'Table1_2!A:E',
    DEALS_SHEET_RANGE: 'Main!A:L',
    DEALS_SHEET_NAME: 'Main',
    
    // ===== WHATSAPP BUSINESS API CONFIGURATION =====
    WHATSAPP_API_TOKEN: 'your-whatsapp-business-api-token',
    WHATSAPP_API_URL: 'https://graph.facebook.com/v17.0',
    WHATSAPP_PHONE_NUMBER_ID: 'your-phone-number-id',
    
    // Recipients for WhatsApp messages
    WHATSAPP_PHONE_ACCOUNTS: '919702507574',    // Accounts team
    WHATSAPP_PHONE_LOGISTICS: '917977656248',   // Logistics team
    
    // ===== COMPANY INFORMATION =====
    COMPANY_NAME: 'Your Company Name',
    
    // ===== APPLICATION SETTINGS =====
    SYNC_INTERVAL: 5 * 60 * 1000, // 5 minutes
    SERVER_MODE: true,
    DEBUG_MODE: true
};

// Validation function
function validateConfig() {
    const required = ['GOOGLE_SHEETS_ID', 'GOOGLE_API_KEY'];
    
    for (const key of required) {
        if (!ENV_CONFIG[key] || ENV_CONFIG[key].includes('your-')) {
            console.warn(`⚠️  Please configure ${key} in config.js`);
            return false;
        }
    }
    
    return true;
}

// Export for use in other files
window.ENV_CONFIG = ENV_CONFIG;
window.validateConfig = validateConfig;
