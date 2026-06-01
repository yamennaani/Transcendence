require('dotenv').config();
const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');

const logger = require('../packages/logger')


const authRoutes = require('./auth.routes');

const app = express();

// Security
app.use(helmet());
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100 // limit each IP to 100 requests per windowMs
});
app.use('/api/auth', limiter);

// CORS – allow your Angular app (adjust origin in production)
app.use(cors({
    origin: process.env.NODE_ENV === 'production' ? 'https://yourdomain.com' : 'http://localhost:4200',
    credentials: true
}));

app.use(cookieParser());
app.use(express.json());

// Routes
app.use('/auth', require('./auth.routes'));

// Global error handler
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ error: 'Something went wrong!' });
});


const PORT = process.env.PORT || 3000;

app.listen(PORT, ()=>{
    logger.info('auth service', `running on Port ${PORT}`);
})


// const PORT = process.env.PORT || 5000;
// app.listen(PORT, () => {
//     console.log(`Auth service running on port ${PORT}`);
// });