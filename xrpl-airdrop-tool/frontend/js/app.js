// Global state
const state = {
    selectedNetwork: 'testnet',
    recipients: [],
    tokenConfig: null,
    connectedWallet: null,
    airdropConfig: null
};

// API base URL
const API_BASE_URL = 'http://localhost:5000/api';

// DOM elements
const elements = {
    // Network section
    networkRadios: document.querySelectorAll('input[name="network"]'),
    nextToRecipientsBtn: document.getElementById('next-to-recipients'),
    
    // Recipients section
    recipientsTextarea: document.getElementById('recipients-textarea'),
    validateRecipientsBtn: document.getElementById('validate-recipients'),
    clearRecipientsBtn: document.getElementById('clear-recipients'),
    recipientsStatus: document.getElementById('recipients-status'),
    validRecipients: document.getElementById('valid-recipients'),
    nextToTokenConfigBtn: document.getElementById('next-to-token-config'),
    
    // Token config section
    tokenCurrency: document.getElementById('token-currency'),
    tokenIssuer: document.getElementById('token-issuer'),
    distributionType: document.getElementById('distribution-type'),
    amountPerWallet: document.getElementById('amount-per-wallet'),
    tokenConfigSummary: document.getElementById('token-config-summary'),
    nextToXamanBtn: document.getElementById('next-to-xaman'),
    
    // Xaman section
    connectXamanBtn: document.getElementById('connect-xaman'),
    xamanQrContainer: document.getElementById('xaman-qr-container'),
    nextToReviewBtn: document.getElementById('next-to-review'),
    
    // Review section
    finalSummary: document.getElementById('final-summary'),
    executeAirdropBtn: document.getElementById('execute-airdrop'),
    
    // Status section
    progressFill: document.getElementById('progress-fill'),
    progressText: document.getElementById('progress-text'),
    transactionResults: document.getElementById('transaction-results'),
    startOverBtn: document.getElementById('start-over'),
    
    // Step sections
    sections: {
        network: document.getElementById('network-section'),
        recipients: document.getElementById('recipients-section'),
        tokenConfig: document.getElementById('token-config-section'),
        xaman: document.getElementById('xaman-section'),
        review: document.getElementById('review-section'),
        status: document.getElementById('status-section')
    }
};

// Initialize the application
document.addEventListener('DOMContentLoaded', function() {
    setupEventListeners();
    loadSavedData();
});

    // Token fetching
    elements.fetchTokensBtn = document.getElementById('fetch-tokens');
    elements.availableTokens = document.getElementById('available-tokens');
    
    // Event listeners setup
function setupEventListeners() {
    // Network selection
    elements.networkRadios.forEach(radio => {
        radio.addEventListener('change', handleNetworkChange);
    });
    
    elements.nextToRecipientsBtn.addEventListener('click', () => showSection('recipients'));
    
    // Recipients management
    elements.validateRecipientsBtn.addEventListener('click', validateRecipients);
    elements.clearRecipientsBtn.addEventListener('click', clearRecipients);
    elements.recipientsTextarea.addEventListener('input', debounce(handleRecipientsInput, 500));
    elements.nextToTokenConfigBtn.addEventListener('click', () => showSection('tokenConfig'));
    
    // Token configuration
    elements.tokenCurrency.addEventListener('input', debounce(updateTokenConfigSummary, 300));
    elements.tokenIssuer.addEventListener('input', debounce(updateTokenConfigSummary, 300));
    elements.distributionType.addEventListener('change', updateTokenConfigSummary);
    elements.amountPerWallet.addEventListener('input', debounce(updateTokenConfigSummary, 300));
    elements.fetchTokensBtn.addEventListener('click', fetchAvailableTokens);
    elements.nextToXamanBtn.addEventListener('click', () => showSection('xaman'));
    
    // Xaman connection
    elements.connectXamanBtn.addEventListener('click', connectWithXaman);
    elements.nextToReviewBtn.addEventListener('click', () => showSection('review'));
    
    // Review and execution
    elements.executeAirdropBtn.addEventListener('click', executeAirdrop);
    
    // Status section
    elements.startOverBtn.addEventListener('click', startOver);
}

// Network selection handler
function handleNetworkChange(event) {
    state.selectedNetwork = event.target.value;
    console.log('Network changed to:', state.selectedNetwork);
}

