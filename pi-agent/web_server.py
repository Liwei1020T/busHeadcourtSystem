"""
Pi Agent Web Interface Server
Provides a simple web UI for monitoring and configuring the Pi Agent.

Features:
- View scan statistics and recent scans
- Configure agent settings (API URL, Bus ID, etc.)
- Manually trigger test scans
- Monitor upload status
"""

import json
import logging
import os
from datetime import datetime
from typing import Dict, List, Optional

from flask import Flask, jsonify, request, send_from_directory
from flask_cors import CORS

from db import get_scan_count, get_unuploaded_scans, get_recent_scans, insert_scan

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s"
)
logger = logging.getLogger(__name__)

# Initialize Flask app
app = Flask(__name__, static_folder='static')
CORS(app)

# Configuration file path
CONFIG_FILE = "config.json"


@app.route('/')
def index():
    """Serve the main HTML interface."""
    return send_from_directory('static', 'index.html')


@app.route('/api/status', methods=['GET'])
def get_status():
    """
    Get current agent status.
    
    Returns:
        {
            "scan_counts": {"pending": int, "uploaded": int},
            "config_loaded": bool,
            "bus_id": str
        }
    """
    try:
        counts = get_scan_count()
        
        # Try to load config
        config_loaded = os.path.exists(CONFIG_FILE)
        bus_id = None
        
        if config_loaded:
            with open(CONFIG_FILE, 'r', encoding='utf-8') as f:
                config = json.load(f)
                bus_id = config.get('bus_id', 'Unknown')
        
        return jsonify({
            "scan_counts": counts,
            "config_loaded": config_loaded,
            "bus_id": bus_id,
            "timestamp": datetime.now().isoformat()
        })
    except Exception as e:
        logger.error(f"Error getting status: {e}")
        return jsonify({"error": str(e)}), 500


@app.route('/api/scans/recent', methods=['GET'])
def get_recent():
    """
    Get recent scans.
    
    Query params:
        limit: Number of scans to return (default: 50)
    
    Returns:
        [
            {
                "id": int,
                "batch_id": int,
                "card_uid": str,
                "scan_time": str,
                "uploaded": bool
            }
        ]
    """
    try:
        limit = request.args.get('limit', 50, type=int)
        scans = get_recent_scans(limit=limit)
        
        return jsonify({
            "scans": scans,
            "count": len(scans)
        })
    except Exception as e:
        logger.error(f"Error getting recent scans: {e}")
        return jsonify({"error": str(e)}), 500


@app.route('/api/scans/pending', methods=['GET'])
def get_pending():
    """
    Get pending (unuploaded) scans.
    
    Returns:
        [
            {
                "id": int,
                "batch_id": int,
                "card_uid": str,
                "scan_time": str
            }
        ]
    """
    try:
        scans = get_unuploaded_scans(limit=200)
        
        return jsonify({
            "scans": scans,
            "count": len(scans)
        })
    except Exception as e:
        logger.error(f"Error getting pending scans: {e}")
        return jsonify({"error": str(e)}), 500


@app.route('/api/config', methods=['GET'])
def get_config():
    """
    Get current configuration.
    
    Returns:
        {
            "bus_id": str,
            "api_base_url": str,
            "trips": []
        }
    """
    try:
        if not os.path.exists(CONFIG_FILE):
            return jsonify({"error": "Configuration file not found"}), 404
        
        with open(CONFIG_FILE, 'r', encoding='utf-8') as f:
            config = json.load(f)
        
        # Don't expose API key in response
        safe_config = {k: v for k, v in config.items() if k != 'api_key'}
        safe_config['has_api_key'] = 'api_key' in config
        
        return jsonify(safe_config)
    except Exception as e:
        logger.error(f"Error reading config: {e}")
        return jsonify({"error": str(e)}), 500


@app.route('/api/config', methods=['POST'])
def update_config():
    """
    Update configuration.
    
    Request body:
        {
            "bus_id": str,
            "api_base_url": str,
            "api_key": str (optional),
            "trips": []
        }
    """
    try:
        new_config = request.get_json()
        
        if not new_config:
            return jsonify({"error": "Invalid JSON"}), 400
        
        # Load existing config to preserve api_key if not provided
        existing_config = {}
        if os.path.exists(CONFIG_FILE):
            with open(CONFIG_FILE, 'r', encoding='utf-8') as f:
                existing_config = json.load(f)
        
        # Merge configs (new config takes precedence)
        merged_config = {**existing_config, **new_config}
        
        # Validate required fields
        required_fields = ["bus_id", "api_base_url", "api_key"]
        for field in required_fields:
            if field not in merged_config:
                return jsonify({"error": f"Missing required field: {field}"}), 400
        
        # Write config
        with open(CONFIG_FILE, 'w', encoding='utf-8') as f:
            json.dump(merged_config, f, indent=2, ensure_ascii=False)
        
        logger.info(f"Configuration updated: bus_id={merged_config.get('bus_id')}")
        
        return jsonify({
            "success": True,
            "message": "Configuration updated successfully"
        })
    except Exception as e:
        logger.error(f"Error updating config: {e}")
        return jsonify({"error": str(e)}), 500


@app.route('/api/scan/test', methods=['POST'])
def test_scan():
    """
    Simulate a card scan for testing.
    
    Request body:
        {
            "batch_id": int
        }
    """
    try:
        data = request.get_json()
        
        if not data or 'batch_id' not in data:
            return jsonify({"error": "batch_id is required"}), 400
        
        try:
            batch_id = int(data['batch_id'])
        except ValueError:
            return jsonify({"error": "batch_id must be an integer"}), 400
        
        scan_time = datetime.now().isoformat()
        card_uid = str(batch_id)
        
        # Insert into database
        inserted = insert_scan(
            batch_id=batch_id,
            card_uid=card_uid,
            scan_time=scan_time
        )
        
        if inserted:
            logger.info(f"Test scan recorded: batch_id={batch_id}")
            return jsonify({
                "success": True,
                "message": f"Scan recorded for batch_id={batch_id}",
                "batch_id": batch_id,
                "scan_time": scan_time
            })
        else:
            return jsonify({
                "success": False,
                "message": "Duplicate scan detected",
                "batch_id": batch_id
            }), 409
            
    except Exception as e:
        logger.error(f"Error recording test scan: {e}")
        return jsonify({"error": str(e)}), 500


@app.route('/api/health', methods=['GET'])
def health_check():
    """Health check endpoint."""
    return jsonify({
        "status": "healthy",
        "timestamp": datetime.now().isoformat()
    })


def main():
    """Run the web server."""
    logger.info("Starting Pi Agent Web Interface...")
    
    # Create static folder if it doesn't exist
    os.makedirs('static', exist_ok=True)
    
    # Run server
    port = int(os.getenv('WEB_PORT', 5000))
    host = os.getenv('WEB_HOST', '0.0.0.0')
    
    logger.info(f"Web interface available at http://{host}:{port}")
    logger.info("Press Ctrl+C to stop")
    
    app.run(
        host=host,
        port=port,
        debug=False
    )


if __name__ == '__main__':
    main()
