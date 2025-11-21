import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import mongoose from 'mongoose';
import userRoutes from './routes/user.route.js';
import weatherRoutes from './routes/weather.route.js'
import productRoutes from './routes/product.route.js';
import routineRoutes from './routes/routine.route.js';
import ingredientRoutes from './routes/ingredient.route.js';

const app = express();

// Increase timeout for long-running requests (5 minutes)
app.use((req, res, next) => {
  req.setTimeout(300000); // 5 minutes
  res.setTimeout(300000);
  next();
});

// Middleware
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(morgan('dev'));

// Disable helmet and rate limiter for debugging
// app.use(helmet({
//   contentSecurityPolicy: false,
//   crossOriginEmbedderPolicy: false
// }));
// app.use(rateLimit({
//   windowMs: 15 * 60 * 1000,
//   max: 100,
//   standardHeaders: true,
//   legacyHeaders: false
// }));

// Routes
app.use('/api/users', userRoutes);
app.use('/api/products', productRoutes);
app.use('/api/weather', weatherRoutes);
app.use('/api/routines', routineRoutes);
app.use('/api/ingredient', ingredientRoutes);

app.get('/', (req, res) => res.send('Backend alive'));

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/skincare-app';
mongoose.connect(MONGODB_URI, {
  serverSelectionTimeoutMS: 10000,
  socketTimeoutMS: 300000
})
  .then(() => console.log('Connected to MongoDB'))
  .catch((err) => console.error('MongoDB connection error:', err));

const PORT = process.env.PORT || 5002;
const server = app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

server.timeout = 300000;
server.keepAliveTimeout = 300000;
server.headersTimeout = 305000;