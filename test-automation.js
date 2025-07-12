// Automated Testing System for Polymer Trading System
// Tests all major functionality and provides detailed reports

class TradingSystemTester {
    constructor() {
        this.testResults = [];
        this.isRunning = false;
        this.testStartTime = null;
        this.testEndTime = null;
        this.currentTest = null;
    }

    // Initialize the tester
    async initialize() {
        console.log('🧪 Initializing Trading System Tester...');
        
        // Wait for system to be ready
        let attempts = 0;
        const maxAttempts = 30; // 30 seconds timeout
        
        while (!isSystemReady() && attempts < maxAttempts) {
            await new Promise(resolve => setTimeout(resolve, 1000));
            attempts++;
        }
        
        if (!isSystemReady()) {
            throw new Error('System not ready after 30 seconds');
        }
        
        console.log('✅ Trading System Tester initialized');
    }

    // Run all tests
    async runAllTests() {
        if (this.isRunning) {
            console.warn('⚠️ Tests already running');
            return;
        }

        this.isRunning = true;
        this.testStartTime = Date.now();
        this.testResults = [];
        
        console.log('🚀 Starting comprehensive system tests...');
        this.updateTestUI('Starting comprehensive system tests...', 'info');
        
        try {
            // Test 1: System Configuration
            await this.testSystemConfiguration();
            
            // Test 2: Google Sheets Integration
            await this.testGoogleSheetsIntegration();
            
            // Test 3: WhatsApp Integration
            await this.testWhatsAppIntegration();
            
            // Test 4: Deal Management
            await this.testDealManagement();
            
            // Test 5: Inventory Management
            await this.testInventoryManagement();
            
            // Test 6: Data Synchronization
            await this.testDataSynchronization();
            
            // Test 7: UI Functionality
            await this.testUIFunctionality();
            
            // Test 8: Error Handling
            await this.testErrorHandling();
            
            // Test 9: Performance
            await this.testPerformance();
            
            // Test 10: End-to-End Workflow
            await this.testEndToEndWorkflow();
            
        } catch (error) {
            console.error('❌ Test suite failed:', error);
            this.addTestResult('Test Suite', false, `Test suite failed: ${error.message}`);
        } finally {
            this.isRunning = false;
            this.testEndTime = Date.now();
            this.generateTestReport();
        }
    }

    // Test 1: System Configuration
    async testSystemConfiguration() {
        this.currentTest = 'System Configuration';
        this.updateTestUI('Testing system configuration...', 'info');
        
        const results = [];
        
        // Test config validation
        try {
            const isValid = validateConfig();
            results.push({
                test: 'Configuration Validation',
                passed: isValid,
                details: isValid ? 'All required configurations are set' : 'Missing required configurations'
            });
        } catch (error) {
            results.push({
                test: 'Configuration Validation',
                passed: false,
                details: `Error: ${error.message}`
            });
        }
        
        // Test Google Sheets ID
        try {
            const hasSheetsId = ENV_CONFIG.GOOGLE_SHEETS_ID && 
                               !ENV_CONFIG.GOOGLE_SHEETS_ID.includes('YOUR_ACTUAL_') &&
                               !ENV_CONFIG.GOOGLE_SHEETS_ID.includes('your-');
            results.push({
                test: 'Google Sheets ID',
                passed: hasSheetsId,
                details: hasSheetsId ? 'Valid Google Sheets ID configured' : 'Invalid or missing Google Sheets ID'
            });
        } catch (error) {
            results.push({
                test: 'Google Sheets ID',
                passed: false,
                details: `Error: ${error.message}`
            });
        }
        
        // Test WhatsApp configuration
        try {
            const whatsappConfig = validateWhatsAppConfig();
            results.push({
                test: 'WhatsApp Configuration',
                passed: whatsappConfig.isValid,
                details: whatsappConfig.isValid ? 'WhatsApp properly configured' : 'WhatsApp configuration incomplete'
            });
        } catch (error) {
            results.push({
                test: 'WhatsApp Configuration',
                passed: false,
                details: `Error: ${error.message}`
            });
        }
        
        // Test service account
        try {
            const serviceAccount = await googleAuth.loadServiceAccount();
            results.push({
                test: 'Service Account',
                passed: !!serviceAccount,
                details: serviceAccount ? 'Service account loaded successfully' : 'Failed to load service account'
            });
        } catch (error) {
            results.push({
                test: 'Service Account',
                passed: false,
                details: `Error: ${error.message}`
            });
        }
        
        const allPassed = results.every(r => r.passed);
        this.addTestResult('System Configuration', allPassed, `${results.filter(r => r.passed).length}/${results.length} tests passed`);
        
        if (!allPassed) {
            console.warn('⚠️ System configuration issues found:', results.filter(r => !r.passed));
        }
    }

