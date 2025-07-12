# Production Setup Guide for PDF Upload Functionality

## Python Dependencies Setup

The PDF upload functionality requires Python packages that need to be installed in your production environment.

### Required Python Packages

Install the required packages using pip:

```bash
pip install pandas>=1.5.0 pymongo>=4.0.0 pdfplumber>=0.9.0 numpy>=1.21.0
```

Or install from the requirements.txt file:

```bash
pip install -r requirements.txt
```

### Vercel Deployment

For Vercel deployment, you need to configure Python support:

1. **Create a `vercel.json` file** in your project root:

```json
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

2. **Install Python in Vercel** by adding a build command in your `package.json`:

```json
{
  "scripts": {
    "build": "pip install -r requirements.txt && next build",
    "vercel-build": "pip install -r requirements.txt && next build"
  }
}
```

### Alternative: Serverless Function Approach

If Python is not available in your production environment, consider using a serverless function approach:

1. **Create an API route** for PDF processing:

```typescript
// app/api/process-pdf/route.ts
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  // Handle PDF processing here
  // You can use a cloud service like AWS Lambda or Google Cloud Functions
  // that has Python support
}
```

2. **Use a cloud service** like:
   - AWS Lambda with Python runtime
   - Google Cloud Functions
   - Azure Functions
   - Or a dedicated Python microservice

### Environment Variables

Ensure these environment variables are set in production:

```bash
MONGODB_URI=your_mongodb_connection_string
```

### Troubleshooting Common Issues

#### 1. Python Not Found
**Error**: `Python is not available`
**Solution**: Install Python 3.7+ in your production environment

#### 2. Missing Dependencies
**Error**: `Missing required Python package`
**Solution**: Install required packages using pip

#### 3. Memory Issues
**Error**: Process killed due to memory limits
**Solution**: 
- Reduce PDF file size limit (currently 10MB)
- Process PDFs in chunks
- Use streaming for large files

#### 4. Timeout Issues
**Error**: PDF processing timed out
**Solution**:
- Increase timeout limits
- Optimize PDF processing
- Use async processing

#### 5. File System Permissions
**Error**: Permission denied
**Solution**:
- Use temporary directories
- Ensure proper file permissions
- Use in-memory processing where possible

### Monitoring and Logging

Add logging to track PDF processing:

```typescript
// In actions.ts
console.log(`Processing PDF: ${pdfFile.name}, Size: ${pdfFile.size} bytes`)
console.log(`Date: ${date}`)
```

### Performance Optimization

1. **File Size Limits**: Currently set to 10MB max
2. **Timeout**: 60 seconds for processing
3. **Memory**: Monitor memory usage during processing
4. **Caching**: Consider caching parsed results

### Security Considerations

1. **File Validation**: Validate PDF files before processing
2. **Input Sanitization**: Sanitize date inputs
3. **Error Handling**: Don't expose internal errors to users
4. **Rate Limiting**: Implement rate limiting for uploads

### Testing in Production

Test the PDF upload functionality with:

1. **Small PDF files** (< 1MB)
2. **Valid date formats** (DD/MM/YYYY)
3. **Various PDF structures** to ensure parser works
4. **Error conditions** (invalid files, network issues)

### Fallback Strategy

If Python processing fails, consider:

1. **Manual CSV upload** as fallback
2. **Cloud-based PDF processing** services
3. **Client-side PDF parsing** (limited but possible)
4. **Queue-based processing** for large files

## Quick Fix for Immediate Issues

If you're experiencing immediate production issues:

1. **Check Python availability**:
   ```bash
   python3 --version
   pip list | grep -E "(pandas|pymongo|pdfplumber)"
   ```

2. **Test MongoDB connection**:
   ```bash
   python3 -c "from pymongo import MongoClient; client = MongoClient('your_mongo_uri'); print('Connected')"
   ```

3. **Verify file permissions**:
   ```bash
   ls -la python-scripts/
   ```

4. **Check environment variables**:
   ```bash
   echo $MONGODB_URI
   ```

## Support

If issues persist, check:
- Vercel deployment logs
- MongoDB connection status
- Python package installation
- File system permissions
- Memory and timeout limits 