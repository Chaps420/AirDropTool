// Global state
window.state = {
    selectedNetwork: 'mainnet', // Always mainnet now
    recipients: [],
    tokenConfig: null,
    connectedWallet: null,
    selectedToken: null,
    transactionResults: [] // Store results for export
};

// Enhanced distribution configuration
window.distributionConfig = {
    method: 'equal', // 'equal', 'proportional', 'custom'
    fileFormat: 'txt', // 'txt', 'csv'
    baseAmount: 0,
    totalAmount: 0,
    preview: []
};

// Local alias for convenience
const state = window.state;

// API base URL
const API_BASE_URL = 'http://127.0.0.1:5000/api';

// Helper function to convert string to hex (replaces Buffer.from in browser)
function stringToHex(str) {
    return Array.from(str)
        .map(char => char.charCodeAt(0).toString(16).padStart(2, '0'))
        .join('')
        .toUpperCase();
}

// DOM elements
const elements = {
    // Recipients
    recipientsTextarea: document.getElementById('recipients-textarea'),
    recipientsFile: document.getElementById('recipients-file'),
    validateRecipientsBtn: document.getElementById('validate-recipients'),
    clearRecipientsBtn: document.getElementById('clear-recipients'),
    recipientsStatus: document.getElementById('recipients-status'),
    validRecipients: document.getElementById('valid-recipients'),
    
    // Token configuration
    distributionType: document.getElementById('distribution-type'),
    amountPerWallet: document.getElementById('amount-per-wallet'),
    tokenConfigSummary: document.getElementById('token-config-summary'),
    
    // Token fetching - Updated to match actual HTML IDs
    loadWalletTokensBtn: document.getElementById('load-wallet-tokens'),
    availableTokens: document.getElementById('available-tokens'),
    tokenDropdownContainer: document.getElementById('token-dropdown-container'),
    tokenDropdown: document.getElementById('token-select'), // Fixed: was 'token-dropdown', now 'token-select'
    selectedTokenInfo: document.getElementById('selected-token-info'),
    tokenDetails: document.getElementById('token-details'),
    maxAmountInfo: document.getElementById('max-amount-info'),
    
    // Xaman
    connectXamanBtn: document.getElementById('connect-xaman'),
    disconnectXamanBtn: document.getElementById('disconnect-xaman'),
    xamanQrContainer: document.getElementById('xaman-qr-container'),
    xamanQrCode: document.getElementById('xaman-qr-code'),
    xamanLoading: document.getElementById('xaman-loading'),
    xamanStatusText: document.getElementById('xaman-status-text'),
    xamanWalletInfo: document.getElementById('xaman-wallet-info'),
    xamanWalletAddress: document.getElementById('xaman-wallet-address'),
    xamanXrpBalance: document.getElementById('xaman-xrp-balance'),
    xamanTokenCheck: document.getElementById('xaman-token-check'),
    
    // Review & Execute
    finalSummary: document.getElementById('final-summary'),
    executeAirdropBtn: document.getElementById('execute-airdrop'),
    executeTicketsAirdropBtn: document.getElementById('execute-tickets-airdrop'),
    executeRealTicketsAirdropBtn: document.getElementById('execute-real-tickets-airdrop'),
    paymentQrContainer: document.getElementById('payment-qr-container'),
    paymentQrCode: document.getElementById('payment-qr-code'),
    paymentStatusText: document.getElementById('payment-status-text'),
    
    // Status - Updated to match actual HTML elements
    statusSection: document.getElementById('progress-container'), // Using progress-container as status section
    executionProgress: document.getElementById('progress-container'),
    progressFill: document.getElementById('progress-fill'),
    progressText: document.getElementById('progress-text'),
    transactionResults: document.getElementById('results-container'),
    exportActions: document.getElementById('export-actions'),
    exportCsvBtn: document.getElementById('export-csv'),
    exportJsonBtn: document.getElementById('export-json'),
    exportTxtBtn: document.getElementById('export-txt'),
    startOverBtn: document.getElementById('start-over')
};

// Initialize app when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    console.log('🎯 DOM LOADED - Starting initialization...');
    
    // Clear console of extension noise after a short delay
    setTimeout(() => {
        if (typeof console.clear === 'function') {
            console.clear();
        }
    }, 500);
    
    console.log('🚀 XRPL Airdrop Tool initialized');
    
    // Debug: Check if Xaman integration is available
    setTimeout(() => {
        console.log('Checking Xaman integration availability...');
        console.log('XamanIntegration class:', typeof XamanIntegration);
        console.log('window.xamanIntegration:', window.xamanIntegration);
        if (window.xamanIntegration) {
            console.log('Available methods:', Object.getOwnPropertyNames(window.xamanIntegration));
        }
        console.log('🔄 Timeout complete, execution should continue...');
    }, 1000);
    
    // Move this outside setTimeout to ensure it runs
    console.log('⚡ About to setup event listeners (synchronous)...');
    try {
        setupEventListeners();
        console.log('⚡ Event listeners setup completed successfully!');
    } catch (error) {
        console.error('❌ Error setting up event listeners:', error);
    }
    
    console.log('⚡ About to update summary...');
    // Re-enable updateSummary now that the main issue is resolved
    try {
        if (typeof updateSummary === 'function') {
            updateSummary();
        }
    } catch (error) {
        console.log('updateSummary error (non-critical):', error.message);
    }
});

function setupEventListeners() {
    console.log('🔧 Setting up event listeners...');
    
    // Find and setup connect button (try both possible IDs)
    let connectBtn = document.getElementById('connect-xaman') || document.getElementById('connect-wallet');
    
    if (connectBtn) {
        console.log('✅ Adding click listener to connect button...');
        connectBtn.addEventListener('click', function(e) {
            console.log('🎯 Connect button clicked!');
            e.preventDefault();
            connectWithXaman();
        });
        console.log('✅ Connect button listener added successfully!');
    } else {
        console.log('❌ Connect button not found!');
    }
    
    // Add token selection event listener
    if (elements.tokenDropdown) {
        console.log('✅ Adding change listener to token dropdown...');
        elements.tokenDropdown.addEventListener('change', function(e) {
            console.log('🎯 Token dropdown changed:', e.target.value);
            if (typeof handleTokenSelection === 'function') {
                handleTokenSelection(e);
            }
        });
    } else {
        console.log('❌ Token dropdown not found!');
    }
    
    // Add other essential event listeners for elements that exist
    const recipientFile = document.getElementById('recipient-file');
    if (recipientFile && typeof handleFileUpload === 'function') {
        console.log('✅ Adding change listener to recipient file...');
        recipientFile.addEventListener('change', handleFileUpload);
    }
    
    const addRecipientBtn = document.getElementById('add-recipient');
    if (addRecipientBtn) {
        console.log('✅ Adding click listener to add recipient button...');
        addRecipientBtn.addEventListener('click', function() {
            console.log('🎯 Add recipient clicked!');
            addManualRecipient();
        });
    }
    
    const executeBtn = document.getElementById('execute-airdrop');
    if (executeBtn && typeof executeAirdrop === 'function') {
        console.log('✅ Adding click listener to execute airdrop button...');
        executeBtn.addEventListener('click', executeAirdrop);
    }
    
    // Add event listener for token amount input
    const tokenAmountInput = document.getElementById('token-amount');
    if (tokenAmountInput) {
        console.log('✅ Adding input listener to token amount...');
        tokenAmountInput.addEventListener('input', function() {
            console.log('🎯 Token amount changed:', this.value);
            if (typeof updateTokenConfigSummary === 'function') {
                updateTokenConfigSummary();
            }
        });
    }
    
    console.log('🎯 Event listeners setup complete!');
    
    // Initialize enhanced distribution system
    setupEnhancedDistribution();
}

// Enhanced Distribution System Functions
function setupEnhancedDistribution() {
    console.log('🔧 Setting up enhanced distribution system...');
    
    // Distribution method change
    document.querySelectorAll('input[name="distribution-method"]').forEach(radio => {
        radio.addEventListener('change', updateDistributionMethod);
    });
    
    // File format change
    document.querySelectorAll('input[name="file-format"]').forEach(radio => {
        radio.addEventListener('change', updateFileFormatHelp);
    });
    
    // Enhanced file upload
    const fileInput = document.getElementById('recipient-file');
    if (fileInput) {
        fileInput.removeEventListener('change', handleFileUpload); // Remove old listener
        fileInput.addEventListener('change', handleEnhancedFileUpload);
    }
    
    // Amount change for preview update
    const amountInput = document.getElementById('token-amount');
    if (amountInput) {
        amountInput.addEventListener('input', debounce(updatePreview, 300));
    }
    
    // Initialize
    updateDistributionMethod();
}

// Update form behavior based on distribution method
function updateDistributionMethod() {
    const method = document.querySelector('input[name="distribution-method"]:checked')?.value || 'equal';
    const amountLabel = document.getElementById('amount-label');
    const amountHelp = document.getElementById('amount-help');
    const amountInput = document.getElementById('token-amount');
    const txtConfigSection = document.getElementById('txt-config-section');
    
    window.distributionConfig.method = method;
    
    console.log('📊 Distribution method changed to:', method);
    
    switch (method) {
        case 'equal':
            amountLabel.textContent = 'Amount per Recipient';
            amountHelp.textContent = 'Amount each recipient will receive';
            amountInput.placeholder = '10';
            break;
        case 'proportional':
            amountLabel.textContent = 'Base Amount per Unit';
            amountHelp.textContent = 'Amount per NFT/token held (will be multiplied by count)';
            amountInput.placeholder = '1.5';
            break;
        case 'custom':
            amountLabel.textContent = 'Total Budget (Optional)';
            amountHelp.textContent = 'Amounts will be read from CSV file';
            amountInput.placeholder = '1000';
            break;
    }
    
    // Show/hide TXT configuration based on method and file format
    updateTxtConfigVisibility();
    updateFileFormatHelp();
    updatePreview();
}

// Update TXT configuration section visibility
function updateTxtConfigVisibility() {
    const method = window.distributionConfig.method;
    const format = document.querySelector('input[name="file-format"]:checked')?.value || 'txt';
    const txtConfigSection = document.getElementById('txt-config-section');
    const txtConfigLabel = document.getElementById('txt-config-label');
    const defaultValueLabel = document.getElementById('default-value-label');
    const defaultValueHelp = document.getElementById('default-value-help');
    
    // Show TXT config only for proportional/custom with TXT format
    const shouldShow = (method === 'proportional' || method === 'custom') && format === 'txt';
    txtConfigSection.style.display = shouldShow ? 'block' : 'none';
    
    if (shouldShow) {
        if (method === 'proportional') {
            txtConfigLabel.textContent = 'Configure Counts for TXT File';
            defaultValueLabel.textContent = 'Default Count';
            defaultValueHelp.textContent = 'Default NFT/token count for all addresses';
        } else if (method === 'custom') {
            txtConfigLabel.textContent = 'Configure Amounts for TXT File';
            defaultValueLabel.textContent = 'Default Amount';
            defaultValueHelp.textContent = 'Default amount for all addresses';
        }
    }
}

// Update file format help text
function updateFileFormatHelp() {
    const format = document.querySelector('input[name="file-format"]:checked')?.value || 'txt';
    const method = window.distributionConfig.method;
    const helpDiv = document.getElementById('format-help');
    
    window.distributionConfig.fileFormat = format;
    
    if (format === 'txt') {
        let txtExample = '';
        switch (method) {
            case 'equal':
                txtExample = `
                    <small style="color: #f5d942;">Simple Text Format:</small><br>
                    <small style="color: #999;">One wallet address per line</small>
                `;
                break;
            case 'proportional':
                txtExample = `
                    <small style="color: #f5d942;">Text Format Options:</small><br>
                    <small style="color: #999;">1) Simple addresses (configure counts in UI)</small><br>
                    <small style="color: #999;">2) Comma-separated: address,count</small><br>
                    <small style="color: #666;">rXXXXXX,5</small><br>
                    <small style="color: #666;">rYYYYYY,3</small>
                `;
                break;
            case 'custom':
                txtExample = `
                    <small style="color: #f5d942;">Text Format Options:</small><br>
                    <small style="color: #999;">1) Simple addresses (configure amounts in UI)</small><br>
                    <small style="color: #999;">2) Comma-separated: address,amount</small><br>
                    <small style="color: #666;">rXXXXXX,12.5</small><br>
                    <small style="color: #666;">rYYYYYY,8.75</small>
                `;
                break;
        }
        helpDiv.innerHTML = txtExample;
    } else {
        let csvExample = '';
        switch (method) {
            case 'proportional':
                csvExample = `
                    <small style="color: #f5d942;">CSV Format for Proportional Distribution:</small><br>
                    <small style="color: #999;">address,count</small><br>
                    <small style="color: #666;">rXXXXXX,5</small><br>
                    <small style="color: #666;">rYYYYYY,3</small>
                `;
                break;
            case 'custom':
                csvExample = `
                    <small style="color: #f5d942;">CSV Format for Custom Amounts:</small><br>
                    <small style="color: #999;">address,amount</small><br>
                    <small style="color: #666;">rXXXXXX,12.5</small><br>
                    <small style="color: #666;">rYYYYYY,8.75</small>
                `;
                break;
            default:
                csvExample = `
                    <small style="color: #f5d942;">CSV Format:</small><br>
                    <small style="color: #999;">address,data</small><br>
                    <small style="color: #666;">rXXXXXX,value</small>
                `;
        }
        helpDiv.innerHTML = csvExample;
    }
    
    // Update TXT configuration visibility
    updateTxtConfigVisibility();
}

