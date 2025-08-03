"""
Payment-related routes for XRPL transactions via Xaman
"""
import logging
from flask import Blueprint, request, jsonify
import requests
import sys
import os

# Add parent directory to path for imports
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
sys.path.append(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))

from services.xrpl_service import XRPLService
from utils.validators import validate_xrpl_address

# Xaman API credentials (should be moved to environment variables in production)
XAMAN_API_KEY = '335efd5b-f1c8-450e-b844-bd26b8c223f0'
XAMAN_API_SECRET = '5715a322-ff36-4c80-bc42-e7ccf0c0225d'

# Configure logging
logger = logging.getLogger(__name__)

# Create blueprint
payments_bp = Blueprint('payments', __name__)

# Xaman API configuration
XAMAN_BASE_URL = 'https://xumm.app/api/v1/platform'

@payments_bp.route('/create-payment-payload', methods=['POST'])
def create_payment_payload():
    """Create a Xaman payment payload for transaction signing"""
    try:
        data = request.get_json()
        logger.info(f"Received payload request: {data}")
        
        if not data:
            logger.error("No data provided in request")
            return jsonify({'error': 'No data provided'}), 400
            
        transaction = data.get('transaction')
        custom_meta = data.get('custom_meta', {})
        
        if not transaction:
            logger.error("Transaction data missing from request")
            return jsonify({'error': 'Transaction data required'}), 400
            
        logger.info(f"Transaction data: {transaction}")
        
        # Validate transaction structure
        required_fields = ['TransactionType', 'Account', 'Destination', 'Amount']
        for field in required_fields:
            if field not in transaction:
                logger.error(f"Missing required field: {field}")
                return jsonify({'error': f'Missing required field: {field}'}), 400
                
        # Validate addresses
        if not validate_xrpl_address(transaction['Account']):
            logger.error(f"Invalid source address: {transaction['Account']}")
            return jsonify({'error': 'Invalid source address'}), 400
            
        if not validate_xrpl_address(transaction['Destination']):
            logger.error(f"Invalid destination address: {transaction['Destination']}")
            return jsonify({'error': 'Invalid destination address'}), 400
            
        # Prepare Xaman payload
        payload_data = {
            'txjson': transaction,
            'custom_meta': {
                'instruction': custom_meta.get('instruction', 'Sign this payment transaction'),
                'blob_info': custom_meta.get('blob_info', 'XRPL Airdrop Transaction')
            }
        }
        
        # Create payload via Xaman API
        headers = {
            'Content-Type': 'application/json',
            'X-API-Key': XAMAN_API_KEY,
            'X-API-Secret': XAMAN_API_SECRET
        }
        
        logger.info(f"Creating payment payload for {transaction['Destination']}")
        logger.info(f"Payload data being sent to Xaman: {payload_data}")
        
        response = requests.post(
            f"{XAMAN_BASE_URL}/payload",
            json=payload_data,
            headers=headers,
            timeout=10
        )
        
        logger.info(f"Xaman API response status: {response.status_code}")
        logger.info(f"Xaman API response body: {response.text}")
        
        if response.status_code == 200:
            result = response.json()
            logger.info(f"Payment payload created successfully: {result.get('uuid')}")
            return jsonify(result)
        else:
            logger.error(f"Failed to create payment payload: {response.status_code} - {response.text}")
            return jsonify({'error': f'Failed to create payment payload: {response.text}'}), 400
            
    except Exception as e:
        logger.error(f"Error creating payment payload: {str(e)}")
        return jsonify({'error': 'Internal server error'}), 500

@payments_bp.route('/payload-status/<uuid>', methods=['GET'])
def get_payload_status(uuid):
    """Get the status of a Xaman payload"""
    try:
        headers = {
            'X-API-Key': XAMAN_API_KEY,
            'X-API-Secret': XAMAN_API_SECRET
        }
        
        response = requests.get(
            f"{XAMAN_BASE_URL}/payload/{uuid}",
            headers=headers,
            timeout=10
        )
        
        if response.status_code == 200:
            result = response.json()
            return jsonify(result)
        else:
            logger.error(f"Failed to get payload status: {response.status_code} - {response.text}")
            return jsonify({'error': 'Failed to get payload status'}), response.status_code
            
    except Exception as e:
        logger.error(f"Error getting payload status: {str(e)}")
        return jsonify({'error': 'Internal server error'}), 500

@payments_bp.route('/estimate-fees', methods=['GET'])
def estimate_fees():
    """Estimate network fees for transactions"""
    try:
        network = request.args.get('network', 'testnet')
        count = int(request.args.get('count', 1))
        
        # Initialize XRPL service
        xrpl_service = XRPLService()
        
        # Get current base fee from network
        try:
            base_fee = xrpl_service.get_base_fee(network)
        except Exception as e:
            logger.warning(f"Could not get network fee, using default: {e}")
            base_fee = 10  # Default base fee in drops (0.00001 XRP)
            
        # Calculate total fees
        total_fee_drops = base_fee * count
        total_fee_xrp = total_fee_drops / 1000000  # Convert drops to XRP
        
        return jsonify({
            'success': True,
            'network': network,
            'transactionCount': count,
            'baseFeeDrops': base_fee,
            'totalFeeDrops': total_fee_drops,
            'totalFees': total_fee_xrp
        })
        
    except Exception as e:
        logger.error(f"Error estimating fees: {str(e)}")
        return jsonify({
            'success': False,
            'error': 'Failed to estimate fees',
            'totalFees': count * 0.00001  # Fallback
        }), 500
