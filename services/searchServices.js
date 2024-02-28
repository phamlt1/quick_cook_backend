const pool = require("../database/index");

async function searchItems(req, res) {
    const { searchQuery, selectedFilter } = req.body;
    let query = '';
    
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
        connection.release();
        res.json({ success: true, results: rows });
    } catch (error) {
        console.error('Error during database query:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
}

module.exports = { searchItems };
