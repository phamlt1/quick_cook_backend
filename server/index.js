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
    connection.release();
  })
  .catch((error) => {
    console.error("Error connecting to MySQL:", error);
  });

// Endpoint to handle the search functionality
app.post('/search', async (req, res) => {
  const { searchQuery, selectedFilter } = req.body;
  let query = '';
  let results = [];

  // Modify the SQL query based on the selected filter
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

// Function to generate a unique user ID
async function generateUniqueUserId() {
  const connection = await pool.getConnection();
  const [rows] = await connection.execute('SELECT MAX(user_id) AS max_user_id FROM user_new');
  connection.release();
  const maxUserId = rows[0].max_user_id || 0;
  return maxUserId + 1;
}

// Function to generate a unique group ID
async function generateUniqueGroupId() {
  const connection = await pool.getConnection();
  const [rows] = await connection.execute('SELECT MAX(group_id) AS max_group_id FROM `group`');
  connection.release();
  const maxGroupId = rows[0].max_group_id || 0;
  return maxGroupId + 1;
}

// Function to generate a unique manager ID
async function generateUniqueManagerId() {
  const connection = await pool.getConnection();
  const [rows] = await connection.execute('SELECT MAX(manager_id) AS max_manager_id FROM manager');
  connection.release();
  const maxManagerId = rows[0].max_manager_id || 0;
  return maxManagerId + 1;
}

// Endpoint to add a recipe to a group
app.post('/addRecipeToGroup', async (req, res) => {
  const { recipeId, groupId } = req.body;

  try {
    const connection = await pool.getConnection();
    const query = 'INSERT INTO group_recipe (recipe_id, group_id) VALUES (?, ?)';
    await connection.execute(query, [recipeId, groupId]);
    connection.release();

    res.status(201).json({ message: 'Recipe added to group successfully' });
  } catch (error) {
    console.error('Error adding recipe to group:', error);
    res.status(500).json({ error: 'Failed to add recipe to group' });
  }
});

// Endpoint to add a recipe to a user
app.post('/addRecipeToUser', async (req, res) => {
  const { recipeId, userId } = req.body;

  try {
    const connection = await pool.getConnection();
    const query = 'INSERT INTO user_recipe (recipe_id, user_id) VALUES (?, ?)';
    await connection.execute(query, [recipeId, userId]);
    connection.release();

    res.status(201).json({ message: 'Recipe added to user successfully' });
  } catch (error) {
    console.error('Error adding recipe to user:', error);
    res.status(500).json({ error: 'Failed to add recipe to user' });
  }
});

// Endpoint to fetch the list of groups
app.get('/groups', async (req, res) => {
  try {
    const connection = await pool.getConnection();
    const query = 'SELECT group_id, group_name FROM `group`';
    const [rows] = await connection.execute(query);
    connection.release();

    res.json({ groups: rows });
  } catch (error) {
    console.error('Error fetching groups:', error);
    res.status(500).json({ error: 'Failed to fetch groups' });
  }
});

// Endpoint to handle adding records
app.post('/add', async (req, res) => {
  const { selectedTable, formData } = req.body;
  let query = '';
  let values = [];

  // Modify the SQL query and values based on the selected table
  switch (selectedTable) {
    case 'Users':
      query = 'INSERT INTO user_new (user_id, user_name, user_pass) VALUES (?, ?, ?)';
      const userId = await generateUniqueUserId();
      values = [userId, formData.user_name, formData.user_pass];
      break;
    case 'Recipes':
      query = 'INSERT INTO recipe (recipe_name, instruction) VALUES (?, ?)';
      values = [formData.recipe_name, formData.instruction];
      break;
    case 'Groups':
      query = 'INSERT INTO `group` (group_id, group_name, group_pass) VALUES (?, ?, ?)';
      const groupId = await generateUniqueGroupId();
      values = [groupId, formData.group_name, formData.group_pass];
      break;
    case 'Managers':
      query = 'INSERT INTO manager (manager_id, manager_name, user_id) VALUES (?, ?, ?)';
      const managerId = await generateUniqueManagerId();
      const managerUserId = formData.user_id;
      values = [managerId, formData.manager_name, managerUserId];
      break;
    default:
      return res.status(400).json({ error: 'Invalid table name' });
  }

  try {
    const connection = await pool.getConnection();
    const [result] = await connection.execute(query, values);
    const insertedId = result.insertId;
    connection.release();

    res.status(201).json({ message: `${selectedTable.slice(0, -1)} added successfully`, id: insertedId });
  } catch (error) {
    console.error(`Error adding ${selectedTable.slice(0, -1)}:`, error);
    res.status(500).json({ error: `Failed to add ${selectedTable.slice(0, -1)}` });
  }
});

// Start the server
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});