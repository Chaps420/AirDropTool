from flask import Blueprint, request, jsonify
import logging
import threading
import time
import uuid
from datetime import datetime
from services.xrpl_service import XRPLService
from services.wallet_service import WalletService
from utils.validators import validate_xrpl_address

logger = logging.getLogger(__name__)

# Create blueprint for airdrop routes
airdrop_bp = Blueprint('airdrop', __name__)

# In-memory storage for airdrop tasks (in production, use Redis or database)
airdrop_tasks = {}

@airdrop_bp.route('/execute', methods=['POST'])
def execute_airdrop():
    """Execute an airdrop to multiple recipients."""
    try:
        data = request.get_json()
        
        if not data:
            return jsonify({
                'success': False,
                'error': 'No data provided'
            }), 400
        
        # Validate required fields
        required_fields = ['seed', 'network', 'config']
        for field in required_fields:
            if field not in data:
                return jsonify({
                    'success': False,
                    'error': f'Missing required field: {field}'
                }), 400
        
        seed = data['seed']
        network = data['network']
        config = data['config']
        
        # Validate network
        if network not in ['testnet', 'mainnet']:
            return jsonify({
                'success': False,
                'error': 'Invalid network'
            }), 400
        
        # Validate config
        required_config_fields = ['token', 'recipients', 'amountPerRecipient']
        for field in required_config_fields:
            if field not in config:
                return jsonify({
                    'success': False,
                    'error': f'Missing config field: {field}'
                }), 400
        
        # Validate recipients
        recipients = config['recipients']
        if not isinstance(recipients, list) or len(recipients) == 0:
            return jsonify({
                'success': False,
                'error': 'Recipients list is required'
            }), 400
        
        if len(recipients) > 1000:
            return jsonify({
                'success': False,
                'error': 'Maximum 1000 recipients allowed'
            }), 400
        
        # Validate all recipient addresses
        for recipient in recipients:
            if not validate_xrpl_address(recipient):
                return jsonify({
                    'success': False,
                    'error': f'Invalid recipient address: {recipient}'
                }), 400
        
        # Generate task ID
        task_id = str(uuid.uuid4())
        
        # Initialize task tracking
        airdrop_tasks[task_id] = {
            'id': task_id,
            'status': 'pending',
            'created_at': datetime.utcnow().isoformat(),
            'config': config,
            'network': network,
            'progress': {
                'total': len(recipients),
                'completed': 0,
                'failed': 0,
                'status': 'pending',
                'results': []
            }
        }
        
        # Start airdrop in background thread
        thread = threading.Thread(
            target=_execute_airdrop_background,
            args=(task_id, seed, network, config),
            daemon=True
        )
        thread.start()
        
        return jsonify({
            'success': True,
            'task_id': task_id,
            'message': 'Airdrop execution started'
        })
        
    except Exception as e:
        logger.error(f'Airdrop execution error: {str(e)}')
        return jsonify({
            'success': False,
            'error': 'Failed to start airdrop execution'
        }), 500

@airdrop_bp.route('/status/<task_id>', methods=['GET'])
def get_airdrop_status(task_id):
    """Get the status of an airdrop task."""
    try:
        if task_id not in airdrop_tasks:
            return jsonify({
                'success': False,
                'error': 'Task not found'
            }), 404
        
        task = airdrop_tasks[task_id]
        
        return jsonify({
            'success': True,
            'task_id': task_id,
            'progress': task['progress'],
            'created_at': task['created_at']
        })
        
    except Exception as e:
        logger.error(f'Status lookup error: {str(e)}')
        return jsonify({
            'success': False,
            'error': 'Failed to get task status'
        }), 500

@airdrop_bp.route('/tasks', methods=['GET'])
def list_airdrop_tasks():
    """List all airdrop tasks."""
    try:
        # Return limited task information (without sensitive data)
        tasks_summary = []
        for task_id, task in airdrop_tasks.items():
            tasks_summary.append({
                'id': task_id,
                'status': task['progress']['status'],
                'created_at': task['created_at'],
                'total_recipients': task['progress']['total'],
                'completed': task['progress']['completed'],
                'failed': task['progress']['failed']
            })
        
        return jsonify({
            'success': True,
            'tasks': tasks_summary
        })
        
    except Exception as e:
        logger.error(f'Task listing error: {str(e)}')
        return jsonify({
            'success': False,
            'error': 'Failed to list tasks'
        }), 500

