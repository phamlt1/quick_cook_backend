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

// Endpoint to handle the delete
app.post('/delete', async (req, res) => {
    const {selectedFilter, deleteItem} = req.body;
    let query = '';

    // Modify the query based on the selected filter
    switch (selectedFilter) {
        case 'Users':
            query = 'DELETE FROM `user_new` WHERE user_id = ?';
            break;
        case 'Recipes':
            query = 'DELETE FROM `recipe` WHERE recipe_id = ?';
            break;
		case 'Groups':
			query = 'DELETE FROM `group` WHERE group_id = ?';
			break;
		case 'Managers':
			query = 'DELETE FROM `manager` WHERE manager_id = ?';
			break;
    }

    // Perform the search using the query and searchQuery
    try {
        const connection = await pool.getConnection();
        const [results] = await connection.execute(query, [deleteItem]);
        
        connection.release();
        res.json({ success: true, message: "Item deleted", deletedItem:deleteItem });
    } catch (error) {
        console.error('Error during database query:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
});

// Endpoint to handle the update of user table
app.put('/update/Users', async (req, res) => {
    const {updateItem} = req.body;
    const {user_id,user_name, user_pass} = updateItem;
    let query = 'UPDATE `user_new` SET user_name = ?, user_pass = ? WHERE user_id = ?';    
    // Perform the search using the query and searchQuery
    try {
        const connection = await pool.getConnection();
        const [results] = await connection.execute(query, [user_name, user_pass, user_id]);
        
        connection.release();
        res.json({ success: true, message: "Item updated", updatedItem:user_id });
    } catch (error) {
        console.error('Error during database query:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
});

// Endpoint to handle the update of manager table
app.put('/update/Managers', async (req, res) => {
    const {updateItem} = req.body;
    const {manager_id, manager_name} = updateItem;
    let query = '';
    query = 'UPDATE `manager` SET manager_name = ? WHERE manager_id = ?';
            
    // Perform the search using the query and searchQuery
    try {
        const connection = await pool.getConnection();
        const [results] = await connection.execute(query, [manager_name, manager_id]);
        
        connection.release();
        res.json({ success: true, message: "Item updated", updatedItem:updateItem });
    } catch (error) {
        console.error('Error during database query:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
});

// Endpoint to handle the update of group table
app.put('/update/Groups', async (req, res) => {
    const {updateItem} = req.body;
    const {group_id, group_name, group_pass} = updateItem;
    let query = '';
    query = 'UPDATE `group` SET group_name = ?, group_pass = ? WHERE group_id = ?';
            
    // Perform the search using the query and searchQuery
    try {
        const connection = await pool.getConnection();
        const [results] = await connection.execute(query, [group_name, group_pass, group_id]);
        
        connection.release();
        res.json({ success: true, message: "Item updated", updatedItem:updateItem });
    } catch (error) {
        console.error('Error during database query:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
});

// Endpoint to handle the update of recipe table
app.put('/update/Recipes', async (req, res) => {
    const {updateItem} = req.body;
    const {recipe_id, recipe_name, instruction} = updateItem;
    let query = '';
    query = 'UPDATE `recipe` SET recipe_name = ?, instruction = ? WHERE recipe_id = ?';
    // Perform the search using the query and searchQuery
    try {
        const connection = await pool.getConnection();
        const [results] = await connection.execute(query, [recipe_name, instruction, recipe_id]);
        
        connection.release();
        res.json({ success: true, message: "Item updated", updatedItem:updateItem });
    } catch (error) {
        console.error('Error during database query:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
});
app.listen(port, () => {
	console.log(`Server running on port ${port}`);
});