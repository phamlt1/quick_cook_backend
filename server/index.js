const axios = require("axios");
const mysql = require("mysql2/promise");
require('dotenv').config();

// Create a MySQL connection pool
const pool = mysql.createPool({
	host: "localhost",
	user: "root",
	password: process.env.DB_PASSWORD,
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
			// fetchDataAndSave();
			connection.release();
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

async function fetchDataAndSave() {
	try {
		// Fetch data from the API
		const response = await axios.get(
			"https://www.themealdb.com/api/json/v1/1/search.php?s="
		);
		const data = response.data.meals; // Assuming the API returns an array of meals
		const today = new Date().toISOString().slice(0, 10);

		let ingredients = []; // Array to hold ingredient objects
		let ingredientNames = new Set(); // Helper set to track unique ingredient names

		for (let index in data) {
			for (let i = 1; i <= 20; i++) {
				let ingredientName = data[index][`strIngredient${i}`];
				if (
					ingredientName !== "" &&
					ingredientName !== null &&
					!ingredientNames.has(ingredientName)
				) {
					// Add ingredient name to the set to keep track of unique names
					ingredientNames.add(ingredientName);

					// Create an object for the ingredient with id and name, then add it to the array
					ingredients.push({
						id: generateUniqueIntId(),
						name: ingredientName,
					});
				}
			}
		}

		function countIngredient(recipe) {
			let ingredientCount = 0;
			for (let i = 1; i <= 20; i++) {
				const ingredient = recipe[`strIngredient${i}`];
				if (ingredient) {
					ingredientCount++;
				}
			}
			return ingredientCount;
		}

		const recipe = data.map((item) => [
			item.idMeal,
			item.strMeal,
			today,
			countIngredient(item),
			item.strInstructions,
			item.strMealThumb,
		]);

		let ingredientsTuple = [];
		for (let index in data) {
			for (let i = 1; i <= 20; i++) {
				if (data[index][`strIngredient${i}`] !== "") {
					for (let j = 0; j < ingredients.length; j++) {
						if (ingredients[j].name === data[index][`strIngredient${i}`]) {
							ingredientsTuple.push({
								recipe_id: data[index].idMeal,
								ingredient_id: ingredients[j].id,
								quantity: data[index][`strMeasure${i}`],
							});
						}
					}
				}
			}
		}

		// Save data to the database
		const connection = await pool.getConnection();
		try {
			await connection.query(
				"INSERT IGNORE INTO `recipe` (recipe_id, recipe_name, date, ingredient_num, instruction, image) VALUES ?",
				[recipe]
			);
			console.log(ingredientsTuple);
			let ingredientsData = ingredients.map((ingredient) => [
				ingredient.id,
				ingredient.name,
			]);
			await connection.query(
				"INSERT INTO `ingredient` (ingredient_id, food_name) VALUES ?",
				[ingredientsData]
			);
			let recipeInData = ingredientsTuple.map((recipeIn) => [
				recipeIn.recipe_id,
				recipeIn.ingredient_id,
				recipeIn.quantity
			]);
			await connection.query(
				"INSERT IGNORE INTO `recipe_ingredient` (recipe_id, ingredient_id, quantity) VALUES ?",
				[recipeInData]
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

////////////////////////////////////////////////////
const express = require('express');
const cors = require('cors');
const app = express();
const port = 3001;

app.use(express.json());
app.use(cors());

app.use(express.json());

// Endpoint to handle the search
app.post('/search', async (req, res) => {
    const { searchQuery, selectedFilter } = req.body;
    let query = '';
    let results = [];

    // Modify the query based on the selected filter
    switch (selectedFilter) {
        case 'Users':
            query = 'SELECT * FROM user_new WHERE user_name LIKE ? OR user_pass LIKE ?';
            break;
        case 'Recipes':
            query = 'SELECT * FROM recipe WHERE recipe_name LIKE ? OR instruction LIKE ?';
            break;
		case 'Groups':
			query = 'SELECT * FROM `group` WHERE group_name LIKE ? OR group_pass LIKE ?';
			break;
		case 'Managers':
			query = 'SELECT * FROM manager WHERE manager_name LIKE ? OR user_id LIKE ?'; // Adjust the table name and columns if needed
			break;
    }

    // Perform the search using the query and searchQuery
    try {
        const connection = await pool.getConnection();
        const [rows] = await connection.execute(query, [`%${searchQuery}%`, `%${searchQuery}%`]);
        results = rows;
        connection.release();

        res.json({ success: true, results });
    } catch (error) {
        console.error('Error during database query:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
});

app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});