// Show/hide sections
function showSection(sectionName) {
    // Hide all sections
    Object.values(elements.sections).forEach(section => {
        section.classList.remove('active');
    });
    
    // Show selected section
    elements.sections[sectionName].classList.add('active');
}

// Toggle seed visibility
function toggleSeedVisibility() {
    const seedInput = elements.walletSeedInput;
    const toggleBtn = elements.toggleSeedBtn;
    
    if (seedInput.type === 'password') {
        seedInput.type = 'text';
        toggleBtn.textContent = 'Hide';
    } else {
        seedInput.type = 'password';
        toggleBtn.textContent = 'Show';
    }
}

// Connect wallet
async function connectWallet() {
    const seed = elements.walletSeedInput.value.trim();
    
    if (!seed) {
        showError('Please enter your wallet seed or secret key.');
        return;
    }
    
    try {
        setLoading(elements.connectWalletBtn, true);
        
        const response = await fetch(`${API_BASE_URL}/wallet/connect`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                seed: seed,
                network: state.selectedNetwork
            })
        });
        
        const data = await response.json();
        
        if (data.success) {
            state.connectedWallet = seed;
            state.walletInfo = data.wallet_info;
            displayWalletInfo(data.wallet_info);
            elements.nextToRecipientsBtn.style.display = 'block';
        } else {
            showError(data.error || 'Failed to connect wallet');
        }
    } catch (error) {
        console.error('Wallet connection error:', error);
        showError('Failed to connect to the server. Please try again.');
    } finally {
        setLoading(elements.connectWalletBtn, false);
    }
}

// Display wallet information
function displayWalletInfo(walletInfo) {
    elements.walletAddress.textContent = walletInfo.address;
    elements.xrpBalance.textContent = walletInfo.xrp_balance;
    
    // Display token balances
    const tokenBalancesContainer = elements.tokenBalances;
    tokenBalancesContainer.innerHTML = '';
    
    if (walletInfo.tokens && walletInfo.tokens.length > 0) {
        const tokenTitle = document.createElement('h4');
        tokenTitle.textContent = 'Token Balances:';
        tokenBalancesContainer.appendChild(tokenTitle);
        
        walletInfo.tokens.forEach(token => {
            const tokenDiv = document.createElement('div');
            tokenDiv.className = 'token-item';
            tokenDiv.innerHTML = `
                <span>${token.currency}</span>
                <span>${token.value} (${token.issuer})</span>
            `;
            tokenBalancesContainer.appendChild(tokenDiv);
        });
        
        // Populate token select dropdown
        populateTokenSelect(walletInfo.tokens);
    } else {
        tokenBalancesContainer.innerHTML = '<p>No tokens found in this wallet.</p>';
    }
    
    elements.walletInfo.style.display = 'block';
}

// Populate token select dropdown
function populateTokenSelect(tokens) {
    const tokenSelect = elements.tokenSelect;
    tokenSelect.innerHTML = '<option value="">Select a token...</option>';
    
    tokens.forEach(token => {
        const option = document.createElement('option');
        option.value = JSON.stringify({
            currency: token.currency,
            issuer: token.issuer,
            value: token.value
        });
        option.textContent = `${token.currency} (Balance: ${token.value})`;
        tokenSelect.appendChild(option);
    });
}

// Handle recipients input
function handleRecipientsInput() {
    const text = elements.recipientsTextarea.value.trim();
    if (text) {
        // Auto-validate as user types
        const addresses = parseRecipientAddresses(text);
        if (addresses.length > 0) {
            elements.validateRecipientsBtn.style.display = 'block';
        }
    }
}

