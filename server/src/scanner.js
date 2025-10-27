import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export function executePythonScan(options) {
  return new Promise((resolve, reject) => {
    const {
      username,
      websites = 'all',
      method = 'all',
      filter = 'good',
      top = '0',
      timeout = 300000
    } = options;

    if (!username || username.trim() === '') {
      return reject(new Error('Username is required'));
    }

    const projectRoot = path.resolve(__dirname, '../..');
    const pythonScript = path.join(projectRoot, 'app.py');

    const args = [
      pythonScript,
      '--username', username,
      '--websites', websites,
      '--method', method,
      '--filter', filter,
      '--top', top,
      '--output', 'json',
      '--silent'
    ];

    const pythonPath = process.env.PYTHON_PATH || 'python3';
    const pythonProcess = spawn(pythonPath, args, {
      cwd: projectRoot,
      env: { ...process.env }
    });

    let stdout = '';
    let stderr = '';
    let timeoutHandle;
    let isTimedOut = false;

    timeoutHandle = setTimeout(() => {
      isTimedOut = true;
      pythonProcess.kill('SIGTERM');

      setTimeout(() => {
        if (!pythonProcess.killed) {
          pythonProcess.kill('SIGKILL');
        }
      }, 5000);
    }, timeout);

    pythonProcess.stdout.on('data', (data) => {
      stdout += data.toString();
    });

    pythonProcess.stderr.on('data', (data) => {
      stderr += data.toString();
    });

    pythonProcess.on('error', (error) => {
      clearTimeout(timeoutHandle);
      reject(new Error(`Failed to start Python process: ${error.message}`));
    });

    pythonProcess.on('close', (code) => {
      clearTimeout(timeoutHandle);

      if (isTimedOut) {
        return reject(new Error('Scan timeout exceeded'));
      }

      if (code !== 0) {
        return reject(new Error(`Python script exited with code ${code}: ${stderr}`));
      }

      try {
        const jsonMatch = stdout.match(/\{[\s\S]*\}/);
        if (!jsonMatch) {
          return reject(new Error('No JSON output found from scanner'));
        }

        const result = JSON.parse(jsonMatch[0]);
        resolve(result);
      } catch (error) {
        reject(new Error(`Failed to parse JSON output: ${error.message}\nOutput: ${stdout}`));
      }
    });
  });
}
