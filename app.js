/*const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');

const app = express();
const port = 7685; // Define your preferred port number

// Connect to MongoDB
mongoose.connect('mongodb://localhost:27017/HotelBooking', {
    useNewUrlParser: true,
    useUnifiedTopology: true,
});
const db = mongoose.connection;
db.on('error', console.error.bind(console, 'MongoDB connection error:'));
db.once('open', () => {
    console.log('Connected to MongoDB');
});

// Define a Mongoose schema for bookings
const bookingSchema = new mongoose.Schema({
    checkinDate: Date,
    checkoutDate: Date,
    adults: Number,
    children: Number,
    rooms: Number,
});

const Booking = mongoose.model('users', bookingSchema);

// Middleware
app.use(bodyParser.urlencoded({ extended: false }));

// Endpoint to fetch the latest booking ID
app.get('/latest-booking', async (req, res) => {
    try {
        // Example: Fetching the latest booking based on check-in date
        const latestBooking = await Booking.findOne().sort({ checkinDate: -1 });
        if (!latestBooking) {
            return res.status(404).json({ error: 'No bookings found' });
        }
        res.json({ bookingId: latestBooking._id });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// Endpoint to fetch booking details by ID
app.get('/booking/:bookingId', async (req, res) => {
    try {
        const booking = await Booking.findById(req.params.bookingId);
        if (!booking) {
            return res.status(404).json({ error: 'Booking not found' });
        }
        res.json(booking);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// Start server
app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});*/
