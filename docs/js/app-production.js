// Production XRPL Airdrop Tool - Client-Side Application
console.log('Loading production XRPL Airdrop Tool...');

// Global state
const state = {
    connectedWallet: null,
    recipients: [],
    tokenConfig: null,
    distributionMethod: 'equal',
    distributionConfig: {},
    preview: [],
    transactionResults: null
};

// DOM elements
const elements = {
    connectBtn: null,
    walletStatus: null,
    tokenSection: null,
    tokenType: null,
    customTokenConfig: null,
    currencyCode: null,
    issuerAddress: null,
    recipientsSection: null,
    fileInput: null,
    uploadArea: null,
    distributionSection: null,
    previewSection: null,
    executeSection: null,
    executeBtn: null,
    progressSection: null,
    progressFill: null,
    progressText: null,
    resultsSection: null
};

// Initialize application
document.addEventListener('DOMContentLoaded', function() {
    console.log('Initializing production XRPL Airdrop Tool...');
    
    initializeElements();
    setupEventListeners();
    updateUI();
    
    console.log('Application initialized successfully');
});

function initializeElements() {
    elements.connectBtn = document.getElementById('connect-wallet-btn');
    elements.walletStatus = document.getElementById('wallet-status');
    elements.tokenSection = document.getElementById('token-section');
    elements.tokenType = document.getElementById('token-type');
    elements.customTokenConfig = document.getElementById('custom-token-config');
    elements.currencyCode = document.getElementById('currency-code');
    elements.issuerAddress = document.getElementById('issuer-address');
    elements.recipientsSection = document.getElementById('recipients-section');
    elements.fileInput = document.getElementById('file-input');
    elements.uploadArea = document.getElementById('upload-area');
    elements.distributionSection = document.getElementById('distribution-section');
    elements.previewSection = document.getElementById('preview-section');
    elements.executeSection = document.getElementById('execute-section');
    elements.executeBtn = document.getElementById('execute-btn');
    elements.progressSection = document.getElementById('progress-section');
    elements.progressFill = document.getElementById('progress-fill');
    elements.progressText = document.getElementById('progress-text');
    elements.resultsSection = document.getElementById('results-section');
}

function setupEventListeners() {
    // Wallet connection
    if (elements.connectBtn) {
        elements.connectBtn.addEventListener('click', connectWallet);
    }

    // Token type selection
    if (elements.tokenType) {
        elements.tokenType.addEventListener('change', handleTokenTypeChange);
    }

    // File upload
    if (elements.fileInput) {
        elements.fileInput.addEventListener('change', handleFileUpload);
    }

    // Drag and drop
    if (elements.uploadArea) {
        elements.uploadArea.addEventListener('dragover', handleDragOver);
        elements.uploadArea.addEventListener('drop', handleFileDrop);
    }

    // Distribution method
    const methodInputs = document.querySelectorAll('input[name="distribution-method"]');
    methodInputs.forEach(input => {
        input.addEventListener('change', handleDistributionMethodChange);
    });

    // Distribution config inputs
    const equalAmount = document.getElementById('equal-amount');
    const totalAmount = document.getElementById('total-amount');
    
    if (equalAmount) equalAmount.addEventListener('input', updatePreview);
    if (totalAmount) totalAmount.addEventListener('input', updatePreview);

    // Execute button
    if (elements.executeBtn) {
        elements.executeBtn.addEventListener('click', executeAirdrop);
    }
}

async function connectWallet() {
    console.log('Connecting wallet via Xaman...');
    
    try {
        elements.connectBtn.disabled = true;
        elements.connectBtn.textContent = 'Connecting...';

        // Connect via Xaman
        const account = await window.xamanIntegration.connect();
        
        state.connectedWallet = account;
        
        // Get additional account info via XRPL
        try {
            const accountInfo = await window.xrplClient.getAccountInfo(account.address);
            state.connectedWallet = { ...account, ...accountInfo };
        } catch (error) {
            console.warn('Could not fetch account info:', error);
        }

        updateWalletStatus();
        showNextSection('token');
        
    } catch (error) {
        console.error('Wallet connection failed:', error);
        showError('Failed to connect wallet: ' + error.message);
        
        elements.connectBtn.disabled = false;
        elements.connectBtn.textContent = 'Connect with Xaman';
    }
}