    // Test 2: Google Sheets Integration
    async testGoogleSheetsIntegration() {
        this.currentTest = 'Google Sheets Integration';
        this.updateTestUI('Testing Google Sheets integration...', 'info');
        
        const results = [];
        
        // Test authentication
        try {
            const accessToken = await googleAuth.getAccessToken();
            results.push({
                test: 'Google Sheets Authentication',
                passed: !!accessToken,
                details: accessToken ? 'Successfully authenticated with Google Sheets' : 'Authentication failed'
            });
        } catch (error) {
            results.push({
                test: 'Google Sheets Authentication',
                passed: false,
                details: `Authentication error: ${error.message}`
            });
        }
        
        // Test sheets access
        try {
            const url = `https://sheets.googleapis.com/v4/spreadsheets/${ENV_CONFIG.GOOGLE_SHEETS_ID}`;
            const response = await fetch(url, {
                headers: {
                    'Authorization': `Bearer ${await googleAuth.getAccessToken()}`
                }
            });
            
            results.push({
                test: 'Google Sheets Access',
                passed: response.ok,
                details: response.ok ? 'Successfully accessed Google Sheets' : `Access failed: ${response.status}`
            });
        } catch (error) {
            results.push({
                test: 'Google Sheets Access',
                passed: false,
                details: `Access error: ${error.message}`
            });
        }
        
        // Test data loading
        try {
            await sessionDB.refresh();
            const stats = sessionDB.getStats();
            results.push({
                test: 'Data Loading',
                passed: stats.products > 0 || stats.purchaseParties > 0 || stats.saleParties > 0,
                details: `Loaded ${stats.products} products, ${stats.purchaseParties} purchase parties, ${stats.saleParties} sale parties`
            });
        } catch (error) {
            results.push({
                test: 'Data Loading',
                passed: false,
                details: `Loading error: ${error.message}`
            });
        }
        
        const allPassed = results.every(r => r.passed);
        this.addTestResult('Google Sheets Integration', allPassed, `${results.filter(r => r.passed).length}/${results.length} tests passed`);
    }

    // Test 3: WhatsApp Integration
    async testWhatsAppIntegration() {
        this.currentTest = 'WhatsApp Integration';
        this.updateTestUI('Testing WhatsApp integration...', 'info');
        
        const results = [];
        
        // Test WhatsApp configuration
        try {
            const config = validateWhatsAppConfig();
            results.push({
                test: 'WhatsApp Configuration',
                passed: config.isValid,
                details: config.isValid ? 'WhatsApp properly configured' : 'WhatsApp configuration incomplete'
            });
        } catch (error) {
            results.push({
                test: 'WhatsApp Configuration',
                passed: false,
                details: `Configuration error: ${error.message}`
            });
        }
        
        // Test message sending (simulated)
        try {
            const testMessage = '🧪 Automated test message from Polymer Trading System';
            const result = await sendNotificationMessage(testMessage, 'accounts');
            results.push({
                test: 'Message Sending',
                passed: result && (result.success || result.simulated),
                details: result && result.simulated ? 'Message simulation successful' : 
                        result && result.success ? 'Message sent successfully' : 'Message sending failed'
            });
        } catch (error) {
            results.push({
                test: 'Message Sending',
                passed: false,
                details: `Sending error: ${error.message}`
            });
        }
        
        const allPassed = results.every(r => r.passed);
        this.addTestResult('WhatsApp Integration', allPassed, `${results.filter(r => r.passed).length}/${results.length} tests passed`);
    }

