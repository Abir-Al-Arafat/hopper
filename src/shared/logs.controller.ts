import { Request, Response } from 'express';
import fs from 'fs';
import path from 'path';
import { listLogFiles } from '../app/helper/listLogFiles';
import globalLogStyle from './style/logUtils';

const getAllErrorLogs = async (req: Request, res: Response) => {
  const errorFiles = listLogFiles('errors');

  const tableBody = errorFiles
    .map(
      (file: string, index: number) => `
      <tr>
        <td>#${index + 1}</td>
        <td>${file}</td>
        <td><a class="view-btn" href="/logs/errors/${file}">View</a></td>
      </tr>`,
    )
    .join('');

  const content =
    errorFiles.length === 0
      ? '<p>No error logs available.</p>'
      : `
      <table>
        <thead>
          <tr><th>Serial</th><th>Log File</th><th>Action</th></tr>
        </thead>
        <tbody>${tableBody}</tbody>
      </table>`;

  res.status(200).send(`
    <!DOCTYPE html>
    <html>
      <head>
        <title>Error Logs</title>
        <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;600&display=swap" rel="stylesheet">
        <style>${globalLogStyle}</style>
      </head>
      <body>
        <h1>❗ Error Logs</h1>
        ${content}
        <a class="back-home" href="/">⬅ Back to Home</a>
      </body>
    </html>
  `);
};

const getAllSuccessLogs = async (req: Request, res: Response) => {
  const successFiles = listLogFiles('successes');

  const tableBody = successFiles
    .map(
      (file: string, index: number) => `
      <tr>
        <td>#${index + 1}</td>
        <td>${file}</td>
        <td><a class="view-btn" href="/logs/successes/${file}">View</a></td>
      </tr>`,
    )
    .join('');

  const content =
    successFiles.length === 0
      ? '<p>No success logs available.</p>'
      : `
      <table>
        <thead>
          <tr><th>Serial</th><th>Log File</th><th>Action</th></tr>
        </thead>
        <tbody>${tableBody}</tbody>
      </table>`;

  res.status(200).send(`
    <!DOCTYPE html>
    <html>
      <head>
        <title>Success Logs</title>
        <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;600&display=swap" rel="stylesheet">
        <style>${globalLogStyle}</style>
      </head>
      <body>
        <h1>✅ Success Logs</h1>
        ${content}
        <a class="back-home" href="/">⬅ Back to Home</a>
      </body>
    </html>
  `);
};

const generateLogHtmlTemplate = (
  title: string,
  message: string,
  logData: string = '',
  link: string,
  isError: boolean = false,
) => {
  const linkText = isError ? 'Back to Error Logs' : 'Back to Success Logs';
  const fileContent = logData
    ? `<table><thead><tr><th>Log Entry</th></tr></thead><tbody>${logData}</tbody></table>`
    : '';

  return `
    <!DOCTYPE html>
    <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${title}</title>
        <link href="https://fonts.googleapis.com/css2?family=Courier+New:wght@400;600&display=swap" rel="stylesheet">
        <style>
          body {
            font-family: 'Courier New', Courier, monospace;
            background-color: #1e1e1e;
            color: #ffffff;
            margin: 0;
            padding: 0;
            display: flex;
            justify-content: center;
            align-items: center;
            min-height: 100vh;
          }
          h1 {
            color: ${isError ? '#e74c3c' : '#2ecc71'};
            font-size: 40px;
            margin-bottom: 20px;
          }
          p {
            font-size: 20px;
            margin-bottom: 20px;
          }
          a {
            color: #3498db;
            text-decoration: none;
            font-weight: bold;
            padding: 12px 24px;
            border: 1px solid #3498db;
            border-radius: 6px;
            background-color: transparent;
            transition: all 0.3s ease;
            margin-top: 20px;
          }
          a:hover {
            background-color: #3498db;
            color: white;
          }
          .container {
            background-color: #2d2d2d;
            padding: 40px;
            border-radius: 12px;
            box-shadow: 0 2px 20px rgba(0, 0, 0, 0.4);
            width: 100%;
            max-width: 1000px;
            text-align: center;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 20px;
          }
          th, td {
            padding: 12px;
            border: 1px solid #444;
            text-align: left;
            font-size: 16px;
          }
            .button{
              margin-top: 30px;
            }
          th {
            background-color: #333;
            color: #fff;
          }
          .info {
            color: #4caf50;
          }
          .warn {
            color: #f39c12;
          }
          .error {
            color: #e74c3c;
          }
          .debug {
            color: #3498db;
          }
          .trace {
            color: #9b59b6;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <h1>${title}</h1>
          <p>${message}</p>
          ${fileContent}
         <div class="button">
          <a href="${link}">${linkText}</a>
         </div>
        </div>
      </body>
    </html>
  `;
};

