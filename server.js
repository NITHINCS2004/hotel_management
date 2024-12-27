const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const path = require('path');
const cron = require('node-cron');
const cors = require('cors');
const nodemailer = require('nodemailer');

const app = express();
app.use(cors());
const port = 7865;

// Connect to MongoDB
mongoose.connect('mongodb://localhost:27017/HotelManagement', { useNewUrlParser: true, useUnifiedTopology: true })
    .then(() => console.log('MongoDB connected'))
    .catch(err => console.error('MongoDB connection error:', err));

// Define User schema
const userSchema = new mongoose.Schema({
    email: { type: String, required: true },
    roomtype: { type: String, required: true },
    checkinDate: { type: Date, required: true },
    checkoutDate: { type: Date, required: true },
    adults: { type: Number, required: true },
    children: { type: Number, required: true },
    rooms: { type: Number, required: true },
    bookingId: { type: String, required: true, unique: true }
});
//CREATE TABLE Users (
    //email VARCHAR(255) NOT NULL,
    /*roomtype VARCHAR(50) NOT NULL,
    checkinDate DATE NOT NULL,
    checkoutDate DATE NOT NULL,
    adults INT NOT NULL,
    children INT NOT NULL,
    rooms INT NOT NULL,
    bookingId VARCHAR(50) NOT NULL UNIQUE,
    PRIMARY KEY (bookingId)
);
CREATE TABLE Rooms (
    roomtype VARCHAR(50) NOT NULL,
    availableRooms INT NOT NULL,
    PRIMARY KEY (roomtype)
);*/

// Define Room Availability schema
const roomSchema = new mongoose.Schema({
    roomtype: { type: String, required: true },
    availableRooms: { type: Number, required: true }
});

// Create User and Room models
const User = mongoose.model('users', userSchema);
const Room = mongoose.model('rooms', roomSchema);

// Middleware
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

// Serve static files (e.g., index.html)
app.get('/register', (req, res) => {
    res.sendFile(path.join(__dirname, 'form.html'));
});

// Generate unique booking ID
function generateBookingId() {
    return 'BID' + Date.now();
}

// Initialize room data
async function initializeRoomData() {
    const roomTypes = [
        { roomtype: 'SLAC', availableRooms: 10 },
        { roomtype: 'SLNAC', availableRooms: 20 },
        { roomtype: 'SAC', availableRooms: 15 },
        { roomtype: 'SNAC', availableRooms: 25 }
    ];

    for (const room of roomTypes) {
        const existingRoom = await Room.findOne({ roomtype: room.roomtype });/*SELECT * FROM Rooms WHERE roomtype = 'SLAC';
*/
        if (!existingRoom) {
            await new Room(room).save();
        }
    }
}
/*INSERT INTO Rooms (roomtype, availableRooms) VALUES
('SLAC', 10),
('SLNAC', 20),
('SAC', 15),
('SNAC', 25)
ON DUPLICATE KEY UPDATE availableRooms = VALUES(availableRooms);
*/

// Define failure message
const failureMessage = `
<html>
<head>
    <meta charset="utf-8">
    <title>Registration Failure</title>
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <style>
        body {
            font-family: Arial, sans-serif;
            background-color: #f0f0f0;
            margin: 0;
            padding: 0;
        }

        .failure-container {
            max-width: 600px;
            margin: 20px auto;
            background-color: #fff;
            padding: 20px;
            box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
            border-radius: 5px;
        }

        .failure-container h1 {
            margin-bottom: 10px;
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

        .btn:hover {
            background-color: #45a049;
        }
    </style>
</head>
<body>
    <div class="failure-container">
        <h1>Rooms are not available!</h1>
        <button onclick="window.history.back()" class="btn">Back</button>
    </div>
</body>
</html>
`;