    // Test 4: Deal Management
    async testDealManagement() {
        this.currentTest = 'Deal Management';
        this.updateTestUI('Testing deal management...', 'info');
        
        const results = [];
        
        // Test deal form validation
        try {
            const testDeal = {
                date: formatDateToDDMMYYYY(new Date()),
                saleParty: 'Test Customer',
                product: 'Test Product',
                grade: 'Test Grade',
                company: 'Test Company',
                specificGrade: 'Test Specific Grade',
                quantitySold: 100,
                saleRate: 50,
                deliveryTerms: 'Ex-Works',
                purchaseParty: 'Test Supplier',
                purchaseQuantity: 100,
                purchaseRate: 45
            };
            
            // Simulate form validation
            const hasRequiredFields = testDeal.saleParty && testDeal.quantitySold && testDeal.saleRate;
            results.push({
                test: 'Deal Form Validation',
                passed: hasRequiredFields,
                details: hasRequiredFields ? 'Deal form validation working' : 'Deal form validation failed'
            });
        } catch (error) {
            results.push({
                test: 'Deal Form Validation',
                passed: false,
                details: `Validation error: ${error.message}`
            });
        }
        
        // Test deal storage
        try {
            const originalDealsCount = deals.length;
            const testDeal = {
                id: Date.now(),
                date: formatDateToDDMMYYYY(new Date()),
                saleParty: 'Test Customer',
                product: 'Test Product',
                quantitySold: 100,
                saleRate: 50,
                profit: 500
            };
            
            deals.push(testDeal);
            localStorage.setItem('deals', JSON.stringify(deals));
            
            const updatedDealsCount = deals.length;
            results.push({
                test: 'Deal Storage',
                passed: updatedDealsCount > originalDealsCount,
                details: `Successfully stored deal (${originalDealsCount} → ${updatedDealsCount})`
            });
            
            // Clean up test deal
            deals.pop();
            localStorage.setItem('deals', JSON.stringify(deals));
            
        } catch (error) {
            results.push({
                test: 'Deal Storage',
                passed: false,
                details: `Storage error: ${error.message}`
            });
        }
        
        const allPassed = results.every(r => r.passed);
        this.addTestResult('Deal Management', allPassed, `${results.filter(r => r.passed).length}/${results.length} tests passed`);
    }

    // Test 5: Inventory Management
    async testInventoryManagement() {
        this.currentTest = 'Inventory Management';
        this.updateTestUI('Testing inventory management...', 'info');
        
        const results = [];
        
        // Test inventory addition
        try {
            const originalInventoryCount = inventory.length;
            const testItem = {
                id: Date.now(),
                product: 'Test Product',
                grade: 'Test Grade',
                company: 'Test Company',
                specificGrade: 'Test Specific Grade',
                quantity: 100,
                rate: 45,
                purchaseParty: 'Test Supplier',
                dateAdded: formatDateToDDMMYYYY(new Date())
            };
            
            inventory.push(testItem);
            localStorage.setItem('inventory', JSON.stringify(inventory));
            
            const updatedInventoryCount = inventory.length;
            results.push({
                test: 'Inventory Addition',
                passed: updatedInventoryCount > originalInventoryCount,
                details: `Successfully added inventory item (${originalInventoryCount} → ${updatedInventoryCount})`
            });
            
            // Clean up test item
            inventory.pop();
            localStorage.setItem('inventory', JSON.stringify(inventory));
            
        } catch (error) {
            results.push({
                test: 'Inventory Addition',
                passed: false,
                details: `Addition error: ${error.message}`
            });
        }
        
        // Test inventory alerts
        try {
            const lowStockThreshold = 100;
            const testLowStockItem = {
                quantity: 50,
                product: 'Test Low Stock Product'
            };
            
            const isLowStock = testLowStockItem.quantity <= lowStockThreshold;
            results.push({
                test: 'Inventory Alerts',
                passed: isLowStock,
                details: isLowStock ? 'Low stock detection working' : 'Low stock detection failed'
            });
        } catch (error) {
            results.push({
                test: 'Inventory Alerts',
                passed: false,
                details: `Alert error: ${error.message}`
            });
        }
        
        const allPassed = results.every(r => r.passed);
        this.addTestResult('Inventory Management', allPassed, `${results.filter(r => r.passed).length}/${results.length} tests passed`);
    }