// Update token configuration summary
function updateTokenConfigSummary() {
    const currency = elements.tokenCurrency.value.trim().toUpperCase();
    const issuer = elements.tokenIssuer.value.trim();
    const distributionType = elements.distributionType.value;
    const amount = parseFloat(elements.amountPerWallet.value) || 0;
    
    if (!currency || !issuer || amount <= 0 || !state.recipients.length) {
        elements.tokenConfigSummary.innerHTML = '';
        elements.nextToXamanBtn.style.display = 'none';
        return;
    }
    
    // Validate currency code
    if (!WalletUtils.validate_currency_code || !WalletUtils.validate_currency_code(currency)) {
        elements.tokenConfigSummary.innerHTML = '<div style="color: red;">Invalid currency code format</div>';
        elements.nextToXamanBtn.style.display = 'none';
        return;
    }
    
    // Validate issuer address
    if (!WalletUtils.isValidXRPLAddress(issuer)) {
        elements.tokenConfigSummary.innerHTML = '<div style="color: red;">Invalid issuer address format</div>';
        elements.nextToXamanBtn.style.display = 'none';
        return;
    }
    
    const totalAmount = distributionType === 'equal' ? 
        amount * state.recipients.length : 
        amount;
    
    const amountPerRecipient = distributionType === 'equal' ? 
        amount : 
        amount / state.recipients.length;
    
    // Store token configuration
    state.tokenConfig = {
        currency: currency,
        issuer: issuer,
        distributionType: distributionType,
        amountPerRecipient: amountPerRecipient,
        totalAmount: totalAmount
    };
    
    const summaryHtml = `
        <h4>📋 Token Configuration Summary</h4>
        <div class="config-item">
            <span>Token Currency:</span>
            <span>${currency}</span>
        </div>
        <div class="config-item">
            <span>Token Issuer:</span>
            <span>${WalletUtils.formatAddress(issuer, 30)}</span>
        </div>
        <div class="config-item">
            <span>Recipients:</span>
            <span>${state.recipients.length}</span>
        </div>
        <div class="config-item">
            <span>Amount per recipient:</span>
            <span>${amountPerRecipient.toFixed(6)} ${currency}</span>
        </div>
        <div class="config-item">
            <span>Total amount needed:</span>
            <span>${totalAmount.toFixed(6)} ${currency}</span>
        </div>
    `;
    
    elements.tokenConfigSummary.innerHTML = summaryHtml;
    elements.nextToXamanBtn.style.display = 'block';
}

// Connect with Xaman
async function connectWithXaman() {
    try {
        setLoading(elements.connectXamanBtn, true);
        
        // Show QR container
        elements.xamanQrContainer.style.display = 'block';
        
        // Initialize Xaman connection
        await xamanIntegration.initializeConnection();
        
    } catch (error) {
        console.error('Xaman connection error:', error);
        showError('Failed to connect with Xaman: ' + error.message);
    } finally {
        setLoading(elements.connectXamanBtn, false);
    }
}

// Show review summary
function showReviewSummary() {
    if (!state.recipients.length || !state.tokenConfig || !xamanIntegration.connectedAccount) {
        return;
    }
    
    const summaryHtml = `
        <div class="summary-section">
            <h4>🌐 Network</h4>
            <p>${state.selectedNetwork === 'testnet' ? 'Testnet' : 'Mainnet'}</p>
        </div>
        
        <div class="summary-section">
            <h4>👥 Recipients</h4>
            <p>${state.recipients.length} wallet addresses</p>
            <div style="max-height: 150px; overflow-y: auto; background: #f9fafb; border-radius: 6px; padding: 10px; margin-top: 8px;">
                ${state.recipients.map(addr => `<div style="font-family: monospace; font-size: 0.9em; margin: 2px 0;">${addr}</div>`).join('')}
            </div>
        </div>
        
        <div class="summary-section">
            <h4>🪙 Token Configuration</h4>
            <p><strong>Currency:</strong> ${state.tokenConfig.currency}</p>
            <p><strong>Issuer:</strong> ${WalletUtils.formatAddress(state.tokenConfig.issuer, 30)}</p>
            <p><strong>Amount per recipient:</strong> ${state.tokenConfig.amountPerRecipient.toFixed(6)}</p>
            <p><strong>Total amount:</strong> ${state.tokenConfig.totalAmount.toFixed(6)}</p>
        </div>
        
        <div class="summary-section">
            <h4>💼 Connected Wallet</h4>
            <p><strong>Address:</strong> ${WalletUtils.formatAddress(xamanIntegration.connectedAccount.address, 30)}</p>
            <p><strong>XRP Balance:</strong> ${xamanIntegration.connectedAccount.balance} XRP</p>
        </div>
        
        <div class="summary-section">
            <h4>📊 Execution Plan</h4>
            <p>Each transaction will be signed individually in your Xaman app</p>
            <p>You can review and approve each payment before it's sent</p>
            <p>Estimated time: ${Math.ceil(state.recipients.length * 3 / 60)} minutes</p>
        </div>
    `;
    
    elements.finalSummary.innerHTML = summaryHtml;
    elements.executeAirdropBtn.style.display = 'block';
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
        
        const response = await fetch(`${API_BASE_URL}/wallet/validate`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                addresses: addresses
            })
        });
        
        const data = await response.json();
        
        if (data.success) {
            state.recipients = data.valid_addresses;
            displayValidRecipients(data.valid_addresses, data.invalid_addresses);
            
            if (data.valid_addresses.length > 0) {
                elements.nextToAirdropBtn.style.display = 'block';
            }
        } else {
            showError(data.error || 'Failed to validate addresses');
        }
    } catch (error) {
        console.error('Validation error:', error);
        showError('Failed to validate addresses. Please try again.');
    } finally {
        setLoading(elements.validateRecipientsBtn, false);
    }
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
    
    if (state.recipients.length === 0) {
        elements.nextToAirdropBtn.style.display = 'none';
    }
}