// Handle form submission
app.post('/register', async (req, res) => {
    const { email, roomtype, checkinDate, checkoutDate, adults, children, rooms } = req.body;

    try {
        // Check room availability
        const room = await Room.findOne({ roomtype });
        if (!room || room.availableRooms < rooms) {
            return res.send(failureMessage);
        }

        // Generate booking ID
        const bookingId = generateBookingId();

        // Create new user
        const newUser = new User({
            email,
            roomtype,
            checkinDate,
            checkoutDate,
            adults,
            children,
            rooms,
            bookingId
        });
/*INSERT INTO Users (email, roomtype, checkinDate, checkoutDate, adults, children, rooms, bookingId)
VALUES ('example@example.com', 'SLAC', '2024-07-28', '2024-07-30', 2, 1, 1, 'BID1234567890');*/

        await newUser.save();

        // Update room availability
        room.availableRooms -= rooms;
        await room.save();
/*UPDATE Rooms
SET availableRooms = availableRooms - 1
WHERE roomtype = 'SLAC';
*/
        // Send HTML response with success message including booking ID
        const successMessage = `
            <html>
            <head>
                <meta charset="utf-8">
                <title>Registration Success</title>
                <meta name="viewport" content="width=device-width, initial-scale=1">
                <style>
                    body {
                        font-family: Arial, sans-serif;
                        background-color: #f0f0f0;
                        margin: 0;
                        padding: 0;
                    }

                    .success-container {
                        max-width: 600px;
                        margin: 20px auto;
                        background-color: #fff;
                        padding: 20px;
                        box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
                        border-radius: 5px;
                    }

                    .success-container h1 {
                        margin-bottom: 10px;
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

                    .btn:hover {
                        background-color: #45a049;
                    }
                </style>
            </head>
            <body>
                <div class="success-container">
                    <h1>Your Room has been booked successfully!</h1>
                    <p>Booking ID: ${bookingId}</p>
                    <p>You can pay at the hotel or through the website.</p>
                    <button onclick="window.history.back()" class="btn">Back</button>
                </div>
            </body>
            </html>
        `;

        // Send the success message with booking ID
        res.send(successMessage);

        // Send email notification using Ethereal email service
        // Replace with your Ethereal SMTP credentials
        const transporter = nodemailer.createTransport({
            host: 'smtp.ethereal.email',
            port: 587,
            auth: {
                user: 'rodrigo.lakin@ethereal.email', // Replace with your Ethereal email address
                pass: 'PWCnxJM25u75UXhPWz' // Replace with your Ethereal email password
            }
        });

        const mailOptions = {
            from: 'your_ethereal_user@example.com',
            to: email,
            subject: 'Room Booking Confirmation',
            html: `
                <p>Your room has been booked successfully!</p>
                <p>Booking ID: ${bookingId}</p>
                <p>You can pay at the hotel or through the website.</p>
            `
        };

        transporter.sendMail(mailOptions, function (err, info) {
            if (err) {
                console.error('Error sending email:', err);
            } else {
                console.log('Email sent: ' + info.response, email);
                // Use info for sending success response if needed
            }
        });

    } catch (err) {
        res.status(400).send('Error inserting data: ' + err.message);
    }
});

// Serve available rooms data
app.get('/rooms', async (req, res) => {
    try {
        const rooms = await Room.find({});
        res.json(rooms);
    } catch (err) {
        res.status(500).send('Error fetching room data: ' + err.message);
    }
});

// Schedule a job to run daily at midnight to update room availability
cron.schedule('0 0 * * *', async () => {
    try {
        const now = new Date();
        const expiredBookings = await User.find({ checkoutDate: { $lt: now } });

        for (const booking of expiredBookings) {
            const room = await Room.findOne({ roomtype: booking.roomtype });
            if (room) {
                room.availableRooms += booking.rooms;
                await room.save();

                // Remove expired booking
                await User.deleteOne({ _id: booking._id });
            }/*DELETE FROM Users WHERE bookingId = 'BID1234567890';
*/
        }
        /*const getExpiredBookings = async (date) => {
    try {
        const expiredBookings = await User.aggregate([
            { $match: { checkoutDate: { $lt: new Date(date) } } },
            { $group: { _id: "$roomtype", roomsToRelease: { $sum: "$rooms" } } }
        ]);
        return expiredBookings;
    } catch (err) {
        console.error('Error fetching expired bookings:', err);
    }
};
*/

        console.log('Room availability updated');
    } catch (err) {
        console.error('Error updating room availability:', err);
    }
});

// Initialize room data and start the server
initializeRoomData().then(() => {
    app.listen(port, () => {
        console.log(`Server is running on http://localhost:${port}`);
    });
});
//update
//findone
//delete
