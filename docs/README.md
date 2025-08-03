# XRPL Airdrop Tool

🚀 **Professional XRPL token distribution platform**

[![Live Demo](https://img.shields.io/badge/Demo-GitHub%20Pages-blue)](https://chaps420.github.io/AirDropTool/)
[![Download](https://img.shields.io/badge/Download-Latest-green)](https://github.com/Chaps420/AirDropTool/archive/refs/heads/master.zip)
[![License](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

## 🌟 Features

- **Multi-Token Support**: Distribute XRP and custom XRPL tokens
- **Multiple Distribution Methods**: Equal, proportional, or custom amounts
- **Xaman Integration**: Secure wallet connection via Xaman (formerly XUMM)
- **Batch Processing**: Efficient payments with XRPL ticket system
- **Real-time Tracking**: Live progress updates and transaction monitoring
- **Built-in Validation**: Address validation and balance checking

## 🎯 Quick Start

### Option 1: Try the Demo
Visit the [**Live Demo**](https://chaps420.github.io/AirDropTool/) to see the interface and features.

### Option 2: Run Locally (Full Functionality)

1. **Download the tool:**
   ```bash
   git clone https://github.com/Chaps420/AirDropTool.git
   cd AirDropTool/xrpl-airdrop-tool
   ```

2. **Install dependencies:**
   ```bash
   pip install -r requirements.txt
   ```

3. **Launch the application:**
   ```bash
   python start_airdrop_tool.py
   ```

4. **Open your browser:**
   Navigate to `http://localhost:5000`

## 📋 System Requirements

- Python 3.7+
- Modern web browser
- Xaman mobile app
- XRPL testnet/mainnet access

## 🏗️ Architecture

### Backend (Python/Flask)
- RESTful API architecture
- XRPL network integration
- Ticket-based batch processing
- Real-time WebSocket updates

### Frontend (JavaScript)
- Modern responsive UI
- Real-time progress tracking
- CSV/TXT file upload support
- Interactive transaction monitoring

## 📖 Usage Guide

1. **Connect Wallet**: Use Xaman app to connect your XRPL wallet
2. **Select Token**: Choose XRP or custom token for distribution
3. **Upload Recipients**: CSV or TXT file with addresses and amounts
4. **Choose Method**: Equal distribution, proportional, or custom
5. **Execute Airdrop**: Monitor real-time progress and results

## 🔧 Configuration

The tool supports both XRPL Testnet and Mainnet:
- **Testnet**: For testing and development
- **Mainnet**: For production airdrops

## 📁 Project Structure

```
xrpl-airdrop-tool/
├── backend/              # Flask API server
│   ├── app.py           # Main application
│   ├── routes/          # API endpoints
│   ├── services/        # Business logic
│   └── utils/           # Utilities
├── frontend/            # Web interface
│   ├── index.html       # Main page
│   ├── css/            # Stylesheets
│   └── js/             # JavaScript
├── requirements.txt     # Python dependencies
└── start_airdrop_tool.py # Launch script
```

## 🛡️ Security Features

- Wallet validation and verification
- Transaction signing via Xaman app
- Balance checking before distribution
- Error handling and rollback capabilities
- Secure API communication

## 📊 Supported File Formats

### CSV Format
```csv
address,amount
rN7n7otQDd6FczFgLdSqtcsAUxDkw6fzRH,100
rPEPPER7kfTD9w2To4CQk6UCfuHM9c6GDY,250
```

### TXT Format
```
rN7n7otQDd6FczFgLdSqtcsAUxDkw6fzRH,100
rPEPPER7kfTD9w2To4CQk6UCfuHM9c6GDY,250
```

## 🤝 Contributing

Contributions are welcome! Please feel free to submit issues, feature requests, or pull requests.

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🔗 Links

- [XRPL Documentation](https://xrpl.org)
- [Xaman Wallet](https://xaman.app)
- [Live Demo](https://chaps420.github.io/AirDropTool/)

## 📞 Support

For questions or support, please open an issue on GitHub.

---

**⚠️ Disclaimer**: This tool is for educational and development purposes. Always test on testnet before using on mainnet. Use at your own risk.