// Enhanced file upload handler
async function handleEnhancedFileUpload(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    showInfo('Processing file...');
    
    try {
        const text = await file.text();
        const method = window.distributionConfig.method;
        const format = window.distributionConfig.fileFormat;
        
        console.log(`📂 Processing ${format.toUpperCase()} file for ${method} distribution...`);
        
        let recipients = [];
        
        if (format === 'csv') {
            // CSV format with additional data
            recipients = parseCSVFile(text, method);
        } else {
            // TXT format
            if (method === 'equal') {
                // Simple text format for equal distribution
                recipients = parseSimpleFile(text);
            } else {
                // Check if TXT file contains comma-separated values
                const hasCommaData = text.split('\n').some(line => 
                    line.trim() && line.includes(',') && line.split(',').length === 2
                );
                
                if (hasCommaData) {
                    // Parse TXT as comma-separated values
                    recipients = parseCommaTxtFile(text, method);
                    console.log(`✅ Parsed TXT file with comma-separated values: ${recipients.length} recipients`);
                } else {
                    // TXT with individual value configuration for proportional/custom
                    recipients = parseSimpleFile(text);
                    setupTxtValueInputs(recipients);
                    showInfo(`Loaded ${recipients.length} addresses. Configure individual values below.`);
                    return; // Don't update preview yet, wait for user to configure values
                }
            }
        }
        
        if (recipients.length === 0) {
            throw new Error('No valid recipients found in file');
        }
        
        // Clear existing recipients and add new ones
        state.recipients = recipients;
        console.log(`✅ Loaded ${recipients.length} recipients:`, recipients);
        
        updateRecipientsDisplay();
        updatePreview();
        showSuccess(`Loaded ${recipients.length} valid recipients from file`);
        
        // Clear the file input
        event.target.value = '';
        
    } catch (error) {
        console.error('File processing error:', error);
        showError(`Failed to process file: ${error.message}`);
        event.target.value = '';
    }
}

// Parse simple text file (one address per line)
function parseSimpleFile(text) {
    const lines = text.split('\n').map(line => line.trim()).filter(line => line);
    const recipients = [];
    
    for (const line of lines) {
        if (isValidXRPLAddress(line)) {
            recipients.push({
                address: line,
                count: 1,
                amount: null, // Will be calculated based on method
                isValid: true
            });
        }
    }
    
    return recipients;
}

// Parse CSV file with headers
function parseCSVFile(text, method) {
    const lines = text.split('\n').map(line => line.trim()).filter(line => line);
    if (lines.length < 2) {
        throw new Error('CSV file must have at least a header and one data row');
    }
    
    const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
    const recipients = [];
    
    // Validate headers based on method
    if (!headers.includes('address')) {
        throw new Error('CSV must include an "address" column');
    }
    
    if (method === 'proportional' && !headers.includes('count')) {
        throw new Error('Proportional distribution requires a "count" column');
    }
    
    if (method === 'custom' && !headers.includes('amount')) {
        throw new Error('Custom distribution requires an "amount" column');
    }
    
    // Parse data rows
    for (let i = 1; i < lines.length; i++) {
        const values = lines[i].split(',').map(v => v.trim());
        const row = {};
        
        headers.forEach((header, index) => {
            row[header] = values[index] || '';
        });
        
        if (!isValidXRPLAddress(row.address)) {
            console.warn(`Invalid address on line ${i + 1}: ${row.address}`);
            continue;
        }
        
        const recipient = {
            address: row.address,
            count: parseFloat(row.count) || 1,
            amount: parseFloat(row.amount) || null,
            isValid: true
        };
        
        recipients.push(recipient);
    }
    
    return recipients;
}

// Parse TXT file with comma-separated values (address,value format)
function parseCommaTxtFile(text, method) {
    const lines = text.split('\n').map(line => line.trim()).filter(line => line);
    const recipients = [];
    
    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        if (!line || !line.includes(',')) continue;
        
        const parts = line.split(',').map(part => part.trim());
        if (parts.length !== 2) {
            console.warn(`Line ${i + 1}: Invalid format, expected "address,value", got: ${line}`);
            continue;
        }
        
        const [address, valueStr] = parts;
        
        if (!isValidXRPLAddress(address)) {
            console.warn(`Line ${i + 1}: Invalid XRPL address: ${address}`);
            continue;
        }
        
        const value = parseFloat(valueStr);
        if (isNaN(value) || value < 0) {
            console.warn(`Line ${i + 1}: Invalid value: ${valueStr}`);
            continue;
        }
        
        const recipient = {
            address: address,
            isValid: true
        };
        
        if (method === 'proportional') {
            recipient.count = value;
            recipient.amount = null; // Will be calculated
        } else if (method === 'custom') {
            recipient.count = 1;
            recipient.amount = value;
        }
        
        recipients.push(recipient);
    }
    
    return recipients;
}

