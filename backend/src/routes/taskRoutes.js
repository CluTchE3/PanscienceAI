const express = require('express');
const router = express.Router();
const {
  createTask,
  getTasks,
  getTaskById,
  updateTask,
  deleteTask
} = require('../controllers/taskController');
const { protect } = require('../middleware/authMiddleware');
const upload = require('../middleware/uploadMiddleware');

router.route('/')
  .post(protect, upload.array('attachments', 3), createTask)
  .get(protect, getTasks);

router.route('/:id')
  .get(protect, getTaskById)
  .put(protect, upload.array('attachments', 3), updateTask)
  .delete(protect, deleteTask);

module.exports = router;
