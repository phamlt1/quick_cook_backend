const axios = require("axios");
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

// Check connection to MySQL
pool
	.getConnection()
	.then(async (connection) => {
		try {
			console.log("Connected to MySQL database!");

			// // Execute SHOW TABLES query
			// const [rows, fields] = await connection.query("SHOW TABLES");
			// console.log("Tables:", rows);
			fetchDataAndSave();
			connection.release();

			// Now you can call your function to fetch data and save to the database
		} catch (error) {
			console.error("Error executing query:", error);
			connection.release();
		}
	})
	.catch((error) => {
		console.error("Error connecting to MySQL:", error);
	});

function generateUniqueIntId() {
	const random = Math.floor(Math.random() * 1000000);
	const uniqueId = parseInt(random.toString());
	return uniqueId;
}

// Function to fetch data from the API, manipulate it, and save it to the database
async function fetchDataAndSave() {
	try {
		// Fetch data from the API
		const response = await axios.get(
			"https://www.themealdb.com/api/json/v1/1/search.php?s="
		);
		const data = response.data.meals; // Assuming the API returns an array of meals
		const today = new Date().toISOString().slice(0, 10);

		let ingredientCount = 0;

		for (let key in data) {
			if (key.startsWith("strIngredient") && data[key] !== "") {
				ingredientCount++;
			}
		}

		const uniqueIntId = generateUniqueIntId();

		// Manipulate data if necessary
		const processedData = data.map((item) => [
			// item.strMeal,
			// item.idMeal,
			// today,
			// ingredientCount,
			// uniqueIntId,

			item.strInstructions,
            generateUniqueIntId(),


		]);

		// Save data to the database
		const connection = await pool.getConnection();
		try {
			// await connection.query(
			// 	"INSERT INTO `recipe` (recipe_name, recipe_id, date, ingredient_num, instruction_id) VALUES ?",
			// 	[processedData]
			// );

			// await connection.query(
			// 	"INSERT INTO `instruction` (description, instruction_id) VALUES ?",
			// 	[processedData]
			// );

            await connection.query(
				"INSERT INTO `ingredient` (description, ingredient_id) VALUES ?",
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



async function fetchDataAndSave() {
    try {
        // Fetch data from the API
        const response = await axios.get("https://www.themealdb.com/api/json/v1/1/search.php?s=");
        const meals = response.data.meals; // Assuming the API returns an array of meals

        // Loop through each meal to process its data
        for (const meal of meals) {
            // Loop through each property in the meal
            for (const key in meal) {
                // Check if the key indicates an ingredient and the value is not empty
                if (key.startsWith("strIngredient") && meal[key].trim()) {
                    const ingredient = meal[key].trim();
                    const connection = await pool.getConnection();
                    try {
                        // Check if the ingredient already exists
                        const [rows] = await connection.query(
                            "SELECT COUNT(*) AS count FROM `ingredient` WHERE food_name = ?",
                            [ingredient]
                        );

                        if (rows[0].count === 0) {
                            // The ingredient does not exist, insert it
                            const uniqueIntId = generateUniqueIntId();
                            await connection.query(
                                "INSERT INTO `ingredient` (food_name, ingredient_id) VALUES (?, ?)",
                                [ingredient, uniqueIntId]
                            );
                            console.log("Ingredient inserted successfully:", ingredient);
                        } else {
                            console.log("Ingredient already exists, skipped:", ingredient);
                        }
                    } catch (insertError) {
                        console.error("Error inserting/checking ingredient:", insertError);
                    } finally {
                        connection.release();
                    }
                }
            }
        }
    } catch (error) {
        console.error("Error fetching or saving data:", error);
    }
}