// Update preview table
function updatePreview() {
    const previewSection = document.getElementById('preview-section');
    const previewBody = document.getElementById('preview-body');
    const totalCountEl = document.getElementById('preview-total-count');
    const totalAmountEl = document.getElementById('preview-total-amount');
    
    if (!state.recipients || state.recipients.length === 0) {
        previewSection.style.display = 'none';
        return;
    }
    
    const method = window.distributionConfig.method;
    const baseAmount = parseFloat(document.getElementById('token-amount').value) || 0;
    
    let preview = [];
    let totalCount = 0;
    let totalAmount = 0;
    
    for (const recipient of state.recipients) {
        let calculatedAmount = 0;
        
        switch (method) {
            case 'equal':
                calculatedAmount = baseAmount;
                break;
            case 'proportional':
                calculatedAmount = baseAmount * (recipient.count || 1);
                break;
            case 'custom':
                calculatedAmount = recipient.amount || 0;
                break;
        }
        
        preview.push({
            address: recipient.address,
            count: recipient.count || 1,
            amount: calculatedAmount
        });
        
        totalCount += recipient.count || 1;
        totalAmount += calculatedAmount;
    }
    
    // Update preview table
    previewBody.innerHTML = '';
    preview.forEach(row => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td style="font-family: monospace; font-size: 12px;">
                ${row.address.substring(0, 8)}...${row.address.substring(row.address.length - 8)}
            </td>
            <td style="text-align: right;">${row.count}</td>
            <td style="text-align: right;">${row.amount.toFixed(6)}</td>
        `;
        previewBody.appendChild(tr);
    });
    
    totalCountEl.textContent = totalCount;
    totalAmountEl.textContent = totalAmount.toFixed(6);
    
    window.distributionConfig.preview = preview;
    window.distributionConfig.totalAmount = totalAmount;
    
    previewSection.style.display = 'block';
    
    // Update token config summary
    updateTokenConfigSummary();
}

// Debounce function to limit rapid calls
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// Setup individual value inputs for TXT files
function setupTxtValueInputs(addresses) {
    const container = document.getElementById('txt-values-container');
    const method = window.distributionConfig.method;
    
    // Clear existing inputs
    container.innerHTML = '';
    
    // Store addresses for later use
    window.distributionConfig.txtAddresses = addresses;
    
    // Create input for each address
    addresses.forEach((address, index) => {
        const row = document.createElement('div');
        row.className = 'txt-value-row';
        
        const addressSpan = document.createElement('span');
        addressSpan.className = 'txt-value-address';
        addressSpan.textContent = address;
        addressSpan.title = address; // Full address on hover
        
        const input = document.createElement('input');
        input.type = 'number';
        input.className = 'txt-value-input';
        input.step = '0.000001';
        input.min = '0';
        input.placeholder = method === 'proportional' ? '1' : '0';
        input.dataset.address = address;
        input.dataset.index = index;
        
        // Update preview when value changes
        input.addEventListener('input', debounce(() => {
            updateTxtPreview();
        }, 300));
        
        row.appendChild(addressSpan);
        row.appendChild(input);
        container.appendChild(row);
    });
    
    // Setup apply default values button
    setupApplyDefaultButton();
}

// Setup the apply default values button
function setupApplyDefaultButton() {
    const button = document.getElementById('apply-default-values');
    const defaultInput = document.getElementById('default-value');
    
    // Remove existing listeners
    button.replaceWith(button.cloneNode(true));
    const newButton = document.getElementById('apply-default-values');
    
    newButton.addEventListener('click', () => {
        const defaultValue = defaultInput.value || '1';
        const inputs = document.querySelectorAll('.txt-value-input');
        
        inputs.forEach(input => {
            input.value = defaultValue;
        });
        
        updateTxtPreview();
        showInfo(`Applied default value ${defaultValue} to all addresses`);
    });
}

// Update preview using TXT values
function updateTxtPreview() {
    const inputs = document.querySelectorAll('.txt-value-input');
    const method = window.distributionConfig.method;
    const baseAmount = parseFloat(document.getElementById('token-amount').value) || 0;
    
    // Build recipients array with values
    const recipients = [];
    inputs.forEach(input => {
        const address = input.dataset.address;
        const value = parseFloat(input.value) || 0;
        
        if (method === 'proportional') {
            recipients.push({
                address: address,
                count: value
            });
        } else if (method === 'custom') {
            recipients.push({
                address: address,
                amount: value
            });
        }
    });
    
    // Update state and preview
    state.recipients = recipients;
    updateRecipientsDisplay();
    updatePreview();
}

// Handle file upload for recipients
function handleFileUpload(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    if (!file.name.endsWith('.txt')) {
        showError('Please select a .txt file');
        event.target.value = '';
        return;
    }
    
    console.log('📂 Processing file:', file.name);
    showInfo('Processing file...', 1000);
    
    const reader = new FileReader();
    reader.onload = function(e) {
        const content = e.target.result;
        const addresses = content.split('\n')
            .map(line => line.trim())
            .filter(line => line.length > 0 && line.startsWith('r')); // Basic XRPL address filter
        
        console.log('📊 Found addresses:', addresses.length);
        
        if (addresses.length === 0) {
            showError('No valid XRPL addresses found in file. Addresses should start with "r".');
            event.target.value = '';
            return;
        }
        
        // Add addresses to recipients list
        if (!state.recipients) {
            state.recipients = [];
        }
        
        // Clear existing recipients and add new ones
        state.recipients = [];
        addresses.forEach(address => {
            if (address.length >= 25 && address.length <= 34) { // XRPL address length validation
                state.recipients.push({
                    address: address,
                    isValid: true
                });
            } else {
                console.warn('Invalid address length:', address);
            }
        });
        
        console.log('✅ Valid recipients added:', state.recipients.length);
        showSuccess(`Loaded ${state.recipients.length} valid addresses from file`);
        
        // Update the UI
        updateRecipientsDisplay();
        updateSummary();
        
        // Clear the file input
        event.target.value = '';
    };
    
    reader.onerror = function() {
        showError('Error reading file');
        event.target.value = '';
    };
    
    reader.readAsText(file);
}

// Update the recipients display
function updateRecipientsDisplay() {
    const recipientsList = document.getElementById('recipients-list');
    const recipientCount = document.getElementById('recipient-count');
    
    if (!recipientsList || !recipientCount) {
        console.log('❌ Recipients display elements not found');
        return;
    }
    
    if (!state.recipients || state.recipients.length === 0) {
        recipientsList.innerHTML = '<p style="color: #999; text-align: center; padding: 20px;">No recipients added yet</p>';
        recipientCount.textContent = '0';
        return;
    }
    
    // Update count
    recipientCount.textContent = state.recipients.length;
    
    // Create recipients HTML
    const recipientsHTML = state.recipients.map((recipient, index) => `
        <div class="recipient-item" style="display: flex; justify-content: space-between; align-items: center; padding: 8px; margin: 4px 0; background: rgba(245, 217, 66, 0.1); border-radius: 4px; border-left: 3px solid #f5d942;">
            <span style="font-family: monospace; font-size: 14px;">${recipient.address}</span>
            <button class="btn btn-small" onclick="removeRecipient(${index})" style="background: #ff4757; color: white; padding: 4px 8px; font-size: 12px;">Remove</button>
        </div>
    `).join('');
    
    recipientsList.innerHTML = recipientsHTML;
}

// Remove a recipient
function removeRecipient(index) {
    if (state.recipients && index >= 0 && index < state.recipients.length) {
        state.recipients.splice(index, 1);
        updateRecipientsDisplay();
        updateSummary();
        showInfo(`Recipient removed. ${state.recipients.length} recipients remaining.`);
    }
}

// Add a manual recipient
function addManualRecipient() {
    const manualAddressInput = document.getElementById('manual-address');
    if (!manualAddressInput) {
        showError('Manual address input not found');
        return;
    }
    
    const address = manualAddressInput.value.trim();
    
    if (!address) {
        showError('Please enter an XRPL address');
        return;
    }
    
    // Basic XRPL address validation
    if (!address.startsWith('r') || address.length < 25 || address.length > 34) {
        showError('Invalid XRPL address format. Address should start with "r" and be 25-34 characters long.');
        return;
    }
    
    // Check if address already exists
    if (!state.recipients) {
        state.recipients = [];
    }
    
    const exists = state.recipients.some(recipient => recipient.address === address);
    if (exists) {
        showError('This address is already in the recipients list');
        return;
    }
    
    // Add the recipient
    state.recipients.push({
        address: address,
        isValid: true
    });
    
    // Clear the input
    manualAddressInput.value = '';
    
    // Update displays
    updateRecipientsDisplay();
    updateSummary();
    
    showSuccess(`Recipient added! Total: ${state.recipients.length} recipients`);
}

// Make removeRecipient available globally for onclick handlers
window.removeRecipient = removeRecipient;

// Handle recipients input
function handleRecipientsInput() {
    // This function is kept for compatibility but updated to work with our current HTML structure
    if (elements.recipientsTextarea && elements.recipientsTextarea.value) {
        const text = elements.recipientsTextarea.value.trim();
        if (text) {
            // Clear previous validation
            if (elements.recipientsStatus) {
                elements.recipientsStatus.innerHTML = '';
            }
            if (elements.validRecipients) {
                elements.validRecipients.innerHTML = '';
            }
        }
    }
    // Always update summary regardless
    if (typeof updateSummary === 'function') {
        updateSummary();
    }
}

// Clear recipients
function clearRecipients() {
    // Clear textarea if it exists
    if (elements.recipientsTextarea) {
        elements.recipientsTextarea.value = '';
    }
    if (elements.recipientsStatus) {
        elements.recipientsStatus.innerHTML = '';
    }
    if (elements.validRecipients) {
        elements.validRecipients.innerHTML = '';
    }
    
    // Clear our current recipients
    state.recipients = [];
    
    // Update displays
    updateRecipientsDisplay();
    if (typeof updateSummary === 'function') {
        updateSummary();
    }
}

// Disconnect from Xaman
function disconnectXaman() {
    console.log('Disconnecting Xaman wallet...');
    
    // Clear wallet state
    state.connectedWallet = null;
    state.selectedToken = null;
    state.availableTokens = null;
    
    // Close WebSocket connection if exists
    if (window.xamanIntegration && window.xamanIntegration.websocket) {
        try {
            window.xamanIntegration.websocket.close();
            window.xamanIntegration.connected = false;
            window.xamanIntegration.account = null;
        } catch (e) {
            console.warn('Error closing WebSocket:', e);
        }
    }
    
    // Reset UI elements safely
    elements.connectXamanBtn.style.display = 'block';
    elements.xamanWalletInfo.style.display = 'none';
    elements.xamanQrContainer.style.display = 'none';
    
    // Reset token dropdown
    elements.tokenDropdown.innerHTML = '<option value="">Select a token...</option>';
    elements.tokenDropdownContainer.style.display = 'none';
    elements.availableTokens.style.display = 'none';
    elements.selectedTokenInfo.style.display = 'none';
    elements.maxAmountInfo.style.display = 'none';
    
    // Reset load tokens button
    elements.loadWalletTokensBtn.disabled = true;
    elements.loadWalletTokensBtn.textContent = 'Load My Tokens';
    
    // Update summary
    updateSummary();
    
    console.log('Wallet disconnected successfully');
}

// Connect with Xaman - Enhanced with proper error handling
async function connectWithXaman() {
    try {
        console.log('🔗 Starting Xaman connection...');
        
        // Clear any previous error states - with null checks
        if (elements.xamanQrContainer) {
            elements.xamanQrContainer.style.display = 'none';
        }
        
        // Check if XamanIntegration is available
        if (!window.xamanIntegration) {
            console.log('XamanIntegration not found, creating new instance...');
            if (typeof XamanIntegration !== 'undefined') {
                window.xamanIntegration = new XamanIntegration();
            } else {
                throw new Error('Xaman integration is not available. Please ensure the Xaman SDK is loaded.');
            }
        }
        
        // Validate integration
        if (typeof window.xamanIntegration.connect !== 'function') {
            console.error('xamanIntegration object:', window.xamanIntegration);
            console.error('Available methods:', Object.getOwnPropertyNames(window.xamanIntegration));
            throw new Error('Xaman integration is not properly initialized.');
        }
        
        // Show loading state - with null checks
        const connectBtn = elements.connectXamanBtn || document.getElementById('connect-wallet');
        if (connectBtn && typeof setLoading === 'function') {
            setLoading(connectBtn, true);
        }
        showInfo('Generating QR code for wallet connection...', 2000);
        
        console.log('Attempting Xaman connection...');
        const walletInfo = await window.xamanIntegration.connect();
        
        if (walletInfo) {
            // Validate network match
            const connectedNetwork = walletInfo.network || 'unknown';
            if (connectedNetwork !== state.selectedNetwork) {
                const networkMismatch = `
⚠️ Network Mismatch Warning

Your wallet connected on: ${connectedNetwork}
Currently selected: ${state.selectedNetwork}

Do you want to switch to ${connectedNetwork} to match your wallet?
                `;
                
                if (confirm(networkMismatch)) {
                    // Update UI to match wallet network
                    state.selectedNetwork = connectedNetwork;
                    const networkRadio = document.querySelector(`input[name="network"][value="${connectedNetwork}"]`);
                    if (networkRadio) {
                        networkRadio.checked = true;
                    }
                    showInfo(`Switched to ${connectedNetwork} network to match your wallet.`);
                } else {
                    showInfo(`Continuing with ${state.selectedNetwork} network. Note: Token balances may differ between networks.`);
                }
            }
            
            // Store wallet info
            state.connectedWallet = walletInfo;
            
            // Update UI - with null checks
            if (elements.xamanWalletAddress) {
                elements.xamanWalletAddress.textContent = walletInfo.address;
            }
            if (elements.xamanXrpBalance) {
                elements.xamanXrpBalance.textContent = `${walletInfo.balance || '0'} XRP`;
            }
            if (elements.xamanWalletInfo) {
                elements.xamanWalletInfo.style.display = 'block';
            }
            if (elements.xamanQrContainer) {
                elements.xamanQrContainer.style.display = 'none';
            }
            
            // Enable load tokens button - with null checks
            if (elements.loadWalletTokensBtn) {
                elements.loadWalletTokensBtn.disabled = false;
                elements.loadWalletTokensBtn.textContent = 'Load My Tokens';
            }
            
            console.log('Wallet connected:', walletInfo);
            showSuccess(`Wallet connected successfully! Address: ${walletInfo.address.substring(0, 12)}...`);
            
            // Auto-load tokens after successful connection - only if function exists
            console.log('Auto-loading tokens for connected wallet...');
            showInfo('Loading your tokens automatically...', 2000);
            
            // Only try to load tokens if the function exists
            if (typeof loadWalletTokens === 'function') {
                try {
                    await loadWalletTokens();
                } catch (tokenError) {
                    console.log('Token loading failed:', tokenError.message);
                    showInfo('Wallet connected successfully, but token loading failed. You can try loading tokens manually.');
                }
            }
            
            // Only update summary if function exists
            if (typeof updateSummary === 'function') {
                updateSummary();
            }
        } else {
            throw new Error('No wallet information received from Xaman.');
        }
        
    } catch (error) {
        console.error('Xaman connection error:', error);
        
        // Provide specific error messages based on error type
        let errorMessage = 'Failed to connect with Xaman.';
        
        if (error.message.includes('timeout')) {
            errorMessage = 'Connection timed out. Please try again and make sure to scan the QR code within 5 minutes.';
        } else if (error.message.includes('rejected')) {
            errorMessage = 'Connection was cancelled. Please try again if you want to connect your wallet.';
        } else if (error.message.includes('integration')) {
            errorMessage = 'Xaman integration error. Please refresh the page and try again.';
        } else {
            errorMessage = `Connection failed: ${error.message}`;
        }
        
        showError(errorMessage);
        
        // Reset UI state - with null checks
        if (elements.xamanQrContainer) {
            elements.xamanQrContainer.style.display = 'none';
        }
        if (elements.xamanWalletInfo) {
            elements.xamanWalletInfo.style.display = 'none';
        }
        
    } finally {
        // Only try to set loading state if the element exists
        if (elements.connectXamanBtn) {
            setLoading(elements.connectXamanBtn, false);
        } else {
            // Try to find it by the actual ID that exists
            const connectBtn = document.getElementById('connect-wallet');
            if (connectBtn && typeof setLoading === 'function') {
                setLoading(connectBtn, false);
            }
        }
    }
}

// Update token configuration summary
function updateTokenConfigSummary() {
    // Get amount from our actual HTML element
    const tokenAmountInput = document.getElementById('token-amount');
    const amount = tokenAmountInput ? parseFloat(tokenAmountInput.value) || 0 : 0;
    
    if (!state.selectedToken || !state.recipients || !state.recipients.length) {
        // Clear summary displays
        const displayTotalAmount = document.getElementById('display-total-amount');
        const displayCurrency = document.getElementById('display-currency');
        if (displayTotalAmount) displayTotalAmount.textContent = '0';
        if (displayCurrency) displayCurrency.textContent = 'TOKEN';
        
        if (typeof updateSummary === 'function') {
            updateSummary();
        }
        return;
    }
    
    // Calculate total amount based on distribution method
    const method = window.distributionConfig.method;
    let totalAmount = 0;
    
    switch (method) {
        case 'equal':
            if (amount <= 0) return;
            totalAmount = amount * state.recipients.length;
            break;
        case 'proportional':
            if (amount <= 0) return;
            totalAmount = window.distributionConfig.totalAmount || 0;
            break;
        case 'custom':
            totalAmount = window.distributionConfig.totalAmount || 0;
            break;
    }
    
    const availableBalance = parseFloat(state.selectedToken.balance);
    
    // Update display elements
    const displayTotalAmount = document.getElementById('display-total-amount');
    const displayCurrency = document.getElementById('display-currency');
    if (displayTotalAmount) displayTotalAmount.textContent = totalAmount.toFixed(6);
    if (displayCurrency) displayCurrency.textContent = state.selectedToken.currency;
    
    // Check if user has enough balance
    if (totalAmount > availableBalance) {
        console.log('Insufficient balance for distribution');
        showError(`Insufficient balance! You need ${totalAmount.toFixed(6)} ${state.selectedToken.currency} but only have ${availableBalance.toFixed(6)} ${state.selectedToken.currency}`);
        state.tokenConfig = null;
        if (typeof updateSummary === 'function') {
            updateSummary();
        }
        return;
    }
    
    // Configuration is valid
    state.tokenConfig = {
        currency: state.selectedToken.currency,
        issuer: state.selectedToken.issuer,
        distributionType: method, // Use the selected distribution method
        amount: method === 'equal' ? amount : totalAmount, // Amount per recipient for equal, total for others
        type: state.selectedToken.type,
        method: method // Store the method for execution
    };
    
    console.log('Token configuration updated:', state.tokenConfig);
    
    if (typeof updateSummary === 'function') {
        updateSummary();
    }
}

// Make removeRecipient globally available
window.removeRecipient = removeRecipient;

// Update main summary
function updateSummary() {
    const summaryDiv = elements.finalSummary;
    
    // Check if summary element exists
    if (!summaryDiv) {
        console.log('❌ Summary element not found, skipping summary update');
        return;
    }
    
    // Check if we have all required data
    const hasRecipients = state.recipients && state.recipients.length > 0;
    const hasTokenConfig = state.tokenConfig && state.tokenConfig.currency && state.tokenConfig.amount > 0;
    const hasWallet = state.connectedWallet && state.connectedWallet.address;
    
    if (!hasRecipients || !hasTokenConfig) {
        summaryDiv.innerHTML = `
            <div class="summary-placeholder">
                ${!hasRecipients ? '📥 Add recipient addresses<br>' : ''}
                ${!hasTokenConfig ? '🪙 Select a token and configure amount<br>' : ''}
                ${hasRecipients && hasTokenConfig ? '🔐 Connect your wallet to continue' : ''}
            </div>
        `;
        // Safe access to executeAirdropBtn
        if (elements.executeAirdropBtn) {
            elements.executeAirdropBtn.style.display = 'none';
        }
        return;
    }
    
    const totalAmount = parseFloat(state.tokenConfig.amount) * state.recipients.length;
    const isXRP = state.tokenConfig.currency === 'XRP';
    
    summaryDiv.innerHTML = `
        <div class="review-summary">
            <h3>🎯 Airdrop Configuration</h3>
            
            <div class="summary-section">
                <h4>Network</h4>
                <p>${state.selectedNetwork === 'testnet' ? '🧪 XRPL Testnet' : '🌐 XRPL Mainnet'}</p>
            </div>
            
            <div class="summary-section">
                <h4>Token Details</h4>
                <p><strong>Currency:</strong> ${state.tokenConfig.currency} ${isXRP ? '(Native)' : '(Issued)'}</p>
                ${!isXRP ? `<p><strong>Issuer:</strong> ${state.tokenConfig.issuer}</p>` : ''}
                <p><strong>Amount per recipient:</strong> ${state.tokenConfig.amount} ${state.tokenConfig.currency}</p>
            </div>
            
            <div class="summary-section">
                <h4>Distribution</h4>
                <p><strong>Recipients:</strong> ${state.recipients.length}</p>
                <p><strong>Total tokens to distribute:</strong> ${totalAmount.toFixed(6)}</p>
                <div class="recipients-preview">
                    ${state.recipients.slice(0, 3).map(addr => `<div class="recipient-preview">${addr}</div>`).join('')}
                    ${state.recipients.length > 3 ? `<div class="recipient-more">... and ${state.recipients.length - 3} more recipients</div>` : ''}
                </div>
            </div>
            
            <div class="summary-section">
                <h4>Wallet Status</h4>
                <p class="wallet-status">
                    ${hasWallet ? 
                        `✅ Connected: ${state.connectedWallet.address}` : 
                        '⚠️ Please connect your wallet to execute'
                    }
                </p>
            </div>
        </div>
    `;
    
    // Show execute buttons only if wallet is connected
    if (hasWallet) {
        // Safe access to executeAirdropBtn
        if (elements.executeAirdropBtn) {
            elements.executeAirdropBtn.style.display = 'block';
            // Update the text and cost information
            if (state.recipients && state.recipients.length > 0) {
                const estimatedFees = (state.recipients.length * 0.000012).toFixed(6);
                elements.executeAirdropBtn.textContent = `Execute Sequential Airdrop (${state.recipients.length} txns, ~${estimatedFees} XRP fees)`;
            }
        }
        
        if (elements.executeTicketsAirdropBtn) {
            elements.executeTicketsAirdropBtn.style.display = 'none'; // Hide tickets option
            const ticketsNote = document.querySelector('.tickets-note');
            if (ticketsNote) ticketsNote.style.display = 'none';
        }
        if (elements.executeRealTicketsAirdropBtn) {
            elements.executeRealTicketsAirdropBtn.style.display = 'none'; // Hide real tickets option
            const realTicketsNote = document.querySelector('.real-tickets-note');
            if (realTicketsNote) realTicketsNote.style.display = 'none';
        }
    } else {
        // Safe access to executeAirdropBtn
        if (elements.executeAirdropBtn) {
            elements.executeAirdropBtn.style.display = 'none';
        }
        if (elements.executeTicketsAirdropBtn) {
            elements.executeTicketsAirdropBtn.style.display = 'none';
            const ticketsNote = document.querySelector('.tickets-note');
            if (ticketsNote) ticketsNote.style.display = 'none';
        }
        if (elements.executeRealTicketsAirdropBtn) {
            elements.executeRealTicketsAirdropBtn.style.display = 'none';
            const realTicketsNote = document.querySelector('.real-tickets-note');
            if (realTicketsNote) realTicketsNote.style.display = 'none';
        }
    }
}

// Parse recipient addresses from textarea
function parseRecipientAddresses(text) {
    return text
        .split('\n')
        .map(line => line.trim())
        .filter(line => line.length > 0);
}

// Validate recipients
async function validateRecipients() {
    const text = elements.recipientsTextarea.value.trim();
    
    if (!text) {
        showError('Please enter recipient wallet addresses.');
        return;
    }
    
    const addresses = parseRecipientAddresses(text);
    
    try {
        setLoading(elements.validateRecipientsBtn, true);
        
        // Validate addresses locally first
        const validAddresses = [];
        const invalidAddresses = [];
        
        addresses.forEach(address => {
            address = address.trim();
            if (!address) return;
            
            // Basic XRPL address validation (starts with 'r' and is 25-34 characters)
            if (isValidXRPLAddress(address)) {
                if (!validAddresses.includes(address)) { // Remove duplicates
                    validAddresses.push(address);
                }
            } else {
                invalidAddresses.push(address);
            }
        });
        
        state.recipients = validAddresses;
        displayValidRecipients(validAddresses, invalidAddresses);
        updateSummary();
        
    } catch (error) {
        console.error('Validation error:', error);
        showError('Failed to validate addresses. Please try again.');
    } finally {
        setLoading(elements.validateRecipientsBtn, false);
    }
}

// Basic XRPL address validation
function isValidXRPLAddress(address) {
    // XRPL addresses start with 'r' and are typically 25-34 characters long
    const xrplAddressRegex = /^r[1-9A-HJ-NP-Za-km-z]{24,33}$/;
    return xrplAddressRegex.test(address);
}

// Display valid recipients
function displayValidRecipients(validAddresses, invalidAddresses) {
    const statusDiv = elements.recipientsStatus;
    const recipientsDiv = elements.validRecipients;
    
    // Show status
    statusDiv.innerHTML = `
        <div class="status-info success">
            ✅ ${validAddresses.length} valid addresses found
            ${invalidAddresses.length > 0 ? `<br>⚠️ ${invalidAddresses.length} invalid addresses ignored` : ''}
        </div>
    `;
    
    // Show valid recipients list
    recipientsDiv.innerHTML = '';
    validAddresses.forEach((address, index) => {
        const recipientDiv = document.createElement('div');
        recipientDiv.className = 'recipient-item';
        recipientDiv.innerHTML = `
            <span>${address}</span>
            <button class="remove-btn" onclick="removeRecipient(${index})">Remove</button>
        `;
        recipientsDiv.appendChild(recipientDiv);
    });
}

// Remove recipient
function removeRecipient(index) {
    state.recipients.splice(index, 1);
    displayValidRecipients(state.recipients, []);
    updateSummary();
}

// Fetch available tokens from issuer
// Prevent multiple simultaneous token loading calls
let isLoadingTokens = false;

// Load tokens from connected wallet
async function loadWalletTokens() {
    console.log('loadWalletTokens() called');
    
    if (isLoadingTokens) {
        console.log('Already loading tokens, skipping...');
        return;
    }
    
    console.log('state.connectedWallet:', state.connectedWallet);
    
    if (!state.connectedWallet || !state.connectedWallet.address) {
        console.error('No connected wallet found');
        showError('Please connect your wallet first.');
        return;
    }
    
    isLoadingTokens = true;
    
    try {
        console.log('Setting loading state...');
        // Try-catch for setLoading in case element doesn't exist
        try {
            setLoading(elements.loadWalletTokensBtn, true);
        } catch (e) {
            console.warn('Could not set loading state:', e);
        }
        
        const apiUrl = `${API_BASE_URL}/wallet/${state.connectedWallet.address}/tokens?network=${state.selectedNetwork}`;
        console.log('Fetching tokens from:', apiUrl);
        
        // Call backend API to fetch wallet tokens
        const response = await fetch(apiUrl);
        
        console.log('Response received:', response.status, response.ok);
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        console.log('Token data received:', data);
        
        if (data.success && data.tokens && data.tokens.length > 0) {
            console.log('Populating dropdown with tokens:', data.tokens.length);
            populateTokenDropdown(data.tokens, data.is_funded);
        } else {
            console.log('No tokens found, showing message');
            showNoTokensFound();
        }
        
    } catch (error) {
        console.error('Error loading wallet tokens:', error);
        showError('Failed to load wallet tokens. Please try again.');
    } finally {
        console.log('Resetting loading state...');
        isLoadingTokens = false;
        try {
            setLoading(elements.loadWalletTokensBtn, false);
        } catch (e) {
            console.warn('Could not reset loading state:', e);
        }
    }
}

// Populate dropdown with wallet tokens
function populateTokenDropdown(tokens, isFunded) {
    console.log('populateTokenDropdown called with:', tokens, 'isFunded:', isFunded);
    
    // Check if token dropdown exists
    if (!elements.tokenDropdown) {
        console.log('❌ Token dropdown element not found, skipping token population');
        return;
    }
    
    // Clear existing options
    elements.tokenDropdown.innerHTML = '<option value="">Select a token...</option>';
    
    // Filter and deduplicate tokens
    const uniqueTokens = [];
    const seen = new Set();
    
    tokens.forEach(token => {
        const key = `${token.currency}-${token.issuer || 'native'}`;
        if (!seen.has(key)) {
            // Show all tokens - let user decide what to send
            // For unfunded accounts, only show available tokens
            const balance = parseFloat(token.balance) || 0;
            const isXRP = token.currency === 'XRP' && !token.issuer;
            
            // Include token if:
            // 1. It has a positive balance, OR
            // 2. It's XRP (always show native XRP), OR  
            // 3. Account is funded (show all trust lines even with 0 balance)
            if (balance > 0 || isXRP || isFunded) {
                uniqueTokens.push(token);
                seen.add(key);
            }
        }
    });
    
    console.log('Filtered unique tokens:', uniqueTokens);
    
    // Store tokens in state
    state.availableTokens = uniqueTokens;
    
    if (uniqueTokens.length === 0) {
        showNoTokensFound();
        return;
    }
    
    // Add each token as an option
    uniqueTokens.forEach((token, index) => {
        console.log('Adding token to dropdown:', token);
        const option = document.createElement('option');
        option.value = index;
        
        const isXRP = token.currency === 'XRP' && !token.issuer;
        const balance = parseFloat(token.balance) || 0;
        
        // Format balance for display
        let balanceDisplay;
        if (balance === 0 && isXRP && !isFunded) {
            balanceDisplay = '0 (Unfunded)';
        } else {
            balanceDisplay = balance.toLocaleString(undefined, {
                minimumFractionDigits: 2,
                maximumFractionDigits: 6
            });
        }
        
        const displayName = isXRP ? 'XRP (Native)' : `${token.currency}${token.issuer ? ' (Token)' : ''}`;
        option.textContent = `${displayName} - Balance: ${balanceDisplay}`;
        
        elements.tokenDropdown.appendChild(option);
    });
    
    console.log('Dropdown populated, showing container...');
    console.log('Dropdown innerHTML after population:', elements.tokenDropdown.innerHTML);
    console.log('Number of options in dropdown:', elements.tokenDropdown.children.length);
    
    // Show the dropdown and enable it - with null checks
    if (elements.tokenDropdownContainer) {
        elements.tokenDropdownContainer.style.display = 'block';
    }
    if (elements.tokenDropdown) {
        elements.tokenDropdown.disabled = false;
    }
    
    // Show success message - with null check
    if (elements.availableTokens) {
        elements.availableTokens.style.display = 'block';
        elements.availableTokens.innerHTML = `
            <div class="tokens-info">
                <h4>✅ Found ${uniqueTokens.length} token${uniqueTokens.length !== 1 ? 's' : ''}</h4>
                <p>Select a token from the dropdown above to configure your airdrop.</p>
                ${!isFunded ? '<p><strong>Note:</strong> Your account appears to be unfunded on this network. You can still prepare airdrops, but you\'ll need to fund your account before executing transactions.</p>' : ''}
            </div>
        `;
    }
    
    console.log('populateTokenDropdown completed');
}

// Handle token selection from dropdown
function handleTokenSelection() {
    const selectedIndex = elements.tokenDropdown.value;
    
    if (selectedIndex === '' || !state.availableTokens) {
        // Clear selection
        state.selectedToken = null;
        elements.selectedTokenInfo.style.display = 'none';
        elements.maxAmountInfo.style.display = 'none';
        updateTokenConfigSummary();
        return;
    }
    
    const token = state.availableTokens[parseInt(selectedIndex)];
    selectWalletToken(token);
}

// Select a token from wallet
function selectWalletToken(token) {
    // Store selected token
    state.selectedToken = token;
    
    // Show token details
    const isXRP = token.currency === 'XRP';
    const detailsHtml = `
        <h4>Selected Token: ${token.currency}</h4>
        <p><strong>Type:</strong> ${isXRP ? 'Native XRP' : 'Issued Token'}</p>
        ${!isXRP ? `<p><strong>Issuer:</strong> ${token.issuer}</p>` : ''}
        <p><strong>Your Balance:</strong> ${parseFloat(token.balance).toLocaleString()} ${token.currency}</p>
    `;
    
    // Safe updates with null checks
    if (elements.tokenDetails) {
        elements.tokenDetails.innerHTML = detailsHtml;
    }
    if (elements.selectedTokenInfo) {
        elements.selectedTokenInfo.style.display = 'block';
    }
    
    // Update max amount info - with null checks
    const recipientCount = Math.max(state.recipients.length, 1);
    const maxPerWallet = parseFloat(token.balance) / recipientCount;
    if (elements.maxAmountInfo) {
        elements.maxAmountInfo.innerHTML = `
            💡 Maximum per wallet: ${maxPerWallet.toFixed(6)} ${token.currency}
            (Based on your current balance and ${state.recipients.length} recipients)
        `;
        elements.maxAmountInfo.style.display = 'block';
    }
    
    // Show token information in our current HTML structure
    const selectedTokenDisplay = document.getElementById('selected-token-display');
    const displayTokenName = document.getElementById('display-token-name');
    const displayTokenBalance = document.getElementById('display-token-balance');
    
    if (selectedTokenDisplay && displayTokenName && displayTokenBalance) {
        selectedTokenDisplay.style.display = 'block';
        displayTokenName.textContent = `${token.currency} ${isXRP ? '(Native)' : '(Token)'}`;
        displayTokenBalance.textContent = `Balance: ${parseFloat(token.balance).toLocaleString()}`;
    }
    
    // Update token config
    updateTokenConfigSummary();
}

async function fetchAvailableTokens() {
    // This function is now replaced by loadWalletTokens
    showError('Please use "Load My Tokens" to fetch tokens from your connected wallet.');
}

// Display available tokens
function displayAvailableTokens(tokens) {
    const container = elements.availableTokens;
    
    container.innerHTML = `
        <h4>Available Tokens from this Issuer:</h4>
        <p>Click on a token to select it:</p>
        <div class="tokens-list"></div>
    `;
    
    const tokensList = container.querySelector('.tokens-list');
    
    tokens.forEach((token, index) => {
        const tokenDiv = document.createElement('div');
        tokenDiv.className = 'token-option';
        tokenDiv.onclick = () => selectToken(token, tokenDiv);
        
        tokenDiv.innerHTML = `
            <div class="token-info">
                <div class="token-currency">${token.currency}</div>
                <div class="token-details">
                    ${token.description || 'Custom token'} • 
                    Balance: ${token.balance || '0'} • 
                    Holders: ${token.holders || 'Unknown'}
                </div>
            </div>
        `;
        
        tokensList.appendChild(tokenDiv);
    });
    
    container.style.display = 'block';
}

// Select a token
function selectToken(token, tokenElement) {
    // Remove previous selection
    document.querySelectorAll('.token-option').forEach(el => el.classList.remove('selected'));
    
    // Mark as selected
    tokenElement.classList.add('selected');
    
    // Fill in the currency field
    elements.tokenCurrency.value = token.currency;
    
    // Trigger validation
    updateTokenConfigSummary();
    
    console.log('Selected token:', token);
}

// Show no tokens found message
function showNoTokensFound() {
    const container = elements.availableTokens;
    
    container.innerHTML = `
        <div class="no-tokens-message">
            <h4>No Tokens Found</h4>
            <p>This issuer address doesn't have any tokens issued yet, or they may not be publicly visible.</p>
            <p>You can still manually enter the currency code if you know it.</p>
        </div>
    `;
    
    container.style.display = 'block';
}

// Execute sequential airdrop - Enter wallet secret once, all transactions automatic
async function executeAirdrop() {
    if (!state.connectedWallet) {
        showError('Please connect your wallet first.');
        return;
    }
    
    if (!state.recipients || state.recipients.length === 0) {
        showError('Please add recipient addresses first.');
        return;
    }
    
    if (!state.tokenConfig) {
        showError('Please configure token distribution first.');
        return;
    }
    
    try {
        setLoading(elements.executeAirdropBtn, true);
        
        // Calculate total cost and validate
        const totalAmount = parseFloat(state.tokenConfig.amount) * state.recipients.length;
        const availableBalance = parseFloat(state.selectedToken.balance);
        const estimatedFees = state.recipients.length * 0.000012;
        
        if (totalAmount > availableBalance) {
            throw new Error(`Insufficient balance! You need ${totalAmount} ${state.tokenConfig.currency} but only have ${availableBalance}.`);
        }
        
        // Show confirmation dialog
        const confirmed = await showSequentialConfirmation(totalAmount, state.recipients.length, estimatedFees);
        if (!confirmed) {
            return;
        }
        
        // Get wallet secret for automatic transaction submission
        console.log('🔐 Prompting for wallet secret...');
        const walletSecret = await promptForWalletSecret();
        console.log('🔐 Wallet secret received:', walletSecret ? 'YES' : 'NO');
        if (!walletSecret) {
            showError('Wallet secret is required for automatic transaction submission.');
            return;
        }
        
        // Show status section - with null check
        if (elements.statusSection) {
            elements.statusSection.style.display = 'block';
        }
        updateProgress(0, 'Starting automatic sequential airdrop...');
        
        console.log('Starting automated sequential airdrop execution...');
        
        // Execute all transactions automatically using wallet secret
        updateProgress(10, 'Submitting transactions automatically...');
        
        console.log('🚀 Calling executeSequentialPayments with:', {
            walletSecret: walletSecret ? 'PROVIDED' : 'MISSING',
            recipientCount: state.recipients.length,
            recipients: state.recipients, // Show actual recipients array
            amount: state.tokenConfig.amount,
            currency: state.tokenConfig.currency,
            issuer: state.selectedToken.issuer
        });
        
        // For enhanced distribution, use preview data; otherwise use original logic
        let recipientAmounts;
        if (distributionConfig.method !== 'equal' && distributionConfig.preview && distributionConfig.preview.length > 0) {
            // Use enhanced distribution with individual amounts
            recipientAmounts = distributionConfig.preview.map(item => ({
                address: item.address,
                amount: item.amount
            }));
        } else {
            // Use original equal distribution
            recipientAmounts = state.recipients.map(r => ({
                address: r.address || r,
                amount: state.tokenConfig.amount
            }));
        }
        
        const executionResult = await executeSequentialPayments(
            walletSecret,
            recipientAmounts,
            state.tokenConfig.currency,
            state.selectedToken.issuer
        );
        
        console.log('✅ executeSequentialPayments completed:', executionResult);
        
        // Log detailed results for debugging
        console.log('🔍 Detailed transaction results:');
        executionResult.results.forEach((result, index) => {
            console.log(`Transaction ${index + 1}:`, {
                recipient: result.recipient,
                success: result.success,
                error: result.error,
                tx_hash: result.tx_hash
            });
        });
        
        updateProgress(100, 'Sequential airdrop completed!');
        
        // Display results
        const successCount = executionResult.results.filter(r => r.success).length;
        const failCount = executionResult.results.filter(r => !r.success).length;
        
        displayTransactionResults(executionResult.results, successCount, failCount);
        
        // Show start over button if it exists
        if (elements.startOverBtn) {
            elements.startOverBtn.style.display = 'block';
        }
        
    } catch (error) {
        console.error('Sequential airdrop execution error:', error);
        showError(`Failed to execute sequential airdrop: ${error.message}`);
        updateProgress(0, 'Sequential airdrop failed.');
    } finally {
        setLoading(elements.executeAirdropBtn, false);
    }
}

// Execute sequential payments automatically using wallet secret
async function executeSequentialPayments(walletSecret, recipientAmounts, currency, issuer) {
    try {
        console.log('🌐 Making API call to backend...', {
            url: `${API_BASE_URL}/execute-sequential-payments`,
            walletSecret: walletSecret ? 'PROVIDED' : 'MISSING',
            recipientCount: recipientAmounts.length,
            recipientAmounts: recipientAmounts.slice(0, 3), // Show first 3 for debug
            currency,
            issuer,
            network: state.selectedNetwork
        });
        
        const response = await fetch(`${API_BASE_URL}/execute-sequential-payments`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                wallet_secret: walletSecret,
                recipient_amounts: recipientAmounts, // Changed from recipients + amount_per_recipient
                currency: currency,
                issuer: issuer,
                network: state.selectedNetwork
            })
        });
        
        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`HTTP ${response.status}: ${errorText}`);
        }
        
        const result = await response.json();
        
        if (result.success) {
            return result;
        } else {
            throw new Error(result.error || 'Sequential payments failed');
        }
        
    } catch (error) {
        console.error('Error executing sequential payments:', error);
        throw error;
    }
}

// Prompt user for wallet secret (secure input)
async function promptForWalletSecret() {
    const secret = prompt(`🔐 Wallet Secret Required

To execute ${state.recipients.length} transactions automatically without individual signatures, please enter your wallet secret.

⚠️ SECURITY NOTE:
• Your secret is used locally and NOT stored
• Transactions are submitted directly to XRPL
• This is the same as signing each transaction manually
• Only enter your secret on trusted devices

Enter your wallet secret (starts with 's'):`);
    
    if (!secret) {
        return null;
    }
    
    // Basic validation
    if (!secret.startsWith('s') || secret.length < 25) {
        showError('Invalid wallet secret format. Wallet secrets start with "s" and are ~29 characters long.');
        return null;
    }
    
    return secret;
}

// Create batch authorization (single signature)
async function createBatchAuthorization(recipients, selectedToken, amountPerWallet) {
    console.log('Creating batch authorization for', recipients.length, 'recipients');
    
    // Calculate total amount needed
    const totalAmount = (recipients.length * amountPerWallet).toFixed(6);
    
    // Create authorization transaction
    const authTransactionData = {
        TransactionType: 'Payment',
        Account: state.connectedWallet.address,
        Destination: state.connectedWallet.address, // Self-payment to authorize
        Amount: selectedToken.currency === 'XRP' ? '1' : { // Minimal amount for authorization
            currency: selectedToken.currency,
            issuer: selectedToken.issuer,
            value: '0.000001'
        },
        Memos: [{
            Memo: {
                MemoType: stringToHex('BatchAuth'),
                MemoData: stringToHex(`Authorize batch airdrop: ${recipients.length} recipients, ${totalAmount} ${selectedToken.currency}`)
            }
        }]
    };
    
    console.log('Authorization transaction prepared:', authTransactionData);
    
    const requestBody = {
        transaction: authTransactionData,
        custom_meta: {
            instruction: `Authorize batch airdrop of ${totalAmount} ${selectedToken.currency} to ${recipients.length} recipients`,
            batch_info: {
                recipient_count: recipients.length,
                token: selectedToken.currency,
                amount_per_wallet: amountPerWallet,
                total_amount: totalAmount,
                recipients: recipients.map(r => r.address || r)
            }
        }
    };
    
    console.log('Sending batch authorization request...');
    
    try {
        // Create Xaman payload for batch authorization
        const payloadResponse = await fetch(`${API_BASE_URL}/create-batch-authorization`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(requestBody)
        });
        
        console.log('Authorization response status:', payloadResponse.status);
        
        if (!payloadResponse.ok) {
            const errorText = await payloadResponse.text();
            console.error('Authorization error response:', errorText);
            throw new Error(`Failed to create batch authorization: ${payloadResponse.status} - ${errorText}`);
        }
        
        const payloadData = await payloadResponse.json();
        console.log('Batch authorization payload created:', payloadData.uuid);
        
        // Show QR code for batch authorization
        if (payloadData.refs && payloadData.refs.qr_png) {
            showPaymentQRCode(payloadData.refs.qr_png, payloadData.uuid);
            elements.paymentStatusText.textContent = `Authorize batch of ${recipients.length} transactions...`;
        }
        
        // Monitor the authorization payload
        const authResult = await monitorPayloadStatus(payloadData.uuid);
        
        // Hide QR code when done
        hidePaymentQRCode();
        
        if (!authResult.success) {
            throw new Error(authResult.error || 'Batch authorization was not signed');
        }
        
        return {
            success: true,
            authToken: payloadData.uuid,
            txHash: authResult.txHash
        };
        
    } catch (error) {
        hidePaymentQRCode();
        throw error;
    }
}

// Execute all transactions automatically after authorization
async function executeBatchTransactions(authToken, recipients, selectedToken, amountPerWallet) {
    console.log('Executing batch transactions with authorization:', authToken);
    
    const results = [];
    const totalTransactions = recipients.length;
    
    for (let i = 0; i < recipients.length; i++) {
        const recipient = recipients[i];
        const recipientAddress = recipient.address || recipient;
        
        try {
            updateProgress(20 + ((i / totalTransactions) * 75), `Processing transaction ${i + 1} of ${totalTransactions}...`);
            
            console.log(`Executing transaction ${i + 1} for ${recipientAddress}`);
            
            // Create transaction payload
            const transactionData = {
                TransactionType: 'Payment',
                Account: state.connectedWallet.address,
                Destination: recipientAddress,
                Amount: selectedToken.currency === 'XRP' 
                    ? Math.round(parseFloat(amountPerWallet) * 1000000).toString() // Convert XRP to drops
                    : {
                        currency: selectedToken.currency,
                        issuer: selectedToken.issuer,
                        value: amountPerWallet.toString()
                    }
            };
            
            // Execute transaction using batch authorization
            const txResult = await executeBatchTransaction(authToken, transactionData, i + 1);
            
            results.push({
                recipient: recipientAddress,
                amount: amountPerWallet,
                success: txResult.success,
                txHash: txResult.txHash,
                error: txResult.error
            });
            
            if (txResult.success) {
                console.log(`Transaction ${i + 1} completed successfully:`, txResult.txHash);
                updateProgress(20 + (((i + 1) / totalTransactions) * 75), `✅ Transaction ${i + 1} completed successfully`);
            } else {
                console.error(`Transaction ${i + 1} failed:`, txResult.error);
                updateProgress(20 + (((i + 1) / totalTransactions) * 75), `❌ Transaction ${i + 1} failed: ${txResult.error}`);
            }
            
            // Small delay between transactions to avoid rate limits
            if (i < recipients.length - 1) {
                await new Promise(resolve => setTimeout(resolve, 1000));
            }
            
        } catch (error) {
            console.error(`Transaction ${i + 1} failed:`, error);
            results.push({
                recipient: recipientAddress,
                amount: amountPerWallet,
                success: false,
                error: error.message
            });
            
            updateProgress(20 + (((i + 1) / totalTransactions) * 75), `❌ Transaction ${i + 1} failed: ${error.message}`);
        }
    }
    
    return results;
}

// Execute individual transaction using batch authorization
async function executeBatchTransaction(authToken, transactionData, sequenceNumber) {
    console.log(`Executing batch transaction ${sequenceNumber} with auth ${authToken}`);
    
    try {
        const response = await fetch(`${API_BASE_URL}/execute-batch-transaction`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                auth_token: authToken,
                transaction: transactionData,
                sequence_number: sequenceNumber
            })
        });
        
        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`HTTP ${response.status}: ${errorText}`);
        }
        
        const result = await response.json();
        
        if (result.success) {
            return {
                success: true,
                txHash: result.tx_hash
            };
        } else {
            return {
                success: false,
                error: result.error || 'Transaction failed'
            };
        }
        
    } catch (error) {
        console.error(`Error executing batch transaction ${sequenceNumber}:`, error);
        return {
            success: false,
            error: error.message
        };
    }
}

// Show sequential confirmation dialog
async function showSequentialConfirmation(totalAmount, recipientCount, estimatedFees) {
    const isXRP = state.tokenConfig.currency === 'XRP';
    
    const message = `
🚀 AUTOMATED SEQUENTIAL AIRDROP

💰 Distribution Details:
• Token: ${state.tokenConfig.currency} ${isXRP ? '(Native XRP)' : '(Issued Token)'}
• Recipients: ${recipientCount} wallets
• Amount per recipient: ${state.tokenConfig.amount} ${state.tokenConfig.currency}
• Total amount: ${totalAmount} ${state.tokenConfig.currency}

💸 Network Costs:
• Transaction fees: ~${estimatedFees.toFixed(6)} XRP (${recipientCount} × 0.000012 XRP)
• NO RESERVE REQUIREMENTS! (Much cheaper than tickets)
• Estimated cost: ~$${(estimatedFees * 0.5).toFixed(3)} USD

⚡ Execution Process:
• Enter your wallet secret ONCE
• All ${recipientCount} transactions submit automatically
• NO individual signatures required
• Real-time progress tracking

✅ Benefits:
• Set it and forget it - fully automated
• Only pay tiny transaction fees
• No XRP reserves locked up
• Works for 5 recipients or 500+ recipients
• Fastest and most cost-effective method

🔐 Security:
• Your secret is used locally only
• Same security as manual signing
• Not stored anywhere

Continue with automated sequential airdrop?
    `;
    
    return confirm(message);
}

// Estimate network fees for transactions
async function estimateNetworkFees(transactionCount) {
    try {
        const response = await fetch(`${API_BASE_URL}/estimate-fees?network=${state.selectedNetwork}&count=${transactionCount}`);
        if (response.ok) {
            const data = await response.json();
            return data.totalFees || (transactionCount * 0.00001); // Fallback to standard fee
        }
    } catch (error) {
        console.warn('Could not estimate fees, using fallback:', error);
    }
    
    // Fallback: standard XRPL fee is ~0.00001 XRP per transaction
    return transactionCount * 0.00001;
}

// Show transaction confirmation dialog
async function showTransactionConfirmation(totalAmount, estimatedFees) {
    const isXRP = state.tokenConfig.currency === 'XRP';
    
    const message = `
🎯 AIRDROP CONFIRMATION

Token: ${state.tokenConfig.currency} ${isXRP ? '(Native)' : '(Issued)'}
Recipients: ${state.recipients.length}
Amount per recipient: ${state.tokenConfig.amount}
Total distribution: ${totalAmount} ${state.tokenConfig.currency}

Network: ${state.selectedNetwork === 'testnet' ? 'XRPL Testnet' : 'XRPL Mainnet'}
Estimated network fees: ~${estimatedFees.toFixed(6)} XRP

⚠️ This will create ${state.recipients.length} separate transactions.
Each transaction will require approval on your Xaman mobile app.

Continue with airdrop?
    `;
    
    return confirm(message);
}

// Create and sign individual transaction using Xaman
async function createAndSignTransaction(recipient, amount, sequenceIndex) {
    console.log(`Creating transaction ${sequenceIndex + 1} for ${recipient}`);
    
    // Prepare transaction data (simplified version for testing)
    const transactionData = {
        TransactionType: 'Payment',
        Account: state.connectedWallet.address,
        Destination: recipient,
        Amount: state.tokenConfig.currency === 'XRP' 
            ? Math.round(parseFloat(amount) * 1000000).toString() // Convert XRP to drops
            : {
                currency: state.tokenConfig.currency,
                issuer: state.tokenConfig.issuer,
                value: amount.toString()
            }
    };
    
    // No NetworkID needed for mainnet
    
    console.log('Transaction data prepared:', transactionData);
    
    const requestBody = {
        transaction: transactionData,
        custom_meta: {
            instruction: `Airdrop ${amount} ${state.tokenConfig.currency} to ${recipient}`,
            blob_info: `Transaction ${sequenceIndex + 1} of ${state.recipients.length}`
        }
    };
    
    console.log('Sending request body:', requestBody);
    
    // Create Xaman payload for transaction signing
    const payloadResponse = await fetch(`${API_BASE_URL}/create-payment-payload`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestBody)
    });
    
    console.log('Response status:', payloadResponse.status);
    
    if (!payloadResponse.ok) {
        const errorText = await payloadResponse.text();
        console.error('Error response:', errorText);
        throw new Error(`Failed to create payment payload: ${payloadResponse.status} - ${errorText}`);
    }
    
    const payloadData = await payloadResponse.json();
    console.log('Payment payload created:', payloadData.uuid);
    
    // Show QR code for transaction signing
    if (payloadData.refs && payloadData.refs.qr_png) {
        showPaymentQRCode(payloadData.refs.qr_png, payloadData.uuid);
    }
    
    // Monitor the payload for user action
    const result = await monitorPayloadStatus(payloadData.uuid);
    
    // Hide QR code when done
    hidePaymentQRCode();
    
    if (!result.success) {
        throw new Error(result.error || 'Transaction was not signed');
    }
    
    return {
        recipient: recipient,
        amount: amount,
        success: true,
        txHash: result.txHash,
        payloadUuid: payloadData.uuid
    };
}

// Monitor payload status for transaction completion
async function monitorPayloadStatus(payloadUuid) {
    return new Promise((resolve, reject) => {
        console.log(`Monitoring payload: ${payloadUuid}`);
        
        const timeout = setTimeout(() => {
            resolve({ success: false, error: 'Transaction timeout' });
        }, 300000); // 5 minute timeout
        
        // Create WebSocket connection for real-time monitoring
        const ws = new WebSocket(`wss://xumm.app/sign/${payloadUuid}`);
        
        ws.onopen = () => {
            console.log(`WebSocket connected for payload ${payloadUuid}`);
        };
        
        ws.onmessage = (event) => {
            try {
                const data = JSON.parse(event.data);
                console.log(`Payload ${payloadUuid} status:`, data);
                
                if (data.signed === true) {
                    clearTimeout(timeout);
                    ws.close();
                    
                    // Get final payload result
                    fetch(`${API_BASE_URL}/payload-status/${payloadUuid}`)
                        .then(response => response.json())
                        .then(result => {
                            console.log('Final payload result (full structure):', JSON.stringify(result, null, 2));
                            
                            // Check for transaction failure first
                            if (result.response && result.response.dispatched_result) {
                                const dispatchResult = result.response.dispatched_result;
                                if (dispatchResult !== 'tesSUCCESS') {
                                    console.log('Transaction failed with result:', dispatchResult);
                                    resolve({ 
                                        success: false, 
                                        error: `Transaction failed: ${dispatchResult}`,
                                        dispatchResult: dispatchResult
                                    });
                                    return;
                                }
                            }
                            
                            // Check various possible locations for the transaction hash
                            let txHash = null;
                            
                            // Check the WebSocket data first (it might have the hash)
                            if (data.txid) {
                                txHash = data.txid;
                                console.log('Found txHash in WebSocket data.txid:', txHash);
                            } else if (data.hash) {
                                txHash = data.hash;
                                console.log('Found txHash in WebSocket data.hash:', txHash);
                            } else if (data.transaction_hash) {
                                txHash = data.transaction_hash;
                                console.log('Found txHash in WebSocket data.transaction_hash:', txHash);
                            }
                            
                            // If not in WebSocket data, check the API result
                            if (!txHash && result.response && result.response.txid) {
                                txHash = result.response.txid;
                                console.log('Found txHash in result.response.txid:', txHash);
                            } else if (!txHash && result.response && result.response.hash) {
                                txHash = result.response.hash;
                                console.log('Found txHash in result.response.hash:', txHash);
                            } else if (!txHash && result.response && result.response.transaction_hash) {
                                txHash = result.response.transaction_hash;
                                console.log('Found txHash in result.response.transaction_hash:', txHash);
                            } else if (!txHash && result.meta && result.meta.txHash) {
                                txHash = result.meta.txHash;
                                console.log('Found txHash in result.meta.txHash:', txHash);
                            } else if (!txHash && result.txid) {
                                txHash = result.txid;
                                console.log('Found txHash in result.txid:', txHash);
                            } else if (!txHash && result.hash) {
                                txHash = result.hash;
                                console.log('Found txHash in result.hash:', txHash);
                            }
                            
                            if (txHash) {
                                console.log('Transaction hash found:', txHash);
                                resolve({
                                    success: true,
                                    txHash: txHash
                                });
                            } else {
                                console.log('No transaction hash found in result or WebSocket data');
                                console.log('WebSocket data keys:', Object.keys(data));
                                console.log('Result keys:', Object.keys(result));
                                if (result.response) console.log('Result.response keys:', Object.keys(result.response));
                                if (result.meta) console.log('Result.meta keys:', Object.keys(result.meta));
                                resolve({ success: false, error: 'Transaction was signed but no transaction hash received' });
                            }
                        })
                        .catch(error => {
                            resolve({ success: false, error: `Failed to get final result: ${error.message}` });
                        });
                        
                } else if (data.signed === false && data.expired) {
                    clearTimeout(timeout);
                    ws.close();
                    resolve({ success: false, error: 'Transaction expired' });
                    
                } else if (data.signed === false && !data.expired) {
                    clearTimeout(timeout);
                    ws.close();
                    resolve({ success: false, error: 'Transaction was rejected' });
                }
                
            } catch (error) {
                console.error('Error parsing WebSocket message:', error);
            }
        };
        
        ws.onclose = () => {
            console.log(`WebSocket closed for payload ${payloadUuid}`);
        };
        
        ws.onerror = (error) => {
            console.error(`WebSocket error for payload ${payloadUuid}:`, error);
            clearTimeout(timeout);
            resolve({ success: false, error: 'WebSocket connection failed' });
        };
    });
}

