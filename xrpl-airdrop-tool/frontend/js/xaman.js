// Xaman (formerly XUMM) integration for XRPL Airdrop Tool
// Based on https://docs.xaman.dev/

class XamanIntegration {
    constructor() {
        this.apiKey = null; // Set your Xaman API key here
        this.apiSecret = null; // Set your Xaman API secret here
        this.baseUrl = 'https://xumm.app/api/v1/platform';
        this.connectedAccount = null;
        this.payloadId = null;
        this.websocket = null;
        this.connectionResolve = null;
        this.connectionReject = null;
        
        console.log('XamanIntegration constructor called');
    }

    // Main connect method - called from the UI
    async connect() {
        console.log('XamanIntegration.connect() called');
        try {
            // Show QR container
            const qrContainer = document.getElementById('xaman-qr-container');
            if (qrContainer) {
                qrContainer.style.display = 'block';
            }
            
            // Initialize the connection flow
            await this.initializeConnection();
            
            // Return a promise that resolves when connection is successful
            return new Promise((resolve, reject) => {
                this.connectionResolve = resolve;
                this.connectionReject = reject;
                
                // Set a timeout for the connection
                setTimeout(() => {
                    if (this.connectionReject) {
                        this.connectionReject(new Error('Connection timeout'));
                        this.connectionResolve = null;
                        this.connectionReject = null;
                    }
                }, 30000); // 30 second timeout
            });
            
        } catch (error) {
            console.error('Xaman connect error:', error);
            throw error;
        }
    }

    // Initialize Xaman connection
    async initializeConnection() {
        try {
            // For demo purposes, we'll use a mock QR code
            // In production, you would:
            // 1. Register your app with Xaman
            // 2. Get API credentials
            // 3. Create sign-in payload
            // 4. Display real QR code
            
            this.showMockQRCode();
            this.startConnectionPolling();
            
        } catch (error) {
            console.error('Xaman initialization error:', error);
            throw new Error('Failed to initialize Xaman connection');
        }
    }

    // Show mock QR code for demonstration
    showMockQRCode() {
        const qrContainer = document.getElementById('xaman-qr-code');
        
        // Create mock QR code (in production, this would be the real Xaman QR)
        qrContainer.innerHTML = `
            <div style="width: 200px; height: 200px; background: linear-gradient(45deg, #667eea, #764ba2); 
                        border-radius: 12px; display: flex; align-items: center; justify-content: center; 
                        color: white; font-size: 14px; text-align: center; margin: 0 auto;">
                <div>
                    <div style="font-size: 24px; margin-bottom: 10px;">📱</div>
                    <div>Mock QR Code</div>
                    <div style="font-size: 12px; margin-top: 5px;">Click to simulate scan</div>
                </div>
            </div>
        `;
        
        // Add click handler for demo
        qrContainer.addEventListener('click', () => {
            this.simulateSuccessfulConnection();
        });
    }

    // Start polling for connection status
    startConnectionPolling() {
        document.getElementById('xaman-loading').style.display = 'block';
        document.getElementById('xaman-status-text').textContent = 'Waiting for Xaman app connection...';
        
        // In production, this would poll the Xaman API
        // For demo, we'll just show the loading state
    }

    // Simulate successful connection for demo
    async simulateSuccessfulConnection() {
        try {
            // Hide QR and loading
            document.getElementById('xaman-qr-container').style.display = 'none';
            document.getElementById('xaman-loading').style.display = 'none';
            
            // Simulate getting account info
            const mockAccount = {
                address: 'rN7n7otQDd6FczFgLdSqtcsAUxDkw6fzRH', // Mock testnet address
                balance: '1000.5', // Mock XRP balance
                network: window.state?.selectedNetwork || 'testnet'
            };
            
            this.connectedAccount = mockAccount;
            
            // Update UI
            this.displayConnectedWallet(mockAccount);
            
            // Check if wallet has the required token
            await this.checkTokenBalance();
            
            // Resolve the connection promise if it exists
            if (this.connectionResolve) {
                this.connectionResolve(mockAccount);
                this.connectionResolve = null;
                this.connectionReject = null;
            }
            
            return mockAccount;
            
        } catch (error) {
            console.error('Connection simulation error:', error);
            this.showConnectionError(error.message);
            
            // Reject the connection promise if it exists
            if (this.connectionReject) {
                this.connectionReject(error);
                this.connectionResolve = null;
                this.connectionReject = null;
            }
            
            throw error;
        }
    }

    // Display connected wallet information
    displayConnectedWallet(account) {
        document.getElementById('xaman-wallet-address').textContent = account.address;
        document.getElementById('xaman-xrp-balance').textContent = account.balance;
        document.getElementById('xaman-wallet-info').style.display = 'block';
    }

