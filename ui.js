// UI Management Functions

// Global variables
let deals = [];
let inventory = [];

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

// Tab switching functionality
function switchTab(tabName) {
    // Hide all tab contents
    const contents = document.querySelectorAll('.tab-content');
    contents.forEach(content => content.classList.remove('active'));
    
    // Remove active class from all tabs
    const tabs = document.querySelectorAll('.tab');
    tabs.forEach(tab => tab.classList.remove('active'));
    
    // Show selected tab content
    document.getElementById(tabName).classList.add('active');
    
    // Add active class to clicked tab
    event.target.classList.add('active');
}

// Auto-fill product information based on selection
function updateProductSelection() {
    const productSelect = document.getElementById('product');
    const gradeInput = document.getElementById('grade');
    const companyInput = document.getElementById('company');
    const specificGradeInput = document.getElementById('specificGrade');
    
    const selectedProduct = productSelect.value;
    
    if (selectedProduct && sessionDB.getProduct(selectedProduct)) {
        const productData = sessionDB.getProduct(selectedProduct);
        console.log('DEBUG productData:', productData); // Debug log
        // Auto-fill and make read-only
        gradeInput.value = productData.grade;
        gradeInput.readOnly = true;
        gradeInput.style.backgroundColor = '#f0f9ff';
        gradeInput.style.cursor = 'not-allowed';
        
        companyInput.value = productData.company;
        companyInput.readOnly = true;
        companyInput.style.backgroundColor = '#f0f9ff';
        companyInput.style.cursor = 'not-allowed';
        
        specificGradeInput.value = productData.specificGrade;
        specificGradeInput.readOnly = true;
        specificGradeInput.style.backgroundColor = '#f0f9ff';
        specificGradeInput.style.cursor = 'not-allowed';
    } else {
        // Clear and make editable if no product selected
        gradeInput.value = '';
        gradeInput.readOnly = false;
        gradeInput.style.backgroundColor = '#fafafa';
        gradeInput.style.cursor = 'text';
        
        companyInput.value = '';
        companyInput.readOnly = false;
        companyInput.style.backgroundColor = '#fafafa';
        companyInput.style.cursor = 'text';
        
        specificGradeInput.value = '';
        specificGradeInput.readOnly = false;
        specificGradeInput.style.backgroundColor = '#fafafa';
        specificGradeInput.style.cursor = 'text';
    }
}

// Update product dropdown with loaded data
function updateProductDropdown() {
    const productSelect = document.getElementById('product');
    if (!productSelect) return;
    
    productSelect.innerHTML = '<option value="">Select Product Code</option>';
    
    const products = sessionDB.getAllProducts();
    Object.keys(products).sort().forEach(productCode => {
        const option = document.createElement('option');
        option.value = productCode;
        option.textContent = productCode;
        productSelect.appendChild(option);
    });
}

// Update Sale Party dropdown with loaded data
function updateSalePartyDropdown() {
    const salePartySelect = document.getElementById('saleParty');
    if (!salePartySelect) return;
    
    // Clear existing options except the placeholder
    salePartySelect.innerHTML = '<option value="">Select Customer</option>';
    
    const saleParties = sessionDB.getAllSaleParties();
    Object.keys(saleParties).sort().forEach(partyName => {
        const option = document.createElement('option');
        option.value = partyName;
        option.textContent = partyName;
        salePartySelect.appendChild(option);
    });
}

// Update Purchase Party dropdown with loaded data
function updatePurchasePartyDropdown() {
    const purchasePartySelect = document.getElementById('purchaseParty');
    if (!purchasePartySelect) return;
    
    // Clear existing options except the placeholder
    purchasePartySelect.innerHTML = '<option value="">Select Supplier</option>';
    
    const purchaseParties = sessionDB.getAllPurchaseParties();
    Object.keys(purchaseParties).sort().forEach(partyName => {
        const option = document.createElement('option');
        option.value = partyName;
        option.textContent = partyName;
        purchasePartySelect.appendChild(option);
    });
}

// Sale source selection
function selectSaleSource(source) {
    const radioGroups = document.querySelectorAll('.radio-group');
    radioGroups.forEach(group => group.classList.remove('selected'));
    
    const selectedGroup = event.currentTarget;
    selectedGroup.classList.add('selected');
    
    const radioInput = selectedGroup.querySelector('input[type="radio"]');
    radioInput.checked = true;
    
    const inventorySelection = document.getElementById('inventory-selection');
    const purchaseDetails = document.getElementById('purchase-details');
    
    if (source === 'inventory') {
        inventorySelection.classList.add('show');
        purchaseDetails.style.display = 'none';
        updateInventoryList();
    } else {
        inventorySelection.classList.remove('show');
        purchaseDetails.style.display = 'grid';
    }
}

