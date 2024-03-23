require('dotenv').config();

const express = require("express");
const cors = require("cors");
const app = express();
const port = process.env.PORT;

app.use(express.json());
app.use(cors());

const adminRouter = require("../router/adminRouter");

app.use("/api/admin", adminRouter);

const pool = require("../database/index");
const { fetchDataAndSave } = require("../services/dataMigrationService");

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

app.listen(port, () => {
	console.log(`Server running on port ${port}`);
});