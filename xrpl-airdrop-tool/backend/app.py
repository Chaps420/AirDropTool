from flask import Flask, request, jsonify
from flask_cors import CORS
import logging
import os
from datetime import datetime

# Import route modules
from routes.wallet import wallet_bp
from routes.airdrop import airdrop_bp

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

def create_app():
    """Create and configure the Flask application."""
    app = Flask(__name__)
    
    # Configure CORS for frontend communication - Allow file:// access
    CORS(app, 
         origins=['http://localhost:3000', 'http://127.0.0.1:3000', 'file://', 'null'],
         supports_credentials=True,
         allow_headers=['Content-Type', 'Authorization'],
         methods=['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'])
    
    # App configuration
    app.config['SECRET_KEY'] = os.environ.get('SECRET_KEY', 'dev-secret-key-change-in-production')
    app.config['DEBUG'] = os.environ.get('FLASK_DEBUG', 'True').lower() == 'true'
    
    # Xaman API configuration
    app.config['XAMAN_API_KEY'] = os.environ.get('XAMAN_API_KEY', '335efd5b-f1c8-450e-b844-bd26b8c223f0')
    app.config['XAMAN_API_SECRET'] = os.environ.get('XAMAN_API_SECRET', '5715a322-ff36-4c80-bc42-e7ccf0c0225d')
    
    # Register blueprints
    app.register_blueprint(wallet_bp, url_prefix='/api/wallet')
    app.register_blueprint(airdrop_bp, url_prefix='/api/airdrop')
    
    # Import and register tokens blueprint
    from routes.tokens import tokens_bp
    app.register_blueprint(tokens_bp, url_prefix='/api')
    
    # Import and register xaman blueprint
    from routes.xaman import xaman_bp
    app.register_blueprint(xaman_bp, url_prefix='/api')
    
    # Import and register payments blueprint
    from routes.payments import payments_bp
    app.register_blueprint(payments_bp, url_prefix='/api')
    
    # Import and register batch blueprint
    from routes.batch import batch_bp
    app.register_blueprint(batch_bp, url_prefix='/api')
    
    # Import and register tickets blueprint
    from routes.tickets import tickets_bp
    app.register_blueprint(tickets_bp, url_prefix='/api')
    
    # Import and register real tickets blueprint
    from routes.real_tickets import real_tickets_bp
    app.register_blueprint(real_tickets_bp, url_prefix='/api')
    
    # Import and register enhanced real tickets blueprint
    from routes.enhanced_real_tickets import enhanced_real_tickets_bp
    app.register_blueprint(enhanced_real_tickets_bp, url_prefix='/api/enhanced')
    
    # Import and register sequential payments blueprint
    from routes.sequential_payments import sequential_payments_bp
    app.register_blueprint(sequential_payments_bp, url_prefix='/api')
    
    # Error handlers
    @app.errorhandler(404)
    def not_found(error):
        return jsonify({
            'success': False,
            'error': 'Endpoint not found'
        }), 404
    
    @app.errorhandler(500)
    def internal_error(error):
        logger.error(f'Internal server error: {str(error)}')
        return jsonify({
            'success': False,
            'error': 'Internal server error'
        }), 500
    
    @app.errorhandler(Exception)
    def handle_exception(error):
        logger.error(f'Unhandled exception: {str(error)}')
        return jsonify({
            'success': False,
            'error': 'An unexpected error occurred'
        }), 500
    
    # Health check endpoint
    @app.route('/api/health')
    def health_check():
        return jsonify({
            'success': True,
            'status': 'healthy',
            'timestamp': datetime.utcnow().isoformat(),
            'version': '1.0.0'
        })
    
    # Root endpoint
    @app.route('/')
    def index():
        return jsonify({
            'success': True,
            'message': 'XRPL Airdrop Tool API',
            'version': '1.0.0',
            'endpoints': {
                'health': '/api/health',
                'wallet': '/api/wallet/*',
                'airdrop': '/api/airdrop/*'
            }
        })
    
    return app

# Create the application instance
app = create_app()

if __name__ == '__main__':
    host = os.environ.get('HOST', '127.0.0.1')
    port = int(os.environ.get('PORT', 5000))
    debug = os.environ.get('FLASK_DEBUG', 'True').lower() == 'true'
    
    logger.info(f'Starting XRPL Airdrop Tool API on {host}:{port}')
    logger.info(f'Debug mode: {debug}')
    
    app.run(
        host=host,
        port=port,
        debug=debug,
        threaded=True
    )