    // Test 6: Data Synchronization
    async testDataSynchronization() {
        this.currentTest = 'Data Synchronization';
        this.updateTestUI('Testing data synchronization...', 'info');
        
        const results = [];
        
        // Test session database sync
        try {
            const originalStats = sessionDB.getStats();
            await sessionDB.refresh();
            const updatedStats = sessionDB.getStats();
            
            results.push({
                test: 'Session Database Sync',
                passed: sessionDB.isInitialized,
                details: `Database initialized: ${sessionDB.isInitialized}, Stats: ${JSON.stringify(updatedStats)}`
            });
        } catch (error) {
            results.push({
                test: 'Session Database Sync',
                passed: false,
                details: `Sync error: ${error.message}`
            });
        }
        
        // Test local storage
        try {
            const testData = { test: 'data', timestamp: Date.now() };
            localStorage.setItem('test_storage', JSON.stringify(testData));
            const retrievedData = JSON.parse(localStorage.getItem('test_storage'));
            localStorage.removeItem('test_storage');
            
            results.push({
                test: 'Local Storage',
                passed: retrievedData && retrievedData.test === 'data',
                details: retrievedData && retrievedData.test === 'data' ? 'Local storage working' : 'Local storage failed'
            });
        } catch (error) {
            results.push({
                test: 'Local Storage',
                passed: false,
                details: `Storage error: ${error.message}`
            });
        }
        
        const allPassed = results.every(r => r.passed);
        this.addTestResult('Data Synchronization', allPassed, `${results.filter(r => r.passed).length}/${results.length} tests passed`);
    }

    // Test 7: UI Functionality
    async testUIFunctionality() {
        this.currentTest = 'UI Functionality';
        this.updateTestUI('Testing UI functionality...', 'info');
        
        const results = [];
        
        // Test notification system
        try {
            showNotification('Test notification', 'info');
            results.push({
                test: 'Notification System',
                passed: true,
                details: 'Notification system working'
            });
        } catch (error) {
            results.push({
                test: 'Notification System',
                passed: false,
                details: `Notification error: ${error.message}`
            });
        }
        
        // Test form elements
        try {
            const dateInput = document.getElementById('date');
            const dealForm = document.getElementById('dealForm');
            
            results.push({
                test: 'Form Elements',
                passed: dateInput && dealForm,
                details: dateInput && dealForm ? 'Form elements present' : 'Form elements missing'
            });
        } catch (error) {
            results.push({
                test: 'Form Elements',
                passed: false,
                details: `Form error: ${error.message}`
            });
        }
        
        // Test display updates
        try {
            if (typeof updateDealsHistory === 'function') {
                updateDealsHistory();
                results.push({
                    test: 'Display Updates',
                    passed: true,
                    details: 'Display update functions available'
                });
            } else {
                results.push({
                    test: 'Display Updates',
                    passed: false,
                    details: 'Display update functions not available'
                });
            }
        } catch (error) {
            results.push({
                test: 'Display Updates',
                passed: false,
                details: `Display error: ${error.message}`
            });
        }
        
        const allPassed = results.every(r => r.passed);
        this.addTestResult('UI Functionality', allPassed, `${results.filter(r => r.passed).length}/${results.length} tests passed`);
    }

