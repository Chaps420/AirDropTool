# XRPL Airdrop Tool

A comprehensive tool for executing token airdrops on the XRPL (XRP Ledger) with multiple distribution methods and execution options.

## ⚡ Quick Start

### Option 1: Windows Batch File (Recommended)
Simply double-click: **`START_AIRDROP_TOOL.bat`**

### Option 2: PowerShell Script
Right-click on **`START_AIRDROP_TOOL.ps1`** → "Run with PowerShell"

### Option 3: Python Script
```bash
python start_airdrop_tool.py
```

All launchers will:
- ✅ Check and install dependencies
- ✅ Start the backend server
- ✅ Open the tool in your browser automatically
- ✅ Provide clear status updates

## 🚀 Features

### Distribution Methods
- **Equal Distribution**: Same amount to all recipients
- **Proportional Distribution**: Amount varies based on NFT count/token holdings
- **Custom Distribution**: Specific amounts for each recipient

### File Format Support
- **TXT Files**: 
  - Simple address lists
  - Comma-separated format: `address,count` or `address,amount`
- **CSV Files**: Full header support with `address,count` or `address,amount`

### Execution Methods
- **Sequential Payments**: Cost-effective with transaction fees only (~0.000012 XRP each)
- **Batch Processing**: One-signature execution through Xaman
- **Simulated Mode**: Test without real transactions
- **Real-time Progress**: Live updates during airdrop execution
- **Transaction Tracking**: Monitor success/failure status for each recipient
- **Responsive UI**: Clean, modern interface that works on all devices
- **Security First**: Private keys are handled locally and never stored

## Technology Stack

### Frontend
- **HTML5/CSS3**: Modern, responsive design
- **Vanilla JavaScript**: No framework dependencies for simplicity
- **Modular Architecture**: Clean separation of concerns

### Backend
- **Python 3.8+**: Core application language
- **Flask**: Lightweight web framework
- **xrpl-py**: Official XRPL Python library
- **Flask-CORS**: Cross-origin resource sharing support

## Installation

### Prerequisites
- Python 3.8 or higher
- pip (Python package installer)
- Modern web browser

### Setup Instructions

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd xrpl-airdrop-tool
   ```

2. **Create virtual environment**
   ```bash
   python -m venv venv
   
   # On Windows
   venv\Scripts\activate
   
   # On macOS/Linux
   source venv/bin/activate
   ```

3. **Install dependencies**
   ```bash
   pip install -r requirements.txt
   ```

4. **Configuration (Optional)**
   Create a `.env` file in the root directory:
   ```
   FLASK_ENV=development
   FLASK_DEBUG=True
   SECRET_KEY=your-secret-key-here
   DEFAULT_NETWORK=testnet
   MAX_RECIPIENTS_PER_AIRDROP=1000
   ```

5. **Run the application**
   ```bash
   cd backend
   python app.py
   ```

6. **Open the frontend**
   Open `frontend/index.html` in your web browser, or serve it with a local web server:
   ```bash
   # Using Python's built-in server
   cd frontend
   python -m http.server 3000
   ```
   
   Then visit `http://localhost:3000`

## Usage Guide

### Step 1: Network Selection
- Choose between Testnet (recommended for testing) or Mainnet
- Testnet is safe for experimentation with no real value at risk

### Step 2: Connect Source Wallet
- Enter your wallet seed, secret key, or private key
- **Security Note**: Your private information is processed locally and never transmitted or stored
- The tool will display your wallet address, XRP balance, and available tokens

### Step 3: Add Recipients
- Enter recipient wallet addresses (one per line)
- The tool validates all addresses and shows which ones are valid
- Remove invalid or unwanted addresses as needed

### Step 4: Configure Airdrop
- Select the token you want to distribute from your available balance
- Choose distribution method:
  - **Equal amount**: Send the same amount to each recipient
  - **Total division**: Divide a total amount equally among recipients
- Review the summary including total costs and estimated fees

### Step 5: Execute Airdrop
- Confirm the transaction details
- Monitor real-time progress as transactions are processed
- View detailed results including transaction hashes for successful transfers

## API Documentation

### Base URL
```
http://localhost:5000/api
```

### Endpoints

