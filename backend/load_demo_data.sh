#!/bin/bash
# Load demo data into the Bus System database

set -e  # Exit on error

echo "🚌 Bus System - Demo Data Loader"
echo "================================="
echo ""

# Check if we're in the backend directory
if [ ! -f "demo_data.sql" ]; then
    echo "❌ Error: demo_data.sql not found. Please run this script from the backend directory."
    exit 1
fi

# Check for required environment variables or use defaults
DB_HOST="${DB_HOST:-localhost}"
DB_PORT="${DB_PORT:-5432}"
DB_NAME="${DB_NAME:-bus_optimizer}"
DB_USER="${DB_USER:-postgres}"

echo "📋 Database Configuration:"
echo "   Host: $DB_HOST"
echo "   Port: $DB_PORT"
echo "   Database: $DB_NAME"
echo "   User: $DB_USER"
echo ""

# Prompt for password if not set
if [ -z "$PGPASSWORD" ]; then
    echo "🔐 Enter database password for user '$DB_USER':"
    read -s PGPASSWORD
    export PGPASSWORD
    echo ""
fi

# Test database connection
echo "🔍 Testing database connection..."
if ! psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -c "SELECT 1;" > /dev/null 2>&1; then
    echo "❌ Failed to connect to database. Please check your credentials and connection settings."
    exit 1
fi
echo "✅ Database connection successful"
echo ""

# Load demo data
echo "📥 Loading demo data..."
psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -f demo_data.sql

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Demo data loaded successfully!"
    echo ""
    echo "📊 Summary (FICTIONAL TEST DATA):"
    echo "   - 7 buses (Fictional Routes A-E)"
    echo "   - 12 vans with fictional drivers"
    echo "   - 48 fictional employees"
    echo "   - Attendance records for the last 7 days"
    echo ""
    echo "⚠️  NOTE: All data is FICTIONAL for testing purposes only"
    echo ""
    echo "🎉 You can now access the dashboard and see the demo data!"
    echo "   Development: http://localhost:5175"
    echo "   Docker: http://localhost:5175"
else
    echo ""
    echo "❌ Failed to load demo data. Please check the error messages above."
    exit 1
fi
