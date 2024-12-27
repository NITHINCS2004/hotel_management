const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const path = require('path');
const QRCode = require('qrcode');

const app = express();
const port = 8746; // Permanent port number

// Connect to MongoDB
mongoose.connect('mongodb://localhost:27017/HotelManagement', { useNewUrlParser: true, useUnifiedTopology: true })
    .then(() => console.log('MongoDB connected'))
    .catch(err => console.error('MongoDB connection error:', err));

// Define User schema
const userSchema = new mongoose.Schema({
    email: { type: String, required: true },
    checkinDate: { type: Date, required: true },
    checkoutDate: { type: Date, required: true },
    adults: { type: Number, required: true },
    children: { type: Number, required: true },
    rooms: { type: Number, required: true },
    paidcost: { type: Number, default: 0 }, // Add cost field with default value
    bookingId: { type: String, required: true, unique: true } // Add bookingId field
});

// Create User model
const User = mongoose.model('users', userSchema);

// Middleware
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

// Serve the registration form (optional if served by static files)
app.get('/registers', (req, res) => {
    res.sendFile(path.join(__dirname, 'pay.html'));
});

// Handle form submission to update cost
app.post('/registers', async (req, res) => {
    const { email, checkinDate, checkoutDate, paidcost, bookingId } = req.body;

    try {
        // Find the existing record based on bookingId
        const existingUser = await User.findOne({ bookingId });
        
        if (!existingUser || existingUser.email !== email || existingUser.checkinDate.toISOString() !== new Date(checkinDate).toISOString() || existingUser.checkoutDate.toISOString() !== new Date(checkoutDate).toISOString()) {
            return res.status(404).send('It is not registered');
        }

        // Update the cost field
        existingUser.paidcost = paidcost;

        // Save the updated record
        await existingUser.save();

        // Generate UPI QR code
        const upiId = 'mayankbijjal2004-2@okaxis'; // Replace with your UPI ID
        const upiUrl = `upi://pay?pa=${upiId}&pn=Your Name&am=${paidcost}&cu=INR`;

        try {
            const qrCodeDataURL = await QRCode.toDataURL(upiUrl);
            res.send(`
                <html>
                <head>
                    <meta charset="utf-8">
                    <title>Payment Success</title>
                    <meta name="viewport" content="width=device-width, initial-scale=1">
                    <style>
                        body {
                            font-family: Arial, sans-serif;
                            background-color: #f0f0f0;
                            margin: 0;
                            padding: 0;
                            text-align: center;
                        }
                        
                        .success-container {
                            max-width: 600px;
                            margin: 20px auto;
                            background-color: #fff;
                            padding: 20px;
                            box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
                            border-radius: 5px;
                        }
                        
                        .btn {
                            background-color: #4CAF50;
                            color: #fff;
                            padding: 10px 20px;
                            border: none;
                            border-radius: 4px;
                            cursor: pointer;
                            font-size: 16px;
                            margin-top: 10px;
                        }
                        
                        .button{
                            text-align: center;
                        }

                        .btn:hover {
                            background-color: #45a049;
                        }
                    </style>
                </head>
                <body>
                    <div class="success-container">
                        <h1>Make Payment. </h1>
                        <h2>Scan to Pay</h2>
                        <img src="${qrCodeDataURL}" alt="UPI QR Code">
                        <h2>Thank You</h2>
                        <div class="button"><button onclick="window.history.back()" class="btn">Back</button></div>
                    </div>
                </body>
                </html>
            `);
        } catch (err) {
            console.error('Error generating QR code:', err);
            res.status(500).send('Error generating QR code');
        }

    } catch (err) {
        res.status(400).send('Error updating cost: ' + err.message);
    }
});

// Start the server
app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});
