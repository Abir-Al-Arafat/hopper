// === Shared Styles (DRY) ===
const globalLogStyle = `
  body {
    margin: 0;
    padding: 20px;
    font-family: 'Poppins', sans-serif;
    background-color: #121212;
    color: #ffffff;
  }

  h1 {
    color: #00ffab;
    font-size: 2.5rem;
    text-align: center;
  }

  p {
    font-size: 1.1rem;
    color: #ccc;
    text-align: center;
  }

  table {
    width: 90%;
    margin: 30px auto;
    border-collapse: collapse;
    background-color: #1f1f1f;
    border-radius: 10px;
    overflow: hidden;
  }

  th, td {
    padding: 16px;
    border-bottom: 1px solid #333;
    text-align: left;
  }

  th {
    background-color: #00d8ff;
    color: #000;
  }

  tr:hover {
    background-color: #2c2c2c;
  }

  a.view-btn {
    padding: 8px 16px;
    background-color: #00ffab;
    color: black;
    text-decoration: none;
    border-radius: 5px;
    font-weight: bold;
    transition: background 0.3s ease;
  }

  a.view-btn:hover {
    background-color: #00c488;
  }

  .back-home {
    display: block;
    width: fit-content;
    margin: 40px auto 0;
    padding: 12px 24px;
    background-color: #ff5e5e;
    color: white;
    text-decoration: none;
    border-radius: 8px;
    font-weight: bold;
    text-align: center;
  }

  .back-home:hover {
    background-color: #e04444;
  }

  pre {
    background-color: #1e1e1e;
    padding: 20px;
    border-radius: 8px;
    text-align: left;
    white-space: pre-wrap;
    overflow-x: auto;
    max-width: 90%;
    margin: 20px auto;
    box-shadow: 0 0 10px rgba(0, 216, 255, 0.1);
    font-size: 0.95rem;
    line-height: 1.5;
  }
`;

export default globalLogStyle;
