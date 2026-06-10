# Hopper Roadside

A comprehensive backend API for a roadside assistance service platform, connecting customers with service providers in real-time.

## 🚀 Features

- **User Management**: Multi-role authentication system (Admin, Company, Dispatcher, Customer, Service Provider)
- **Job Management**: Create, assign, and track roadside assistance jobs
- **Real-time Communication**: Socket.IO integration for live updates and messaging
- **Payment Processing**: Stripe integration for subscription and payment management
- **Geolocation Services**: Location-based job assignment and tracking
- **Notification System**: Push notifications via Firebase
- **Subscription Management**: Flexible subscription plans for companies and service providers
- **Review & Rating System**: Customer feedback and provider ratings
- **Scheduled Jobs**: Automated job scheduling and cron tasks
- **Comprehensive Logging**: Winston-based logging system with daily rotation
- **Message Queue**: Kafka integration for asynchronous task processing
- **Caching**: Redis for session management and performance optimization

## 🛠️ Tech Stack

### Core Technologies
- **Runtime**: Node.js v20
- **Language**: TypeScript
- **Framework**: Express.js
- **Database**: MongoDB (Mongoose ODM)
- **Caching**: Redis, IORedis
- **Message Queue**: Apache Kafka (KafkaJS)
- **Real-time**: Socket.IO

### Key Dependencies
- **Authentication**: JWT (jsonwebtoken), bcrypt
- **Validation**: Zod
- **Payment**: Stripe
- **Email**: Nodemailer
- **File Upload**: Multer, AWS S3
- **Image Processing**: HEIC Convert
- **Logging**: Winston, winston-daily-rotate-file
- **Task Scheduling**: node-cron
- **Push Notifications**: Firebase Admin SDK
- **Rate Limiting**: express-rate-limit

## 📋 Prerequisites

Before you begin, ensure you have the following installed:
- Node.js (v20 or higher)
- npm or yarn
- MongoDB
- Redis
- Docker & Docker Compose (for containerized deployment)
- Apache Kafka (optional, for development without Docker)

## 🔧 Installation

### 1. Clone the repository
```bash
git clone <repository-url>
cd hopper-roadside
```

### 2. Install dependencies
```bash
npm install
```

### 3. Environment Setup
Create a `.env` file in the root directory with the following variables:

```env
# Application
NODE_ENV=development
PORT=8000
SOCKET_PORT=8001
IP=localhost
BASE_URL=http://localhost:8000
PROJECT_NAME=Hopper Roadside

# Database
DATABASE_URL=mongodb://localhost:27017/hopper-roadside

# Security
SALT_ROUND=10

# JWT Configuration
ACCESS_KEY=your_access_token_secret
ACCESS_EXPIRE_IN=7d
SIGNUP_KEY=your_signup_token_secret
SIGNUP_EXPIRE_IN=1h
FORGOT_PASSWORD_KEY=your_forgot_password_secret
FORGOT_PASSWORD_EXPIRE_IN=1h
REFRESH_KEY=your_refresh_token_secret
REFRESH_EXPIRE_IN=30d
RESET_PASSWORD_KEY=your_reset_password_secret
RESET_PASSWORD_EXPIRE_IN=1h

# Admin Credentials
ADMIN_EMAIL=admin@hopperroadside.com
ADMIN_PASSWORD=your_admin_password

# Company Credentials
HOPPER_COMPANY_EMAIL=company@hopperroadside.com
HOPPER_COMPANY_PASSWORD=your_company_password

# Default Passwords
DISPATCHER_DEFAULT_PASSWORD=dispatcher123
CUSTOMER_DEFAULT_PASSWORD=customer123

# OTP
OTP_EXPIRE_IN=5

# Email Configuration (SMTP)
SMTP_USERNAME=your_smtp_username
SMTP_PASSWORD=your_smtp_password

# Payment (Stripe)
STRIPE_SECRET_KEY=your_stripe_secret_key

# AWS S3
AWS_ACCESS_KEY_ID=your_aws_access_key
AWS_SECRET_ACCESS_KEY=your_aws_secret_key
AWS_REGION=us-east-1
AWS_BUCKET_NAME=your_bucket_name

# Logging
LOGGER_USERNAME=logger
LOGGER_PASSWORD=your_logger_password

# Monitoring
MONITOR_USERNAMES=monitor_user
MONITOR_PASSWORDS=monitor_pass
```

## 🚀 Running the Application

### Development Mode
```bash
npm run dev
```

### Production Build
```bash
# Build the TypeScript code
npm run build

# Run the production server
npm run start:prod
```

### Using Docker Compose
```bash
# Start all services (app, redis, kafka, zookeeper)
docker-compose up -d

# View logs
docker-compose logs -f

# Stop all services
docker-compose down
```

## 📂 Project Structure