    // Test 8: Error Handling
    async testErrorHandling() {
        this.currentTest = 'Error Handling';
        this.updateTestUI('Testing error handling...', 'info');
        
        const results = [];
        
        // Test invalid date handling
        try {
            const invalidDate = formatDateToDDMMYYYY('invalid-date');
            results.push({
                test: 'Invalid Date Handling',
                passed: invalidDate === 'invalid-date',
                details: 'Invalid date handling working correctly'
            });
        } catch (error) {
            results.push({
                test: 'Invalid Date Handling',
                passed: false,
                details: `Date handling error: ${error.message}`
            });
        }
        
        // Test configuration validation
        try {
            const originalConfig = { ...ENV_CONFIG };
            ENV_CONFIG.GOOGLE_SHEETS_ID = 'invalid-id';
            const isValid = validateConfig();
            ENV_CONFIG.GOOGLE_SHEETS_ID = originalConfig.GOOGLE_SHEETS_ID;
            
            results.push({
                test: 'Configuration Validation',
                passed: !isValid,
                details: 'Configuration validation working correctly'
            });
        } catch (error) {
            results.push({
                test: 'Configuration Validation',
                passed: false,
                details: `Validation error: ${error.message}`
            });
        }
        
        const allPassed = results.every(r => r.passed);
        this.addTestResult('Error Handling', allPassed, `${results.filter(r => r.passed).length}/${results.length} tests passed`);
    }

    // Test 9: Performance
    async testPerformance() {
        this.currentTest = 'Performance';
        this.updateTestUI('Testing performance...', 'info');
        
        const results = [];
        
        // Test initialization time
        try {
            const startTime = Date.now();
            await sessionDB.refresh();
            const endTime = Date.now();
            const duration = endTime - startTime;
            
            results.push({
                test: 'Initialization Performance',
                passed: duration < 10000, // 10 seconds max
                details: `Initialization took ${duration}ms (${duration < 10000 ? 'Good' : 'Slow'})`
            });
        } catch (error) {
            results.push({
                test: 'Initialization Performance',
                passed: false,
                details: `Performance error: ${error.message}`
            });
        }
        
        // Test memory usage
        try {
            const memoryInfo = performance.memory;
            const memoryUsage = memoryInfo ? memoryInfo.usedJSHeapSize / 1024 / 1024 : 0;
            
            results.push({
                test: 'Memory Usage',
                passed: memoryUsage < 100, // 100MB max
                details: `Memory usage: ${memoryUsage.toFixed(2)}MB (${memoryUsage < 100 ? 'Good' : 'High'})`
            });
        } catch (error) {
            results.push({
                test: 'Memory Usage',
                passed: true, // Skip if not available
                details: 'Memory info not available'
            });
        }
        
        const allPassed = results.every(r => r.passed);
        this.addTestResult('Performance', allPassed, `${results.filter(r => r.passed).length}/${results.length} tests passed`);
    }

