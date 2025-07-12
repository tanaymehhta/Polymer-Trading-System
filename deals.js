// Deal Management Functions

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

// Add deal to Google Sheets Main tab
async function addDealToSheets(dealData) {
    try {
        // Get current date for Sr.No generation
        const currentDate = new Date();
        
        // Generate Sr.No
        const srNo = `${currentDate.getFullYear()}${String(currentDate.getMonth() + 1).padStart(2, '0')}${String(currentDate.getDate()).padStart(2, '0')}_${Date.now().toString().slice(-4)}`;
        
        // Map the deal data to match your Google Sheets columns
        const dealRow = [
            '',                                      // Sr.No (A) - leave empty
            dealData.date,                            // Date (B)
            dealData.saleParty,                       // Sale Party (C)
            dealData.quantitySold,                    // Quantity Sold (kgs) (D)
            dealData.saleRate,                        // Rate (E)
            dealData.product,                         // Product (F)
            dealData.grade,                           // Grade (G)
            dealData.company,                         // Company (H)
            dealData.specificGrade,                   // Specific Grade (I)
            dealData.purchaseParty || '',             // Purchase Party (J)
            dealData.purchaseQuantity || 0,           // Purchase Quantity (kgs) (K)
            dealData.purchaseRate || 0                // Rate (L)
        ];

        // Get access token from service account
        const accessToken = await googleAuth.getAccessToken();

        const response = await fetch(
            `https://sheets.googleapis.com/v4/spreadsheets/${ENV_CONFIG.GOOGLE_SHEETS_ID}/values/${ENV_CONFIG.DEALS_SHEET_NAME}!A:L:append?valueInputOption=RAW`,
            {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${accessToken}`
                },
                body: JSON.stringify({
                    values: [dealRow]
                })
            }
        );
        
        if (response.ok) {
            console.log('✅ Deal logged to Google Sheets successfully');
            showNotification('Deal logged to Google Sheets successfully!', 'success');
            return true;
        } else {
            const errorData = await response.json();
            console.error('Google Sheets API Error:', errorData);
            throw new Error(`Failed to log deal: ${errorData.error?.message || 'Unknown error'}`);
        }
    } catch (error) {
        console.error('Error logging deal to Google Sheets:', error);
        showNotification(`Error logging deal to Google Sheets: ${error.message}`, 'error');
        return false;
    }
}

// Preview WhatsApp messages
function previewWhatsAppMessages() {
    const formData = new FormData(document.getElementById('dealForm'));
    const data = Object.fromEntries(formData);
    
    // Check if this is a purchase-only entry
    const hasSaleInfo = data.saleParty && data.quantitySold && data.saleRate;
    const hasPurchaseInfo = data.purchaseParty && data.purchaseQuantity && data.purchaseRate;
    
    if (!hasSaleInfo && hasPurchaseInfo) {
        showNotification('WhatsApp preview is only available for complete deals with sale information.', 'info');
        return;
    }
    
    // Validate required fields for complete deals
    if (!data.product || !data.quantitySold || !data.saleRate || !data.saleParty) {
        showNotification('Please fill in product, sale party, quantity, and rate first!', 'warning');
        return;
    }
    
    // Create data object for message templates
    const messageData = {
        date: data.date,
        saleParty: data.saleParty,
        quantitySold: data.quantitySold,
        saleRate: data.saleRate,
        deliveryTerms: data.deliveryTerms,
        saleComments: data.saleComments,
        product: data.product,
        grade: data.grade,
        company: data.company,
        specificGrade: data.specificGrade,
        purchaseParty: data.purchaseParty,
        purchaseQuantity: data.purchaseQuantity,
        purchaseRate: data.purchaseRate,
        finalComments: data.finalComments,
        warehouseInput: data.warehouseInput
    };
    
    // Generate messages using templates
    const accountsMessage = WhatsAppTemplates.accounts(messageData);
    const logisticsMessage = WhatsAppTemplates.logistics(messageData);
    
    document.getElementById('whatsapp-content-1').textContent = accountsMessage;
    document.getElementById('whatsapp-content-2').textContent = logisticsMessage;
    document.getElementById('whatsapp-preview-section').style.display = 'block';
}

// Handle deal form submission
function initializeDealForm() {
    const dealForm = document.getElementById('dealForm');
    if (!dealForm) return;
    
    dealForm.addEventListener('submit', async function(e) {
        e.preventDefault();

        // Checklist UI setup (always show)
        const checklist = document.getElementById('deal-tasks-checklist');
        if (checklist) {
            checklist.innerHTML = `
                <div id="task-register" style="margin-bottom:4px;">⬜ Registering deal...</div>
                <div id="task-whatsapp" style="margin-bottom:4px;">⬜ Sending WhatsApp message...</div>
                <div id="task-preview">⬜ Showing WhatsApp preview...</div>
            `;
        }

        let registerSuccess = false;
        let whatsappSuccess = false;
        let previewSuccess = false;

        // Step 1: Register Deal (existing logic)
        let validationFailed = false;
        let deal = null;
        try {
            const formData = new FormData(this);
            const data = Object.fromEntries(formData);
            
            // Check entry type
            const hasSaleInfo = data.saleParty && data.quantitySold && data.saleRate;
            const hasPurchaseInfo = data.purchaseParty && data.purchaseQuantity && data.purchaseRate;
            
            // Purchase-only entry (add to inventory)
            if (!hasSaleInfo && hasPurchaseInfo) {
                if (!data.product || !data.purchaseQuantity || !data.purchaseRate || !data.purchaseParty) {
                    if (checklist) document.getElementById('task-register').innerHTML = '❌ Purchase registration failed (Product, Purchase Party, Quantity, and Rate required)';
                    showNotification('For purchase-only entries: Product, Purchase Party, Quantity, and Rate are required!', 'error');
                    validationFailed = true;
                    return;
                }
                
                // Add to inventory
                const inventoryItem = {
                    id: Date.now(),
                    product: data.product,
                    grade: data.grade,
                    company: data.company,
                    specificGrade: data.specificGrade,
                    quantity: parseFloat(data.purchaseQuantity),
                    rate: parseFloat(data.purchaseRate),
                    purchaseParty: data.purchaseParty,
                    dateAdded: formatDateToDDMMYYYY(data.date)
                };
                
                inventory.push(inventoryItem);
                localStorage.setItem('inventory', JSON.stringify(inventory));
                sessionDB.inventory = inventory;
                updateInventoryDisplay();
                showNotification('Purchase added to inventory successfully!', 'success');
                registerSuccess = true;
                if (checklist) document.getElementById('task-register').innerHTML = '✅ Purchase added to inventory';
                resetDealForm();
                return;
            }
            
            // Sale-only entry (not allowed)
            if (hasSaleInfo && !hasPurchaseInfo) {
                if (checklist) document.getElementById('task-register').innerHTML = '❌ Deal registration failed (Purchase information required)';
                showNotification('Sale-only entries are not allowed. Please provide purchase information or select from inventory.', 'error');
                validationFailed = true;
                return;
            }
            
            // Complete deal validation
            if (!data.saleParty) {
                if (checklist) document.getElementById('task-register').innerHTML = '❌ Deal registration failed (Sale Party required)';
                showNotification('Sale Party is required!', 'error');
                validationFailed = true;
                return;
            }
            
            if (!data.deliveryTerms) {
                if (checklist) document.getElementById('task-register').innerHTML = '❌ Deal registration failed (Delivery Terms required)';
                showNotification('Delivery Terms is required!', 'error');
                validationFailed = true;
                return;
            }
            
            // Calculate profit
            const saleValue = parseFloat(data.quantitySold) * parseFloat(data.saleRate);
            const purchaseValue = parseFloat(data.purchaseQuantity || data.quantitySold) * parseFloat(data.purchaseRate || 0);
            const profit = saleValue - purchaseValue;
            
            // Create deal object with all necessary data
            deal = {
                id: Date.now(),
                date: formatDateToDDMMYYYY(data.date),
                saleParty: data.saleParty,
                product: data.product,
                grade: data.grade,
                company: data.company,
                specificGrade: data.specificGrade,
                quantitySold: parseFloat(data.quantitySold),
                saleRate: parseFloat(data.saleRate),
                deliveryTerms: data.deliveryTerms,
                saleComments: data.saleComments,
                saleSource: data.saleSource,
                purchaseParty: data.purchaseParty,
                purchaseQuantity: parseFloat(data.purchaseQuantity || data.quantitySold),
                purchaseRate: parseFloat(data.purchaseRate || 0),
                purchaseComments: data.purchaseComments,
                finalComments: data.finalComments,
                warehouseInput: data.warehouseInput,
                profit: profit,
                saleValue: saleValue,
                purchaseValue: purchaseValue
            };
            
            // Handle inventory if selling from inventory
            if (data.saleSource === 'inventory' && window.selectedInventoryItem !== undefined) {
                const inventoryItem = inventory[window.selectedInventoryItem];
                if (inventoryItem.quantity >= parseFloat(data.quantitySold)) {
                    inventoryItem.quantity -= parseFloat(data.quantitySold);
                    if (inventoryItem.quantity === 0) {
                        inventory.splice(window.selectedInventoryItem, 1);
                    }
                    deal.purchaseParty = inventoryItem.purchaseParty;
                    deal.purchaseRate = inventoryItem.rate;
                    deal.purchaseQuantity = parseFloat(data.quantitySold);
                    deal.purchaseValue = parseFloat(data.quantitySold) * inventoryItem.rate;
                    deal.profit = deal.saleValue - deal.purchaseValue;
                } else {
                    showNotification('Insufficient inventory quantity!', 'error');
                    return;
                }
            } else if (data.saleSource === 'new' && parseFloat(data.purchaseQuantity) > parseFloat(data.quantitySold)) {
                // Add excess to inventory
                const excessQuantity = parseFloat(data.purchaseQuantity) - parseFloat(data.quantitySold);
                const inventoryItem = {
                    id: Date.now(),
                    product: data.product,
                    grade: data.grade,
                    company: data.company,
                    specificGrade: data.specificGrade,
                    quantity: excessQuantity,
                    rate: parseFloat(data.purchaseRate),
                    purchaseParty: data.purchaseParty,
                    dateAdded: formatDateToDDMMYYYY(data.date)
                };
                inventory.push(inventoryItem);
            }
            
            // Save deal locally
            deals.push(deal);
            localStorage.setItem('deals', JSON.stringify(deals));
            localStorage.setItem('inventory', JSON.stringify(inventory));
            sessionDB.deals = deals;
            sessionDB.inventory = inventory;
            await addDealToSheets(deal);
            updateDealsHistory();
            updateInventoryDisplay();
            updateBackButtonVisibility();
            registerSuccess = true;
            if (checklist) document.getElementById('task-register').innerHTML = '✅ Deal registered';
        } catch (err) {
            if (checklist) document.getElementById('task-register').innerHTML = '❌ Deal registration failed';
        }

        // Step 2: Send WhatsApp automatically (only for complete deals)
        if (deal && deal.saleParty) {
            try {
                // Prepare WhatsApp messages using WhatsAppTemplates
                const messageData = {
                    date: deal.date,
                    saleParty: deal.saleParty,
                    quantitySold: deal.quantitySold,
                    saleRate: deal.saleRate,
                    deliveryTerms: deal.deliveryTerms,
                    saleComments: deal.saleComments,
                    product: deal.product,
                    grade: deal.grade,
                    company: deal.company,
                    specificGrade: deal.specificGrade,
                    purchaseParty: deal.purchaseParty,
                    purchaseQuantity: deal.purchaseQuantity,
                    purchaseRate: deal.purchaseRate,
                    finalComments: deal.finalComments,
                    warehouseInput: deal.warehouseInput
                };
                const accountsMessage = WhatsAppTemplates.accounts(messageData);
                const logisticsMessage = WhatsAppTemplates.logistics(messageData);
                document.getElementById('whatsapp-content-1').textContent = accountsMessage;
                document.getElementById('whatsapp-content-2').textContent = logisticsMessage;
                // Send WhatsApp messages
                if (typeof sendWhatsAppMessages === 'function') {
                    await new Promise((resolve) => {
                        // Patch sendWhatsAppMessages to resolve after sending
                        const origShowNotification = window.showNotification;
                        window.showNotification = function(msg, type) {
                            if (msg && msg.toLowerCase().includes('whatsapp')) {
                                resolve();
                            }
                            origShowNotification.apply(this, arguments);
                        };
                        sendWhatsAppMessages();
                    });
                }
                whatsappSuccess = true;
                if (checklist) document.getElementById('task-whatsapp').innerHTML = '✅ WhatsApp sent';
            } catch (err) {
                if (checklist) document.getElementById('task-whatsapp').innerHTML = '❌ WhatsApp failed';
            }
        } else {
            if (checklist) document.getElementById('task-whatsapp').innerHTML = '⏭️ WhatsApp skipped (purchase-only entry)';
            whatsappSuccess = true;
        }

        // Step 3: Show WhatsApp preview (only for complete deals)
        if (deal && deal.saleParty) {
            try {
                document.getElementById('whatsapp-preview-section').style.display = 'block';
                previewSuccess = true;
                if (checklist) document.getElementById('task-preview').innerHTML = '✅ WhatsApp preview shown';
            } catch (err) {
                if (checklist) document.getElementById('task-preview').innerHTML = '❌ WhatsApp preview failed';
            }
        } else {
            if (checklist) document.getElementById('task-preview').innerHTML = '⏭️ WhatsApp preview skipped (purchase-only entry)';
            previewSuccess = true;
        }

        // Reset form only if deal registered
        if (registerSuccess) {
            resetDealForm();
        }
    });
}

// Reset deal form
function resetDealForm() {
    const form = document.getElementById('dealForm');
    if (!form) return;
    
    form.reset();
    document.getElementById('date').valueAsDate = new Date();
    
    // Hide WhatsApp preview
    const whatsappSection = document.getElementById('whatsapp-preview-section');
    if (whatsappSection) {
        whatsappSection.style.display = 'none';
    }
    
    // Reset radio groups
    document.querySelectorAll('.radio-group').forEach(group => group.classList.remove('selected'));
    
    // Hide inventory selection
    const inventorySelection = document.getElementById('inventory-selection');
    if (inventorySelection) {
        inventorySelection.classList.remove('show');
    }
    
    // Show purchase details
    const purchaseDetails = document.getElementById('purchase-details');
    if (purchaseDetails) {
        purchaseDetails.style.display = 'grid';
    }
    
    // Clear selected inventory
    window.selectedInventoryItem = undefined;
    
    // Reset auto-filled fields
    ['grade', 'company', 'specificGrade'].forEach(fieldId => {
        const field = document.getElementById(fieldId);
        if (field) {
            field.value = '';
            field.readOnly = false;
            field.style.backgroundColor = '#fafafa';
            field.style.cursor = 'text';
        }
    });
}

// Load deals from local storage
function loadDealsFromStorage() {
    try {
        const storedDeals = localStorage.getItem('deals');
        const storedInventory = localStorage.getItem('inventory');
        
        deals = storedDeals ? JSON.parse(storedDeals) : [];
        inventory = storedInventory ? JSON.parse(storedInventory) : [];
        
        console.log(`📊 Loaded ${deals.length} deals and ${inventory.length} inventory items from local storage`);
        
        // Show/hide back button based on whether there are deals
        updateBackButtonVisibility();
    } catch (error) {
        console.warn('Failed to load deals from storage:', error);
        deals = [];
        inventory = [];
    }
}

// Update back button visibility
function updateBackButtonVisibility() {
    const backButton = document.getElementById('back-button');
    if (backButton) {
        if (deals.length > 0) {
            backButton.style.display = 'inline-block';
            backButton.title = `Restore data from last deal (${deals.length} total deals)`;
        } else {
            backButton.style.display = 'none';
        }
    }
}

// Restore last deal data to form
function restoreLastDeal() {
    if (deals.length === 0) {
        showNotification('No previous deals found!', 'warning');
        return;
    }
    
    const lastDeal = deals[deals.length - 1];
    const form = document.getElementById('dealForm');
    
    if (!form) {
        showNotification('Form not found!', 'error');
        return;
    }
    
    // Populate form fields with last deal data
    const fields = {
        'date': lastDeal.date,
        'saleParty': lastDeal.saleParty,
        'quantitySold': lastDeal.quantitySold,
        'saleRate': lastDeal.saleRate,
        'deliveryTerms': lastDeal.deliveryTerms,
        'saleComments': lastDeal.saleComments,
        'product': lastDeal.product,
        'grade': lastDeal.grade,
        'company': lastDeal.company,
        'specificGrade': lastDeal.specificGrade,
        'purchaseParty': lastDeal.purchaseParty,
        'purchaseQuantity': lastDeal.purchaseQuantity,
        'purchaseRate': lastDeal.purchaseRate,
        'purchaseComments': lastDeal.purchaseComments,
        'finalComments': lastDeal.finalComments,
        'warehouseInput': lastDeal.warehouseInput
    };
    
    // Set form values
    Object.keys(fields).forEach(fieldName => {
        const field = form.querySelector(`[name="${fieldName}"]`);
        if (field && fields[fieldName] !== undefined && fields[fieldName] !== null) {
            field.value = fields[fieldName];
        }
    });
    
    // Set sale source radio button
    if (lastDeal.saleSource) {
        const radioInput = form.querySelector(`input[name="saleSource"][value="${lastDeal.saleSource}"]`);
        if (radioInput) {
            radioInput.checked = true;
            const radioGroup = radioInput.closest('.radio-group');
            if (radioGroup) {
                radioGroup.classList.add('selected');
            }
        }
    }
    
    // Handle inventory selection if it was from inventory
    if (lastDeal.saleSource === 'inventory') {
        const inventorySelection = document.getElementById('inventory-selection');
        const purchaseDetails = document.getElementById('purchase-details');
        
        if (inventorySelection) {
            inventorySelection.classList.add('show');
        }
        if (purchaseDetails) {
            purchaseDetails.style.display = 'none';
        }
        
        // Update inventory list
        updateInventoryList();
    } else {
        const inventorySelection = document.getElementById('inventory-selection');
        const purchaseDetails = document.getElementById('purchase-details');
        
        if (inventorySelection) {
            inventorySelection.classList.remove('show');
        }
        if (purchaseDetails) {
            purchaseDetails.style.display = 'grid';
        }
    }
    
    // Update product selection to trigger auto-fill
    updateProductSelection();
    
    showNotification('Last deal data restored to form!', 'success');
}
