const express = require("express");
const cors = require("cors");
const pool = require("../database/index");
const { fetchDataAndSave } = require("../services/dataMigrationService");
const searchRoutes = require('../routes/searchRoutes');

const app = express();
const port = 3001;

app.use(express.json());
app.use(cors());
app.use(express.json());

pool
	.getConnection()
	.then(async (connection) => {
		console.log("Connected to MySQL database!");
		// await fetchDataAndSave();
		connection.release();
	})
	.catch((error) => {
		console.error("Error connecting to MySQL:", error);
	});

app.use("/api", searchRoutes);

app.listen(port, () => {
	console.log(`Server running on port ${port}`);
});