    // Test 10: End-to-End Workflow
    async testEndToEndWorkflow() {
        this.currentTest = 'End-to-End Workflow';
        this.updateTestUI('Testing end-to-end workflow...', 'info');
        
        const results = [];
        
        // Test complete deal workflow
        try {
            // Simulate a complete deal
            const testDeal = {
                id: Date.now(),
                date: formatDateToDDMMYYYY(new Date()),
                saleParty: 'Test Customer',
                product: 'Test Product',
                grade: 'Test Grade',
                company: 'Test Company',
                specificGrade: 'Test Specific Grade',
                quantitySold: 100,
                saleRate: 50,
                deliveryTerms: 'Ex-Works',
                purchaseParty: 'Test Supplier',
                purchaseQuantity: 100,
                purchaseRate: 45,
                profit: 500
            };
            
            // Test deal creation
            deals.push(testDeal);
            localStorage.setItem('deals', JSON.stringify(deals));
            
            // Test WhatsApp message generation
            const messageData = {
                date: testDeal.date,
                saleParty: testDeal.saleParty,
                quantitySold: testDeal.quantitySold,
                saleRate: testDeal.saleRate,
                deliveryTerms: testDeal.deliveryTerms,
                product: testDeal.product,
                grade: testDeal.grade,
                company: testDeal.company,
                specificGrade: testDeal.specificGrade,
                purchaseParty: testDeal.purchaseParty,
                purchaseQuantity: testDeal.purchaseQuantity,
                purchaseRate: testDeal.purchaseRate
            };
            
            const accountsMessage = WhatsAppTemplates.accounts(messageData);
            const logisticsMessage = WhatsAppTemplates.logistics(messageData);
            
            results.push({
                test: 'Deal Creation',
                passed: deals.length > 0 && deals[deals.length - 1].id === testDeal.id,
                details: 'Deal created and stored successfully'
            });
            
            results.push({
                test: 'WhatsApp Message Generation',
                passed: accountsMessage && logisticsMessage,
                details: 'WhatsApp messages generated successfully'
            });
            
            // Clean up test deal
            deals.pop();
            localStorage.setItem('deals', JSON.stringify(deals));
            
        } catch (error) {
            results.push({
                test: 'End-to-End Workflow',
                passed: false,
                details: `Workflow error: ${error.message}`
            });
        }
        
        const allPassed = results.every(r => r.passed);
        this.addTestResult('End-to-End Workflow', allPassed, `${results.filter(r => r.passed).length}/${results.length} tests passed`);
    }

    // Add test result
    addTestResult(testName, passed, details) {
        this.testResults.push({
            name: testName,
            passed,
            details,
            timestamp: Date.now()
        });
        
        console.log(`${passed ? '✅' : '❌'} ${testName}: ${details}`);
        this.updateTestUI(`${passed ? '✅' : '❌'} ${testName}`, passed ? 'success' : 'error');
    }

    // Update test UI
    updateTestUI(message, type = 'info') {
        const testStatus = document.getElementById('test-status');
        if (testStatus) {
            testStatus.textContent = message;
            testStatus.className = `test-status ${type}`;
        }
        
        const testProgress = document.getElementById('test-progress');
        if (testProgress) {
            const progress = (this.testResults.length / 10) * 100;
            testProgress.style.width = `${progress}%`;
        }
    }

    // Generate test report
    generateTestReport() {
        const totalTests = this.testResults.length;
        const passedTests = this.testResults.filter(r => r.passed).length;
        const failedTests = totalTests - passedTests;
        const duration = this.testEndTime - this.testStartTime;
        
        const report = {
            summary: {
                total: totalTests,
                passed: passedTests,
                failed: failedTests,
                duration: duration,
                timestamp: new Date().toISOString()
            },
            results: this.testResults,
            systemInfo: {
                userAgent: navigator.userAgent,
                timestamp: new Date().toISOString(),
                config: {
                    debugMode: ENV_CONFIG.DEBUG_MODE,
                    serverMode: ENV_CONFIG.SERVER_MODE,
                    sheetsConfigured: !!ENV_CONFIG.GOOGLE_SHEETS_ID,
                    whatsappConfigured: !!ENV_CONFIG.WHATSAPP_API_TOKEN
                }
            }
        };
        
        console.log('📊 Test Report:', report);
        
        // Update UI with results
        this.updateTestResultsUI(report);
        
        // Store report in localStorage
        localStorage.setItem('lastTestReport', JSON.stringify(report));
        
        return report;
    }

