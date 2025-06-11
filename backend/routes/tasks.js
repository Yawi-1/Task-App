const express = require('express');
const router = express.Router();
const auth = require('../middleware/authMiddleware');
const { getTasks, addTask, deleteTask } = require('../controllers/taskController');

router.get('/', auth, getTasks);
router.post('/', auth, addTask);
router.delete('/:id', auth, deleteTask);

module.exports = router;
