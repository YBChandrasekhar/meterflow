require('dotenv').config();
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const http = require('http');
const { Server } = require('socket.io');

const connectDB = require('./config/db');
const authRoutes = require('./routes/authRoutes');
const apiRoutes = require('./routes/apiRoutes');
const usageRoutes = require('./routes/usageRoutes');
const gatewayRoutes = require('./routes/gatewayRoutes');
const { startBillingWorker } = require('./services/billingJob');

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: { origin: process.env.CLIENT_URL, methods: ['GET', 'POST'] }
});

app.use(cors({ origin: process.env.CLIENT_URL }));
app.use(express.json());
app.use(morgan('dev'));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/apis', apiRoutes);
app.use('/api/usage', usageRoutes);
app.use('/gateway', gatewayRoutes);

// Health check
app.get('/health', (req, res) => res.json({ status: 'ok' }));

// Socket.io for real-time dashboard
io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);
  socket.on('disconnect', () => console.log('Client disconnected:', socket.id));
});

app.set('io', io);

const PORT = process.env.PORT || 5000;

connectDB().then(() => {
  startBillingWorker();
  server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
});
