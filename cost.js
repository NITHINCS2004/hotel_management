const express = require('express');
const mongoose = require('mongoose');

// Step 1: Connect to MongoDB
mongoose.connect('mongodb://localhost:27017/HotelManagement', {
    useNewUrlParser: true,
    useUnifiedTopology: true
});

// Step 2: Define Mongoose schema
const userSchema = new mongoose.Schema({
    email: String,
    checkinDate: Date,
    checkoutDate: Date,
    adults: Number,
    children: Number,
    rooms: Number,
    paidcost: Number, // Include paidcost field
    bookingId: { type: String, required: true, unique: true } // Include bookingId field
});

// Define the model based on the schema
const User = mongoose.model('User', userSchema, 'users');

// Step 3: Set up Express application
const app = express();
const port = 6740; // Specify the port you want to use

// Step 4: Middleware for JSON parsing
app.use(express.json()); // Middleware to parse JSON bodies

// Step 5: Endpoint to fetch user data and calculate cost
app.get('/', async (req, res) => {
    try {
        const allUsers = await User.find({});
        const usersWithCost = allUsers.map(user => {
            // Calculate cost based on user data
            const calculateCost = (checkinDate, checkoutDate, adults, children, rooms) => {
                const baseRate = 1000;           // Example base rate per night
                const additionalRate1 = 800;     // Example additional rate per night after first 5 days
                const additionalRate2 = 1200;    // Example additional rate per night after next 5 days

                const oneDay = 24 * 60 * 60 * 1000; // Hours * minutes * seconds * milliseconds
                const checkinTime = new Date(checkinDate).getTime();
                const checkoutTime = new Date(checkoutDate).getTime();
                const diffTime = Math.abs(checkoutTime - checkinTime);
                const totalNights = Math.ceil(diffTime / oneDay);

                let totalCost = 0;

                for (let night = 1; night <= totalNights; night++) {
                    if (night <= 5) {
                        totalCost += baseRate;
                    } else if (night <= 10) {
                        totalCost += additionalRate1;
                    } else {
                        totalCost += additionalRate2;
                    }
                }

                const totalGuests = adults + children;
                const totalGuestCost = totalGuests * totalCost;

                return totalGuestCost;
            };

            const totalGuestCost = calculateCost(user.checkinDate, user.checkoutDate, user.adults, user.children, user.rooms);
            const finalTotalCost = totalGuestCost - (user.paidcost || 0); // Subtract paid cost if applicable

            return {
                ...user.toObject(),
                totalCost: finalTotalCost
            };
        });

        // Sorting users by totalCost
        usersWithCost.sort((a, b) => a.totalCost - b.totalCost);
/*WITH cost_calculation AS (
    SELECT
        email,
        checkinDate,
        checkoutDate,
        adults,
        children,
        rooms,
        DATEDIFF(day, checkinDate, checkoutDate) AS totalNights,
        CASE
            WHEN DATEDIFF(day, checkinDate, checkoutDate) <= 5 THEN DATEDIFF(day, checkinDate, checkoutDate) * 1000
            WHEN DATEDIFF(day, checkinDate, checkoutDate) <= 10 THEN
                (5 * 1000) + ((DATEDIFF(day, checkinDate, checkoutDate) - 5) * 800)
            ELSE
                (5 * 1000) + (5 * 800) + ((DATEDIFF(day, checkinDate, checkoutDate) - 10) * 1200)
        END AS baseCost,
        (adults + children) * (
            CASE
                WHEN DATEDIFF(day, checkinDate, checkoutDate) <= 5 THEN 1000
                WHEN DATEDIFF(day, checkinDate, checkoutDate) <= 10 THEN
                    800
                ELSE
                    1200
            END
        ) AS totalCost
    FROM users
)
SELECT
    email,
    checkinDate,
    checkoutDate,
    adults,
    children,
    rooms,
    paidcost,
    bookingId,
    (totalCost - COALESCE(paidcost, 0)) AS finalTotalCost
FROM cost_calculation
ORDER BY finalTotalCost;
*/
        res.send(`
            <!DOCTYPE html>
            <html>
            <head>
                <title>User Data with Cost</title>
                <style>
                    table {
                        border-collapse: collapse;
                        width: 100%;
                    }
                    th, td {
                        border: 1px solid #ddd;
                        padding: 8px;
                        text-align: left;
                    }
                    th {
                        background-color: #f2f2f2;
                        cursor: pointer;
                    }
                    .back-button {
                        margin-top: 20px;
                    }
                </style>
                <script>
                    // Client-side sorting function (optional)
                    function sortTable(columnIndex) {
                        const table = document.querySelector('table');
                        const rows = Array.from(table.rows).slice(1); // Exclude header row
                        const isNumeric = !isNaN(parseFloat(rows[0].cells[columnIndex].textContent));

                        rows.sort((rowA, rowB) => {
                            const cellA = isNumeric ? parseFloat(rowA.cells[columnIndex].textContent) : rowA.cells[columnIndex].textContent;
                            const cellB = isNumeric ? parseFloat(rowB.cells[columnIndex].textContent) : rowB.cells[columnIndex].textContent;
                            return cellA > cellB ? 1 : -1;
                        });

                        // Reorder rows based on sorting
                        table.tBodies[0].append(...rows);
                    }
                </script>
            </head>
            <body>
                <h2>User Data with Cost</h2>
                <table>
                    <thead>
                        <tr>
                            <th>Email</th>
                            <th>Check-in Date</th>
                            <th>Check-out Date</th>
                            <th>Adults</th>
                            <th>Children</th>
                            <th>Rooms</th>
                            <th>Paid Cost</th>
                            <th>Booking ID</th>
                            <th onclick="sortTable(8)">Total Cost</th> <!-- Sort by Total Cost -->
                            <th>Send</th> <!-- New column header for Send button -->
                        </tr>
                    </thead>
                    <tbody>
                        ${usersWithCost.map(user => `
                            <tr>
                                <td>${user.email}</td>
                                <td>${new Date(user.checkinDate).toISOString().slice(0, 10)}</td>
                                <td>${new Date(user.checkoutDate).toISOString().slice(0, 10)}</td>
                                <td>${user.adults}</td>
                                <td>${user.children}</td>
                                <td>${user.rooms}</td>
                                <td>${user.paidcost || 0}</td>
                                <td>${user.bookingId}</td>
                                <td>${user.totalCost}</td>
                                <td><a href="https://formsubmit.co/el/mezeso" class="send-button">Send</a></td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
                
                <button class="back-button" onclick="window.history.back()">Back</button>
            </body>
            </html>
        `);
    } catch (err) {
        console.error('Error fetching data:', err);
        res.status(500).send('Error fetching data');
    }
});

// Step 6: Start the server
app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});
//fetch 
//insert
//aggregate 
//Comman table expression with WITH caluse