// Update progress indicator
function updateProgress(percentage, message) {
    if (elements.progressFill && elements.progressText) {
        elements.progressFill.style.width = `${percentage}%`;
        elements.progressText.textContent = message;
    }
    console.log(`Progress: ${percentage}% - ${message}`);
}

// Display transaction results
function displayTransactionResults(results, successCount, failCount) {
    // Store results for export
    state.transactionResults = results;
    
    const resultsHtml = `
        <div class="transaction-results">
            <h3>🎯 Airdrop Results</h3>
            
            <div class="results-summary">
                <div class="result-stat success">✅ Successful: ${successCount}</div>
                <div class="result-stat failed">❌ Failed: ${failCount}</div>
                <div class="result-stat total">📊 Total: ${results.length}</div>
            </div>
            
            <div class="transaction-list">
                ${results.map((result, index) => `
                    <div class="transaction-item ${result.success ? 'success' : 'failed'}">
                        <div class="tx-info">
                            <strong>Transaction ${index + 1}:</strong> ${result.recipient}
                            <br>
                            <span class="tx-status">
                                ${result.success 
                                    ? `✅ Success${result.txHash ? ` - TX: ${result.txHash.substring(0, 16)}...` : ''}` 
                                    : `❌ Failed: ${result.error}`
                                }
                            </span>
                        </div>
                    </div>
                `).join('')}
            </div>
        </div>
    `;
    
    // Safe update with null check
    if (elements.transactionResults) {
        elements.transactionResults.innerHTML = resultsHtml;
    } else {
        // Fallback: show results in a simple way
        console.log('📊 Transaction Results:', results);
        const resultsSection = document.getElementById('results-section');
        const resultsContainer = document.getElementById('results-container');
        if (resultsSection && resultsContainer) {
            resultsSection.style.display = 'block';
            resultsContainer.innerHTML = resultsHtml;
        }
    }
    
    // Show export actions if there are results - with null check
    if (results.length > 0 && elements.exportActions) {
        elements.exportActions.style.display = 'block';
    }
}