function updateWalletStatus() {
    if (state.connectedWallet && elements.walletStatus) {
        elements.walletStatus.innerHTML = `
            <div style="background: #10b981; color: white; padding: 15px; border-radius: 8px;">
                <h3>✅ Wallet Connected</h3>
                <p><strong>Address:</strong> ${state.connectedWallet.address}</p>
                <p><strong>Balance:</strong> ${state.connectedWallet.balance || '0'} XRP</p>
                <p><strong>Network:</strong> Mainnet</p>
                <button class="btn secondary" onclick="disconnectWallet()" style="margin-top: 10px;">
                    Disconnect
                </button>
            </div>
        `;
    }
}

function disconnectWallet() {
    window.xamanIntegration.disconnect();
    state.connectedWallet = null;
    
    elements.walletStatus.innerHTML = `
        <p>Connect your Xaman wallet to begin</p>
        <button class="btn primary" id="connect-wallet-btn">
            Connect with Xaman
        </button>
    `;
    
    // Re-setup event listener
    elements.connectBtn = document.getElementById('connect-wallet-btn');
    elements.connectBtn.addEventListener('click', connectWallet);
    
    // Hide other sections
    hideAllSections();
}

function handleTokenTypeChange() {
    const tokenType = elements.tokenType.value;
    
    if (tokenType === 'custom') {
        elements.customTokenConfig.style.display = 'block';
        state.tokenConfig = null;
    } else {
        elements.customTokenConfig.style.display = 'none';
        state.tokenConfig = {
            currency: 'XRP',
            issuer: null
        };
        showNextSection('recipients');
    }
}

function validateTokenConfig() {
    if (elements.tokenType.value === 'XRP') {
        state.tokenConfig = {
            currency: 'XRP',
            issuer: null
        };
        return true;
    } else {
        const currency = elements.currencyCode.value.trim().toUpperCase();
        const issuer = elements.issuerAddress.value.trim();
        
        if (!currency || currency.length !== 3) {
            showError('Currency code must be exactly 3 characters');
            return false;
        }
        
        if (!issuer || !window.xrplClient.validateAddress(issuer)) {
            showError('Invalid issuer address');
            return false;
        }
        
        state.tokenConfig = {
            currency: currency,
            issuer: issuer
        };
        return true;
    }
}

function handleFileUpload(event) {
    const file = event.target.files[0];
    if (file) {
        processFile(file);
    }
}

function handleDragOver(event) {
    event.preventDefault();
    elements.uploadArea.style.borderColor = '#667eea';
    elements.uploadArea.style.background = '#f8faff';
}

function handleFileDrop(event) {
    event.preventDefault();
    elements.uploadArea.style.borderColor = '#d1d5db';
    elements.uploadArea.style.background = '';
    
    const file = event.dataTransfer.files[0];
    if (file) {
        processFile(file);
    }
}

function processFile(file) {
    console.log('Processing file:', file.name);
    
    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const content = e.target.result;
            const recipients = parseRecipients(content);
            
            if (recipients.length === 0) {
                showError('No valid recipients found in file');
                return;
            }
            
            state.recipients = recipients;
            
            // Update upload area
            elements.uploadArea.innerHTML = `
                <div class="upload-content">
                    <div class="upload-icon">✅</div>
                    <h3>File Uploaded Successfully</h3>
                    <p><strong>${file.name}</strong></p>
                    <p>${recipients.length} recipients loaded</p>
                    <button class="btn secondary" onclick="document.getElementById('file-input').click()">
                        Choose Different File
                    </button>
                </div>
            `;
            
            showNextSection('distribution');
            
        } catch (error) {
            console.error('Error processing file:', error);
            showError('Error processing file: ' + error.message);
        }
    };
    
    reader.readAsText(file);
}

function parseRecipients(content) {
    const lines = content.trim().split('\n');
    const recipients = [];
    
    for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line || line.startsWith('#')) continue; // Skip empty lines and comments
        
        // Skip header row if it looks like one
        if (i === 0 && (line.toLowerCase().includes('address') || line.toLowerCase().includes('recipient'))) {
            continue;
        }
        
        const parts = line.split(',').map(p => p.trim());
        
        if (parts.length >= 1) {
            const address = parts[0];
            const amount = parts.length > 1 ? parseFloat(parts[1]) : null;
            
            // Validate address
            if (window.xrplClient.validateAddress(address)) {
                recipients.push({
                    address: address,
                    amount: amount,
                    originalLine: i + 1
                });
            } else {
                console.warn(`Invalid address on line ${i + 1}: ${address}`);
            }
        }
    }
    
    return recipients;
}

