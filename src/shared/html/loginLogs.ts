const loginLogs = `
      <!DOCTYPE html>
      <html lang="en">
        <head>
          <meta charset="UTF-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1.0" />
          <title>Logs Viewer</title>
          <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;600&display=swap" rel="stylesheet">
          <style>
            body {
              margin: 0;
              font-family: 'Poppins', sans-serif;
              background: linear-gradient(135deg, #0f2027, #203a43, #2c5364);
              color: #ffffff;
              display: flex;
              flex-direction: column;
              align-items: center;
              justify-content: center;
              height: 100vh;
              text-align: center;
            }

            h1 {
              font-size: 3rem;
              margin-bottom: 10px;
              color: #00d8ff;
              letter-spacing: 1px;
            }

            p {
              font-size: 1.2rem;
              margin-bottom: 30px;
              color: #ccc;
            }

            a {
              background-color: #00ffab;
              color: #000;
              padding: 12px 24px;
              margin: 10px;
              border-radius: 8px;
              font-weight: 600;
              text-decoration: none;
              transition: all 0.3s ease;
              display: inline-block;
            }

            a:hover {
              background-color: #00c488;
              transform: scale(1.05);
            }

            .logout {
              background-color: #ff5e5e;
              color: white;
            }

            .logout:hover {
              background-color: #e04444;
            }
          </style>
        </head>
        <body>
          <h1>🚀 Logs Viewer</h1>
          <p>Select the type of logs you want to view:</p>
          <div>
            <a href="/logs/errors">🔴 Error Logs</a>
            <a href="/logs/successes">✅ Success Logs</a>
            <a href="/logout" class="logout">🚪 Logout</a>
          </div>
        </body>
      </html>
    `;

export default loginLogs;
