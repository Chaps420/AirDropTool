from flask import Blueprint, request, jsonify
import logging
from services.wallet_service import WalletService
from utils.validators import validate_xrpl_address

logger = logging.getLogger(__name__)

# Create blueprint for wallet routes
wallet_bp = Blueprint('wallet', __name__)

@wallet_bp.route('/connect', methods=['POST'])
def connect_wallet():
    """Connect to an XRPL wallet using seed/secret key."""
    try:
        data = request.get_json()
        
        if not data:
            return jsonify({
                'success': False,
                'error': 'No data provided'
            }), 400
        
        seed = data.get('seed')
        network = data.get('network', 'testnet')
        
        if not seed:
            return jsonify({
                'success': False,
                'error': 'Wallet seed is required'
            }), 400
        
        if network not in ['testnet', 'mainnet']:
            return jsonify({
                'success': False,
                'error': 'Invalid network. Must be "testnet" or "mainnet"'
            }), 400
        
        # Connect to wallet using service
        wallet_service = WalletService(network)
        wallet_info = wallet_service.connect_wallet(seed)
        
        return jsonify({
            'success': True,
            'wallet_info': wallet_info,
            'message': 'Wallet connected successfully'
        })
        
    except ValueError as e:
        logger.warning(f'Wallet connection validation error: {str(e)}')
        return jsonify({
            'success': False,
            'error': str(e)
        }), 400
        
    except Exception as e:
        logger.error(f'Wallet connection error: {str(e)}')
        return jsonify({
            'success': False,
            'error': 'Failed to connect wallet'
        }), 500

@wallet_bp.route('/validate', methods=['POST'])
def validate_addresses():
    """Validate a list of XRPL addresses."""
    try:
        data = request.get_json()
        
        if not data:
            return jsonify({
                'success': False,
                'error': 'No data provided'
            }), 400
        
        addresses = data.get('addresses', [])
        
        if not addresses or not isinstance(addresses, list):
            return jsonify({
                'success': False,
                'error': 'Addresses list is required'
            }), 400
        
        if len(addresses) > 1000:
            return jsonify({
                'success': False,
                'error': 'Maximum 1000 addresses allowed'
            }), 400
        
        valid_addresses = []
        invalid_addresses = []
        
        for address in addresses:
            address = address.strip()
            if not address:
                continue
                
            if validate_xrpl_address(address):
                if address not in valid_addresses:  # Avoid duplicates
                    valid_addresses.append(address)
            else:
                invalid_addresses.append(address)
        
        return jsonify({
            'success': True,
            'valid_addresses': valid_addresses,
            'invalid_addresses': invalid_addresses,
            'summary': {
                'total_input': len(addresses),
                'valid_count': len(valid_addresses),
                'invalid_count': len(invalid_addresses),
                'duplicates_removed': len(addresses) - len(valid_addresses) - len(invalid_addresses)
            }
        })
        
    except Exception as e:
        logger.error(f'Address validation error: {str(e)}')
        return jsonify({
            'success': False,
            'error': 'Failed to validate addresses'
        }), 500

@wallet_bp.route('/balance/<address>', methods=['GET'])
def get_wallet_balance():
    """Get balance information for a specific wallet address."""
    try:
        address = request.view_args.get('address')
        network = request.args.get('network', 'testnet')
        
        if not validate_xrpl_address(address):
            return jsonify({
                'success': False,
                'error': 'Invalid XRPL address'
            }), 400
        
        if network not in ['testnet', 'mainnet']:
            return jsonify({
                'success': False,
                'error': 'Invalid network'
            }), 400
        
        wallet_service = WalletService(network)
        balance_info = wallet_service.get_account_info(address)
        
        return jsonify({
            'success': True,
            'balance_info': balance_info
        })
        
    except Exception as e:
        logger.error(f'Balance lookup error: {str(e)}')
        return jsonify({
            'success': False,
            'error': 'Failed to get balance information'
        }), 500

@wallet_bp.route('/tokens/<address>', methods=['GET'])
def get_wallet_tokens():
    """Get token holdings for a specific wallet address."""
    try:
        address = request.view_args.get('address')
        network = request.args.get('network', 'testnet')
        
        if not validate_xrpl_address(address):
            return jsonify({
                'success': False,
                'error': 'Invalid XRPL address'
            }), 400
        
        if network not in ['testnet', 'mainnet']:
            return jsonify({
                'success': False,
                'error': 'Invalid network'
            }), 400
        
        wallet_service = WalletService(network)
        tokens = wallet_service.get_account_tokens(address)
        
        return jsonify({
            'success': True,
            'tokens': tokens
        })
        
    except Exception as e:
        logger.error(f'Token lookup error: {str(e)}')
        return jsonify({
            'success': False,
            'error': 'Failed to get token information'
        }), 500

@wallet_bp.route('/info/<address>', methods=['GET'])
def get_wallet_info():
    """Get comprehensive wallet information including balance and tokens."""
    try:
        address = request.view_args.get('address')
        network = request.args.get('network', 'testnet')
        
        if not validate_xrpl_address(address):
            return jsonify({
                'success': False,
                'error': 'Invalid XRPL address'
            }), 400
        
        if network not in ['testnet', 'mainnet']:
            return jsonify({
                'success': False,
                'error': 'Invalid network'
            }), 400
        
        wallet_service = WalletService(network)
        wallet_info = wallet_service.get_comprehensive_wallet_info(address)
        
        return jsonify({
            'success': True,
            'wallet_info': wallet_info
        })
        
    except Exception as e:
        logger.error(f'Wallet info lookup error: {str(e)}')
        return jsonify({
            'success': False,
            'error': 'Failed to get wallet information'
        }), 500