    // Check if wallet has the required token
    async checkTokenBalance() {
        const currency = document.getElementById('token-currency').value.trim().toUpperCase();
        const issuer = document.getElementById('token-issuer').value.trim();
        
        if (!currency || !issuer) {
            return;
        }
        
        try {
            // In production, query XRPL for actual token balance
            // For demo, simulate token check
            const hasToken = Math.random() > 0.3; // 70% chance of having token
            const tokenBalance = hasToken ? (Math.random() * 10000).toFixed(6) : '0';
            
            const tokenCheckDiv = document.getElementById('xaman-token-check');
            
            if (hasToken && parseFloat(tokenBalance) > 0) {
                tokenCheckDiv.className = 'token-check valid';
                tokenCheckDiv.innerHTML = `
                    <h4>✅ Token Balance Found</h4>
                    <p><strong>Token:</strong> ${currency}</p>
                    <p><strong>Issuer:</strong> ${issuer}</p>
                    <p><strong>Balance:</strong> ${tokenBalance}</p>
                `;
            } else {
                tokenCheckDiv.className = 'token-check invalid';
                tokenCheckDiv.innerHTML = `
                    <h4>⚠️ Token Not Found</h4>
                    <p>This wallet doesn't hold the specified token: ${currency}</p>
                    <p>Please check the currency code and issuer address, or use a different wallet.</p>
                `;
            }
            
        } catch (error) {
            console.error('Token balance check error:', error);
        }
    }

    // Create Xaman payment payload
    async createPaymentPayload(destination, amount, currency, issuer) {
        try {
            // In production, create actual Xaman payload
            const payload = {
                txjson: {
                    TransactionType: 'Payment',
                    Account: this.connectedAccount.address,
                    Destination: destination,
                    Amount: currency === 'XRP' ? 
                        (parseFloat(amount) * 1000000).toString() : // Convert XRP to drops
                        {
                            currency: currency,
                            issuer: issuer,
                            value: amount.toString()
                        }
                },
                custom_meta: {
                    instruction: `Airdrop payment to ${destination}`,
                    blob: {
                        purpose: 'XRPL Airdrop Tool',
                        amount: amount,
                        currency: currency,
                        recipient: destination
                    }
                }
            };
            
            // For demo, return mock payload
            return {
                uuid: 'mock-payload-' + Date.now(),
                next: {
                    always: 'https://demo.xrpl-airdrop.app/return'
                },
                refs: {
                    qr_png: 'data:image/png;base64,mock-qr-data',
                    qr_uri_quality_opts: ['m', 'q', 'h'],
                    websocket_status: 'wss://xumm.app/sign/mock-payload-' + Date.now()
                }
            };
            
        } catch (error) {
            console.error('Payload creation error:', error);
            throw new Error('Failed to create payment payload');
        }
    }

    // Execute airdrop with Xaman signing
    async executeAirdropWithXaman(recipients, tokenConfig) {
        try {
            const results = [];
            let successCount = 0;
            let failureCount = 0;
            
            for (let i = 0; i < recipients.length; i++) {
                const recipient = recipients[i];
                
                try {
                    // Update progress
                    const progress = ((i) / recipients.length) * 100;
                    this.updateExecutionProgress(progress, i, recipients.length);
                    
                    // Create payment payload for this recipient
                    const payload = await this.createPaymentPayload(
                        recipient,
                        tokenConfig.amountPerRecipient,
                        tokenConfig.token.currency,
                        tokenConfig.token.issuer
                    );
                    
                    // For demo, simulate user signing
                    const signed = await this.simulateUserSigning(payload, recipient, i);
                    
                    if (signed.success) {
                        results.push({
                            recipient: recipient,
                            status: 'success',
                            tx_hash: signed.txHash,
                            amount: tokenConfig.amountPerRecipient
                        });
                        successCount++;
                    } else {
                        results.push({
                            recipient: recipient,
                            status: 'error',
                            error: signed.error,
                            amount: tokenConfig.amountPerRecipient
                        });
                        failureCount++;
                    }
                    
                    // Update transaction results
                    this.updateTransactionResults(results);
                    
                    // Delay between transactions
                    if (i < recipients.length - 1) {
                        await this.delay(2000); // 2 second delay
                    }
                    
                } catch (error) {
                    console.error(`Transaction error for ${recipient}:`, error);
                    results.push({
                        recipient: recipient,
                        status: 'error',
                        error: error.message,
                        amount: tokenConfig.amountPerRecipient
                    });
                    failureCount++;
                }
            }
            
            // Final progress update
            this.updateExecutionProgress(100, recipients.length, recipients.length);
            
            // Show completion summary
            this.showCompletionSummary(successCount, failureCount, recipients.length);
            
            return {
                success: true,
                results: results,
                summary: {
                    total: recipients.length,
                    successful: successCount,
                    failed: failureCount
                }
            };
            
        } catch (error) {
            console.error('Airdrop execution error:', error);
            throw new Error('Failed to execute airdrop');
        }
    }

