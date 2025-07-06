# PDF to MongoDB Upload - Admin Portal Integration

## Overview

The admin portal now includes a streamlined **PDF Upload** feature that automatically parses rainfall report PDFs and uploads the data directly to MongoDB without saving intermediate CSV files.

## How It Works

### 1. **PDF Upload Process**
- Admin uploads a rainfall report PDF through the admin portal
- System temporarily saves the PDF for processing
- Python parser processes the PDF and extracts structured data
- Data is directly uploaded to MongoDB database
- Temporary PDF file is cleaned up

### 2. **Parser Integration**
The system uses the `FixedRainfallParser` class from `python-scripts/parser.py` which:
- Extracts text from PDF using `pdfplumber`
- Parses rainfall data using regex patterns
- Maps regions, districts, and talukas correctly
- Handles special cases (like Gandhinagar district)
- Outputs structured data with columns:
  - `region`, `district`, `sr_no`, `taluka`
  - `avg_rain_1995_2024`, `rain_till_yesterday`, `rain_last_24hrs`
  - `total_rainfall`, `percent_against_avg`, `date`

### 3. **Admin Portal Interface**

#### Tab: "PDF Upload"
- **PDF File Upload**: Accepts `.pdf` files
- **Report Date**: Date picker for the rainfall report date
- **Upload Button**: Processes the PDF and uploads to MongoDB

## Usage Instructions

### For Administrators:

1. **Access Admin Portal**
   - Navigate to `/admin/dashboard`
   - Login with admin credentials

2. **Upload PDF Report**
   - Click on "PDF Upload" tab
   - Select a rainfall report PDF file
   - Choose the report date
   - Click "Upload PDF to Database"

3. **Monitor Progress**
   - System shows "Processing..." during upload
   - Success message shows number of records uploaded
   - Data is immediately available in the frontend

## Technical Implementation

### Server Actions (`app/admin/dashboard/actions.ts`)

#### `uploadPDFFile(formData: FormData)`
- Handles PDF file upload
- Temporarily saves PDF to server
- Calls Python parser for processing
- Directly uploads data to MongoDB
- Cleans up temporary files
- Returns success/error status with record count

#### `convertPDFAndUploadToMongoDB(pdfPath: string, date: string)`
- Creates temporary Python script
- Runs parser with PDF file
- Connects to MongoDB and uploads data
- Returns record count
- Cleans up temporary files

### Frontend Integration (`app/admin/dashboard/page.tsx`)

- Simplified interface with only PDF upload
- Form with file input and date picker
- Real-time feedback during processing
- Error handling and user notifications

## Data Flow

```
PDF Upload → Temporary Save → Python Parser → MongoDB Upload → Cleanup
     ↓              ↓              ↓              ↓              ↓
Admin Portal → uploads/pdf/ → parser.py → rainfalldatas collection → File cleanup
```

## Error Handling

### Common Issues:

1. **PDF Format Issues**
   - Error: "No data extracted from PDF"
   - Solution: Ensure PDF contains rainfall data in expected format

2. **Python Dependencies**
   - Error: "Failed to run Python script"
   - Solution: Install required packages: `pip install pdfplumber pandas pymongo`

3. **MongoDB Connection**
   - Error: "PDF processing failed"
   - Solution: Check MongoDB connection and credentials

### Debug Mode:
- Set `debug=True` in parser initialization for detailed logging
- Check server logs for Python script output
- Verify MongoDB connection string

## Security Considerations

- File upload validation (PDF files only)
- Temporary file cleanup after processing
- Error message sanitization
- Admin authentication required
- File size limits (handled by server)

## Benefits of Direct Upload

1. **No File Storage**: Eliminates need for CSV file storage
2. **Immediate Availability**: Data is instantly available in frontend
3. **Deployment Friendly**: No file system dependencies in production
4. **Cleaner Architecture**: Direct data flow without intermediate files
5. **Better Performance**: Reduced I/O operations

## Troubleshooting

### If PDF upload fails:
1. Check PDF format matches expected structure
2. Verify Python dependencies are installed
3. Check server logs for detailed error messages
4. Ensure MongoDB connection is working

### If MongoDB upload fails:
1. Verify MongoDB connection string
2. Check database permissions
3. Ensure parser extracted data successfully
4. Review MongoDB logs for connection issues

## Support

For technical issues or questions about the PDF upload:
1. Check server logs for error details
2. Verify Python environment and dependencies
3. Test with sample PDF files
4. Review parser configuration in `python-scripts/parser.py` 