// Update inventory list for selection
function updateInventoryList() {
    const inventoryList = document.getElementById('inventory-list');
    if (!inventoryList) return;
    
    inventoryList.innerHTML = '';
    
    inventory.forEach((item, index) => {
        const div = document.createElement('div');
        div.className = 'inventory-item';
        div.onclick = () => selectInventoryItem(index);
        div.innerHTML = `
            <strong>${item.product} - ${item.grade}</strong><br>
            <small>${item.company} - ${item.specificGrade}</small><br>
            <small>Available: ${item.quantity} kgs @ ₹${item.rate}/kg</small>
        `;
        inventoryList.appendChild(div);
    });
}

// Select inventory item
function selectInventoryItem(index) {
    const inventoryItems = document.querySelectorAll('.inventory-item');
    inventoryItems.forEach(item => item.classList.remove('selected'));
    
    if (inventoryItems[index]) {
        inventoryItems[index].classList.add('selected');
        window.selectedInventoryItem = index;
    }
}

// Update deals history display
function updateDealsHistory() {
    const tbody = document.getElementById('deals-table-body');
    if (!tbody) return;
    
    tbody.innerHTML = '';
    
    deals.slice().reverse().forEach((deal, idx) => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${formatDateToDDMMYYYY(deal.date)}</td>
            <td>${deal.saleParty || 'N/A'}</td>
            <td>${deal.product}</td>
            <td>${deal.grade}</td>
            <td>${deal.company}</td>
            <td>${deal.quantitySold} kgs</td>
            <td>₹${deal.saleRate}/kg</td>
            <td>${deal.purchaseParty || 'N/A'}</td>
            <td>₹${deal.purchaseRate || 0}/kg</td>
            <td style="color: ${deal.profit >= 0 ? 'green' : 'red'}">₹${deal.profit.toLocaleString()}</td>
            <td>
                <button onclick="editDeal(${deals.length - 1 - idx})" style="background: #6366f1; color: white; border: none; padding: 6px 12px; border-radius: 6px; cursor: pointer; margin-right: 6px;">Edit</button>
                <button onclick="deleteDeal(${deals.length - 1 - idx})" style="background: #dc2626; color: white; border: none; padding: 6px 12px; border-radius: 6px; cursor: pointer;">Delete</button>
            </td>
        `;
        tbody.appendChild(row);
    });
}

function editDeal(index) {
    // Switch to Deal Registration tab
    switchTab('deal-registration');
    // Fill the form with the selected deal's data
    const deal = deals[index];
    const form = document.getElementById('dealForm');
    if (!form || !deal) return;
    const fields = {
        'date': deal.date,
        'saleParty': deal.saleParty,
        'quantitySold': deal.quantitySold,
        'saleRate': deal.saleRate,
        'deliveryTerms': deal.deliveryTerms,
        'saleComments': deal.saleComments,
        'product': deal.product,
        'grade': deal.grade,
        'company': deal.company,
        'specificGrade': deal.specificGrade,
        'purchaseParty': deal.purchaseParty,
        'purchaseQuantity': deal.purchaseQuantity,
        'purchaseRate': deal.purchaseRate,
        'purchaseComments': deal.purchaseComments,
        'finalComments': deal.finalComments,
        'warehouseInput': deal.warehouseInput
    };
    Object.keys(fields).forEach(fieldName => {
        const field = form.querySelector(`[name="${fieldName}"]`);
        if (field && fields[fieldName] !== undefined && fields[fieldName] !== null) {
            field.value = fields[fieldName];
        }
    });
    // Set sale source radio button
    if (deal.saleSource) {
        const radioInput = form.querySelector(`input[name="saleSource"][value="${deal.saleSource}"]`);
        if (radioInput) {
            radioInput.checked = true;
            const radioGroup = radioInput.closest('.radio-group');
            if (radioGroup) {
                radioGroup.classList.add('selected');
            }
        }
    }
    // Handle inventory selection if it was from inventory
    if (deal.saleSource === 'inventory') {
        const inventorySelection = document.getElementById('inventory-selection');
        const purchaseDetails = document.getElementById('purchase-details');
        if (inventorySelection) {
            inventorySelection.classList.add('show');
        }
        if (purchaseDetails) {
            purchaseDetails.style.display = 'none';
        }
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
    updateProductSelection();
    showNotification('Deal data loaded for editing. Update and re-register as needed.', 'info');
}

function deleteDeal(index) {
    if (confirm('Are you sure you want to delete this deal?')) {
        deals.splice(index, 1);
        localStorage.setItem('deals', JSON.stringify(deals));
        updateDealsHistory();
        showNotification('Deal deleted successfully!', 'success');
    }
}

// Update inventory display
function updateInventoryDisplay() {
    const inventoryGrid = document.getElementById('inventory-grid');
    if (!inventoryGrid) return;
    
    inventoryGrid.innerHTML = '';
    
    inventory.forEach((item, index) => {
        const card = document.createElement('div');
        card.className = 'inventory-card';
        card.innerHTML = `
            <h4>${item.product} - ${item.grade}</h4>
            <p><strong>Company:</strong> ${item.company}</p>
            <p><strong>Grade:</strong> ${item.specificGrade}</p>
            <p><strong>Quantity:</strong> ${item.quantity} kgs</p>
            <p><strong>Rate:</strong> ₹${item.rate}/kg</p>
            <p><strong>Total Value:</strong> ₹${(item.quantity * item.rate).toLocaleString()}</p>
            <p><strong>Supplier:</strong> ${item.purchaseParty}</p>
            <p><strong>Date Added:</strong> ${formatDateToDDMMYYYY(item.dateAdded)}</p>
            <button onclick="removeInventoryItem(${index})" 
                style="background: #dc2626; color: white; border: none; padding: 8px 16px; border-radius: 6px; cursor: pointer; margin-top: 10px;">
                Remove
            </button>
        `;
        inventoryGrid.appendChild(card);
    });
}

// Remove inventory item
function removeInventoryItem(index) {
    if (confirm('Are you sure you want to remove this inventory item?')) {
        inventory.splice(index, 1);
        localStorage.setItem('inventory', JSON.stringify(inventory));
        updateInventoryDisplay();
        showNotification('Inventory item removed successfully!', 'success');
    }
}

// Update products database display
function updateProductsDatabase() {
    const productsGrid = document.getElementById('products-grid');
    if (!productsGrid) return;
    
    productsGrid.innerHTML = '';
    
    const products = sessionDB.getAllProducts();
    Object.keys(products).forEach(productCode => {
        const product = products[productCode];
        const card = document.createElement('div');
        card.className = 'inventory-card';
        card.innerHTML = `
            <h4>${productCode}</h4>
            <p><strong>Grade:</strong> ${product.grade}</p>
            <p><strong>Company:</strong> ${product.company}</p>
            <p><strong>Specific Grade:</strong> ${product.specificGrade}</p>
            <p style="font-size: 0.8em; color: #666;">
                <strong>Last Updated:</strong> 
                ${product.lastUpdated ? formatDateToDDMMYYYY(new Date(product.lastUpdated)) : 'Unknown'}
            </p>
        `;
        productsGrid.appendChild(card);
    });
    // Hide table view if visible
    const tableContainer = document.getElementById('products-table-container');
    const btn = document.getElementById('toggle-products-table');
    if (tableContainer && btn) {
        tableContainer.style.display = 'none';
        productsGrid.style.display = 'block';
        btn.textContent = '📋 View as Table';
    }
}

// Show add inventory form
function showAddInventoryForm() {
    const form = prompt(`Add Inventory Item (format: Product,Grade,Company,SpecificGrade,Quantity,Rate,Supplier)
Example: PP,Homopolymer,Reliance,H110MA,1000,85,ABC Suppliers`);
    
    if (form) {
        const [product, grade, company, specificGrade, quantity, rate, supplier] = form.split(',');
        
        if (product && grade && company && specificGrade && quantity && rate && supplier) {
            const inventoryItem = {
                id: Date.now(),
                product: product.trim(),
                grade: grade.trim(),
                company: company.trim(),
                specificGrade: specificGrade.trim(),
                quantity: parseFloat(quantity.trim()),
                rate: parseFloat(rate.trim()),
                purchaseParty: supplier.trim(),
                dateAdded: formatDateToDDMMYYYY(new Date())
            };
            
            inventory.push(inventoryItem);
            localStorage.setItem('inventory', JSON.stringify(inventory));
            updateInventoryDisplay();
            showNotification('Inventory item added successfully!', 'success');
        } else {
            showNotification('Invalid format! Please use the correct format.', 'error');
        }
    }
}

// Show add product form
function showAddProductForm() {
    const productCode = prompt(`Add New Product (format: ProductCode,Grade,Company,SpecificGrade)
Example: GRPLON30GF,30% Glass Filled Nylon,GRP,Nylon`);
    
    if (productCode) {
        const [product, grade, company, specificGrade] = productCode.split(',');
        
        if (product && grade && company && specificGrade) {
            const newProduct = {
                product: product.trim(),
                grade: grade.trim(),
                company: company.trim(),
                specificGrade: specificGrade.trim()
            };
            
            // Add via session database (handles sync automatically)
            sessionDB.addProduct(newProduct);
            
        } else {
            showNotification('Invalid format! Please use: ProductCode,Grade,Company,SpecificGrade', 'error');
        }
    }
}

// Show system statistics
function showSystemStats() {
    const stats = sessionDB.getStats();
    const lastSync = stats.lastSyncTime ? formatDateToDDMMYYYY(new Date(stats.lastSyncTime)) : 'Never';
    
    const statsMessage = `🖥️ SYSTEM STATISTICS 🖥️

📦 Products in Database: ${stats.products}
📊 Total Deals: ${stats.deals}
📋 Inventory Items: ${stats.inventory}
⏳ Pending Updates: ${stats.pendingUpdates}

🔄 Last Sync: ${lastSync}
🟢 System Status: ${stats.isInitialized ? 'Active' : 'Initializing'}

📈 Memory Usage: ${Object.keys(sessionDB.products).length} products loaded
🔗 Google Sheets: Connected
💾 Local Storage: Active`;

    alert(statsMessage);
}

// Add system status indicator
function addSystemStatusIndicator() {
    const header = document.querySelector('.header');
    if (!header) return;
    
    const statusDiv = document.createElement('div');
    statusDiv.id = 'system-status';
    
    updateSystemStatus();
    header.appendChild(statusDiv);
    
    // Update status every 30 seconds
    setInterval(updateSystemStatus, 30000);
}

// Update system status display
function updateSystemStatus() {
    const statusDiv = document.getElementById('system-status');
    if (!statusDiv) return;
    
    const stats = sessionDB.getStats();
    const lastSync = stats.lastSyncTime ? formatDateToDDMMYYYY(new Date(stats.lastSyncTime)) : 'Never';
    
    statusDiv.innerHTML = `
        <div>
            <span>🟢 System Active</span> | 
            <span>📦 ${stats.products} Products</span> | 
            <span>📊 ${stats.deals} Deals</span> | 
            <span>📋 ${stats.inventory} Inventory Items</span>
        </div>
        <div>
            <span>🔄 Last Sync: ${lastSync}</span>
            ${stats.pendingUpdates > 0 ? `| <span style="color: #fbbf24;">⏳ ${stats.pendingUpdates} Pending</span>` : ''}
        </div>
    `;
}

// Show notification
function showNotification(message, type) {
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.classList.add('show');
    }, 100);
    
    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => {
            if (notification.parentNode) {
                document.body.removeChild(notification);
            }
        }, 300);
    }, 3000);
}

// After sessionDB is initialized, update the Sale Party dropdown
if (typeof sessionDB !== 'undefined' && sessionDB.isInitialized) {
    updateSalePartyDropdown();
    updatePurchasePartyDropdown();
}

// --- Product Autocomplete Logic ---
let productList = [];
let filteredProducts = [];
let productDropdownVisible = false;
let productDropdownSelectedIndex = -1;

function getProductList() {
    // Get all product codes from sessionDB
    return Object.keys(sessionDB.getAllProducts());
}

function handleProductInput() {
    const input = document.getElementById('product');
    const dropdown = document.getElementById('product-dropdown');
    const value = input.value.trim();
    productList = getProductList();
    filteredProducts = value ? productList.filter(p => p.toLowerCase().includes(value.toLowerCase())) : productList.slice();
    // If no match, add create new option
    let showCreate = value && !productList.some(p => p.toLowerCase() === value.toLowerCase());
    let html = '';
    filteredProducts.forEach((p, i) => {
        html += `<div class="${i === productDropdownSelectedIndex ? 'selected' : ''}" onclick="selectProductFromDropdown('${p}')">${p}</div>`;
    });
    if (showCreate) {
        html += `<div class="create-new" style="color:#2563eb;font-weight:500;" onclick="openNewProductModal('${value}')">➕ Create new product: "${value}"</div>`;
    }
    dropdown.innerHTML = html;
    dropdown.style.display = html ? 'block' : 'none';
    productDropdownVisible = !!html;
    productDropdownSelectedIndex = -1;
}

function showProductDropdown() {
    handleProductInput();
}

document.addEventListener('click', function(e) {
    const dropdown = document.getElementById('product-dropdown');
    const input = document.getElementById('product');
    if (!dropdown.contains(e.target) && e.target !== input) {
        dropdown.style.display = 'none';
        productDropdownVisible = false;
    }
});

document.getElementById('product').addEventListener('keydown', function(e) {
    if (!productDropdownVisible) return;
    if (e.key === 'ArrowDown') {
        productDropdownSelectedIndex = Math.min(productDropdownSelectedIndex + 1, filteredProducts.length - 1);
        updateProductDropdownHighlight();
        e.preventDefault();
    } else if (e.key === 'ArrowUp') {
        productDropdownSelectedIndex = Math.max(productDropdownSelectedIndex - 1, 0);
        updateProductDropdownHighlight();
        e.preventDefault();
    } else if (e.key === 'Enter') {
        if (productDropdownSelectedIndex >= 0 && filteredProducts[productDropdownSelectedIndex]) {
            selectProductFromDropdown(filteredProducts[productDropdownSelectedIndex]);
        } else {
            // If create new is visible and selected
            const input = document.getElementById('product');
            const value = input.value.trim();
            if (value && !productList.some(p => p.toLowerCase() === value.toLowerCase())) {
                openNewProductModal(value);
            }
        }
        document.getElementById('product-dropdown').style.display = 'none';
        productDropdownVisible = false;
        e.preventDefault();
    }
});

function updateProductDropdownHighlight() {
    const dropdown = document.getElementById('product-dropdown');
    const items = dropdown.querySelectorAll('div');
    items.forEach((item, idx) => {
        if (idx === productDropdownSelectedIndex) {
            item.classList.add('selected');
        } else {
            item.classList.remove('selected');
        }
    });
}

function selectProductFromDropdown(productCode) {
    document.getElementById('product').value = productCode;
    document.getElementById('product-dropdown').style.display = 'none';
    productDropdownVisible = false;
    updateProductSelection();
}

// --- Modal Logic for New Product ---
function openNewProductModal(prefillCode) {
    document.getElementById('new-product-code').value = prefillCode || '';
    document.getElementById('new-grade').value = '';
    document.getElementById('new-company').value = '';
    document.getElementById('new-specific-grade').value = '';
    document.getElementById('new-product-modal').style.display = 'block';
}
function closeNewProductModal() {
    document.getElementById('new-product-modal').style.display = 'none';
}

async function saveNewProduct(e) {
    e.preventDefault();
    const code = document.getElementById('new-product-code').value.trim();
    const grade = document.getElementById('new-grade').value.trim();
    const company = document.getElementById('new-company').value.trim();
    const specificGrade = document.getElementById('new-specific-grade').value.trim();
    if (!code || !grade || !company) {
        alert('Please fill all required fields.');
        return;
    }
    // Add to sessionDB and sync to Google Sheets
    await sessionDB.addProduct({ product: code, grade, company, specificGrade });
    closeNewProductModal();
    // Update UI and select new product
    document.getElementById('product').value = code;
    updateProductSelection();
    showNotification('Product added successfully!', 'success');
}

// --- Sale Party Autocomplete Logic ---
let salePartyList = [];
let filteredSaleParties = [];
let salePartyDropdownVisible = false;
let salePartyDropdownSelectedIndex = -1;

function getSalePartyList() {
    return Object.keys(sessionDB.getAllSaleParties());
}

function handleSalePartyInput() {
    const input = document.getElementById('saleParty');
    const dropdown = document.getElementById('saleParty-dropdown');
    const value = input.value.trim();
    salePartyList = getSalePartyList();
    filteredSaleParties = value ? salePartyList.filter(p => p.toLowerCase().includes(value.toLowerCase())) : salePartyList.slice();
    let showCreate = value && !salePartyList.some(p => p.toLowerCase() === value.toLowerCase());
    let html = '';
    filteredSaleParties.forEach((p, i) => {
        html += `<div class="${i === salePartyDropdownSelectedIndex ? 'selected' : ''}" onclick="selectSalePartyFromDropdown('${p}')">${p}</div>`;
    });
    if (showCreate) {
        html += `<div class="create-new" style="color:#2563eb;font-weight:500;" onclick="openNewSalePartyModal('${value}')">➕ Create new party: "${value}"</div>`;
    }
    dropdown.innerHTML = html;
    dropdown.style.display = html ? 'block' : 'none';
    salePartyDropdownVisible = !!html;
    salePartyDropdownSelectedIndex = -1;
}

function showSalePartyDropdown() {
    handleSalePartyInput();
}

document.addEventListener('click', function(e) {
    const dropdown = document.getElementById('saleParty-dropdown');
    const input = document.getElementById('saleParty');
    if (dropdown && !dropdown.contains(e.target) && e.target !== input) {
        dropdown.style.display = 'none';
        salePartyDropdownVisible = false;
    }
});

document.getElementById('saleParty').addEventListener('keydown', function(e) {
    if (!salePartyDropdownVisible) return;
    if (e.key === 'ArrowDown') {
        salePartyDropdownSelectedIndex = Math.min(salePartyDropdownSelectedIndex + 1, filteredSaleParties.length - 1);
        updateSalePartyDropdownHighlight();
        e.preventDefault();
    } else if (e.key === 'ArrowUp') {
        salePartyDropdownSelectedIndex = Math.max(salePartyDropdownSelectedIndex - 1, 0);
        updateSalePartyDropdownHighlight();
        e.preventDefault();
    } else if (e.key === 'Enter') {
        if (salePartyDropdownSelectedIndex >= 0 && filteredSaleParties[salePartyDropdownSelectedIndex]) {
            selectSalePartyFromDropdown(filteredSaleParties[salePartyDropdownSelectedIndex]);
        } else {
            const input = document.getElementById('saleParty');
            const value = input.value.trim();
            if (value && !salePartyList.some(p => p.toLowerCase() === value.toLowerCase())) {
                openNewSalePartyModal(value);
            }
        }
        document.getElementById('saleParty-dropdown').style.display = 'none';
        salePartyDropdownVisible = false;
        e.preventDefault();
    }
});

function updateSalePartyDropdownHighlight() {
    const dropdown = document.getElementById('saleParty-dropdown');
    const items = dropdown.querySelectorAll('div');
    items.forEach((item, idx) => {
        if (idx === salePartyDropdownSelectedIndex) {
            item.classList.add('selected');
        } else {
            item.classList.remove('selected');
        }
    });
}

function selectSalePartyFromDropdown(partyName) {
    document.getElementById('saleParty').value = partyName;
    document.getElementById('saleParty-dropdown').style.display = 'none';
    salePartyDropdownVisible = false;
}

// --- Modal Logic for New Sale Party ---
function openNewSalePartyModal(prefillName) {
    document.getElementById('new-saleParty-name').value = prefillName || '';
    document.getElementById('new-saleParty-contact').value = '';
    document.getElementById('new-saleParty-phone').value = '';
    document.getElementById('new-saleParty-email').value = '';
    document.getElementById('new-saleParty-address').value = '';
    document.getElementById('new-saleParty-modal').style.display = 'block';
}
function closeNewSalePartyModal() {
    document.getElementById('new-saleParty-modal').style.display = 'none';
}
async function saveNewSaleParty(e) {
    e.preventDefault();
    const name = document.getElementById('new-saleParty-name').value.trim();
    const contact = document.getElementById('new-saleParty-contact').value.trim();
    const phone = document.getElementById('new-saleParty-phone').value.trim();
    const email = document.getElementById('new-saleParty-email').value.trim();
    const address = document.getElementById('new-saleParty-address').value.trim();
    if (!name) {
        alert('Please enter a name.');
        return;
    }
    await sessionDB.addSaleParty({ partyName: name, contactPerson: contact, phone, email, address });
    closeNewSalePartyModal();
    document.getElementById('saleParty').value = name;
    showNotification('Sale party added successfully!', 'success');
}

// --- Purchase Party Autocomplete Logic ---
let purchasePartyList = [];
let filteredPurchaseParties = [];
let purchasePartyDropdownVisible = false;
let purchasePartyDropdownSelectedIndex = -1;

function getPurchasePartyList() {
    return Object.keys(sessionDB.getAllPurchaseParties());
}

function handlePurchasePartyInput() {
    const input = document.getElementById('purchaseParty');
    const dropdown = document.getElementById('purchaseParty-dropdown');
    const value = input.value.trim();
    purchasePartyList = getPurchasePartyList();
    filteredPurchaseParties = value ? purchasePartyList.filter(p => p.toLowerCase().includes(value.toLowerCase())) : purchasePartyList.slice();
    let showCreate = value && !purchasePartyList.some(p => p.toLowerCase() === value.toLowerCase());
    let html = '';
    filteredPurchaseParties.forEach((p, i) => {
        html += `<div class="${i === purchasePartyDropdownSelectedIndex ? 'selected' : ''}" onclick="selectPurchasePartyFromDropdown('${p}')">${p}</div>`;
    });
    if (showCreate) {
        html += `<div class="create-new" style="color:#2563eb;font-weight:500;" onclick="openNewPurchasePartyModal('${value}')">➕ Create new party: "${value}"</div>`;
    }
    dropdown.innerHTML = html;
    dropdown.style.display = html ? 'block' : 'none';
    purchasePartyDropdownVisible = !!html;
    purchasePartyDropdownSelectedIndex = -1;
}

function showPurchasePartyDropdown() {
    handlePurchasePartyInput();
}

document.addEventListener('click', function(e) {
    const dropdown = document.getElementById('purchaseParty-dropdown');
    const input = document.getElementById('purchaseParty');
    if (dropdown && !dropdown.contains(e.target) && e.target !== input) {
        dropdown.style.display = 'none';
        purchasePartyDropdownVisible = false;
    }
});

document.getElementById('purchaseParty').addEventListener('keydown', function(e) {
    if (!purchasePartyDropdownVisible) return;
    if (e.key === 'ArrowDown') {
        purchasePartyDropdownSelectedIndex = Math.min(purchasePartyDropdownSelectedIndex + 1, filteredPurchaseParties.length - 1);
        updatePurchasePartyDropdownHighlight();
        e.preventDefault();
    } else if (e.key === 'ArrowUp') {
        purchasePartyDropdownSelectedIndex = Math.max(purchasePartyDropdownSelectedIndex - 1, 0);
        updatePurchasePartyDropdownHighlight();
        e.preventDefault();
    } else if (e.key === 'Enter') {
        if (purchasePartyDropdownSelectedIndex >= 0 && filteredPurchaseParties[purchasePartyDropdownSelectedIndex]) {
            selectPurchasePartyFromDropdown(filteredPurchaseParties[purchasePartyDropdownSelectedIndex]);
        } else {
            const input = document.getElementById('purchaseParty');
            const value = input.value.trim();
            if (value && !purchasePartyList.some(p => p.toLowerCase() === value.toLowerCase())) {
                openNewPurchasePartyModal(value);
            }
        }
        document.getElementById('purchaseParty-dropdown').style.display = 'none';
        purchasePartyDropdownVisible = false;
        e.preventDefault();
    }
});

function updatePurchasePartyDropdownHighlight() {
    const dropdown = document.getElementById('purchaseParty-dropdown');
    const items = dropdown.querySelectorAll('div');
    items.forEach((item, idx) => {
        if (idx === purchasePartyDropdownSelectedIndex) {
            item.classList.add('selected');
        } else {
            item.classList.remove('selected');
        }
    });
}

function selectPurchasePartyFromDropdown(partyName) {
    document.getElementById('purchaseParty').value = partyName;
    document.getElementById('purchaseParty-dropdown').style.display = 'none';
    purchasePartyDropdownVisible = false;
}

// --- Modal Logic for New Purchase Party ---
function openNewPurchasePartyModal(prefillName) {
    document.getElementById('new-purchaseParty-name').value = prefillName || '';
    document.getElementById('new-purchaseParty-contact').value = '';
    document.getElementById('new-purchaseParty-phone').value = '';
    document.getElementById('new-purchaseParty-email').value = '';
    document.getElementById('new-purchaseParty-address').value = '';
    document.getElementById('new-purchaseParty-modal').style.display = 'block';
}
function closeNewPurchasePartyModal() {
    document.getElementById('new-purchaseParty-modal').style.display = 'none';
}
async function saveNewPurchaseParty(e) {
    e.preventDefault();
    const name = document.getElementById('new-purchaseParty-name').value.trim();
    const contact = document.getElementById('new-purchaseParty-contact').value.trim();
    const phone = document.getElementById('new-purchaseParty-phone').value.trim();
    const email = document.getElementById('new-purchaseParty-email').value.trim();
    const address = document.getElementById('new-purchaseParty-address').value.trim();
    if (!name) {
        alert('Please enter a name.');
        return;
    }
    await sessionDB.addPurchaseParty({ partyName: name, contactPerson: contact, phone, email, address });
    closeNewPurchasePartyModal();
    document.getElementById('purchaseParty').value = name;
    showNotification('Purchase party added successfully!', 'success');
}

// --- Products Table View Logic ---
function toggleProductsTable() {
    const tableContainer = document.getElementById('products-table-container');
    const grid = document.getElementById('products-grid');
    const btn = document.getElementById('toggle-products-table');
    if (tableContainer.style.display === 'none' || tableContainer.style.display === '') {
        updateProductsTable();
        tableContainer.style.display = 'block';
        grid.style.display = 'none';
        btn.textContent = '🗂️ View as Cards';
    } else {
        tableContainer.style.display = 'none';
        grid.style.display = 'block';
        btn.textContent = '📋 View as Table';
    }
}

function updateProductsTable() {
    const tbody = document.getElementById('products-table-body');
    if (!tbody) return;
    tbody.innerHTML = '';
    const products = sessionDB.getAllProducts();
    Object.keys(products).forEach(productCode => {
        const product = products[productCode];
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${productCode}</td>
            <td>${product.grade}</td>
            <td>${product.company}</td>
            <td>${product.specificGrade}</td>
            <td>${product.lastUpdated ? formatDateToDDMMYYYY(new Date(product.lastUpdated)) : 'Unknown'}</td>
        `;
        tbody.appendChild(tr);
    });
}