    // Simulate user signing in Xaman app
    async simulateUserSigning(payload, recipient, index) {
        try {
            // Show signing prompt
            const signResult = await this.showSigningPrompt(recipient, index);
            
            if (signResult.approved) {
                // Simulate successful transaction
                return {
                    success: true,
                    txHash: 'mock-tx-hash-' + Date.now() + '-' + index,
                    signedAt: new Date().toISOString()
                };
            } else {
                return {
                    success: false,
                    error: 'User declined transaction'
                };
            }
            
        } catch (error) {
            return {
                success: false,
                error: error.message
            };
        }
    }

    // Show signing prompt for demo
    async showSigningPrompt(recipient, index) {
        return new Promise((resolve) => {
            // For demo, auto-approve most transactions
            const autoApprove = Math.random() > 0.1; // 90% approval rate
            
            setTimeout(() => {
                resolve({
                    approved: autoApprove,
                    reason: autoApprove ? 'signed' : 'declined'
                });
            }, 1000 + Math.random() * 2000); // 1-3 second delay
        });
    }

    // Update execution progress
    updateExecutionProgress(percentage, completed, total) {
        const progressFill = document.getElementById('progress-fill');
        const progressText = document.getElementById('progress-text');
        
        progressFill.style.width = `${percentage}%`;
        progressText.textContent = `${Math.round(percentage)}% Complete (${completed}/${total})`;
    }

    // Update transaction results display
    updateTransactionResults(results) {
        const resultsContainer = document.getElementById('transaction-results');
        resultsContainer.innerHTML = '';
        
        results.forEach(result => {
            const resultDiv = document.createElement('div');
            resultDiv.className = `transaction-item ${result.status}`;
            
            let statusIcon = '';
            let resultText = '';
            
            switch (result.status) {
                case 'success':
                    statusIcon = '✅';
                    resultText = result.tx_hash;
                    break;
                case 'error':
                    statusIcon = '❌';
                    resultText = result.error;
                    break;
                default:
                    statusIcon = '⏳';
                    resultText = 'Processing...';
            }
            
            resultDiv.innerHTML = `
                <span>${statusIcon} ${WalletUtils.formatAddress(result.recipient)}</span>
                <span>${resultText}</span>
            `;
            
            resultsContainer.appendChild(resultDiv);
        });
    }

    // Show completion summary
    showCompletionSummary(successful, failed, total) {
        const summaryDiv = document.createElement('div');
        summaryDiv.className = 'status-info';
        summaryDiv.innerHTML = `
            <h3>🎉 Airdrop Complete!</h3>
            <p>✅ Successful transactions: ${successful}</p>
            <p>❌ Failed transactions: ${failed}</p>
            <p>📊 Total processed: ${total}</p>
            <p>📈 Success rate: ${((successful / total) * 100).toFixed(1)}%</p>
        `;
        
        const resultsContainer = document.getElementById('transaction-results');
        resultsContainer.insertBefore(summaryDiv, resultsContainer.firstChild);
        
        // Show start over button
        document.getElementById('start-over').style.display = 'block';
    }

    // Show connection error
    showConnectionError(message) {
        document.getElementById('xaman-status-text').innerHTML = `
            <div style="color: #dc2626;">
                ❌ Connection failed: ${message}
            </div>
        `;
    }

    // Utility: Delay function
    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    // Main connect method - called from the UI
    async connect() {
        try {
            // Show QR container
            document.getElementById('xaman-qr-container').style.display = 'block';
            
            // Initialize the connection flow
            await this.initializeConnection();
            
            // Return a promise that resolves when connection is successful
            return new Promise((resolve, reject) => {
                this.connectionResolve = resolve;
                this.connectionReject = reject;
                
                // Set a timeout for the connection
                setTimeout(() => {
                    if (this.connectionReject) {
                        this.connectionReject(new Error('Connection timeout'));
                    }
                }, 30000); // 30 second timeout
            });
            
        } catch (error) {
            console.error('Xaman connect error:', error);
            throw error;
        }
    }

    // Disconnect from Xaman
    disconnect() {
        this.connectedAccount = null;
        this.payloadId = null;
        
        if (this.websocket) {
            this.websocket.close();
            this.websocket = null;
        }
        
        // Reset UI
        document.getElementById('xaman-wallet-info').style.display = 'none';
        document.getElementById('xaman-qr-container').style.display = 'none';
        document.getElementById('next-to-review').style.display = 'none';
    }
}

// Create global Xaman integration instance
console.log('Creating XamanIntegration instance...');
try {
    window.xamanIntegration = new XamanIntegration();
    console.log('XamanIntegration instance created successfully:', window.xamanIntegration);
    console.log('Connect method available:', typeof window.xamanIntegration.connect);
} catch (error) {
    console.error('Error creating XamanIntegration instance:', error);
}
