const express = require('express');
const cors = require('cors');
const app = express();
const port = 3001;

app.use(express.json());
app.use(cors());
app.use(express.json());

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
			query = 'SELECT * FROM manager WHERE manager_name LIKE ? OR user_id LIKE ?'; 
			break;
    }

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

//this is for adding new group

app.post('/add-group', async (req, res) => {
    const { group_id, group_name, group_pass } = req.body;
    try {
        const connection = await pool.getConnection();
        const [result] = await connection.execute(
            'INSERT INTO `group` (group_id, group_name, group_pass) VALUES (?, ?, ?)',
            [group_id, group_name, group_pass]
        );
        connection.release();
        res.json({ success: true, groupId: group_id }); // Return the group_id that was passed in
    } catch (error) {
        console.error('Error adding new group:', error);
        res.status(500).json({ success: false, message: 'Failed to add new group' });
    }
});

// Get all groups
app.get('/group', async (req, res) => {
    try {
        const connection = await pool.getConnection();
        const [rows] = await connection.query('SELECT * FROM `group`');
        connection.release();

        res.json({ success: true, group: rows });
    } catch (error) {
        console.error('Error fetching groups:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch groups' });
    }
});


app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});