// Clear recipients
function clearRecipients() {
    elements.recipientsTextarea.value = '';
    elements.recipientsStatus.innerHTML = '';
    elements.validRecipients.innerHTML = '';
    elements.nextToAirdropBtn.style.display = 'none';
    state.recipients = [];
}

// Handle token selection
function handleTokenSelection() {
    const selectedValue = elements.tokenSelect.value;
    
    if (selectedValue) {
        state.selectedToken = JSON.parse(selectedValue);
        updateAirdropSummary();
    } else {
        state.selectedToken = null;
        elements.airdropSummary.innerHTML = '';
        elements.executeAirdropBtn.style.display = 'none';
    }
}

// Update airdrop summary
function updateAirdropSummary() {
    if (!state.selectedToken || !state.recipients.length) {
        return;
    }
    
    const amount = parseFloat(elements.amountPerWallet.value) || 0;
    const distributionType = elements.distributionType.value;
    
    if (amount <= 0) {
        elements.airdropSummary.innerHTML = '';
        elements.executeAirdropBtn.style.display = 'none';
        return;
    }
    
    const totalAmount = distributionType === 'equal' ? 
        amount * state.recipients.length : 
        amount;
    
    const amountPerRecipient = distributionType === 'equal' ? 
        amount : 
        amount / state.recipients.length;
    
    // Check if we have enough balance
    const availableBalance = parseFloat(state.selectedToken.value);
    const hasEnoughBalance = totalAmount <= availableBalance;
    
    const summaryHtml = `
        <h4>Airdrop Summary</h4>
        <div class="summary-item">
            <span>Token:</span>
            <span>${state.selectedToken.currency}</span>
        </div>
        <div class="summary-item">
            <span>Recipients:</span>
            <span>${state.recipients.length}</span>
        </div>
        <div class="summary-item">
            <span>Amount per recipient:</span>
            <span>${amountPerRecipient.toFixed(6)}</span>
        </div>
        <div class="summary-item">
            <span>Total amount needed:</span>
            <span>${totalAmount.toFixed(6)}</span>
        </div>
        <div class="summary-item">
            <span>Available balance:</span>
            <span>${availableBalance.toFixed(6)}</span>
        </div>
        <div class="summary-item">
            <span>Status:</span>
            <span style="color: ${hasEnoughBalance ? 'green' : 'red'}">
                ${hasEnoughBalance ? '✅ Sufficient balance' : '❌ Insufficient balance'}
            </span>
        </div>
    `;
    
    elements.airdropSummary.innerHTML = summaryHtml;
    
    if (hasEnoughBalance) {
        state.airdropConfig = {
            token: state.selectedToken,
            recipients: state.recipients,
            amountPerRecipient: amountPerRecipient,
            totalAmount: totalAmount
        };
        elements.executeAirdropBtn.style.display = 'block';
    } else {
        elements.executeAirdropBtn.style.display = 'none';
    }
}