function handleDistributionMethodChange(event) {
    state.distributionMethod = event.target.value;
    
    // Show/hide config sections
    document.getElementById('equal-config').style.display = 
        state.distributionMethod === 'equal' ? 'block' : 'none';
    document.getElementById('proportional-config').style.display = 
        state.distributionMethod === 'proportional' ? 'block' : 'none';
    
    updatePreview();
}

function updatePreview() {
    if (!state.recipients.length || !state.tokenConfig) {
        return;
    }
    
    try {
        let preview = [];
        
        switch (state.distributionMethod) {
            case 'equal':
                const equalAmount = parseFloat(document.getElementById('equal-amount').value);
                if (equalAmount > 0) {
                    preview = state.recipients.map(r => ({
                        address: r.address,
                        amount: equalAmount.toFixed(6)
                    }));
                }
                break;
                
            case 'proportional':
                const totalAmount = parseFloat(document.getElementById('total-amount').value);
                if (totalAmount > 0) {
                    // For proportional, we'd need existing balances
                    // For now, distribute equally
                    const perRecipient = totalAmount / state.recipients.length;
                    preview = state.recipients.map(r => ({
                        address: r.address,
                        amount: perRecipient.toFixed(6)
                    }));
                }
                break;
                
            case 'custom':
                preview = state.recipients.filter(r => r.amount > 0).map(r => ({
                    address: r.address,
                    amount: r.amount.toFixed(6)
                }));
                break;
        }
        
        if (preview.length > 0) {
            state.preview = preview;
            showPreview(preview);
            showNextSection('execute');
        }
        
    } catch (error) {
        console.error('Error updating preview:', error);
    }
}

function showPreview(preview) {
    const previewContent = document.getElementById('preview-content');
    const previewSummary = document.getElementById('preview-summary');
    
    if (!previewContent || !previewSummary) return;
    
    // Calculate totals
    const totalAmount = preview.reduce((sum, p) => sum + parseFloat(p.amount), 0);
    const recipientCount = preview.length;
    
    // Show summary
    previewSummary.innerHTML = `
        <div style="background: #f3f4f6; padding: 15px; border-radius: 8px; margin-bottom: 20px;">
            <h4>Distribution Summary</h4>
            <p><strong>Recipients:</strong> ${recipientCount}</p>
            <p><strong>Total Amount:</strong> ${totalAmount.toFixed(6)} ${state.tokenConfig.currency}</p>
            <p><strong>Method:</strong> ${state.distributionMethod.charAt(0).toUpperCase() + state.distributionMethod.slice(1)}</p>
        </div>
    `;
    
    // Show preview table
    previewContent.innerHTML = `
        <div style="max-height: 300px; overflow-y: auto; border: 1px solid #d1d5db; border-radius: 6px;">
            <table style="width: 100%; border-collapse: collapse;">
                <thead style="background: #f9fafb; position: sticky; top: 0;">
                    <tr>
                        <th style="padding: 10px; text-align: left; border-bottom: 1px solid #d1d5db;">Address</th>
                        <th style="padding: 10px; text-align: right; border-bottom: 1px solid #d1d5db;">Amount</th>
                    </tr>
                </thead>
                <tbody>
                    ${preview.slice(0, 100).map(p => `
                        <tr>
                            <td style="padding: 8px; border-bottom: 1px solid #e5e7eb; font-family: monospace; font-size: 12px;">
                                ${p.address}
                            </td>
                            <td style="padding: 8px; border-bottom: 1px solid #e5e7eb; text-align: right;">
                                ${p.amount} ${state.tokenConfig.currency}
                            </td>
                        </tr>
                    `).join('')}
                    ${preview.length > 100 ? `
                        <tr>
                            <td colspan="2" style="padding: 10px; text-align: center; font-style: italic; color: #666;">
                                ... and ${preview.length - 100} more recipients
                            </td>
                        </tr>
                    ` : ''}
                </tbody>
            </table>
        </div>
    `;
}

