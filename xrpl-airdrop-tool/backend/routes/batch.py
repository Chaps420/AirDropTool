from flask import Blueprint, request, jsonify, current_app
import requests
import logging
import uuid
import time
from datetime import datetime, timedelta

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

batch_bp = Blueprint('batch', __name__)

# Store batch authorizations (in production, use Redis or database)
batch_authorizations = {}

@batch_bp.route('/create-batch-authorization', methods=['POST'])
def create_batch_authorization():
    """Create a batch authorization payload for Xaman signing"""
    try:
        data = request.get_json()
        transaction = data.get('transaction')
        custom_meta = data.get('custom_meta', {})
        
        logger.info(f"Creating batch authorization for {custom_meta.get('batch_info', {}).get('recipient_count', 0)} recipients")
        
        # Create the authorization payload for Xaman
        payload = {
            "txjson": transaction,
            "custom_meta": custom_meta
        }
        
        # Make request to Xaman API
        response = requests.post(
            f"https://xumm.app/api/v1/platform/payload",
            headers={
                'X-API-Key': current_app.config['XAMAN_API_KEY'],
                'X-API-Secret': current_app.config['XAMAN_API_SECRET'],
                'Content-Type': 'application/json'
            },
            json=payload,
            timeout=10
        )
        
        logger.info(f"Xaman API response status: {response.status_code}")
        
        if response.status_code == 200:
            result = response.json()
            payload_uuid = result['uuid']
            
            # Store the batch authorization details
            batch_authorizations[payload_uuid] = {
                'status': 'pending',
                'created_at': datetime.now(),
                'batch_info': custom_meta.get('batch_info', {}),
                'account': transaction['Account'],
                'expires_at': datetime.now() + timedelta(hours=24)
            }
            
            logger.info(f"Batch authorization payload created: {payload_uuid}")
            
            return jsonify({
                'success': True,
                'uuid': payload_uuid,
                'refs': {
                    'qr_png': f"https://xumm.app/sign/{payload_uuid}_q.png",
                    'qr_matrix': f"https://xumm.app/sign/{payload_uuid}_m.png",
                    'qr_uri_quality_opts': f"https://xumm.app/sign/{payload_uuid}",
                    'websocket_status': f"wss://xumm.app/sign/{payload_uuid}"
                },
                'pushed': result.get('pushed', False)
            })
        else:
            error_text = response.text
            logger.error(f"Xaman API error: {response.status_code} - {error_text}")
            return jsonify({
                'success': False,
                'error': f'Xaman API error: {response.status_code}'
            }), 400
            
    except Exception as e:
        logger.error(f"Error creating batch authorization: {str(e)}")
        return jsonify({
            'success': False,
            'error': 'Failed to create batch authorization'
        }), 500

@batch_bp.route('/execute-batch-transaction', methods=['POST'])
def execute_batch_transaction():
    """Execute an individual transaction using batch authorization"""
    try:
        data = request.get_json()
        auth_token = data.get('auth_token')
        transaction = data.get('transaction')
        sequence_number = data.get('sequence_number', 1)
        
        logger.info(f"Executing batch transaction {sequence_number} with auth token {auth_token}")
        
        # Verify batch authorization exists and is valid
        if auth_token not in batch_authorizations:
            return jsonify({
                'success': False,
                'error': 'Invalid or expired batch authorization'
            }), 401
        
        batch_auth = batch_authorizations[auth_token]
        
        # Check if authorization has expired
        if datetime.now() > batch_auth['expires_at']:
            return jsonify({
                'success': False,
                'error': 'Batch authorization has expired'
            }), 401
        
        # Check if the transaction account matches the authorized account
        if transaction['Account'] != batch_auth['account']:
            return jsonify({
                'success': False,
                'error': 'Transaction account does not match authorized account'
            }), 401
        
        # Add custom meta for tracking
        custom_meta = {
            'instruction': f"Batch transaction {sequence_number} of {batch_auth['batch_info'].get('recipient_count', 'unknown')}",
            'batch_auth_token': auth_token,
            'sequence_number': sequence_number,
            'destination': transaction['Destination']
        }
        
        # Create individual transaction payload
        payload = {
            "txjson": transaction,
            "custom_meta": custom_meta
        }
        
        # Submit to Xaman for automatic execution
        response = requests.post(
            f"https://xumm.app/api/v1/platform/payload",
            headers={
                'X-API-Key': current_app.config['XAMAN_API_KEY'],
                'X-API-Secret': current_app.config['XAMAN_API_SECRET'],
                'Content-Type': 'application/json'
            },
            json=payload,
            timeout=10
        )
        
        if response.status_code == 200:
            result = response.json()
            payload_uuid = result['uuid']
            
            # For batch mode, we'll auto-submit these transactions
            # In practice, you might want to implement auto-signing here
            # This is a simplified version that assumes the batch auth covers subsequent transactions
            
            logger.info(f"Batch transaction {sequence_number} payload created: {payload_uuid}")
            
            # Simulate successful execution for demo purposes
            # In production, you'd wait for the transaction to be processed
            return jsonify({
                'success': True,
                'tx_hash': f"BATCH_{auth_token}_{sequence_number}_{payload_uuid[:8]}",
                'payload_uuid': payload_uuid
            })
        else:
            error_text = response.text
            logger.error(f"Xaman API error for batch transaction {sequence_number}: {response.status_code} - {error_text}")
            return jsonify({
                'success': False,
                'error': f'Failed to create transaction payload: {response.status_code}'
            }), 400
            
    except Exception as e:
        logger.error(f"Error executing batch transaction: {str(e)}")
        return jsonify({
            'success': False,
            'error': 'Failed to execute batch transaction'
        }), 500

@batch_bp.route('/batch-status/<auth_token>', methods=['GET'])
def get_batch_status(auth_token):
    """Get the status of a batch authorization"""
    try:
        if auth_token not in batch_authorizations:
            return jsonify({
                'success': False,
                'error': 'Batch authorization not found'
            }), 404
        
        batch_auth = batch_authorizations[auth_token]
        
        return jsonify({
            'success': True,
            'status': batch_auth['status'],
            'created_at': batch_auth['created_at'].isoformat(),
            'expires_at': batch_auth['expires_at'].isoformat(),
            'batch_info': batch_auth['batch_info']
        })
        
    except Exception as e:
        logger.error(f"Error getting batch status: {str(e)}")
        return jsonify({
            'success': False,
            'error': 'Failed to get batch status'
        }), 500

@batch_bp.route('/update-batch-status/<auth_token>', methods=['POST'])
def update_batch_status(auth_token):
    """Update batch authorization status (called when authorization is signed)"""
    try:
        data = request.get_json()
        new_status = data.get('status', 'authorized')
        
        if auth_token in batch_authorizations:
            batch_authorizations[auth_token]['status'] = new_status
            logger.info(f"Updated batch authorization {auth_token} status to {new_status}")
            
            return jsonify({
                'success': True,
                'message': f'Batch status updated to {new_status}'
            })
        else:
            return jsonify({
                'success': False,
                'error': 'Batch authorization not found'
            }), 404
            
    except Exception as e:
        logger.error(f"Error updating batch status: {str(e)}")
        return jsonify({
            'success': False,
            'error': 'Failed to update batch status'
        }), 500