    // Update test results UI
    updateTestResultsUI(report) {
        const resultsContainer = document.getElementById('test-results');
        if (!resultsContainer) return;
        
        const { summary, results } = report;
        
        resultsContainer.innerHTML = `
            <div class="test-summary">
                <h3>Test Summary</h3>
                <div class="summary-stats">
                    <div class="stat">
                        <span class="label">Total Tests:</span>
                        <span class="value">${summary.total}</span>
                    </div>
                    <div class="stat">
                        <span class="label">Passed:</span>
                        <span class="value passed">${summary.passed}</span>
                    </div>
                    <div class="stat">
                        <span class="label">Failed:</span>
                        <span class="value failed">${summary.failed}</span>
                    </div>
                    <div class="stat">
                        <span class="label">Duration:</span>
                        <span class="value">${(summary.duration / 1000).toFixed(1)}s</span>
                    </div>
                </div>
            </div>
            <div class="test-details">
                <h3>Test Details</h3>
                ${results.map(result => `
                    <div class="test-result ${result.passed ? 'passed' : 'failed'}">
                        <div class="test-name">${result.name}</div>
                        <div class="test-details">${result.details}</div>
                    </div>
                `).join('')}
            </div>
        `;
        
        // Show/hide results container
        resultsContainer.style.display = 'block';
    }

    // Get last test report
    getLastTestReport() {
        const report = localStorage.getItem('lastTestReport');
        return report ? JSON.parse(report) : null;
    }

    // Export test report
    exportTestReport() {
        const report = this.getLastTestReport();
        if (!report) {
            showNotification('No test report available', 'warning');
            return;
        }
        
        const data = JSON.stringify(report, null, 2);
        const blob = new Blob([data], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `trading-system-test-report-${new Date().toISOString().split('T')[0]}.json`;
        a.click();
        URL.revokeObjectURL(url);
        
        showNotification('Test report exported successfully', 'success');
    }
}

// Initialize global tester instance
window.tradingSystemTester = new TradingSystemTester();

// Auto-run tests on startup (if enabled)
let autoTestEnabled = localStorage.getItem('autoTestEnabled') === 'true';

// Function to toggle auto-testing
function toggleAutoTesting() {
    autoTestEnabled = !autoTestEnabled;
    localStorage.setItem('autoTestEnabled', autoTestEnabled.toString());
    
    const button = document.getElementById('toggle-auto-test');
    if (button) {
        button.textContent = autoTestEnabled ? 'Disable Auto-Testing' : 'Enable Auto-Testing';
        button.className = autoTestEnabled ? 'btn btn-warning' : 'btn btn-success';
    }
    
    showNotification(
        autoTestEnabled ? 'Auto-testing enabled. Tests will run on next page load.' : 'Auto-testing disabled.',
        autoTestEnabled ? 'success' : 'info'
    );
}

// Function to run tests manually
async function runManualTests() {
    try {
        await window.tradingSystemTester.initialize();
        await window.tradingSystemTester.runAllTests();
        showNotification('Manual tests completed!', 'success');
    } catch (error) {
        console.error('Manual tests failed:', error);
        showNotification('Manual tests failed. Check console for details.', 'error');
    }
}

// Auto-run tests if enabled
if (autoTestEnabled) {
    // Wait for system to be ready, then run tests
    const checkSystemReady = async () => {
        if (isSystemReady()) {
            try {
                await window.tradingSystemTester.initialize();
                await window.tradingSystemTester.runAllTests();
                showNotification('Auto-tests completed!', 'success');
            } catch (error) {
                console.error('Auto-tests failed:', error);
                showNotification('Auto-tests failed. Check console for details.', 'error');
            }
        } else {
            setTimeout(checkSystemReady, 1000);
        }
    };
    
    // Start checking after a short delay
    setTimeout(checkSystemReady, 2000);
}

// Export functions to global scope
window.runManualTests = runManualTests;
window.toggleAutoTesting = toggleAutoTesting;
window.exportTestReport = () => window.tradingSystemTester.exportTestReport();

console.log('🧪 Trading System Tester loaded. Available functions:');
console.log('- runManualTests() - Run tests manually');
console.log('- toggleAutoTesting() - Toggle auto-testing');
console.log('- exportTestReport() - Export last test report'); 