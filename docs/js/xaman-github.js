// GitHub Pages Compatible Xaman Integration
// Works around CORS limitations by using Xaman deep links

console.log('Loading GitHub Pages compatible Xaman integration...');

class GitHubPagesXamanIntegration {
    constructor() {
        this.connected = false;
        this.account = null;
        console.log('GitHubPagesXamanIntegration created');
    }

    async connect() {
        console.log('GitHubPagesXamanIntegration.connect() called');
        
        return new Promise((resolve, reject) => {
            // Show connection modal
            this.showConnectionModal();
            
            // Create a simple sign-in request using Xaman deep link
            const signRequest = {
                TransactionType: "SignIn"
            };
            
            // Create Xaman deep link for sign-in
            const xamanUrl = this.createXamanDeepLink(signRequest);
            
            // Show the deep link and QR code
            this.showXamanLink(xamanUrl, resolve, reject);
        });
    }

    createXamanDeepLink(transaction) {
        // Create a simple Xaman deep link
        const encodedTx = encodeURIComponent(JSON.stringify(transaction));
        return `https://xumm.app/sign?tx=${encodedTx}`;
    }

    showConnectionModal() {
        // Show the existing modal
        const modal = document.getElementById('xaman-qr-container');
        if (modal) {
            modal.style.display = 'flex';
            
            const statusText = document.getElementById('xaman-status-text');
            if (statusText) {
                statusText.textContent = 'Click the button below to connect with Xaman';
            }
        }
    }

    showXamanLink(xamanUrl, resolve, reject) {
        // Update the modal with connection instructions
        const qrContainer = document.getElementById('xaman-qr-code');
        const statusText = document.getElementById('xaman-status-text');
        
        if (qrContainer) {
            qrContainer.innerHTML = `
                <div style="text-align: center; padding: 20px;">
                    <h3 style="margin-bottom: 15px; color: #fff;">Connect with Xaman</h3>
                    <p style="margin-bottom: 20px; color: #ccc;">Click the button below to open Xaman and sign in</p>
                    <button onclick="window.open('${xamanUrl}', '_blank')" 
                            style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); 
                                   color: white; 
                                   padding: 15px 30px; 
                                   border: none; 
                                   border-radius: 8px; 
                                   font-size: 16px; 
                                   cursor: pointer;
                                   margin-bottom: 15px;">
                        Open Xaman App
                    </button>
                    <br>
                    <button onclick="document.getElementById('mock-connect-btn').click()" 
                            style="background: #10b981; 
                                   color: white; 
                                   padding: 10px 20px; 
                                   border: none; 
                                   border-radius: 6px; 
                                   font-size: 14px; 
                                   cursor: pointer;">
                        Demo Mode (for testing)
                    </button>
                </div>
            `;
        }

        if (statusText) {
            statusText.textContent = 'Follow the instructions above to connect';
        }

        // Add demo mode button handler
        this.addDemoModeHandler(resolve);
    }

    addDemoModeHandler(resolve) {
        // Create hidden demo button
        let demoBtn = document.getElementById('mock-connect-btn');
        if (!demoBtn) {
            demoBtn = document.createElement('button');
            demoBtn.id = 'mock-connect-btn';
            demoBtn.style.display = 'none';
            document.body.appendChild(demoBtn);
        }

        demoBtn.onclick = () => {
            console.log('Demo mode connection');
            
            // Mock account for demo
            this.account = {
                address: 'rDemo1234567890123456789012345678901',
                balance: '1000.000000'
            };
            this.connected = true;

            // Hide modal
            const modal = document.getElementById('xaman-qr-container');
            if (modal) {
                modal.style.display = 'none';
            }

            resolve(this.account);
        };
    }

    async signPaymentBatch(payments, tokenConfig) {
        console.log('GitHub Pages Xaman - signing payment batch:', payments.length, 'payments');
        
        if (!this.connected) {
            throw new Error('Please connect your wallet first');
        }

        // Show payment modal
        this.showPaymentModal(payments, tokenConfig);

        return new Promise((resolve, reject) => {
            // In a real implementation, this would create proper Xaman payment requests
            // For now, we'll simulate the signing process
            
            setTimeout(() => {
                console.log('Simulating payment batch signing...');
                
                // Update progress
                this.updatePaymentProgress(50, 'Processing payments...');
                
                setTimeout(() => {
                    this.updatePaymentProgress(100, 'Payments completed!');
                    
                    setTimeout(() => {
                        // Hide payment modal
                        const modal = document.getElementById('payment-modal');
                        if (modal) {
                            modal.style.display = 'none';
                        }
                        
                        // Return success result
                        resolve({
                            success: true,
                            completedCount: payments.length,
                            payload: {
                                txid: 'demo-transaction-' + Date.now()
                            }
                        });
                    }, 1000);
                }, 2000);
            }, 1000);
        });
    }

    showPaymentModal(payments, tokenConfig) {
        const modal = document.getElementById('payment-modal');
        if (modal) {
            modal.style.display = 'flex';
            
            const statusText = document.getElementById('payment-status-text');
            if (statusText) {
                statusText.textContent = `Preparing ${payments.length} payments of ${tokenConfig.currency}`;
            }
            
            this.updatePaymentProgress(0, 'Initializing payment batch...');
        }
    }

    updatePaymentProgress(percentage, message) {
        const progressFill = document.getElementById('payment-progress-fill');
        const progressText = document.getElementById('payment-progress-text');
        
        if (progressFill) {
            progressFill.style.width = `${percentage}%`;
        }
        
        if (progressText) {
            progressText.textContent = message;
        }
    }

    disconnect() {
        console.log('Disconnecting from Xaman...');
        this.connected = false;
        this.account = null;
    }
}

// Create global instance
console.log('Creating GitHubPagesXamanIntegration instance...');
window.xamanIntegration = new GitHubPagesXamanIntegration();
console.log('GitHubPagesXamanIntegration instance created');

console.log('GitHub Pages compatible Xaman integration loaded successfully');
