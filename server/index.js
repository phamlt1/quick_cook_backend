const express = require("express");
const bodyParser = require("body-parser");
const app = express();
const cors = require('cors');
app.use(cors())

app.use(express.json());

// Endpoint to receive data from frontend
app.post("/api/data", (req, res) => {
	const formData = req.body;
	// Process the received data (e.g., save to database)
    // console.log(req);
	console.log("Received data:", formData);
	res.json("Data received successfully!");
});

// Start the server
const port = 5000;
app.listen(port, () => {
	console.log(`Server is running on port ${port}`);
});

app.get("/", (req, res) => {
	res.send("Server is running");
});
