import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import 'express-async-errors';
import { executePythonScan } from './scanner.js';
import { supabase } from './supabaseClient.js';
import { validateSafeModeRequest, getSafeSourcesList } from './safeMode.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.get('/api/safe-sources', (req, res) => {
  try {
    const safeSources = getSafeSourcesList();
    res.json({
      success: true,
      sources: safeSources,
      count: safeSources.length
    });
  } catch (error) {
    console.error('Failed to retrieve safe sources:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to retrieve safe sources list'
    });
  }
});

app.post('/api/scan', async (req, res) => {
  const { username, websites, method, filter, top, safeMode } = req.body;

  if (!username || username.trim() === '') {
    return res.status(400).json({
      error: 'Bad Request',
      message: 'Username is required'
    });
  }

  const enableSafeMode = safeMode === true;
  let websitesToScan = websites || 'all';

  if (enableSafeMode) {
    const validation = validateSafeModeRequest(websitesToScan, true);

    if (!validation.valid) {
      return res.status(400).json({
        error: 'Bad Request',
        message: validation.error,
        safeMode: true,
        availableSources: getSafeSourcesList()
      });
    }

    websitesToScan = validation.filteredWebsites;
  }

  const scanOptions = {
    username: username.trim(),
    websites: websitesToScan,
    method: method || 'all',
    filter: filter || 'good',
    top: top || '0',
    timeout: parseInt(process.env.SCAN_TIMEOUT) || 300000,
    safeMode: enableSafeMode
  };

  try {
    const scanResult = await executePythonScan(scanOptions);

    const { data: savedScan, error: dbError } = await supabase
      .from('scan_history')
      .insert({
        username: scanOptions.username,
        scan_parameters: {
          websites: scanOptions.websites,
          method: scanOptions.method,
          filter: scanOptions.filter,
          top: scanOptions.top,
          safeMode: scanOptions.safeMode
        },
        results: scanResult
      })
      .select()
      .maybeSingle();

    if (dbError) {
      console.error('Database error:', dbError);
    }

    res.json({
      success: true,
      scanId: savedScan?.id || null,
      data: scanResult,
      metadata: {
        username: scanOptions.username,
        parameters: {
          websites: scanOptions.websites,
          method: scanOptions.method,
          filter: scanOptions.filter,
          top: scanOptions.top,
          safeMode: scanOptions.safeMode
        },
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('Scan error:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: error.message || 'Failed to execute scan'
    });
  }
});

app.get('/api/scans', async (req, res) => {
  const { limit = 50, offset = 0 } = req.query;

  try {
    const { data, error, count } = await supabase
      .from('scan_history')
      .select('id, username, scan_parameters, created_at', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(parseInt(offset), parseInt(offset) + parseInt(limit) - 1);

    if (error) {
      throw error;
    }

    res.json({
      success: true,
      data: data || [],
      pagination: {
        limit: parseInt(limit),
        offset: parseInt(offset),
        total: count
      }
    });
  } catch (error) {
    console.error('Database error:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to retrieve scan history'
    });
  }
});

app.get('/api/scans/:id', async (req, res) => {
  const { id } = req.params;

  try {
    const { data, error } = await supabase
      .from('scan_history')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (error) {
      throw error;
    }

    if (!data) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Scan not found'
      });
    }

    res.json({
      success: true,
      data
    });
  } catch (error) {
    console.error('Database error:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to retrieve scan'
    });
  }
});

app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({
    error: 'Internal Server Error',
    message: err.message || 'An unexpected error occurred'
  });
});

app.listen(PORT, () => {
  console.log(`Social Analyzer API Server running on port ${PORT}`);
  console.log(`Health check: http://localhost:${PORT}/api/health`);
});