// Start over
function startOver() {
    // Reset state
    state.selectedNetwork = 'mainnet';
    state.recipients = [];
    state.tokenConfig = null;
    state.connectedWallet = null;
    state.transactionResults = [];
    
    // Reset form values
    elements.recipientsTextarea.value = '';
    elements.recipientsFile.value = '';
    elements.recipientsStatus.innerHTML = '';
    elements.validRecipients.innerHTML = '';
    elements.amountPerWallet.value = '';
    elements.tokenConfigSummary.innerHTML = '';
    elements.availableTokens.style.display = 'none';
    elements.tokenDropdownContainer.style.display = 'none';
    
    // Reset Xaman
    elements.xamanWalletInfo.style.display = 'none';
    elements.xamanQrContainer.style.display = 'none';
    elements.paymentQrContainer.style.display = 'none';
    
    // Hide status section and export actions
    elements.statusSection.style.display = 'none';
    elements.exportActions.style.display = 'none';
    
    // Clear Xaman connection
    if (window.xamanIntegration) {
        window.xamanIntegration.disconnect();
    }
    
    // Update summary
    updateSummary();
    
    console.log('Application reset');
}

// Payment QR Code Display Functions
function showPaymentQRCode(qrUrl, payloadUuid) {
    console.log('Showing payment QR code:', qrUrl);
    
    // Update QR code image in the Review & Execute section
    elements.paymentQrCode.innerHTML = `<img src="${qrUrl}" alt="Scan to sign transaction" style="max-width: 256px; margin: 10px auto; display: block;">`;
    
    // Show the QR container in Review & Execute section
    elements.paymentQrContainer.style.display = 'block';
    
    // Update status text
    elements.paymentStatusText.textContent = 'Scan QR code to sign transaction in Xaman app...';
    
    showInfo('Scan the QR code in your Xaman app to sign the transaction');
}

