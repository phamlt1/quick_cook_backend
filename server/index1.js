const express = require("express");
const bodyParser = require("body-parser");
const app = express();
const cors = require("cors");
app.use(cors());
app.use(express.json());

const mysql = require("mysql2/promise");

// Create a MySQL connection pool
const pool = mysql.createPool({
	host: "localhost",
	user: "root",
	password: "Kingsley1801!",
	database: "quick_cook",
	waitForConnections: true,
	connectionLimit: 10,
	queueLimit: 0,
});

pool
	.getConnection()
	.then((connection) => {
		console.log("Connected to MySQL database!");
		connection.release();

		fetchDataAndSave();
	})
	.catch((error) => {
		console.error("Error connecting to MySQL:", error);
	});

async function fetchDataAndSave() {
	try {
		// Fetch data from the API
		const response = await axios.get(
			"https://www.themealdb.com/api/json/v1/1/search.php?s=Arrabiata"
		);
		const data = response.data.meals; // Assuming the API returns an array of meals

		// Manipulate data if necessary
		const processedData = data.map((item) => [
			item.strMeal,
			item.strMealThumb,
			item.strInstructions,
		]);

		// Save data to the database
		const connection = await pool.getConnection();
		try {
			await connection.query(
				"INSERT INTO recipes (name, imageUrl, instructions) VALUES ?",
				[processedData]
			);
			console.log("Data saved successfully!");
		} catch (error) {
			console.error("Error saving data:", error);
		} finally {
			connection.release();
		}
	} catch (error) {
		console.error("Error fetching or saving data:", error);
	}
}

// // Endpoint to receive data from frontend
// app.post("/api/data", (req, res) => {
// 	const formData = req.body;
// 	// Process the received data (e.g., save to database)
// 	// console.log(req);
// 	console.log("Received data:", formData);
// 	res.json("Data received successfully!");
// });

// Start the server
const port = 5000;
app.listen(port, () => {
	console.log(`Server is running on port ${port}`);
});

app.get("/", (req, res) => {
	res.send("Server is running");
});
