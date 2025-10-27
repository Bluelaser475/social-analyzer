import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import path from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let safeModeConfig = null;

export function loadSafeModeConfig() {
  try {
    const configPath = path.join(__dirname, '../config/safe_mode.json');
    const configData = readFileSync(configPath, 'utf-8');
    safeModeConfig = JSON.parse(configData);
    return safeModeConfig;
  } catch (error) {
    console.error('Failed to load safe mode configuration:', error.message);
    return null;
  }
}

export function getSafeModeConfig() {
  if (!safeModeConfig) {
    return loadSafeModeConfig();
  }
  return safeModeConfig;
}

export function isSafeSource(url) {
  const config = getSafeModeConfig();

  if (!config || !config.safeSources) {
    console.warn('Safe mode configuration not loaded or invalid');
    return false;
  }

  const normalizedUrl = url.toLowerCase();

  return config.safeSources.some(source => {
    const pattern = source.urlPattern.toLowerCase();
    return normalizedUrl.includes(pattern);
  });
}

export function getSafeSourcesList() {
  const config = getSafeModeConfig();

  if (!config || !config.safeSources) {
    return [];
  }

  return config.safeSources.map(source => source.domain);
}

export function filterWebsitesBySafeMode(websitesInput) {
  const config = getSafeModeConfig();

  if (!config || !config.safeSources) {
    console.warn('Safe mode configuration not loaded, returning empty list');
    return '';
  }

  if (!websitesInput || websitesInput.trim() === '' || websitesInput === 'all') {
    const safeWebsites = config.safeSources
      .map(source => source.domain.replace('.com', '').replace('.net', '').replace('.tv', ''))
      .join(' ');
    return safeWebsites;
  }

  const requestedWebsites = websitesInput.split(' ').map(w => w.trim().toLowerCase()).filter(w => w);
  const filteredWebsites = [];

  for (const website of requestedWebsites) {
    const isSafe = config.safeSources.some(source => {
      const sourceDomain = source.domain.toLowerCase();
      const sourcePattern = source.urlPattern.toLowerCase();
      return website === sourceDomain ||
             website === sourcePattern ||
             sourceDomain.includes(website) ||
             sourcePattern.includes(website);
    });

    if (isSafe) {
      filteredWebsites.push(website);
    } else {
      console.warn(`Blocked unsafe website in safe mode: ${website}`);
    }
  }

  return filteredWebsites.join(' ');
}

export function validateSafeModeRequest(websites, safeMode) {
  if (!safeMode) {
    return { valid: true, filteredWebsites: websites };
  }

  const filteredWebsites = filterWebsitesBySafeMode(websites);

  if (!filteredWebsites || filteredWebsites.trim() === '') {
    return {
      valid: false,
      error: 'No safe sources found in request. Safe mode only allows whitelisted platforms.',
      filteredWebsites: ''
    };
  }

  return {
    valid: true,
    filteredWebsites,
    message: 'Request filtered by safe mode'
  };
}