function hidePaymentQRCode() {
    elements.paymentQrContainer.style.display = 'none';
    elements.paymentQrCode.innerHTML = '';
    elements.paymentStatusText.textContent = 'Waiting for signature...';
}

// Utility functions
function showError(message) {
    // Create a more sophisticated error display
    const errorDiv = document.createElement('div');
    errorDiv.className = 'error-notification';
    errorDiv.innerHTML = `
        <div class="error-content">
            <span class="error-icon">⚠️</span>
            <span class="error-message">${message}</span>
            <button class="error-close" onclick="this.parentElement.parentElement.remove()">×</button>
        </div>
    `;
    
    // Add to page
    document.body.appendChild(errorDiv);
    
    // Auto-remove after 5 seconds
    setTimeout(() => {
        if (errorDiv.parentElement) {
            errorDiv.remove();
        }
    }, 5000);
    
    console.error('Error:', message);
}

function showSuccess(message) {
    // Create success notification
    const successDiv = document.createElement('div');
    successDiv.className = 'success-notification';
    successDiv.innerHTML = `
        <div class="success-content">
            <span class="success-icon">✅</span>
            <span class="success-message">${message}</span>
            <button class="success-close" onclick="this.parentElement.parentElement.remove()">×</button>
        </div>
    `;
    
    // Add to page
    document.body.appendChild(successDiv);
    
    // Auto-remove after 3 seconds
    setTimeout(() => {
        if (successDiv.parentElement) {
            successDiv.remove();
        }
    }, 3000);
    
    console.log('Success:', message);
}

function showInfo(message, duration = 4000) {
    // Create info notification
    const infoDiv = document.createElement('div');
    infoDiv.className = 'info-notification';
    infoDiv.innerHTML = `
        <div class="info-content">
            <span class="info-icon">ℹ️</span>
            <span class="info-message">${message}</span>
            <button class="info-close" onclick="this.parentElement.parentElement.remove()">×</button>
        </div>
    `;
    
    // Add to page
    document.body.appendChild(infoDiv);
    
    // Auto-remove
    setTimeout(() => {
        if (infoDiv.parentElement) {
            infoDiv.remove();
        }
    }, duration);
    
    console.info('Info:', message);
}

function setLoading(button, isLoading) {
    if (!button) return; // Safety check
    
    if (isLoading) {
        button.disabled = true;
        button.dataset.originalText = button.textContent;
        button.textContent = 'Loading...';
        button.classList.add('loading');
    } else {
        button.disabled = false;
        button.classList.remove('loading');
        
        // Restore original text or use defaults
        if (button.dataset.originalText) {
            button.textContent = button.dataset.originalText;
        } else {
            const originalTexts = {
                'validate-recipients': 'Validate Addresses',
                'load-wallet-tokens': 'Load My Tokens',
                'connect-xaman': 'Connect with Xaman',
                'execute-airdrop': '🚀 Execute Airdrop with Xaman'
            };
            button.textContent = originalTexts[button.id] || 'Submit';
        }
    }
}

function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// Export functionality
function exportResults(format) {
    if (!state.transactionResults || state.transactionResults.length === 0) {
        showError('No transaction results to export');
        return;
    }
    
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `airdrop-results-${timestamp}`;
    
    try {
        switch (format) {
            case 'csv':
                exportAsCSV(filename);
                break;
            case 'json':
                exportAsJSON(filename);
                break;
            case 'txt':
                exportAsTXT(filename);
                break;
            default:
                showError('Invalid export format');
        }
    } catch (error) {
        showError(`Export failed: ${error.message}`);
    }
}

function exportAsCSV(filename) {
    const headers = ['Transaction #', 'Recipient', 'Amount', 'Token', 'Status', 'Transaction Hash', 'Error'];
    
    const rows = state.transactionResults.map((result, index) => [
        index + 1,
        result.recipient,
        result.amount || '',
        state.tokenConfig?.currency || '',
        result.success ? 'Success' : 'Failed',
        result.txHash || '',
        result.error || ''
    ]);
    
    const csvContent = [headers, ...rows]
        .map(row => row.map(cell => `"${cell}"`).join(','))
        .join('\n');
    
    downloadFile(csvContent, `${filename}.csv`, 'text/csv');
    showSuccess('CSV export completed');
}

function exportAsJSON(filename) {
    const exportData = {
        timestamp: new Date().toISOString(),
        network: state.selectedNetwork,
        token: state.tokenConfig,
        totalTransactions: state.transactionResults.length,
        successCount: state.transactionResults.filter(r => r.success).length,
        failedCount: state.transactionResults.filter(r => !r.success).length,
        transactions: state.transactionResults
    };
    
    const jsonContent = JSON.stringify(exportData, null, 2);
    downloadFile(jsonContent, `${filename}.json`, 'application/json');
    showSuccess('JSON export completed');
}

function exportAsTXT(filename) {
    const successCount = state.transactionResults.filter(r => r.success).length;
    const failedCount = state.transactionResults.filter(r => !r.success).length;
    
    let content = `XRPL Airdrop Results\n`;
    content += `Generated: ${new Date().toLocaleString()}\n`;
    content += `Network: ${state.selectedNetwork}\n`;
    content += `Token: ${state.tokenConfig?.currency || 'Unknown'}\n`;
    content += `Total Transactions: ${state.transactionResults.length}\n`;
    content += `Successful: ${successCount}\n`;
    content += `Failed: ${failedCount}\n`;
    content += `\n${'='.repeat(50)}\n\n`;
    
    state.transactionResults.forEach((result, index) => {
        content += `Transaction ${index + 1}:\n`;
        content += `  Recipient: ${result.recipient}\n`;
        content += `  Amount: ${result.amount || 'N/A'}\n`;
        content += `  Status: ${result.success ? 'SUCCESS' : 'FAILED'}\n`;
        if (result.txHash) {
            content += `  Transaction Hash: ${result.txHash}\n`;
        }
        if (result.error) {
            content += `  Error: ${result.error}\n`;
        }
        content += `\n`;
    });
    
    downloadFile(content, `${filename}.txt`, 'text/plain');
    showSuccess('TXT export completed');
}