async function executeAirdrop() {
    console.log('🔐 Starting Xaman-signed airdrop...');
    
    try {
        // Validation checks
        if (!state.connectedWallet) {
            showError('Please connect your wallet first');
            return;
        }

        if (!state.recipients || state.recipients.length === 0) {
            showError('Please add recipients first');
            return;
        }

        if (!state.tokenConfig) {
            showError('Please configure token settings');
            return;
        }

        if (!state.preview || state.preview.length === 0) {
            showError('Please configure distribution amounts');
            return;
        }

        elements.executeBtn.disabled = true;
        elements.executeBtn.textContent = 'Preparing...';
        elements.progressSection.style.display = 'block';

        updateProgress(0, 'Validating recipients...');

        // Check if Xaman is still connected
        if (!window.xamanIntegration.connected) {
            throw new Error('Xaman wallet disconnected. Please reconnect.');
        }

        updateProgress(10, 'Preparing batch payment for Xaman signing...');

        try {
            // Execute batch payment via Xaman
            const result = await window.xamanIntegration.signPaymentBatch(
                state.preview,
                state.tokenConfig
            );

            updateProgress(100, 'Batch payment completed successfully!');
            
            // Store results
            state.transactionResults = result;
            
            // Show results
            showResults(result);

        } catch (error) {
            console.error('Xaman signing error:', error);
            
            // Handle specific errors
            if (error.message.includes('Missing trust lines')) {
                showError(error.message);
                updateProgress(0, 'Trust line validation failed');
            } else if (error.message.includes('rejected')) {
                showError('Payment was rejected in Xaman');
                updateProgress(0, 'Payment rejected');
            } else if (error.message.includes('timeout')) {
                showError('Payment timed out. Please try again.');
                updateProgress(0, 'Payment timeout');
            } else {
                showError(`Airdrop failed: ${error.message}`);
                updateProgress(0, 'Airdrop failed');
            }
        }

    } catch (error) {
        console.error('Airdrop execution error:', error);
        showError(`Failed to execute airdrop: ${error.message}`);
        updateProgress(0, 'Airdrop failed');
    } finally {
        elements.executeBtn.disabled = false;
        elements.executeBtn.textContent = '🔐 Sign & Execute with Xaman';
    }
}

function updateProgress(percentage, message) {
    if (elements.progressFill) {
        elements.progressFill.style.width = `${percentage}%`;
    }
    
    if (elements.progressText) {
        elements.progressText.textContent = message;
    }
}

function showResults(result) {
    const resultsContent = document.getElementById('results-content');
    
    if (resultsContent) {
        resultsContent.innerHTML = `
            <div style="background: #10b981; color: white; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
                <h3>✅ Airdrop Completed Successfully!</h3>
                <p>Batch payment has been signed and submitted to the XRPL network.</p>
            </div>
            
            <div style="background: #f3f4f6; padding: 15px; border-radius: 8px;">
                <h4>Transaction Details:</h4>
                <p><strong>Status:</strong> ${result.success ? 'Success' : 'Failed'}</p>
                <p><strong>Recipients:</strong> ${result.completedCount || state.preview.length}</p>
                <p><strong>Total Amount:</strong> ${state.preview.reduce((sum, p) => sum + parseFloat(p.amount), 0).toFixed(6)} ${state.tokenConfig.currency}</p>
                ${result.payload && result.payload.txid ? `
                    <p><strong>Transaction Hash:</strong> 
                        <a href="https://livenet.xrpl.org/transactions/${result.payload.txid}" target="_blank" style="color: #667eea;">
                            ${result.payload.txid}
                        </a>
                    </p>
                ` : ''}
            </div>
            
            <div style="margin-top: 20px;">
                <button class="btn primary" onclick="startOver()">
                    Start New Airdrop
                </button>
                <button class="btn secondary" onclick="exportResults()" style="margin-left: 10px;">
                    Export Results
                </button>
            </div>
        `;
    }
    
    showNextSection('results');
}