// Execute airdrop
async function executeAirdrop() {
    if (!confirm('Are you sure you want to execute this airdrop? Each transaction will be signed individually in your Xaman app.')) {
        return;
    }
    
    try {
        showSection('status');
        setLoading(elements.executeAirdropBtn, true);
        
        // Prepare airdrop configuration
        const airdropConfig = {
            token: {
                currency: state.tokenConfig.currency,
                issuer: state.tokenConfig.issuer
            },
            recipients: state.recipients,
            amountPerRecipient: state.tokenConfig.amountPerRecipient,
            totalAmount: state.tokenConfig.totalAmount,
            network: state.selectedNetwork
        };
        
        // Execute with Xaman
        const result = await xamanIntegration.executeAirdropWithXaman(state.recipients, airdropConfig);
        
        if (result.success) {
            console.log('Airdrop completed successfully:', result.summary);
        } else {
            showError('Airdrop execution failed');
        }
        
    } catch (error) {
        console.error('Airdrop execution error:', error);
        showError('Failed to execute airdrop: ' + error.message);
    } finally {
        setLoading(elements.executeAirdropBtn, false);
    }
}

// Show section with updated logic
function showSection(sectionName) {
    // Hide all sections
    Object.values(elements.sections).forEach(section => {
        section.classList.remove('active');
    });
    
    // Show selected section
    elements.sections[sectionName].classList.add('active');
    
    // Handle section-specific logic
    switch (sectionName) {
        case 'review':
            showReviewSummary();
            break;
        case 'xaman':
            // Reset Xaman state when entering section
            xamanIntegration.disconnect();
            break;
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
            
            if (WalletUtils.isValidXRPLAddress(address)) {
                if (!validAddresses.includes(address)) { // Remove duplicates
                    validAddresses.push(address);
                }
            } else {
                invalidAddresses.push(address);
            }
        });
        
        state.recipients = validAddresses;
        displayValidRecipients(validAddresses, invalidAddresses);
        
        if (validAddresses.length > 0) {
            elements.nextToTokenConfigBtn.style.display = 'block';
        }
        
    } catch (error) {
        console.error('Validation error:', error);
        showError('Failed to validate addresses. Please try again.');
    } finally {
        setLoading(elements.validateRecipientsBtn, false);
    }
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
    
    if (state.recipients.length === 0) {
        elements.nextToTokenConfigBtn.style.display = 'none';
    }
    
    // Update token config summary if it exists
    if (state.tokenConfig) {
        updateTokenConfigSummary();
    }
}

// Network selection handler
function handleNetworkChange(event) {
    state.selectedNetwork = event.target.value;
    console.log('Network changed to:', state.selectedNetwork);
}

// Utility functions
function showError(message) {
    alert(message); // Simple error display for now
}

