// Main Application File - Initializes everything

// Application state
let isApplicationReady = false;

// Centralized date formatting function for dd-mm-yyyy format
function formatDateToDDMMYYYY(dateString) {
    if (!dateString) return '';
    
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return dateString; // Return original if invalid date
    
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    
    return `${day}-${month}-${year}`;
}

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
        
        // Update back button visibility
        updateBackButtonVisibility();
        
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
        a.download = `deals_${formatDateToDDMMYYYY(new Date()).replace(/-/g, '')}.json`;
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

// Test panel toggle function
function toggleTestPanel() {
    const panel = document.getElementById('test-automation-panel');
    if (panel.style.display === 'none') {
        panel.style.display = 'block';
        // Load last test report if available
        const lastReport = window.tradingSystemTester?.getLastTestReport();
        if (lastReport) {
            window.tradingSystemTester.updateTestResultsUI(lastReport);
        }
    } else {
        panel.style.display = 'none';
    }
}

// Add test button to main UI
function addTestButtonToMainUI() {
    const mainContainer = document.querySelector('.container') || document.body;
    
    // Check if test button already exists
    if (document.getElementById('open-test-panel')) {
        return;
    }
    
    const testButton = document.createElement('button');
    testButton.id = 'open-test-panel';
    testButton.className = 'btn btn-outline-primary test-button';
    testButton.innerHTML = '🧪 Test System';
    testButton.onclick = toggleTestPanel;
    
    mainContainer.appendChild(testButton);
}

// Initialize test button when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', addTestButtonToMainUI);
} else {
    addTestButtonToMainUI();
}

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