function startOver() {
    // Reset state
    state.recipients = [];
    state.tokenConfig = null;
    state.distributionMethod = 'equal';
    state.preview = [];
    state.transactionResults = null;
    
    // Reset form elements
    if (elements.tokenType) elements.tokenType.value = 'XRP';
    if (elements.currencyCode) elements.currencyCode.value = '';
    if (elements.issuerAddress) elements.issuerAddress.value = '';
    document.getElementById('equal-amount').value = '';
    document.getElementById('total-amount').value = '';
    
    // Reset file upload
    if (elements.uploadArea) {
        elements.uploadArea.innerHTML = `
            <div class="upload-content">
                <div class="upload-icon">📄</div>
                <h3>Upload Recipients File</h3>
                <p>Drop CSV or TXT file here, or click to browse</p>
                <input type="file" id="file-input" accept=".csv,.txt" hidden>
                <button class="btn secondary" onclick="document.getElementById('file-input').click()">
                    Choose File
                </button>
            </div>
        `;
        
        // Re-setup file input
        elements.fileInput = document.getElementById('file-input');
        elements.fileInput.addEventListener('change', handleFileUpload);
    }
    
    // Hide sections and show token config
    hideAllSections();
    showNextSection('token');
}

function exportResults() {
    if (!state.transactionResults || !state.preview) {
        showError('No results to export');
        return;
    }
    
    const exportData = {
        timestamp: new Date().toISOString(),
        airdrop: {
            token: state.tokenConfig,
            method: state.distributionMethod,
            totalRecipients: state.preview.length,
            totalAmount: state.preview.reduce((sum, p) => sum + parseFloat(p.amount), 0)
        },
        recipients: state.preview,
        transaction: state.transactionResults
    };
    
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `airdrop-results-${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

function showNextSection(section) {
    const sections = {
        token: elements.tokenSection,
        recipients: elements.recipientsSection,
        distribution: elements.distributionSection,
        preview: elements.previewSection,
        execute: elements.executeSection,
        results: elements.resultsSection
    };
    
    if (sections[section]) {
        sections[section].style.display = 'block';
    }
}

function hideAllSections() {
    const sections = [
        elements.tokenSection,
        elements.recipientsSection,
        elements.distributionSection,
        elements.previewSection,
        elements.executeSection,
        elements.resultsSection
    ];
    
    sections.forEach(section => {
        if (section) section.style.display = 'none';
    });
}

function showError(message) {
    // Create error notification
    const errorDiv = document.createElement('div');
    errorDiv.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: #dc2626;
        color: white;
        padding: 15px 20px;
        border-radius: 8px;
        z-index: 10001;
        max-width: 400px;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
    `;
    errorDiv.innerHTML = `
        <div style="display: flex; align-items: center; justify-content: space-between;">
            <div>
                <strong>❌ Error</strong><br>
                ${message}
            </div>
            <button onclick="this.parentElement.parentElement.remove()" style="
                background: none;
                border: none;
                color: white;
                font-size: 18px;
                cursor: pointer;
                margin-left: 15px;
            ">&times;</button>
        </div>
    `;
    
    document.body.appendChild(errorDiv);
    
    // Auto remove after 5 seconds
    setTimeout(() => {
        if (errorDiv.parentElement) {
            errorDiv.remove();
        }
    }, 5000);
}

function showSuccess(message) {
    // Create success notification
    const successDiv = document.createElement('div');
    successDiv.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: #10b981;
        color: white;
        padding: 15px 20px;
        border-radius: 8px;
        z-index: 10001;
        max-width: 400px;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
    `;
    successDiv.innerHTML = `
        <div style="display: flex; align-items: center; justify-content: space-between;">
            <div>
                <strong>✅ Success</strong><br>
                ${message}
            </div>
            <button onclick="this.parentElement.parentElement.remove()" style="
                background: none;
                border: none;
                color: white;
                font-size: 18px;
                cursor: pointer;
                margin-left: 15px;
            ">&times;</button>
        </div>
    `;
    
    document.body.appendChild(successDiv);
    
    // Auto remove after 3 seconds
    setTimeout(() => {
        if (successDiv.parentElement) {
            successDiv.remove();
        }
    }, 3000);
}

function updateUI() {
    // Any additional UI updates can go here
    console.log('UI updated');
}

// Make functions globally available
window.disconnectWallet = disconnectWallet;
window.startOver = startOver;
window.exportResults = exportResults;

console.log('Production XRPL Airdrop Tool loaded successfully');
