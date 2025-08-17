# EDI Management System

A Node.js/Express web application with authentication, session management, and PostgreSQL database integration. Features secure login, protected pages, and activity logging.

## Features

- **Authentication System**: Admin login with 4-digit password
- **Session Management**: Secure session handling with PostgreSQL storage
- **Protected Pages**: Three sample pages accessible only to authenticated users
- **Activity Logging**: Tracks logins, logouts, and page access
- **Responsive UI**: Modern, responsive design with clean interface
- **Security**: Helmet.js for security headers, CSRF protection, and secure sessions
- **Database Integration**: PostgreSQL for data persistence
- **Deployment Ready**: Configured for Vercel deployment

## Project Structure

```
edi-manage-system/
├── app.js                 # Main Express application
├── server.js              # Server entry point
├── package.json           # Dependencies and scripts
├── vercel.json            # Vercel deployment config
├── .env.example           # Environment variables template
├── .gitignore             # Git ignore patterns
├── config/
│   └── database.js        # Database configuration
├── middleware/
│   ├── auth.js            # Authentication middleware
│   └── session.js         # Session configuration
├── routes/
│   ├── auth.js            # Authentication routes
│   └── pages.js           # Protected page routes
├── views/
│   ├── login.html         # Login page
│   ├── page1.html         # Sample page 1
│   ├── page2.html         # Sample page 2
│   └── page3.html         # Sample page 3
├── public/
│   ├── css/
│   │   └── style.css      # Main stylesheet
│   └── js/
│       └── main.js        # Client-side JavaScript
└── sql/
    └── init.sql           # Database initialization
```

## Quick Start

### Prerequisites

- Node.js (v18 or higher)
- PostgreSQL database
- Git
- VS Code (recommended)

### 1. Clone and Setup

```bash
# Clone the repository
git clone <your-repo-url>
cd edi-manage-system

# Install dependencies
npm install

# Copy environment file
cp .env.example .env
```

### 2. Database Setup

**Option A: Local PostgreSQL**
```bash
# Create database
createdb edi_manage_system

# Run initialization script
psql -d edi_manage_system -f sql/init.sql
```

**Option B: Cloud Database (Recommended for production)**
- Create a PostgreSQL database on your preferred cloud provider
- Update DATABASE_URL in .env with your connection string

### 3. Environment Configuration

Edit `.env` file:
```env
NODE_ENV=development
PORT=3000
DATABASE_URL=postgres://username:password@localhost:5432/edi_manage_system
SESSION_SECRET=your-super-secret-session-key
ADMIN_PASSWORD=1234
```

### 4. Run the Application

```bash
# Development mode (with nodemon)
npm run dev

# Production mode
npm start
```

Visit `http://localhost:3000` and login with:
- Username: `admin`
- Password: `1234` (or your custom password from .env)

## Deployment

### Deploy to Vercel

1. **Prepare for deployment:**
   ```bash
   # Ensure all changes are committed
   git add .
   git commit -m "Initial commit"
   git push origin main
   ```

2. **Set up Vercel:**
   - Install Vercel CLI: `npm i -g vercel`
   - Login: `vercel login`
   - Deploy: `vercel`

3. **Configure environment variables in Vercel:**
   - Go to your Vercel dashboard
   - Add these environment variables:
     - `DATABASE_URL`: Your PostgreSQL connection string
     - `SESSION_SECRET`: A secure random string
     - `ADMIN_PASSWORD`: Your admin password
     - `NODE_ENV`: `production`

4. **Set up PostgreSQL:**
   - Use a cloud PostgreSQL service (AWS RDS, Railway, Supabase, etc.)
   - Run the `sql/init.sql` script on your production database

### Environment Variables

| Variable | Description | Required | Default |
|----------|-------------|----------|---------|
| `NODE_ENV` | Environment mode | No | `development` |
| `PORT` | Server port | No | `3000` |
| `DATABASE_URL` | PostgreSQL connection string | Yes | - |
| `SESSION_SECRET` | Session encryption key | Yes | - |
| `ADMIN_PASSWORD` | Admin login password | No | `1234` |

## Usage

### Authentication

- Default credentials: `admin` / `1234`
- Sessions expire after 30 minutes of inactivity
- Failed login attempts are logged
- Automatic redirect to login for unauthenticated access

### Pages

1. **Page 1 (Dashboard)**: Overview with statistics and recent activities
2. **Page 2 (Data Processing)**: Sample data processing interface
3. **Page 3 (Reports)**: Activity logs and system status

### API Endpoints

- `GET /auth/status` - Check authentication status
- `POST /auth/login` - User login
- `POST /auth/logout` - User logout
- `GET /pages/api/data` - Protected data endpoint

## Development

### Available Scripts

```bash
npm start          # Start production server
npm run dev        # Start development server with nodemon
npm run setup-db   # Initialize database (if script exists)
```

### Database Schema

The application creates these tables:
- `activity_logs`: User activity tracking
- `session`: Express session storage
- `users`: User accounts (for future expansion)
- `system_settings`: Configuration settings

### Security Features

- Helmet.js for security headers
- CSRF protection
- Secure session cookies
- SQL injection prevention
- Input validation
- Session timeout

## Customization

### Adding New Pages

1. Create HTML file in `views/`
2. Add route in `routes/pages.js`
3. Update navigation in existing pages
4. Add appropriate middleware

### Modifying Authentication

- Update `middleware/auth.js` for custom auth logic
- Modify `ADMIN_PASSWORD` in environment variables
- Extend user system using the `users` table

### Database Modifications

- Add new tables to `sql/init.sql`
- Create migration scripts for schema changes
- Update models if using an ORM

## Troubleshooting

### Common Issues

1. **Database Connection Errors**
   - Check DATABASE_URL format
   - Ensure PostgreSQL is running
   - Verify credentials and permissions

2. **Session Issues**
   - Check SESSION_SECRET is set
   - Verify session table exists
   - Clear browser cookies

3. **Vercel Deployment**
   - Check environment variables are set
   - Ensure database is accessible from Vercel
   - Review function logs in dashboard

### Debugging

```bash
# Enable debug logging
DEBUG=express:* npm run dev

# Check database connection
node -e "require('./config/database').pool.query('SELECT NOW()').then(r => console.log(r.rows))"
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

MIT License - see LICENSE file for details

## Support

For issues and questions:
1. Check the troubleshooting section
2. Review the database logs
3. Check Vercel function logs (for deployment issues)
4. Create an issue in the repository

---

**Note**: Remember to change default passwords and session secrets in production!