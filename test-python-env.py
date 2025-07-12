#!/usr/bin/env python3
"""
Test script to verify Python environment and dependencies for PDF processing
"""

import sys
import os

def test_python_version():
    """Test Python version"""
    print(f"Python version: {sys.version}")
    if sys.version_info < (3, 7):
        print("ERROR: Python 3.7+ is required")
        return False
    print("✓ Python version is compatible")
    return True

def test_dependencies():
    """Test required dependencies"""
    required_packages = ['pandas', 'pymongo', 'pdfplumber', 'numpy']
    missing_packages = []
    
    for package in required_packages:
        try:
            __import__(package)
            print(f"✓ {package} is available")
        except ImportError:
            print(f"✗ {package} is missing")
            missing_packages.append(package)
    
    if missing_packages:
        print(f"\nERROR: Missing packages: {', '.join(missing_packages)}")
        print("Install with: pip install pandas pymongo pdfplumber numpy")
        return False
    
    print("✓ All required packages are available")
    return True

def test_mongodb_connection():
    """Test MongoDB connection"""
    try:
        from pymongo import MongoClient
        import os
        
        mongo_uri = os.environ.get('MONGODB_URI')
        if not mongo_uri:
            print("✗ MONGODB_URI environment variable not set")
            return False
        
        client = MongoClient(mongo_uri, serverSelectionTimeoutMS=5000)
        client.admin.command('ping')
        print("✓ MongoDB connection successful")
        client.close()
        return True
    except Exception as e:
        print(f"✗ MongoDB connection failed: {e}")
        return False

def test_parser_import():
    """Test if our parser can be imported"""
    try:
        # Add python-scripts to path
        script_dir = os.path.dirname(os.path.abspath(__file__))
        python_scripts_dir = os.path.join(script_dir, 'python-scripts')
        sys.path.insert(0, python_scripts_dir)
        
        from parser import FixedRainfallParser
        print("✓ Parser module can be imported")
        return True
    except ImportError as e:
        print(f"✗ Parser import failed: {e}")
        return False
    except Exception as e:
        print(f"✗ Parser test failed: {e}")
        return False

def test_file_permissions():
    """Test file system permissions"""
    try:
        import tempfile
        with tempfile.NamedTemporaryFile(suffix='.pdf', delete=True) as temp_file:
            temp_file.write(b'test')
            print("✓ File system permissions are working")
        return True
    except Exception as e:
        print(f"✗ File system permissions test failed: {e}")
        return False

def main():
    """Run all tests"""
    print("=" * 50)
    print("Python Environment Test for PDF Processing")
    print("=" * 50)
    
    tests = [
        ("Python Version", test_python_version),
        ("Dependencies", test_dependencies),
        ("MongoDB Connection", test_mongodb_connection),
        ("Parser Import", test_parser_import),
        ("File Permissions", test_file_permissions),
    ]
    
    passed = 0
    total = len(tests)
    
    for test_name, test_func in tests:
        print(f"\n--- Testing {test_name} ---")
        if test_func():
            passed += 1
        else:
            print(f"FAILED: {test_name}")
    
    print("\n" + "=" * 50)
    print(f"Test Results: {passed}/{total} tests passed")
    
    if passed == total:
        print("✓ All tests passed! PDF processing should work.")
        return 0
    else:
        print("✗ Some tests failed. Please fix the issues above.")
        return 1

if __name__ == "__main__":
    sys.exit(main()) 