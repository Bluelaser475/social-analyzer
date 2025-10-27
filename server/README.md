# Social Analyzer API Server

Express.js backend that provides a REST API for the Social Analyzer Python tool.

## Features

- POST /api/scan - Execute username scan across social media platforms
- GET /api/scans - Retrieve scan history
- GET /api/scans/:id - Retrieve specific scan by ID
- GET /api/health - Health check endpoint
- Automatic scan result persistence to Supabase
- Configurable timeout and process management
- CORS enabled for frontend integration

## Installation

```bash
cd server
npm install
```

## Configuration

Create a `.env` file in the server directory:

```env
PORT=3001
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_supabase_anon_key
PYTHON_PATH=python3
SCAN_TIMEOUT=300000
```

## Usage

### Development
```bash
npm run dev
```

### Production
```bash
npm start
```

## API Endpoints

### POST /api/scan

Execute a social media username scan.

**Request Body:**
```json
{
  "username": "johndoe",
  "websites": "all",
  "method": "all",
  "filter": "good",
  "top": "0"
}
```

**Response:**
```json
{
  "success": true,
  "scanId": "uuid",
  "data": {
    "detected": [...],
    "unknown": [...],
    "failed": [...]
  },
  "metadata": {
    "username": "johndoe",
    "parameters": {...},
    "timestamp": "2025-10-27T18:00:00.000Z"
  }
}
```

### GET /api/scans

Retrieve scan history with pagination.

**Query Parameters:**
- `limit` (default: 50) - Number of results per page
- `offset` (default: 0) - Starting position

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "username": "johndoe",
      "scan_parameters": {...},
      "created_at": "2025-10-27T18:00:00.000Z"
    }
  ],
  "pagination": {
    "limit": 50,
    "offset": 0,
    "total": 100
  }
}
```

### GET /api/scans/:id

Retrieve a specific scan by ID.

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "username": "johndoe",
    "scan_parameters": {...},
    "results": {...},
    "created_at": "2025-10-27T18:00:00.000Z"
  }
}
```

### GET /api/health

Health check endpoint.

**Response:**
```json
{
  "status": "ok",
  "timestamp": "2025-10-27T18:00:00.000Z"
}
```

## Error Handling

All errors follow this format:

```json
{
  "error": "Error Type",
  "message": "Detailed error message"
}
```

Common error codes:
- 400 - Bad Request (missing or invalid parameters)
- 404 - Not Found (scan ID not found)
- 500 - Internal Server Error (scan execution or database errors)

## Requirements

- Node.js 16+
- Python 3 with Social Analyzer dependencies
- Supabase account with scan_history table
