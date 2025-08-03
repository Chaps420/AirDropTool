from flask import Blueprint, request, jsonify
import requests
import logging
import json

xaman_bp = Blueprint('xaman', __name__)
logger = logging.getLogger(__name__)

# Your Xaman API credentials
XAMAN_API_KEY = '335efd5b-f1c8-450e-b844-bd26b8c223f0'
XAMAN_API_SECRET = '5715a322-ff36-4c80-bc42-e7ccf0c0225d'
XAMAN_BASE_URL = 'https://xumm.app/api/v1/platform'

@xaman_bp.route('/xaman/signin', methods=['POST'])
def create_signin_payload():
    """Create a Xaman sign-in payload"""
    try:
        # Get network from request
        data = request.get_json() or {}
        network = data.get('network', 'testnet')
        
        logger.info(f"Creating Xaman sign-in payload for network: {network}")
        
        # Create sign-in payload
        payload_data = {
            "txjson": {
                "TransactionType": "SignIn"
            },
            "options": {
                "submit": False,
                "multisign": False,
                "expire": 5  # 5 minutes
            },
            "custom_meta": {
                "identifier": "xrpl-airdrop-tool-signin",
                "blob": {
                    "purpose": "sign-in",
                    "network": network,
                    "created": "2025-07-25T00:00:00.000Z"
                },
                "instruction": "Sign in to connect your wallet to the XRPL Airdrop Tool"
            }
        }
        
        # Make request to Xaman API
        headers = {
            'Content-Type': 'application/json',
            'X-API-Key': XAMAN_API_KEY,
            'X-API-Secret': XAMAN_API_SECRET,
            'Authorization': f'Bearer {XAMAN_API_KEY}'
        }
        
        response = requests.post(
            f'{XAMAN_BASE_URL}/payload',
            headers=headers,
            json=payload_data,
            timeout=30
        )
        
        if response.status_code == 200:
            result = response.json()
            logger.info(f"Xaman payload created successfully: {result.get('uuid', 'unknown')}")
            return jsonify({
                'success': True,
                'payload': result
            })
        else:
            error_msg = f"Xaman API error: {response.status_code} - {response.text}"
            logger.error(error_msg)
            return jsonify({
                'success': False,
                'error': error_msg
            }), 400
            
    except Exception as e:
        logger.error(f"Error creating Xaman sign-in payload: {str(e)}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@xaman_bp.route('/xaman/payload/<payload_uuid>', methods=['GET'])
def get_payload_status(payload_uuid):
    """Get the status of a Xaman payload"""
    try:
        logger.info(f"Getting status for Xaman payload: {payload_uuid}")
        
        headers = {
            'X-API-Key': XAMAN_API_KEY,
            'X-API-Secret': XAMAN_API_SECRET,
            'Authorization': f'Bearer {XAMAN_API_KEY}'
        }
        
        response = requests.get(
            f'{XAMAN_BASE_URL}/payload/{payload_uuid}',
            headers=headers,
            timeout=30
        )
        
        if response.status_code == 200:
            result = response.json()
            logger.info(f"Payload status retrieved successfully")
            return jsonify({
                'success': True,
                'payload': result
            })
        else:
            error_msg = f"Xaman API error: {response.status_code} - {response.text}"
            logger.error(error_msg)
            return jsonify({
                'success': False,
                'error': error_msg
            }), 400
            
    except Exception as e:
        logger.error(f"Error getting Xaman payload status: {str(e)}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@xaman_bp.route('/xaman/ping', methods=['POST'])
def ping_xaman():
    """Test Xaman API connectivity"""
    try:
        logger.info("Testing Xaman API connectivity")
        
        headers = {
            'Content-Type': 'application/json',
            'X-API-Key': XAMAN_API_KEY,
            'X-API-Secret': XAMAN_API_SECRET,
            'Authorization': f'Bearer {XAMAN_API_KEY}'
        }
        
        response = requests.post(
            f'{XAMAN_BASE_URL}/ping',
            headers=headers,
            json={},
            timeout=30
        )
        
        if response.status_code == 200:
            result = response.json()
            logger.info("Xaman API ping successful")
            return jsonify({
                'success': True,
                'result': result
            })
        else:
            error_msg = f"Xaman API error: {response.status_code} - {response.text}"
            logger.error(error_msg)
            return jsonify({
                'success': False,
                'error': error_msg
            }), 400
            
    except Exception as e:
        logger.error(f"Error pinging Xaman API: {str(e)}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500
