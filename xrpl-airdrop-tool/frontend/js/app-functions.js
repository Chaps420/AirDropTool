// Additional functions for the XRPL Airdrop Tool

// Show review summary
function showReviewSummary() {
    const summaryDiv = elements.reviewSummary;
    const totalAmount = parseFloat(state.tokenConfig.amount) * state.recipients.length;
    
    summaryDiv.innerHTML = `
        <div class="review-summary">
            <h3>Airdrop Review</h3>
            
            <div class="summary-section">
                <h4>Network</h4>
                <p>${state.selectedNetwork === 'testnet' ? 'XRPL Testnet' : 'XRPL Mainnet'}</p>
            </div>
            
            <div class="summary-section">
                <h4>Token Configuration</h4>
                <p><strong>Currency:</strong> ${state.tokenConfig.currency}</p>
                ${state.tokenConfig.issuer ? `<p><strong>Issuer:</strong> ${state.tokenConfig.issuer}</p>` : ''}
                <p><strong>Amount per recipient:</strong> ${state.tokenConfig.amount}</p>
            </div>
            
            <div class="summary-section">
                <h4>Recipients</h4>
                <p><strong>Total recipients:</strong> ${state.recipients.length}</p>
                <p><strong>Total tokens to distribute:</strong> ${totalAmount.toFixed(6)}</p>
                <div class="recipients-preview">
                    ${state.recipients.slice(0, 3).map(addr => `<div class="recipient-preview">${addr}</div>`).join('')}
                    ${state.recipients.length > 3 ? `<div class="recipient-more">... and ${state.recipients.length - 3} more</div>` : ''}
                </div>
            </div>
            
            <div class="summary-section">
                <h4>Wallet Connection</h4>
                <p class="wallet-status">
                    ${state.connectedWallet ? 
                        `✅ Connected: ${state.connectedWallet.address}` : 
                        '⚠️ Wallet not connected yet'
                    }
                </p>
            </div>
        </div>
    `;
}

// Execute airdrop
async function executeAirdrop() {
    if (!state.connectedWallet) {
        showError('Please connect your wallet first.');
        return;
    }
    
    try {
        setLoading(elements.executeAirdropBtn, true);
        
        // Prepare airdrop data
        const airdropData = {
            network: state.selectedNetwork,
            token: state.tokenConfig,
            recipients: state.recipients,
            wallet: state.connectedWallet
        };
        
        console.log('Executing airdrop with:', airdropData);
        
        // For demo purposes, show success after a delay
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // In a real implementation, this would:
        // 1. Create Xaman payload for transaction signing
        // 2. Wait for user to sign on their mobile device
        // 3. Submit transactions to XRPL
        // 4. Monitor transaction status
        
        alert('🎉 Airdrop completed successfully!\n\nIn a real implementation, this would create and submit actual XRPL transactions.');
        
        // Reset the application
        resetApplication();
        
    } catch (error) {
        console.error('Airdrop execution error:', error);
        showError('Failed to execute airdrop. Please try again.');
    } finally {
        setLoading(elements.executeAirdropBtn, false);
    }
}

// Reset application
function resetApplication() {
    // Reset state
    state.selectedNetwork = 'testnet';
    state.recipients = [];
    state.tokenConfig = null;
    state.connectedWallet = null;
    
    // Reset UI - no showStep function needed for single page layout
    // Just reset the form values and hide status sections
    
    // Reset form values
    elements.recipientsTextarea.value = '';
    elements.recipientsStatus.innerHTML = '';
    elements.validRecipients.innerHTML = '';
    elements.tokenConfigSummary.innerHTML = '';
    elements.reviewSummary.innerHTML = '';
    
    // Reset buttons
    elements.nextToTokenConfigBtn.style.display = 'none';
    elements.nextToXamanBtn.style.display = 'none';
    elements.nextToReviewBtn.style.display = 'none';
    
    // Clear Xaman connection
    if (window.xamanIntegration) {
        window.xamanIntegration.disconnect();
    }
    
    console.log('Application reset');
}

// Fetch available tokens from issuer
async function fetchAvailableTokens() {
    const issuerAddress = elements.tokenIssuer.value.trim();
    
    if (!issuerAddress) {
        showError('Please enter an issuer address first.');
        return;
    }
    
    if (!WalletUtils.isValidXRPLAddress(issuerAddress)) {
        showError('Please enter a valid XRPL address.');
        return;
    }
    
    try {
        setLoading(elements.fetchTokensBtn, true);
        
        // Call backend API to fetch tokens
        const response = await fetch(`http://127.0.0.1:5000/api/tokens/${issuerAddress}?network=${state.selectedNetwork}`);
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        
        if (data.success && data.tokens && data.tokens.length > 0) {
            displayAvailableTokens(data.tokens);
        } else {
            showNoTokensFound();
        }
        
    } catch (error) {
        console.error('Error fetching tokens:', error);
        showError('Failed to fetch tokens. Please check the issuer address and try again.');
    } finally {
        setLoading(elements.fetchTokensBtn, false);
    }
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
