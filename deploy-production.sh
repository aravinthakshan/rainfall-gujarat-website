#!/bin/bash

# Production Deployment Script for Rainfall Website
# This script helps set up the production environment for PDF processing

set -e

echo "🚀 Setting up production environment for PDF processing..."

# Check if Python is available
echo "📋 Checking Python installation..."
if command -v python3 &> /dev/null; then
    PYTHON_CMD="python3"
elif command -v python &> /dev/null; then
    PYTHON_CMD="python"
else
    echo "❌ Python is not installed. Please install Python 3.7+ first."
    exit 1
fi

echo "✅ Python found: $($PYTHON_CMD --version)"

# Check if pip is available
echo "📋 Checking pip installation..."
if ! command -v pip &> /dev/null && ! command -v pip3 &> /dev/null; then
    echo "❌ pip is not installed. Please install pip first."
    exit 1
fi

# Install Python dependencies
echo "📦 Installing Python dependencies..."
if [ -f "requirements.txt" ]; then
    pip install -r requirements.txt
else
    echo "⚠️  requirements.txt not found, installing packages manually..."
    pip install pandas>=1.5.0 pymongo>=4.0.0 pdfplumber>=0.9.0 numpy>=1.21.0
fi

# Test the Python environment
echo "🧪 Testing Python environment..."
if [ -f "test-python-env.py" ]; then
    $PYTHON_CMD test-python-env.py
    if [ $? -eq 0 ]; then
        echo "✅ Python environment test passed!"
    else
        echo "❌ Python environment test failed. Please check the errors above."
        exit 1
    fi
else
    echo "⚠️  test-python-env.py not found, skipping environment test"
fi

# Check environment variables
echo "🔍 Checking environment variables..."
if [ -z "$MONGODB_URI" ]; then
    echo "⚠️  MONGODB_URI environment variable is not set"
    echo "   Please set it in your production environment"
else
    echo "✅ MONGODB_URI is set"
fi

# Build the Next.js application
echo "🔨 Building Next.js application..."
npm run build

echo "✅ Production setup complete!"
echo ""
echo "📝 Next steps:"
echo "1. Ensure MONGODB_URI is set in your production environment"
echo "2. Deploy to your hosting platform (Vercel, etc.)"
echo "3. Test the PDF upload functionality"
echo ""
echo "🔧 If you encounter issues:"
echo "- Check the logs for specific error messages"
echo "- Verify Python and dependencies are installed"
echo "- Ensure MongoDB connection is working"
echo "- Test with smaller PDF files first" 