// Toggle inventory table view
function toggleInventoryTable() {
    const tableContainer = document.getElementById('inventory-table-container');
    const grid = document.getElementById('inventory-grid');
    const btn = document.getElementById('toggle-inventory-table');
    if (!tableContainer || !grid || !btn) return;
    if (tableContainer.style.display === 'none' || tableContainer.style.display === '') {
        updateInventoryTable();
        tableContainer.style.display = 'block';
        grid.style.display = 'none';
        btn.textContent = '🗂️ View as Cards';
    } else {
        tableContainer.style.display = 'none';
        grid.style.display = 'block';
        btn.textContent = '📋 View as Table';
    }
}

// Update inventory table view
function updateInventoryTable() {
    const tbody = document.getElementById('inventory-table-body');
    if (!tbody) return;
    tbody.innerHTML = '';
    inventory.forEach((item, index) => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${item.product}</td>
            <td>${item.grade}</td>
            <td>${item.company}</td>
            <td>${item.specificGrade}</td>
            <td>${item.quantity} kgs</td>
            <td>₹${item.rate}/kg</td>
            <td>₹${(item.quantity * item.rate).toLocaleString()}</td>
            <td>${item.purchaseParty}</td>
            <td>${formatDateToDDMMYYYY(item.dateAdded)}</td>
            <td><button onclick="removeInventoryItem(${index})" style="background: #dc2626; color: white; border: none; padding: 6px 12px; border-radius: 6px; cursor: pointer;">Remove</button></td>
        `;
        tbody.appendChild(row);
    });
}

window.handleProductInput = handleProductInput;
window.showProductDropdown = showProductDropdown;
window.selectProductFromDropdown = selectProductFromDropdown;
window.openNewProductModal = openNewProductModal;
window.closeNewProductModal = closeNewProductModal;
window.saveNewProduct = saveNewProduct;
window.handleSalePartyInput = handleSalePartyInput;
window.showSalePartyDropdown = showSalePartyDropdown;
window.selectSalePartyFromDropdown = selectSalePartyFromDropdown;
window.openNewSalePartyModal = openNewSalePartyModal;
window.closeNewSalePartyModal = closeNewSalePartyModal;
window.saveNewSaleParty = saveNewSaleParty;
window.handlePurchasePartyInput = handlePurchasePartyInput;
window.showPurchasePartyDropdown = showPurchasePartyDropdown;
window.selectPurchasePartyFromDropdown = selectPurchasePartyFromDropdown;
window.openNewPurchasePartyModal = openNewPurchasePartyModal;
window.closeNewPurchasePartyModal = closeNewPurchasePartyModal;
window.saveNewPurchaseParty = saveNewPurchaseParty;