@airdrop_bp.route('/estimate', methods=['POST'])
def estimate_airdrop():
    """Estimate costs and fees for an airdrop."""
    try:
        data = request.get_json()
        
        if not data:
            return jsonify({
                'success': False,
                'error': 'No data provided'
            }), 400
        
        recipients = data.get('recipients', [])
        amount_per_recipient = float(data.get('amount_per_recipient', 0))
        
        if len(recipients) == 0:
            return jsonify({
                'success': False,
                'error': 'Recipients list is required'
            }), 400
        
        if amount_per_recipient <= 0:
            return jsonify({
                'success': False,
                'error': 'Amount per recipient must be greater than 0'
            }), 400
        
        # Calculate estimates
        total_recipients = len(recipients)
        total_token_amount = amount_per_recipient * total_recipients
        
        # Estimate transaction fees (12 drops per transaction)
        fee_per_transaction_drops = 12
        total_fee_drops = fee_per_transaction_drops * total_recipients
        total_fee_xrp = total_fee_drops / 1000000
        
        # Estimate execution time (assuming 1 transaction per second)
        estimated_time_seconds = total_recipients
        estimated_time_minutes = estimated_time_seconds / 60
        
        return jsonify({
            'success': True,
            'estimate': {
                'total_recipients': total_recipients,
                'amount_per_recipient': amount_per_recipient,
                'total_token_amount': total_token_amount,
                'transaction_fees': {
                    'per_transaction_drops': fee_per_transaction_drops,
                    'total_drops': total_fee_drops,
                    'total_xrp': total_fee_xrp
                },
                'estimated_time': {
                    'seconds': estimated_time_seconds,
                    'minutes': round(estimated_time_minutes, 2)
                }
            }
        })
        
    except ValueError as e:
        return jsonify({
            'success': False,
            'error': 'Invalid numeric values provided'
        }), 400
        
    except Exception as e:
        logger.error(f'Estimation error: {str(e)}')
        return jsonify({
            'success': False,
            'error': 'Failed to calculate estimate'
        }), 500

def _execute_airdrop_background(task_id, seed, network, config):
    """Background function to execute airdrop."""
    try:
        task = airdrop_tasks[task_id]
        task['progress']['status'] = 'running'
        
        # Initialize services
        xrpl_service = XRPLService(network)
        wallet_service = WalletService(network)
        
        # Connect to source wallet
        wallet = xrpl_service.wallet_from_seed(seed)
        
        # Get token info
        token_config = config['token']
        recipients = config['recipients']
        amount_per_recipient = config['amountPerRecipient']
        
        # Execute transfers
        for i, recipient in enumerate(recipients):
            try:
                # Create and submit payment transaction
                result = xrpl_service.send_token(
                    wallet=wallet,
                    destination=recipient,
                    currency=token_config['currency'],
                    issuer=token_config['issuer'],
                    amount=str(amount_per_recipient)
                )
                
                # Update progress
                if result['success']:
                    task['progress']['results'].append({
                        'recipient': recipient,
                        'status': 'success',
                        'tx_hash': result['tx_hash'],
                        'amount': amount_per_recipient
                    })
                    task['progress']['completed'] += 1
                else:
                    task['progress']['results'].append({
                        'recipient': recipient,
                        'status': 'error',
                        'error': result['error'],
                        'amount': amount_per_recipient
                    })
                    task['progress']['failed'] += 1
                
                # Add delay between transactions to avoid rate limiting
                time.sleep(1)
                
            except Exception as e:
                logger.error(f'Transaction error for {recipient}: {str(e)}')
                task['progress']['results'].append({
                    'recipient': recipient,
                    'status': 'error',
                    'error': str(e),
                    'amount': amount_per_recipient
                })
                task['progress']['failed'] += 1
        
        # Mark as completed
        task['progress']['status'] = 'completed'
        task['completed_at'] = datetime.utcnow().isoformat()
        
        logger.info(f'Airdrop {task_id} completed: {task["progress"]["completed"]} successful, {task["progress"]["failed"]} failed')
        
    except Exception as e:
        logger.error(f'Airdrop background execution error: {str(e)}')
        task['progress']['status'] = 'failed'
        task['error'] = str(e)
        task['failed_at'] = datetime.utcnow().isoformat()