function downloadFile(content, filename, mimeType) {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.style.display = 'none';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    URL.revokeObjectURL(url);
}

// Tickets-based airdrop functions
async function executeTicketsAirdrop() {
    try {
        console.log('Starting tickets-based airdrop execution...');
        
        if (!state.connectedWallet) {
            showError('Please connect your wallet first.');
            return;
        }
        
        if (!state.recipients.length) {
            showError('Please add recipient addresses first.');
            return;
        }
        
        if (!state.selectedToken) {
            showError('Please select a token first.');
            return;
        }
        
        const amountPerWallet = parseFloat(elements.amountPerWallet.value);
        if (!amountPerWallet || amountPerWallet <= 0) {
            showError('Please enter a valid amount per wallet.');
            return;
        }
        
        // Show status section
        elements.statusSection.style.display = 'block';
        updateProgress(0, 'Starting tickets-based airdrop...');
        
        // Step 1: Create tickets
        updateProgress(10, 'Creating tickets for batch processing...');
        const ticketResult = await createTicketBatch();
        if (!ticketResult.success) {
            throw new Error(`Failed to create tickets: ${ticketResult.error}`);
        }
        
        console.log('Tickets creation initiated:', ticketResult);
        
        // Show QR code for ticket creation
        elements.paymentQrContainer.style.display = 'block';
        elements.paymentQrCode.innerHTML = `<img src="${ticketResult.refs.qr_png}" alt="Scan to create tickets">`;
        elements.paymentStatusText.textContent = 'Scan QR code to create tickets for batch processing';
        
        // Wait for ticket creation to complete
        updateProgress(20, 'Waiting for ticket creation signature...');
        const ticketStatus = await waitForXamanPayload(ticketResult.uuid);
        
        if (!ticketStatus.success) {
            throw new Error('Ticket creation was not signed or failed');
        }
        
        console.log('Tickets created successfully!');
        
        // Step 2: Get the starting ticket sequence from the transaction result
        updateProgress(40, 'Tickets created! Preparing individual transactions...');
        
        // For this demo, we'll assume tickets start from current sequence + 1
        // In a real implementation, you'd parse the transaction result to get the exact ticket numbers
        const startingTicket = ticketStatus.txid ? 1 : Date.now(); // Placeholder logic
        
        // Step 3: Execute individual payments
        updateProgress(50, 'Executing airdrop transactions...');
        
        const recipients = state.recipients.map(address => ({
            address: address,
            amount: amountPerWallet
        }));
        
        const airdropResult = await executeTicketAirdropTransactions(recipients, startingTicket);
        
        if (airdropResult.success) {
            updateProgress(100, `Airdrop completed! Processed ${airdropResult.results.length} transactions.`);
            displayTicketResults(airdropResult.results);
            if (elements.exportActions) {
                elements.exportActions.style.display = 'block';
            }
            if (elements.startOverBtn) {
                elements.startOverBtn.style.display = 'block';
            }
        } else {
            throw new Error(`Airdrop execution failed: ${airdropResult.error}`);
        }
        
    } catch (error) {
        console.error('Tickets airdrop execution error:', error);
        showError(`Failed to execute tickets airdrop: ${error.message}`);
        updateProgress(0, 'Tickets airdrop failed.');
    }
}

async function createTicketBatch() {
    try {
        const response = await fetch(`${API_BASE_URL}/create-ticket-batch`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                wallet_address: state.connectedWallet.account,
                recipient_count: state.recipients.length
            })
        });
        
        const result = await response.json();
        
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${result.error || 'Unknown error'}`);
        }
        
        return result;
        
    } catch (error) {
        console.error('Error creating ticket batch:', error);
        return {
            success: false,
            error: error.message
        };
    }
}

async function executeTicketAirdropTransactions(recipients, startingTicket) {
    try {
        const response = await fetch(`${API_BASE_URL}/execute-ticket-airdrop`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                wallet_address: state.connectedWallet.account,
                recipients: recipients,
                token: state.selectedToken,
                starting_ticket: startingTicket
            })
        });
        
        const result = await response.json();
        
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${result.error || 'Unknown error'}`);
        }
        
        return result;
        
    } catch (error) {
        console.error('Error executing ticket airdrop:', error);
        return {
            success: false,
            error: error.message
        };
    }
}

async function waitForXamanPayload(uuid, maxWaitTime = 300000) { // 5 minutes max
    const startTime = Date.now();
    
    while (Date.now() - startTime < maxWaitTime) {
        try {
            const response = await fetch(`${API_BASE_URL}/check-ticket-status/${uuid}`);
            const result = await response.json();
            
            if (result.success && result.payload) {
                const payload = result.payload;
                
                if (payload.meta && payload.meta.signed) {
                    return {
                        success: true,
                        txid: payload.response?.txid || null,
                        payload: payload
                    };
                } else if (payload.meta && payload.meta.cancelled) {
                    return {
                        success: false,
                        error: 'Transaction was cancelled'
                    };
                }
            }
            
            // Wait 2 seconds before checking again
            await new Promise(resolve => setTimeout(resolve, 2000));
            
        } catch (error) {
            console.error('Error checking payload status:', error);
            await new Promise(resolve => setTimeout(resolve, 2000));
        }
    }
    
    return {
        success: false,
        error: 'Timeout waiting for transaction signature'
    };
}

function displayTicketResults(results) {
    let successCount = 0;
    let failureCount = 0;
    
    let html = '<h4>🎫 Tickets Airdrop Results</h4>';
    html += '<div class="results-summary">';
    
    results.forEach(result => {
        if (result.status === 'success') {
            successCount++;
        } else {
            failureCount++;
        }
    });
    
    html += `<div class="summary-stats">`;
    html += `<span class="success-count">✅ ${successCount} Automated Payments</span>`;
    html += `<span class="failure-count">❌ ${failureCount} Failed</span>`;
    html += `</div></div>`;

    html += '<div class="tickets-explanation">';
    html += '<p><strong>🎯 Tickets Approach Simulation:</strong></p>';
    html += '<p>In a real XRPL tickets implementation, these payments would be automatically submitted to the network using your pre-created tickets. No additional signatures needed!</p>';
    html += '</div>';
    
    html += '<div class="results-list">';
    results.forEach((result, index) => {
        const statusIcon = result.status === 'success' ? '🚀' : '❌';
        const statusClass = result.status === 'success' ? 'success' : 'failure';
        
        html += `<div class="result-item ${statusClass}">`;
        html += `<span class="status">${statusIcon}</span>`;
        html += `<span class="recipient">${result.recipient}</span>`;
        html += `<span class="amount">${result.amount} ${state.selectedToken.currency}</span>`;
        html += `<span class="ticket">Ticket: ${result.ticket_sequence}</span>`;
        if (result.txid) {
            html += `<span class="txid">TxID: ${result.txid}</span>`;
        }
        if (result.message) {
            html += `<div class="message">${result.message}</div>`;
        }
        html += `</div>`;
    });
    html += '</div>';
    
    elements.transactionResults.innerHTML = html;
    
    // Store results for export
    state.transactionResults = results.map(result => ({
        recipient: result.recipient,
        amount: result.amount,
        token: state.selectedToken.currency,
        ticket_sequence: result.ticket_sequence,
        status: result.status,
        txid: result.txid || '',
        message: result.message || '',
        timestamp: new Date().toISOString()
    }));
}

// REAL Tickets-based airdrop functions
async function executeRealTicketsAirdrop() {
    try {
        console.log('Starting comprehensive Option B REAL tickets-based airdrop execution...');
        
        if (!state.connectedWallet) {
            showError('Please connect your wallet first.');
            return;
        }
        
        if (!state.recipients.length) {
            showError('Please add recipient addresses first.');
            return;
        }
        
        if (!state.selectedToken) {
            showError('Please select a token first.');
            return;
        }
        
        const amountPerWallet = parseFloat(elements.amountPerWallet.value);
        if (!amountPerWallet || amountPerWallet <= 0) {
            showError('Please enter a valid amount per wallet.');
            return;
        }
        
        // Show status section
        elements.statusSection.style.display = 'block';
        updateProgress(0, 'Starting comprehensive airdrop validation...');
        
        // Step 1: Validate account readiness first
        updateProgress(10, 'Validating account readiness...');
        const readinessResult = await validateAccountReadiness(state.connectedWallet.address, state.recipients.length);
        
        if (!readinessResult.ready) {
            const issues = readinessResult.error || 'Account not ready';
            
            // Check if the issue is specifically about tickets
            if (issues.includes('Insufficient tickets')) {
                const availableTickets = readinessResult.details?.available_tickets || 0;
                const requiredTickets = state.recipients.length;
                const needed = requiredTickets - availableTickets;
                
                const createTickets = confirm(
                    `🎫 TICKET CREATION NEEDED 🎫\n\n` +
                    `You need ${requiredTickets} tickets but only have ${availableTickets}.\n` +
                    `Need to create: ${needed} additional tickets\n\n` +
                    `Would you like to create the missing tickets now?\n` +
                    `This will require your wallet secret for a one-time ticket creation transaction.\n\n` +
                    `Click OK to proceed with ticket creation, or Cancel to abort.`
                );
                
                if (!createTickets) {
                    updateProgress(0, 'Airdrop cancelled - insufficient tickets.');
                    return;
                }
                
                // Proceed to ticket creation (skip the later check)
                updateProgress(15, `Creating ${needed} missing tickets...`);
                
            } else {
                showError(`Account Readiness Check Failed:\n\n${issues}\n\nPlease resolve these issues first.`);
                updateProgress(0, 'Readiness check failed.');
                return;
            }
        }
        
        console.log('Account readiness check passed:', readinessResult);
        
        // Step 2: Check if we need more tickets (only if readiness check passed)
        const requiredTickets = state.recipients.length;
        const availableTickets = readinessResult.details.available_tickets || 0;
        
        if (availableTickets < requiredTickets && readinessResult.ready) {
            // This case shouldn't happen if validation is working correctly
            // but included for safety
            updateProgress(15, `Need to create ${requiredTickets - availableTickets} more tickets...`);
            
            // Create additional tickets via Xaman
            updateProgress(20, 'Creating additional tickets...');
            const ticketCreationResult = await createTicketsDirectly(requiredTickets - availableTickets);
            
            if (!ticketCreationResult.success) {
                throw new Error(`Failed to create tickets: ${ticketCreationResult.error}`);
            }
            
            showSuccess(`Successfully created ${requiredTickets - availableTickets} tickets!`);
            
            // Wait a moment for tickets to be confirmed
            updateProgress(25, 'Waiting for ticket confirmation...');
            await new Promise(resolve => setTimeout(resolve, 3000));
            
            // Re-validate readiness after ticket creation
            const updatedReadiness = await validateAccountReadiness(state.connectedWallet.address, state.recipients.length);
            if (!updatedReadiness.ready) {
                throw new Error(`Still not ready after ticket creation: ${updatedReadiness.error}`);
            }
        } else if (availableTickets < requiredTickets) {
            // Handle ticket creation from the readiness check
            walletSecret = await promptForWalletSecret();
            if (!walletSecret) {
                showError('Wallet secret is required to create tickets.');
                return;
            }
            
            // Create additional tickets
            updateProgress(20, 'Creating missing tickets...');
            const ticketCreationResult = await createTicketsDirectly(requiredTickets - availableTickets);
            
            if (!ticketCreationResult.success) {
                throw new Error(`Failed to create tickets: ${ticketCreationResult.error}`);
            }
            
            showSuccess(`Successfully created ${requiredTickets - availableTickets} tickets!`);
            
            // Wait longer for tickets to be confirmed on the network
            updateProgress(25, 'Waiting for ticket confirmation on XRPL network...');
            await new Promise(resolve => setTimeout(resolve, 10000)); // Increased to 10 seconds
            
            // Re-validate readiness after ticket creation with retry logic
            let updatedReadiness;
            let retryCount = 0;
            const maxRetries = 3;
            
            do {
                updatedReadiness = await validateAccountReadiness(state.connectedWallet.address, state.recipients.length);
                
                if (updatedReadiness.ready) {
                    break;
                }
                
                retryCount++;
                if (retryCount < maxRetries) {
                    updateProgress(25 + (retryCount * 5), `Retrying validation... (${retryCount}/${maxRetries})`);
                    await new Promise(resolve => setTimeout(resolve, 5000)); // Wait 5 more seconds between retries
                }
            } while (retryCount < maxRetries);
            
            if (!updatedReadiness.ready) {
                // If still not ready, check what the issue is
                const availableAfterCreation = updatedReadiness.details?.available_tickets || 0;
                const errorMsg = `Ticket creation may not have completed successfully.\n\n` +
                              `Expected: ${requiredTickets} tickets\n` +
                              `Available: ${availableAfterCreation} tickets\n\n` +
                              `This can happen if:\n` +
                              `• The ticket creation transaction is still pending\n` +
                              `• The transaction failed or was rejected\n` +
                              `• Network delays in transaction confirmation\n\n` +
                              `Please check your transaction history in Xaman and try again in a few minutes.`;
                
                throw new Error(errorMsg);
            }
            
            // Update readiness result for final confirmation
            readinessResult = updatedReadiness;
        }
        
        // Step 3: Final confirmation
        updateProgress(30, 'Ready for airdrop execution...');
        
        const totalAmount = amountPerWallet * state.recipients.length;
        const confirmed = confirm(
            `🚀 COMPREHENSIVE AIRDROP CONFIRMATION 🚀\n\n` +
            `This will send REAL ${state.selectedToken.currency} tokens:\n` +
            `• Recipients: ${state.recipients.length}\n` +
            `• Amount per recipient: ${amountPerWallet} ${state.selectedToken.currency}\n` +
            `• Total tokens: ${totalAmount.toFixed(6)} ${state.selectedToken.currency}\n` +
            `• Available tickets: ${readinessResult.details.available_tickets}\n` +
            `• Your balance: ${readinessResult.details.balance_xrp} XRP\n\n` +
            `✅ All validations passed - ready to execute!\n\n` +
            `This action cannot be undone and will use real tokens!\n\n` +
            `Proceed with the airdrop?`
        );
        
        if (!confirmed) {
            updateProgress(0, 'Airdrop cancelled by user.');
            return;
        }
        
        // Step 4: Get wallet secret for execution (if not already provided)
        if (!walletSecret) {
            walletSecret = await promptForWalletSecret();
            if (!walletSecret) {
                throw new Error('Wallet secret is required for REAL XRPL transactions');
            }
        }
        
        // Step 5: Execute the airdrop
        updateProgress(50, 'Executing comprehensive airdrop...');
        
        const airdropResult = await executeComprehensiveAirdrop(
            walletSecret,
            state.recipients,
            amountPerWallet,
            state.selectedToken.currency,
            state.selectedToken.issuer,
            readinessResult.details.ticket_sequences
        );
        
        if (airdropResult.success) {
            updateProgress(100, `Comprehensive airdrop completed! ${airdropResult.successful}/${airdropResult.total} transactions successful.`);
            displayComprehensiveResults(airdropResult);
            if (elements.exportActions) {
                elements.exportActions.style.display = 'block';
            }
            if (elements.startOverBtn) {
                elements.startOverBtn.style.display = 'block';
            }
            
            showSuccess(`Airdrop completed successfully!\n${airdropResult.successful} successful, ${airdropResult.failed} failed.`);
        } else {
            throw new Error(`Airdrop execution failed: ${airdropResult.error}`);
        }
        
    } catch (error) {
        console.error('Comprehensive airdrop execution error:', error);
        showError(`Failed to execute comprehensive airdrop: ${error.message}`);
        updateProgress(0, 'Comprehensive airdrop failed.');
    }
}

