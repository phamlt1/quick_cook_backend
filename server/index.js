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
