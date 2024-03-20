const express = require("express");
const router = express.Router();
const pool = require("../database/index");

router.post("/login", async (req, res) => {
	try {
		const [users] = await pool.execute(
			"SELECT * FROM user_new WHERE user_pass = ?",
			[req.body.password]
		);
		const user = users[0];

		if (!user) {
			return res.json({ message: "Authentication failed! User not found." });
		}

		if (req.body.password === user.user_pass) {
			const [admins] = await pool.execute(
				"SELECT * FROM administration WHERE user_id = ?",
				[user.user_id]
			);

			const isAdmin = admins.length > 0;

			res.json({
				success: true,
				isAdmin: isAdmin,
				message: isAdmin
					? "Admin login successful"
					: "User login successful, but not an admin.",
			});
		} else {
			res.status(401).json({
				success: false,
				message: "Authentication failed. Wrong password.",
			});
		}
	} catch (error) {
		console.error(error);
		res.status(500).json({ message: "Internal server error" });
	}
});

router.post("/search", async (req, res) => {
	const { searchQuery, selectedFilter } = req.body;
	let query = "";
	let results = [];

	// Modify the query based on the selected filter
	switch (selectedFilter) {
		case "Users":
			query =
				"SELECT * FROM user_new WHERE user_name LIKE ? OR user_pass LIKE ?";
			break;
		case "Recipes":
			query =
				"SELECT * FROM recipe WHERE recipe_name LIKE ? OR instruction LIKE ?";
			break;
		case "Groups":
			query =
				"SELECT * FROM `group` WHERE group_name LIKE ? OR group_pass LIKE ?";
			break;
		case "Managers":
			query =
				"SELECT * FROM manager WHERE manager_name LIKE ? OR user_id LIKE ?";
			break;
	}

	try {
		const connection = await pool.getConnection();
		const [rows] = await connection.execute(query, [
			`%${searchQuery}%`,
			`%${searchQuery}%`,
		]);
		results = rows;
		connection.release();

		res.json({ success: true, results });
	} catch (error) {
		console.error("Error during database query:", error);
		res.status(500).json({ success: false, message: "Internal server error" });
	}
});

module.exports = router;
