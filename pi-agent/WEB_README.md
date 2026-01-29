# Pi Agent Web Interface

Flask-based web interface for monitoring and managing the Pi Agent.

## Features

- **📊 Real-time Monitoring**: View scan statistics and recent records
- **⚙️ Configuration Management**: Update API settings, bus ID, etc.
- **🧪 Test Scans**: Manually simulate card scans for testing
- **🔄 Auto Refresh**: Data refreshes automatically every 30 seconds

## Installation

1. Install dependencies:
```bash
pip install -r requirements.txt
```

2. Initialize the database:
```bash
python -c "from db import init_db; init_db()"
```

## Usage

### Start the Web Server

```bash
python web_server.py
```

The interface will be available at: `http://localhost:5000`

### Custom Port/Host

```bash
# Set custom port
export WEB_PORT=8080

# Bind to specific host
export WEB_HOST=192.168.1.100

python web_server.py
```

## API Endpoints

### Status
- `GET /api/status` - Get current agent status
- `GET /api/health` - Health check

### Scans
- `GET /api/scans/recent?limit=50` - Get recent scans
- `GET /api/scans/pending` - Get pending (unuploaded) scans
- `POST /api/scan/test` - Simulate a test scan

### Configuration
- `GET /api/config` - Get current configuration
- `POST /api/config` - Update configuration

## Web Interface Tabs

### 1. Monitor Panel
- View scan statistics (uploaded, pending)
- Recent scan records table
- Auto-refresh every 30 seconds

### 2. Test Scans
- Manually input batch IDs to simulate scans
- View pending uploads
- Test the system without physical cards

### 3. System Config
- Configure Bus ID
- Set API base URL
- Update API key
- Load/save configuration

## Screenshots

### Monitor Panel
Real-time statistics and scan records with status badges.

### Test Scans
Simulate card scans for development and testing.

### Configuration
Easy-to-use form for system settings.

## Development

The web interface is built with:
- **Backend**: Flask (Python)
- **Frontend**: Pure HTML/CSS/JavaScript (no frameworks)
- **Styling**: Custom CSS with gradient themes
- **Database**: SQLite (via db.py module)

## Notes

- The web server runs independently from the main agent (`main.py`)
- You can run both simultaneously for live monitoring while the agent collects data
- API key is never exposed in GET requests (security feature)
- All timestamps are displayed in local timezone
