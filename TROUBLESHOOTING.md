# PDF Upload Troubleshooting Guide

## Common Production Issues and Solutions

### 1. Python Not Available

**Error**: `Python is not available. Please install Python 3.7+ and required packages.`

**Solutions**:
- Install Python 3.7+ on your production server
- For Vercel: Use a custom build command that installs Python
- For other platforms: Ensure Python is available in the runtime environment

**Quick Fix**:
```bash
# Check if Python is available
python3 --version
# If not available, install Python
sudo apt-get install python3 python3-pip  # Ubuntu/Debian
```

### 2. Missing Python Dependencies

**Error**: `Missing required Python package: pandas`

**Solutions**:
- Install required packages: `pip install pandas pymongo pdfplumber numpy`
- Use the requirements.txt file: `pip install -r requirements.txt`
- For Vercel: Add Python installation to build process

**Quick Fix**:
```bash
pip install pandas>=1.5.0 pymongo>=4.0.0 pdfplumber>=0.9.0 numpy>=1.21.0
```

### 3. MongoDB Connection Issues

**Error**: `MongoDB connection/insertion failed`

**Solutions**:
- Verify `MONGODB_URI` environment variable is set
- Check MongoDB connection string format
- Ensure MongoDB is accessible from your production environment
- Check network connectivity and firewall settings

**Quick Fix**:
```bash
# Test MongoDB connection
python3 -c "from pymongo import MongoClient; client = MongoClient('your_mongo_uri'); print('Connected')"
```

### 4. File System Permissions

**Error**: `Permission denied` or `Failed to create temporary file`

**Solutions**:
- Ensure write permissions in temporary directories
- Use `/tmp` directory for temporary files
- Check file system permissions on production server

**Quick Fix**:
```bash
# Check permissions
ls -la /tmp
# Fix permissions if needed
chmod 755 /tmp
```

### 5. Memory Issues

**Error**: Process killed due to memory limits

**Solutions**:
- Reduce PDF file size limit (currently 10MB)
- Process PDFs in smaller chunks
- Increase memory limits in production environment
- Use streaming for large files

**Quick Fix**:
- Try with smaller PDF files (< 1MB)
- Check available memory: `free -h`

### 6. Timeout Issues

**Error**: `PDF processing timed out after 60 seconds`

**Solutions**:
- Increase timeout limits in production
- Optimize PDF processing
- Use async processing for large files
- Process files in background

**Quick Fix**:
- Try with smaller files
- Check server performance and resources

### 7. Parser Import Issues

**Error**: `Could not import parser`

**Solutions**:
- Ensure `python-scripts/parser.py` exists
- Check Python path configuration
- Verify file permissions on parser module

**Quick Fix**:
```bash
# Test parser import
python3 -c "import sys; sys.path.append('python-scripts'); from parser import FixedRainfallParser; print('Parser imported successfully')"
```

## Environment-Specific Solutions

### Vercel Deployment

1. **Add Python support**:
```json
// vercel.json
{
  "functions": {
    "app/admin/dashboard/actions.ts": {
      "runtime": "nodejs18.x"
    }
  },
  "build": {
    "env": {
      "PYTHON_VERSION": "3.9"
    }
  }
}
```

2. **Update package.json**:
```json
{
  "scripts": {
    "build": "pip install -r requirements.txt && next build"
  }
}
```

### Docker Deployment

1. **Use multi-stage build**:
```dockerfile
FROM python:3.9-slim as python
RUN pip install pandas pymongo pdfplumber numpy

FROM node:18-alpine
COPY --from=python /usr/local/bin/python3 /usr/local/bin/python3
COPY --from=python /usr/local/lib/python3.9 /usr/local/lib/python3.9
# ... rest of Dockerfile
```

### AWS Lambda

1. **Use Lambda Layers** for Python dependencies
2. **Package dependencies** with your function
3. **Use container images** with Python pre-installed

## Testing Your Setup

### 1. Run the Test Script

```bash
python3 test-python-env.py
```

This will test:
- Python version compatibility
- Required package availability
- MongoDB connection
- Parser import
- File system permissions

### 2. Test PDF Processing

```bash
# Create a test PDF and try processing it
python3 python-scripts/batch_pdf_to_mongo.py
```

### 3. Check Logs

Monitor these logs for issues:
- Application logs
- Python process logs
- MongoDB connection logs
- File system access logs

## Alternative Solutions

### 1. Client-Side Processing

If Python is not available, consider:
- Using PDF.js for client-side parsing
- Converting PDFs to images and using OCR
- Using cloud-based PDF processing services

### 2. Cloud Services

Use external services for PDF processing:
- AWS Textract
- Google Cloud Vision API
- Azure Form Recognizer
- PDF processing APIs

### 3. Queue-Based Processing

For large files:
- Upload to queue (Redis, SQS)
- Process in background
- Notify when complete

## Performance Optimization

### 1. File Size Limits
- Current limit: 10MB
- Consider reducing for faster processing
- Implement chunked processing for large files

### 2. Memory Management
- Monitor memory usage during processing
- Implement garbage collection
- Use streaming for large files

### 3. Caching
- Cache parsed results
- Implement result caching
- Use Redis for temporary storage

## Security Considerations

### 1. File Validation
- Validate PDF files before processing
- Check file headers and signatures
- Implement virus scanning

### 2. Input Sanitization
- Sanitize date inputs
- Validate file names
- Prevent path traversal attacks

### 3. Error Handling
- Don't expose internal errors to users
- Log errors for debugging
- Implement proper error responses

## Monitoring and Alerting

### 1. Set up monitoring for:
- PDF processing success/failure rates
- Processing time
- Memory usage
- Error rates

### 2. Configure alerts for:
- High error rates
- Processing timeouts
- Memory usage spikes
- MongoDB connection failures

## Getting Help

If you're still experiencing issues:

1. **Check the logs** for specific error messages
2. **Run the test script** to identify issues
3. **Verify environment setup** using the deployment script
4. **Test with minimal files** to isolate issues
5. **Contact support** with specific error messages and logs

## Quick Diagnostic Commands

```bash
# Check Python installation
python3 --version

# Check installed packages
pip list | grep -E "(pandas|pymongo|pdfplumber)"

# Test MongoDB connection
python3 -c "from pymongo import MongoClient; client = MongoClient('your_uri'); print('OK')"

# Test parser import
python3 -c "import sys; sys.path.append('python-scripts'); from parser import FixedRainfallParser"

# Check file permissions
ls -la python-scripts/

# Test environment
python3 test-python-env.py
``` 