```
hopper-roadside/
├── src/
│   ├── app/
│   │   ├── constant/           # Application constants
│   │   ├── DB/                 # Database seeders
│   │   ├── helper/             # Helper functions
│   │   ├── interface/          # TypeScript interfaces
│   │   ├── kafka/              # Kafka configuration
│   │   ├── middleware/         # Express middlewares
│   │   ├── modules/            # Feature modules
│   │   │   ├── auth/           # Authentication
│   │   │   ├── category/       # Service categories
│   │   │   ├── company/        # Company management
│   │   │   ├── conversation/   # Chat conversations
│   │   │   ├── job/            # Job management
│   │   │   ├── jobRequest/     # Job requests
│   │   │   ├── message/        # Messaging
│   │   │   ├── notification/   # Notifications
│   │   │   ├── payment/        # Payment processing
│   │   │   ├── profile/        # User profiles
│   │   │   ├── review/         # Reviews & ratings
│   │   │   ├── service/        # Service management
│   │   │   ├── subscription/   # Subscription plans
│   │   │   ├── user/           # User management
│   │   │   └── ...
│   │   ├── QueryBuilder/       # Query utilities
│   │   ├── router/             # Route aggregation
│   │   └── utils/              # Utility functions
│   ├── config/                 # Configuration files
│   ├── Errors/                 # Error handlers
│   ├── shared/                 # Shared resources
│   │   ├── html/               # Email templates
│   │   ├── style/              # Styling utilities
│   │   └── logger.ts           # Logger configuration
│   ├── socket/                 # Socket.IO setup
│   ├── app.ts                  # Express app setup
│   ├── redis.ts                # Redis configuration
│   └── server.ts               # Server entry point
├── docker-compose.yml          # Docker services
├── Dockerfile                  # Docker image
├── package.json               # Dependencies
├── tsconfig.json              # TypeScript config
└── README.md                  # This file
```

## 🔌 API Endpoints

The API is versioned and accessible at `/api/v1`. Main endpoint groups include:

- `/api/v1/auth` - Authentication & Authorization
- `/api/v1/users` - User management
- `/api/v1/companies` - Company management
- `/api/v1/jobs` - Job operations
- `/api/v1/job-requests` - Job request handling
- `/api/v1/categories` - Service categories
- `/api/v1/services` - Service management
- `/api/v1/payments` - Payment processing
- `/api/v1/subscriptions` - Subscription management
- `/api/v1/notifications` - Notification system
- `/api/v1/messages` - Messaging system
- `/api/v1/conversations` - Chat conversations
- `/api/v1/reviews` - Reviews & ratings
- `/api/v1/profiles` - User profiles
- `/api/v1/static-content` - Static content management
- `/logs` - Application logs (protected)

## 🔐 Authentication

The API uses JWT (JSON Web Tokens) for authentication. Include the token in the Authorization header:

```
Authorization: Bearer <your_jwt_token>
```

### User Roles
- **ADMIN**: Full system access
- **COMPANY**: Company account management
- **DISPATCHER**: Job assignment and management
- **CUSTOMER**: Request and track services
- **SERVICE_PROVIDER**: Accept and complete jobs

## 🔄 Real-time Features

The application runs a Socket.IO server on a separate port (default: 8001) for:
- Live job status updates
- Real-time messaging
- Push notifications
- Location tracking

## 📊 Logging & Monitoring

Access the logging dashboard at `http://localhost:8000/` (requires authentication).

Logs are categorized into:
- **Success logs**: `/logs/successes`
- **Error logs**: `/logs/errors`
- Daily rotated log files stored in the logs directory

## 🧪 Code Quality

### Linting
```bash
# Check for linting errors
npm run lint

# Auto-fix linting errors
npm run lint:fix
```

### Code Formatting
```bash
# Format code with Prettier
npm run prettier

# Auto-fix formatting
npm run prettier:fix
```

## 🗄️ Database Seeding

Seed the database with initial data:

```bash
# The seeding scripts are located in src/app/DB/
# Run them as needed for admin and company setup
```

## 📦 Docker Services

The `docker-compose.yml` includes:
- **app**: Main application server
- **redis**: Caching and session storage
- **kafka**: Message queue for async processing
- **zookeeper**: Kafka dependency

Ports exposed:
- `8000`: Main API server
- `8001`: Socket.IO server
- `6379`: Redis
- `9092`: Kafka
- `2181`: Zookeeper

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the ISC License.

## 🐛 Troubleshooting

### Common Issues

1. **MongoDB connection failed**
   - Ensure MongoDB is running
   - Check DATABASE_URL in .env file

2. **Redis connection error**
   - Start Redis server: `redis-server`
   - Verify Redis is accessible on port 6379

3. **Kafka connection issues**
   - Ensure Zookeeper is running before Kafka
   - Check Kafka broker configuration

4. **Port already in use**
   - Change PORT or SOCKET_PORT in .env
   - Kill process using the port: `lsof -ti:8000 | xargs kill -9`

## 📧 Support

For support and queries, please contact the development team or create an issue in the repository.

## 🙏 Acknowledgments

- Express.js community
- MongoDB team
- Socket.IO contributors
- All open-source dependencies

---

**Note**: This is a production-ready backend API. Ensure all environment variables are properly configured and secured before deployment.