// Validate account readiness
async function validateAccountReadiness(walletAddress, recipientsCount) {
    try {
        console.log('Validating account readiness:', { walletAddress, recipientsCount });
        
        const response = await fetch(`${API_BASE_URL}/enhanced/validate-readiness`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                wallet_address: walletAddress,
                recipients_count: recipientsCount
            })
        });
        
        console.log('Validation response status:', response.status);
        
        const data = await response.json();
        console.log('Validation response data:', data);
        
        if (!response.ok) {
            throw new Error(data.error || 'Validation failed');
        }
        
        return data;
    } catch (error) {
        console.error('Error validating account readiness:', error);
        throw error;
    }
}

// Create tickets directly via Xaman
async function createTicketsDirectly(ticketCount) {
    try {
        console.log('Creating tickets via Xaman:', { ticketCount, walletAddress: state.connectedWallet?.address });
        
        const response = await fetch(`${API_BASE_URL}/enhanced/create-tickets`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                wallet_address: state.connectedWallet.address,
                ticket_count: ticketCount
            })
        });
        
        console.log('Create tickets response status:', response.status);
        
        const data = await response.json();
        console.log('Create tickets response data:', data);
        
        if (!response.ok) {
            throw new Error(data.error || 'Ticket creation failed');
        }
        
        if (data.success && data.qr_url) {
            // Show QR code for ticket creation
            showPaymentQRCode(data.qr_url, data.payload_uuid);
            elements.paymentStatusText.textContent = `Create ${ticketCount} tickets for airdrop...`;
            
            // Monitor the payload for completion
            const result = await monitorPayloadStatus(data.payload_uuid);
            
            // Hide QR code when done
            hidePaymentQRCode();
            
            if (result.success) {
                return {
                    success: true,
                    txid: result.txHash,
                    message: `Created ${ticketCount} tickets successfully`
                };
            } else {
                // Check for specific error types
                if (result.error && (result.error.includes('tecINSUFFICIENT_RESERVE') || result.dispatchResult === 'tecINSUFFICIENT_RESERVE')) {
                    throw new Error(`❌ Insufficient XRP Reserve

Your wallet needs more XRP to create ${ticketCount} tickets.

💡 Requirements:
• Each ticket requires 2 XRP reserve
• Transaction fees: ~0.1 XRP
• Total needed: ~${(ticketCount * 2 + 0.1).toFixed(1)} XRP

📊 Current Status:
• Your balance: ${state.connectedWallet?.balance || '0'} XRP
• Shortfall: ~${Math.max(0, (ticketCount * 2 + 0.1) - parseFloat(state.connectedWallet?.balance || '0')).toFixed(1)} XRP

🔧 Solution: Add more XRP to your wallet and try again.`);
                } else if (result.error && result.error.includes('cancelled')) {
                    throw new Error('Ticket creation was cancelled by user.');
                } else {
                    throw new Error(result.error || 'Ticket creation was not completed');
                }
            }
        } else {
            throw new Error('Failed to create ticket creation payload');
        }
        
    } catch (error) {
        console.error('Error creating tickets:', error);
        hidePaymentQRCode();
        throw error;
    }
}

// Execute comprehensive airdrop
async function executeComprehensiveAirdrop(walletSecret, recipients, tokenAmount, tokenCurrency, tokenIssuer, ticketSequences) {
    try {
        const response = await fetch(`${API_BASE_URL}/enhanced/execute-airdrop`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                wallet_secret: walletSecret,
                recipients: recipients,
                token_amount: tokenAmount,
                token_currency: tokenCurrency,
                token_issuer: tokenIssuer,
                ticket_sequences: ticketSequences
            })
        });
        
        const data = await response.json();
        if (!response.ok) {
            throw new Error(data.error || 'Airdrop execution failed');
        }
        
        return data;
    } catch (error) {
        console.error('Error executing airdrop:', error);
        throw error;
    }
}

// Display comprehensive results
function displayComprehensiveResults(results) {
    const container = elements.transactionResults;
    
    const successful = results.results.filter(r => r.success);
    const failed = results.results.filter(r => !r.success);
    
    let html = `
        <div class="results-header">
            <h3>🎯 Comprehensive Airdrop Results</h3>
            <div class="results-summary">
                <div class="summary-stat success">
                    <span class="stat-number">${successful.length}</span>
                    <span class="stat-label">Successful</span>
                </div>
                <div class="summary-stat failed">
                    <span class="stat-number">${failed.length}</span>
                    <span class="stat-label">Failed</span>
                </div>
                <div class="summary-stat total">
                    <span class="stat-number">${results.total}</span>
                    <span class="stat-label">Total</span>
                </div>
            </div>
        </div>
        
        <div class="results-content">
    `;
    
    if (successful.length > 0) {
        html += `
            <div class="results-section">
                <h4 class="section-title success">✅ Successful Transactions</h4>
                <div class="transactions-list">
        `;
        
        successful.forEach((result, index) => {
            html += `
                <div class="transaction-item success">
                    <div class="transaction-header">
                        <span class="transaction-number">#${index + 1}</span>
                        <span class="transaction-recipient">${result.recipient}</span>
                        <span class="transaction-status success">✅ Success</span>
                    </div>
                    <div class="transaction-details">
                        <div class="detail-item">
                            <span class="detail-label">Transaction ID:</span>
                            <span class="detail-value txid">${result.txid}</span>
                        </div>
                        <div class="detail-item">
                            <span class="detail-label">Ticket Used:</span>
                            <span class="detail-value">${result.ticket_used}</span>
                        </div>
                    </div>
                </div>
            `;
        });
        
        html += `
                </div>
            </div>
        `;
    }
    
    if (failed.length > 0) {
        html += `
            <div class="results-section">
                <h4 class="section-title failed">❌ Failed Transactions</h4>
                <div class="transactions-list">
        `;
        
        failed.forEach((result, index) => {
            html += `
                <div class="transaction-item failed">
                    <div class="transaction-header">
                        <span class="transaction-number">#${index + 1}</span>
                        <span class="transaction-recipient">${result.recipient}</span>
                        <span class="transaction-status failed">❌ Failed</span>
                    </div>
                    <div class="transaction-details">
                        <div class="detail-item">
                            <span class="detail-label">Error:</span>
                            <span class="detail-value error">${result.error}</span>
                        </div>
                        ${result.ticket_used ? `
                        <div class="detail-item">
                            <span class="detail-label">Ticket Used:</span>
                            <span class="detail-value">${result.ticket_used}</span>
                        </div>
                        ` : ''}
                    </div>
                </div>
            `;
        });
        
        html += `
                </div>
            </div>
        `;
    }
    
    html += `
        </div>
        <div class="results-footer">
            <p><strong>Summary:</strong> ${results.summary}</p>
        </div>
    `;
    
    container.innerHTML = html;
    container.style.display = 'block';
    
    // Store results for export
    window.lastAirdropResults = results;
}

async function checkAccountReadiness() {
    try {
        const response = await fetch(`${API_BASE_URL}/check-readiness`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                wallet_address: state.connectedWallet.account,
                recipient_count: state.recipients.length
            })
        });
        
        const result = await response.json();
        
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${result.error || 'Unknown error'}`);
        }
        
        return result;
        
    } catch (error) {
        console.error('Error checking account readiness:', error);
        return {
            is_ready: false,
            issues: [`Failed to check readiness: ${error.message}`]
        };
    }
}

async function createRealTicketBatch() {
    try {
        const response = await fetch(`${API_BASE_URL}/create-real-ticket-batch`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                wallet_address: state.connectedWallet.account,
                recipient_count: state.recipients.length
            })
        });
        
        const result = await response.json();
        
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${result.error || 'Unknown error'}`);
        }
        
        return result;
        
    } catch (error) {
        console.error('Error creating real ticket batch:', error);
        return {
            success: false,
            error: error.message
        };
    }
}

async function executeRealTicketAirdropTransactions(recipients, walletSecret, startingTicket) {
    try {
        const response = await fetch(`${API_BASE_URL}/execute-real-ticket-airdrop`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                wallet_secret: walletSecret,
                recipients: recipients,
                token: state.selectedToken,
                starting_ticket: startingTicket
            })
        });
        
        const result = await response.json();
        
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${result.error || 'Unknown error'}`);
        }
        
        return result;
        
    } catch (error) {
        console.error('Error executing real ticket airdrop:', error);
        return {
            success: false,
            error: error.message
        };
    }
}

async function promptForWalletSecret() {
    return new Promise((resolve) => {
        const modal = document.createElement('div');
        modal.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0,0,0,0.8);
            display: flex;
            justify-content: center;
            align-items: center;
            z-index: 10000;
        `;
        
        modal.innerHTML = `
            <div style="background: white; padding: 2rem; border-radius: 12px; max-width: 500px; width: 90%;">
                <h3>🔐 Wallet Secret Required for REAL Transactions</h3>
                <p style="margin: 1rem 0; color: #666;">
                    To send REAL tokens, we need your wallet secret/seed to sign transactions.
                    <br><strong>Your secret never leaves your device.</strong>
                </p>
                <div style="margin: 1rem 0;">
                    <label for="wallet-secret-input" style="display: block; margin-bottom: 0.5rem;">
                        Wallet Secret/Seed (starts with 's'):
                    </label>
                    <input type="password" id="wallet-secret-input" 
                           placeholder="sXXXXXXXXXXXXXXXXXXXXXXXXXXXXX" 
                           style="width: 100%; padding: 0.5rem; border: 1px solid #ccc; border-radius: 4px;">
                </div>
                <div style="display: flex; gap: 1rem; margin-top: 1.5rem;">
                    <button id="submit-secret" style="flex: 1; padding: 0.75rem; background: #10b981; color: white; border: none; border-radius: 4px; cursor: pointer;">
                        ✅ Continue with REAL Airdrop
                    </button>
                    <button id="cancel-secret" style="flex: 1; padding: 0.75rem; background: #6b7280; color: white; border: none; border-radius: 4px; cursor: pointer;">
                        ❌ Cancel
                    </button>
                </div>
                <small style="color: #ef4444; margin-top: 1rem; display: block;">
                    ⚠️ Only provide your secret if you completely trust this environment!
                </small>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        const secretInput = modal.querySelector('#wallet-secret-input');
        const submitBtn = modal.querySelector('#submit-secret');
        const cancelBtn = modal.querySelector('#cancel-secret');
        
        submitBtn.addEventListener('click', () => {
            const secret = secretInput.value.trim();
            if (secret && secret.startsWith('s')) {
                document.body.removeChild(modal);
                resolve(secret);
            } else {
                alert('Please enter a valid wallet secret that starts with "s"');
            }
        });
        
        cancelBtn.addEventListener('click', () => {
            document.body.removeChild(modal);
            resolve(null);
        });
        
        secretInput.focus();
    });
}

function displayRealTicketResults(results) {
    let successCount = 0;
    let failureCount = 0;
    
    let html = '<h4>⚡ REAL Tickets Airdrop Results</h4>';
    html += '<div class="results-summary">';
    
    results.forEach(result => {
        if (result.status === 'success') {
            successCount++;
        } else {
            failureCount++;
        }
    });
    
    html += `<div class="summary-stats">`;
    html += `<span class="success-count">✅ ${successCount} REAL Payments Sent</span>`;
    html += `<span class="failure-count">❌ ${failureCount} Failed</span>`;
    html += `</div></div>`;

    html += '<div class="real-tickets-explanation">';
    html += '<p><strong>🎯 REAL XRPL Transactions:</strong></p>';
    html += '<p>These are REAL transactions on the XRPL network using your pre-created tickets. Tokens have been actually sent!</p>';
    html += '</div>';
    
    html += '<div class="results-list">';
    results.forEach((result, index) => {
        const statusIcon = result.status === 'success' ? '✅' : '❌';
        const statusClass = result.status === 'success' ? 'success' : 'failure';
        
        html += `<div class="result-item ${statusClass}">`;
        html += `<span class="status">${statusIcon}</span>`;
        html += `<span class="recipient">${result.recipient}</span>`;
        html += `<span class="amount">${result.amount} ${state.selectedToken.currency}</span>`;
        html += `<span class="ticket">Ticket: ${result.ticket_sequence}</span>`;
        if (result.txid && result.txid !== 'unknown') {
            html += `<a href="https://livenet.xrpl.org/transactions/${result.txid}" target="_blank" class="txid">View: ${result.txid.substring(0, 16)}...</a>`;
        }
        if (result.message) {
            html += `<div class="message">${result.message}</div>`;
        }
        if (result.error) {
            html += `<div class="error">Error: ${result.error}</div>`;
        }
        html += `</div>`;
    });
    html += '</div>';
    
    elements.transactionResults.innerHTML = html;
    
    // Store results for export
    state.transactionResults = results.map(result => ({
        recipient: result.recipient,
        amount: result.amount,
        token: state.selectedToken.currency,
        ticket_sequence: result.ticket_sequence,
        status: result.status,
        txid: result.txid || '',
        message: result.message || '',
        error: result.error || '',
        timestamp: new Date().toISOString()
    }));
}
