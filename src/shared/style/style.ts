export const style = `
    * {
            box-sizing: border-box;
            padding: 0;
            margin: 0;
        }

        body,
        div,
        a {
            -webkit-text-size-adjust: 100%;
            -ms-text-size-adjust: 100%;
            margin: 0;
            padding: 0;
        }

        img {
            -ms-interpolation-mode: bicubic;
            border: 0;
            outline: none;
            text-decoration: none;
        }

        body {
            width: 100% !important;
            background: #000000;
            font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
            color: #ffffff;
        }

        a {
            text-decoration: none;
            color: #ffffff;
        }

        /* Email Container */
        .email-container {
            max-width: 600px;
            margin: 40px auto;
            background: #111111;
            border-radius: 8px;
            border: 2px solid #ffffff;
            overflow: hidden;
            box-shadow: 0px 4px 12px rgba(255, 255, 255, 0.1);
        }

        /* Header */
        .email-header {
            background: #000000;
            text-align: center;
            padding: 30px;
            color: #ffffff;
            border-bottom: 2px solid #ffffff;
            display: flex;
            justify-content: space-between;
        }

        .email-header img {
            width: 250px;
            height: auto;
            margin-bottom: 10px;
        }

        .email-header h1 {
            margin: 0;
            font-size: 28px;
            letter-spacing: 1px;
            color: #ffffff;
        }

        /* Content Area */
        .email-content {
            padding: 30px 20px;
            text-align: left;
            line-height: 1.6;
        }

        .email-content h2 {
            font-size: 22px;
            color: #ffffff;
            margin-bottom: 10px;
        }

        .email-content p {
            font-size: 16px;
            margin: 10px 0;
            color: #e0e0e0;
        }

        .otp-code {
            display: block;
            font-size: 36px;
            font-weight: bold;
            color: #ffffff;
            background: #000000;
            border: 2px dashed #ffffff;
            padding: 20px;
            margin: 20px 0;
            text-align: center;
            border-radius: 4px;
            letter-spacing: 2px;
        }

        .btn {
            display: inline-block;
            background: #ffffff;
            color: #000000;
            padding: 12px 30px;
            font-size: 16px;
            border-radius: 4px;
            transition: background 0.3s ease;
        }

        .btn:hover {
            background: #e0e0e0;
            color: #000000;
        }

        /* Footer Area */
        .email-footer {
            background: #000000;
            color: #ffffff;
            text-align: center;
            padding: 15px;
            font-size: 14px;
            border-top: 2px solid #ffffff;
        }

        /* Preheader (hidden preview text) */
        .preheader {
            display: none;
            font-size: 1px;
            color: #000000;
            line-height: 1px;
            max-height: 0;
            max-width: 0;
            opacity: 0;
            overflow: hidden;
        }

        @media screen and (max-width: 600px) {
            .email-container {
                width: 100% !important;
            }
        }
`;
