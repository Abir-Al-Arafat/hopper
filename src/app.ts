/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable no-unused-vars */
/* eslint-disable @typescript-eslint/no-unused-vars */
import cookieParser from 'cookie-parser';
import cors from 'cors';
import express, { Application, NextFunction, Request, Response } from 'express';
import globalErrorHandler from './app/middleware/globalErrorHandler';
import notFound from './app/middleware/nof-found';
import router from './app/router';
import morgan from 'morgan';
import { errorLogger, logger } from './shared/logger';
import { LogsRoutes } from './shared/logs.routes';
import loginLogs from './shared/html/loginLogs';
import withOutLoginLogs from './shared/html/withoutLoginLogs';
import config from './config';
import rateLimit from 'express-rate-limit';
import { StripeCartController } from './app/modules/stripe/stripe.controller';

const app: Application = express();
app.post('/api/v1/hopper/onboarding/webhook', express.raw({ type: 'application/json' }), StripeCartController.handleOnboardingStripeEvent);

app.use('/public', express.static('public'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

app.use(
  cors({
    origin: [
      'http://hopperroadside.com',
      'http://localhost:5174',
      'http://10.10.10.6:5174',
      'http://10.10.10.2:5174',
      'https://hopperroadside.com',
    ],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
  }),
);

app.use(
  morgan('dev', {
    stream: {
      write: (message) => logger.info(message),
    },
  }),
);

app.use(
  rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 1000, // limit each IP to 100 requests per windowMs
    message: {
      status: 429,
      error: 'Too many requests, please try again later.',
    },
    standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
    legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  }),
);

// Routes Middleware
app.use('/api/v1', router);

// Welcome route
app.get('/', (req: Request, res: Response) => {
  const isLoggedIn = req.cookies?.loggedIn === 'true';

  if (isLoggedIn) {
    return res.status(200).send(loginLogs);
  }

  // Show login form
  res.status(200).send(withOutLoginLogs);
});

app.post('/login', (req: Request, res: Response) => {
  const { username, password } = req.body;

  // Very basic check (replace with real auth in production)
  if (
    username === config.logger_username &&
    password === config.logger_password
  ) {
    res.cookie('loggedIn', 'true');
    return res.redirect('/');
  }

  res.send(`
    <html>
      <head>
        <title>Login</title>
        <script type="text/javascript">
          alert('Invalid credentials. Please try again!');
          window.location.href = '/';
        </script>
      </head>
      <body>
        <h1>Login</h1>
        <form method="POST" action="/login">
          <input type="text" name="username" placeholder="Username" required />
          <input type="password" name="password" placeholder="Password" required />
          <button type="submit">Login</button>
        </form>
      </body>
    </html>
  `);
});

export const requireLogin = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  if (req.cookies?.loggedIn !== 'true') {
    return res.redirect('/');
  }
  next();
};

app.get('/errors', requireLogin, (req, res) => {
  return res.redirect('/errors');
});

app.get('/successes', requireLogin, (req, res) => {
  return res.redirect('/successes');
});

app.get('/logout', (req: Request, res: Response) => {
  res.clearCookie('loggedIn');
  return res.redirect('/');
});

//Logger Routes
app.use('/logs', LogsRoutes);

// Error handler
app.use((err: Error, req: Request, res: Response, next: any) => {
  errorLogger.error(err);

  next(err);
});

// Not Found Middleware
app.use(notFound);
// Global Error Handler Middleware
app.use(globalErrorHandler);

export default app;
