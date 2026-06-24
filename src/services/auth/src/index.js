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
    origin:'https://localhost',
    credentials: true
}));

app.use(cookieParser());
app.use(express.json());

// Routes
app.use('/auth', require('./auth.routes'));

// Global error handler
const isProd = process.env.NODE_ENV === 'production';

app.use((err, req, res, next) => {
    const status = err.status || 500;

    // Only log real failures (5xx). Expected client errors (4xx) are already
    // handled/displayed by the frontend, so they're noise in every environment.
    if (status >= 500) {
        logger.error('auth-service', err.message, { status, stack: err.stack });
    }

    const message = !isProd || status < 500 ? err.message : 'Something went wrong!';
    const body = { error: message };
    if (err.suggestions) body.suggestions = err.suggestions;
    res.status(status).json(body);
});


const PORT = process.env.PORT || 3000;

app.listen(PORT, ()=>{
    logger.info('auth service', `running on Port ${PORT}`);
})


// const PORT = process.env.PORT || 5000;
// app.listen(PORT, () => {
//     console.log(`Auth service running on port ${PORT}`);
// });