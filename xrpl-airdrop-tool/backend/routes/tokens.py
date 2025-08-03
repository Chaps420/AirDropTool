from flask import Blueprint, request, jsonify
import logging
from services.xrpl_service import XRPLService

tokens_bp = Blueprint('tokens', __name__)
logger = logging.getLogger(__name__)

@tokens_bp.route('/tokens/<issuer_address>', methods=['GET'])
def get_issuer_tokens(issuer_address):
    """Get tokens issued by a specific address"""
    try:
        network = request.args.get('network', 'testnet')
        
        logger.info(f"Fetching tokens for issuer: {issuer_address} on {network}")
        
        xrpl_service = XRPLService(network)
        tokens = xrpl_service.get_issuer_tokens(issuer_address)
        
        return jsonify({
            'success': True,
            'tokens': tokens,
            'issuer': issuer_address,
            'network': network
        })
        
    except Exception as e:
        logger.error(f"Error fetching tokens for issuer {issuer_address}: {str(e)}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@tokens_bp.route('/wallet/<wallet_address>/tokens', methods=['GET'])
def get_wallet_tokens(wallet_address):
    """Get all tokens held by a specific wallet"""
    try:
        network = request.args.get('network', 'testnet')
        
        logger.info(f"Fetching tokens for wallet: {wallet_address} on {network}")
        
        xrpl_service = XRPLService(network)
        
        # Prepare tokens list
        tokens = []
        xrp_balance = 0
        is_funded = False
        
        try:
            # Try to get account info and token holdings
            account_info = xrpl_service.get_account_info(wallet_address)
            token_holdings = xrpl_service.get_account_tokens(wallet_address)
            
            xrp_balance = account_info['xrp_balance']
            is_funded = True
            
            # Add XRP as the first option
            tokens.append({
                'currency': 'XRP',
                'issuer': None,
                'balance': xrp_balance,
                'currency_name': 'XRP',
                'type': 'native'
            })
            
            # Add other tokens from trust lines
            for token in token_holdings:
                tokens.append({
                    'currency': token['currency'],
                    'issuer': token['issuer'],
                    'balance': float(token['balance']),
                    'currency_name': token['currency'],
                    'type': 'issued'
                })
                
        except Exception as account_error:
            logger.warning(f"Account {wallet_address} not found or unfunded: {str(account_error)}")
            
            # Handle unfunded account - still allow XRP transactions
            is_funded = False
            xrp_balance = 0
            
            tokens.append({
                'currency': 'XRP',
                'issuer': None,
                'balance': 0,
                'currency_name': 'XRP (Unfunded Account)',
                'type': 'native'
            })
        
        return jsonify({
            'success': True,
            'tokens': tokens,
            'wallet_address': wallet_address,
            'network': network,
            'xrp_balance': xrp_balance,
            'is_funded': is_funded
        })
        
    except Exception as e:
        logger.error(f"Error fetching wallet tokens for {wallet_address}: {str(e)}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@tokens_bp.route('/tokens/<issuer_address>/<currency_code>', methods=['GET'])
def get_token_info(issuer_address, currency_code):
    """Get detailed information about a specific token"""
    try:
        network = request.args.get('network', 'testnet')
        
        logger.info(f"Fetching token info: {currency_code} from {issuer_address} on {network}")
        
        xrpl_service = XRPLService(network)
        token_info = xrpl_service.get_token_info(issuer_address, currency_code)
        
        return jsonify({
            'success': True,
            'token': token_info,
            'issuer': issuer_address,
            'currency': currency_code,
            'network': network
        })
        
    except Exception as e:
        logger.error(f"Error fetching token info {currency_code} from {issuer_address}: {str(e)}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500
