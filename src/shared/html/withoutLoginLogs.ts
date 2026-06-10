const withOutLoginLogs = `
    <!DOCTYPE html>
    <html lang="en">
      <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>Login | Logs Viewer</title>
        <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;600&display=swap" rel="stylesheet">
        <style>
          body {
            margin: 0;
            font-family: 'Poppins', sans-serif;
            background: linear-gradient(135deg, #232526, #414345);
            color: #ffffff;
            display: flex;
            align-items: center;
            justify-content: center;
            height: 100vh;
          }

          .card {
            background: rgba(255, 255, 255, 0.05);
            backdrop-filter: blur(10px);
            border-radius: 15px;
            padding: 40px;
            box-shadow: 0 0 30px rgba(0, 216, 255, 0.2);
            text-align: center;
            width: 320px;
          }

          h1 {
            font-size: 2rem;
            margin-bottom: 20px;
            color: #00d8ff;
          }

          input {
            width: 100%;
            padding: 12px;
            margin-bottom: 15px;
            border: none;
            border-radius: 8px;
            font-size: 1rem;
          }

          button {
            width: 100px;
            padding: 12px;
            background-color: #00d8ff;
            color: black;
            font-weight: bold;
            border: none;
            border-radius: 8px;
            cursor: pointer;
            transition: background 0.3s ease;
          }

          button:hover {
            background-color: #00a2c6;
          }
        </style>
      </head>
      <body>
        <div class="card">
          <h1>🔐 Login to View Logs</h1>
          <form method="POST" action="/login">
            <input type="text" name="username" placeholder="Username" required />
            <input type="password" name="password" placeholder="Password" required />
            <button type="submit">Login</button>
          </form>
        </div>
      </body>
    </html>
  `;

export default withOutLoginLogs;