#### Wallet Operations
- `POST /wallet/connect` - Connect to a wallet
- `POST /wallet/validate` - Validate XRPL addresses
- `GET /wallet/balance/<address>` - Get wallet balance
- `GET /wallet/tokens/<address>` - Get wallet token holdings

#### Airdrop Operations
- `POST /airdrop/execute` - Execute an airdrop
- `GET /airdrop/status/<task_id>` - Get airdrop status
- `POST /airdrop/estimate` - Estimate airdrop costs
- `GET /airdrop/tasks` - List all airdrop tasks

#### System
- `GET /health` - Health check
- `GET /` - API information

## Security Considerations

### Private Key Handling
- Private keys are processed in memory only
- No private keys are logged or stored
- Frontend handles sensitive data securely
- Always use Testnet for initial testing

### Network Security
- API endpoints validate all inputs
- Rate limiting prevents abuse
- CORS configured for frontend communication
- Input sanitization prevents injection attacks

### Best Practices
1. **Test First**: Always test with small amounts on Testnet
2. **Verify Recipients**: Double-check all recipient addresses
3. **Backup Wallets**: Ensure you have backups of your wallet
4. **Monitor Balances**: Check your token balances before large airdrops
5. **Use HTTPS**: In production, always use HTTPS

## Configuration Options

### Environment Variables
- `FLASK_ENV`: Application environment (development/production)
- `FLASK_DEBUG`: Enable debug mode (True/False)
- `DEFAULT_NETWORK`: Default XRPL network (testnet/mainnet)
- `MAX_RECIPIENTS_PER_AIRDROP`: Maximum recipients per airdrop (default: 1000)
- `RATE_LIMIT_PER_SECOND`: Transaction rate limit (default: 1)
- `MIN_XRP_RESERVE`: Minimum XRP reserve required (default: 10)

### Network Configuration
The application supports custom network configurations in `config.py`:
- Server URLs
- WebSocket endpoints
- Explorer URLs
- Network-specific settings

## Troubleshooting

### Common Issues

1. **"Invalid wallet seed" error**
   - Ensure your seed is in the correct format (family seed starting with 's', hex private key, or mnemonic phrase)
   - Check for extra spaces or characters

2. **"Insufficient balance" error**
   - Verify your token balance is sufficient for the total airdrop amount
   - Ensure you have enough XRP for transaction fees

3. **"Connection failed" error**
   - Check your internet connection
   - Verify the XRPL network is accessible
   - Try switching networks

4. **Frontend not connecting to backend**
   - Ensure the Flask server is running on port 5000
   - Check CORS configuration in the backend
   - Verify the API_BASE_URL in the frontend JavaScript

### Performance Tips
- For large airdrops (500+ recipients), expect longer execution times
- Consider breaking very large airdrops into smaller batches
- Monitor XRP balance for transaction fees in large operations

## Development

### Project Structure
```
xrpl-airdrop-tool/
├── frontend/
│   ├── index.html          # Main HTML file
│   ├── css/
│   │   └── style.css       # Styles
│   └── js/
│       ├── app.js          # Main application logic
│       └── wallet.js       # Wallet utilities
├── backend/
│   ├── app.py              # Flask application
│   ├── routes/             # API route handlers
│   ├── services/           # Business logic services
│   ├── models/             # Data models
│   └── utils/              # Utility functions
├── requirements.txt        # Python dependencies
├── config.py              # Configuration settings
└── README.md              # This file
```

### Adding New Features
1. Create service classes in `backend/services/`
2. Add API routes in `backend/routes/`
3. Update frontend JavaScript in `frontend/js/`
4. Add configuration options in `config.py`

### Testing
- Use Testnet for all development and testing
- Test with small amounts first
- Validate edge cases (invalid addresses, insufficient balances)
- Test error handling and recovery

## Contributing

1. Fork the repository
2. Create a feature branch
3. Test thoroughly on Testnet
4. Submit a pull request with detailed description

## License

This project is provided as-is for educational and development purposes. Use at your own risk, especially on Mainnet.

## Support

For issues and questions:
1. Check the troubleshooting section
2. Review the configuration options
3. Test on Testnet first
4. Create an issue with detailed information

## Disclaimer

This tool handles cryptocurrency transactions. Always:
- Test thoroughly on Testnet before using Mainnet
- Verify all recipient addresses
- Keep backups of your wallet information
- Use appropriate security measures for production deployments
- Understand that transactions on XRPL are irreversible
