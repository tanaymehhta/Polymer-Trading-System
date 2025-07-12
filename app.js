// Main Application File - Initializes everything

// Application state
let isApplicationReady = false;

// Initialize the application
document.addEventListener('DOMContentLoaded', async function() {
    try {
        console.log('🚀 Starting Polymer Trading System...');
        
        // Set today's date
        const dateInput = document.getElementById('date');
        if (dateInput) {
            dateInput.valueAsDate = new Date();
        }
        
        // Validate configuration
        if (!validateConfig()) {
            showNotification('Please configure the system in config.js', 'error');
            return;
        }
        
        // Initialize WhatsApp
        initializeWhatsApp();
        
        // Load existing data from local storage
        loadDealsFromStorage();
        
        // Initialize session database (loads fresh from Google Sheets)
        await sessionDB.initialize();
        
        // Initialize deal form
        initializeDealForm();
        
        // Update all displays
        updateDealsHistory();
        updateInventoryDisplay();
        updateProductsDatabase();
        
        // Add system status indicator
        addSystemStatusIndicator();
        
        // Setup periodic tasks
        setupPeriodicTasks();
        
        // Mark application as ready
        isApplicationReady = true;
        
        console.log('✅ Polymer Trading System initialized successfully');
        
    } catch (error) {
        console.error('❌ Failed to initialize system:', error);
        showNotification('System initialization failed. Please check your configuration.', 'error');
    }
});

// Setup periodic tasks
function setupPeriodicTasks() {
    // Check for low inventory every 30 minutes
    setInterval(() => {
        if (isApplicationReady && inventory.length > 0) {
            checkInventoryAlerts();
        }
    }, 30 * 60 * 1000);
    
    // Update system status every minute
    setInterval(() => {
        if (isApplicationReady) {
            updateSystemStatus();
        }
    }, 60 * 1000);
    
    console.log('⏰ Periodic tasks scheduled');
}

// Handle application cleanup
window.addEventListener('beforeunload', function(e) {
    console.log('🚪 Application shutting down...');
    
    // Save current state
    localStorage.setItem('deals', JSON.stringify(deals));
    localStorage.setItem('inventory', JSON.stringify(inventory));
    
    // Cleanup session database
    if (sessionDB) {
        sessionDB.cleanup();
    }
    
    console.log('💾 State saved, cleanup complete');
});

// Handle errors globally
window.addEventListener('error', function(e) {
    console.error('💥 Application error:', e.error);
    showNotification('An unexpected error occurred. Check console for details.', 'error');
});

// Handle unhandled promise rejections
window.addEventListener('unhandledrejection', function(e) {
    console.error('💥 Unhandled promise rejection:', e.reason);
    showNotification('An async operation failed. Check console for details.', 'error');
    e.preventDefault();
});

// Utility function to check if system is ready
function isSystemReady() {
    return isApplicationReady && sessionDB && sessionDB.isInitialized;
}

// Export global functions for console access
window.systemAPI = {
    // System status
    getStats: () => sessionDB.getStats(),
    isReady: () => isSystemReady(),
    
    // Data management
    refreshProducts: () => sessionDB.refresh(),
    exportDeals: () => {
        const data = JSON.stringify(deals, null, 2);
        const blob = new Blob([data], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `deals_${new Date().toISOString().split('T')[0]}.json`;
        a.click();
        URL.revokeObjectURL(url);
    },
    
    // Configuration
    showConfig: () => {
        console.log('Current Configuration:', ENV_CONFIG);
        return ENV_CONFIG;
    },
    
    // WhatsApp testing
    testWhatsApp: (message = 'Test message from Polymer Trading System') => {
        sendNotificationMessage(message);
    },
    
    // Debug mode
    enableDebug: () => {
        ENV_CONFIG.DEBUG_MODE = true;
        console.log('🐛 Debug mode enabled');
    },
    
    disableDebug: () => {
        ENV_CONFIG.DEBUG_MODE = false;
        console.log('🐛 Debug mode disabled');
    }
};

// Console welcome message
console.log(`
🔄 POLYMER TRADING SYSTEM LOADED
=====================================

System API available at: window.systemAPI
Commands:
  systemAPI.getStats()     - Get system statistics
  systemAPI.isReady()      - Check if system is ready
  systemAPI.showConfig()   - Show current configuration
  systemAPI.testWhatsApp() - Test WhatsApp integration
  systemAPI.exportDeals()  - Export deals as JSON

Debug mode: ${ENV_CONFIG.DEBUG_MODE ? 'ON' : 'OFF'}
Environment: ${ENV_CONFIG.SERVER_MODE ? 'Server' : 'Browser'}

=====================================
`);

// Legacy compatibility functions
function updateGradeOptions() {
    updateProductSelection();
}

function updateCompanyOptions() {
    updateProductSelection();
}

function updateSpecificGradeOptions() {
    updateProductSelection();
}