function setLoading(button, isLoading) {
    if (isLoading) {
        button.disabled = true;
        button.textContent = 'Loading...';
        button.classList.add('loading');
    } else {
        button.disabled = false;
        button.classList.remove('loading');
        // Restore original text based on button ID
        const originalTexts = {
            'validate-recipients': 'Validate Addresses',
            'connect-xaman': 'Connect with Xaman',
            'execute-airdrop': '🚀 Execute Airdrop with Xaman'
        };
        button.textContent = originalTexts[button.id] || 'Submit';
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

function loadSavedData() {
    // Load any saved data from localStorage if needed
    // For now, we'll start fresh each time
}

// Make removeRecipient globally available
window.removeRecipient = removeRecipient;

// Clear recipients
function clearRecipients() {
    elements.recipientsTextarea.value = '';
    elements.recipientsStatus.innerHTML = '';
    elements.validRecipients.innerHTML = '';
    elements.nextToTokenConfigBtn.style.display = 'none';
    state.recipients = [];
}

// Start over
function startOver() {
    // Reset state
    state.recipients = [];
    state.tokenConfig = null;
    state.connectedWallet = null;
    state.airdropConfig = null;
    
    // Reset form elements
    elements.recipientsTextarea.value = '';
    elements.tokenCurrency.value = '';
    elements.tokenIssuer.value = '';
    elements.amountPerWallet.value = '';
    
    // Hide elements
    elements.nextToTokenConfigBtn.style.display = 'none';
    elements.nextToXamanBtn.style.display = 'none';
    elements.nextToReviewBtn.style.display = 'none';
    elements.executeAirdropBtn.style.display = 'none';
    elements.startOverBtn.style.display = 'none';
    
    // Clear content
    elements.recipientsStatus.innerHTML = '';
    elements.validRecipients.innerHTML = '';
    elements.tokenConfigSummary.innerHTML = '';
    elements.finalSummary.innerHTML = '';
    elements.transactionResults.innerHTML = '';
    
    // Reset progress
    elements.progressFill.style.width = '0%';
    elements.progressText.textContent = '0% Complete';
    
    // Disconnect Xaman
    xamanIntegration.disconnect();
    
    // Show first section
    showSection('network');
}

// Poll airdrop progress
async function pollAirdropProgress(taskId) {
    try {
        const response = await fetch(`${API_BASE_URL}/airdrop/status/${taskId}`);
        const data = await response.json();
        
        if (data.success) {
            updateProgress(data.progress);
            
            if (data.progress.status === 'completed' || data.progress.status === 'failed') {
                displayFinalResults(data.progress);
                elements.startOverBtn.style.display = 'block';
            } else {
                // Continue polling
                setTimeout(() => pollAirdropProgress(taskId), 2000);
            }
        }
    } catch (error) {
        console.error('Progress polling error:', error);
    }
}

// Update progress display
function updateProgress(progress) {
    const percentage = Math.round((progress.completed / progress.total) * 100);
    elements.progressFill.style.width = `${percentage}%`;
    elements.progressText.textContent = `${percentage}% Complete (${progress.completed}/${progress.total})`;
    
    // Update transaction results
    displayTransactionResults(progress.results);
}

// Display transaction results
function displayTransactionResults(results) {
    elements.transactionResults.innerHTML = '';
    
    results.forEach(result => {
        const resultDiv = document.createElement('div');
        resultDiv.className = `transaction-item ${result.status}`;
        
        let statusIcon = '';
        switch (result.status) {
            case 'success':
                statusIcon = '✅';
                break;
            case 'error':
                statusIcon = '❌';
                break;
            case 'pending':
                statusIcon = '⏳';
                break;
        }
        
        resultDiv.innerHTML = `
            <span>${statusIcon} ${result.recipient}</span>
            <span>${result.status === 'success' ? result.tx_hash : result.error}</span>
        `;
        
        elements.transactionResults.appendChild(resultDiv);
    });
}

// Display final results
function displayFinalResults(progress) {
    const successCount = progress.results.filter(r => r.status === 'success').length;
    const errorCount = progress.results.filter(r => r.status === 'error').length;
    
    const summaryDiv = document.createElement('div');
    summaryDiv.className = 'status-info';
    summaryDiv.innerHTML = `
        <h3>Airdrop Complete</h3>
        <p>✅ Successful transactions: ${successCount}</p>
        <p>❌ Failed transactions: ${errorCount}</p>
        <p>Total processed: ${progress.total}</p>
    `;
    
    elements.transactionResults.insertBefore(summaryDiv, elements.transactionResults.firstChild);
}

// Start over
function startOver() {
    // Reset state
    state.connectedWallet = null;
    state.walletInfo = null;
    state.recipients = [];
    state.selectedToken = null;
    state.airdropConfig = null;
    
    // Reset form elements
    elements.walletSeedInput.value = '';
    elements.recipientsTextarea.value = '';
    elements.amountPerWallet.value = '';
    
    // Hide elements
    elements.walletInfo.style.display = 'none';
    elements.nextToRecipientsBtn.style.display = 'none';
    elements.nextToAirdropBtn.style.display = 'none';
    elements.executeAirdropBtn.style.display = 'none';
    elements.startOverBtn.style.display = 'none';
    
    // Clear content
    elements.recipientsStatus.innerHTML = '';
    elements.validRecipients.innerHTML = '';
    elements.airdropSummary.innerHTML = '';
    elements.transactionResults.innerHTML = '';
    
    // Reset progress
    elements.progressFill.style.width = '0%';
    elements.progressText.textContent = '0% Complete';
    
    // Show first section
    showSection('network');
}

// Utility functions
function showError(message) {
    alert(message); // Simple error display for now
}

function setLoading(button, isLoading) {
    if (isLoading) {
        button.disabled = true;
        button.textContent = 'Loading...';
        button.classList.add('loading');
    } else {
        button.disabled = false;
        button.classList.remove('loading');
        // Restore original text based on button ID
        const originalTexts = {
            'connect-wallet': 'Connect Wallet',
            'validate-recipients': 'Validate Addresses',
            'execute-airdrop': 'Execute Airdrop'
        };
        button.textContent = originalTexts[button.id] || 'Submit';
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

function loadSavedData() {
    // Load any saved data from localStorage if needed
    // For now, we'll start fresh each time
}

// Make removeRecipient globally available
window.removeRecipient = removeRecipient;