// Function to format log data into table rows with color coding
const formatLogData = (data: string) => {
  return data
    .split('\n')
    .map((line) => {
      let levelClass = '';

      if (line.includes('INFO')) {
        levelClass = 'info';
      } else if (line.includes('ERROR')) {
        levelClass = 'error';
      } else if (line.includes('WARN')) {
        levelClass = 'warn';
      } else if (line.includes('DEBUG')) {
        levelClass = 'debug';
      } else if (line.includes('TRACE')) {
        levelClass = 'trace';
      }

      return `<tr><td class="${levelClass}">${line}</td></tr>`;
    })
    .join('');
};

const getSpecificErrorLog = async (req: Request, res: Response) => {
  const logfile = req.params.logfile;
  const logPath = path.join(
    process.cwd(),
    'logs',
    'winston',
    'errors',
    logfile,
  );

  if (!fs.existsSync(logPath)) {
    const htmlContent = generateLogHtmlTemplate(
      'Log Not Found',
      `The log file <strong>${logfile}</strong> does not exist.`,
      '',
      '/logs/errors',
      true,
    );
    return res.status(404).send(htmlContent);
  }

  fs.readFile(logPath, 'utf8', (err, data) => {
    if (err) {
      const htmlContent = generateLogHtmlTemplate(
        'Error Reading Log',
        'Failed to read log file.',
        '',
        '/logs/errors',
        true,
      );
      return res.status(500).send(htmlContent);
    }

    const formattedData = formatLogData(data);
    const htmlContent = generateLogHtmlTemplate(
      `Log File: ${logfile}`,
      'Here are the details of the log file.',
      formattedData,
      '/logs/errors',
      true,
    );
    res.status(200).send(htmlContent);
  });
};

const getSpecificSuccessLog = async (req: Request, res: Response) => {
  const logfile = req.params.logfile;
  const logPath = path.join(
    process.cwd(),
    'logs',
    'winston',
    'successes',
    logfile,
  );

  if (!fs.existsSync(logPath)) {
    const htmlContent = generateLogHtmlTemplate(
      'Log Not Found',
      `The log file <strong>${logfile}</strong> does not exist.`,
      '',
      '/logs/successes',
    );
    return res.status(404).send(htmlContent);
  }

  fs.readFile(logPath, 'utf8', (err, data) => {
    if (err) {
      const htmlContent = generateLogHtmlTemplate(
        'Error Reading Log',
        'Failed to read log file.',
        '',
        '/logs/successes',
      );
      return res.status(500).send(htmlContent);
    }

    const formattedData = formatLogData(data);
    const htmlContent = generateLogHtmlTemplate(
      `Log File: ${logfile}`,
      'Here are the details of the log file.',
      formattedData,
      '/logs/successes',
    );
    res.status(200).send(htmlContent);
  });
};

export const logsController = {
  getAllSuccessLogs,
  getAllErrorLogs,
  getSpecificSuccessLog,
  getSpecificErrorLog,
};
