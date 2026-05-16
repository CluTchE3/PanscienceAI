const Task = require('../models/Task');

const createTask = async (req, res) => {
  try {
    const { title, description, status, priority, dueDate } = req.body;
    
    // Process attachments
    const attachments = req.files ? req.files.map(file => ({
      filename: file.filename,
      path: file.path,
      mimetype: file.mimetype,
      size: file.size
    })) : [];

    if (attachments.length > 3) {
      return res.status(400).json({ message: 'Cannot upload more than 3 PDFs per task' });
    }

    const task = await Task.create({
      title,
      description,
      status,
      priority,
      dueDate,
      assignedUser: req.user.role === 'admin' && req.body.assignedUser ? req.body.assignedUser : req.user._id,
      attachments
    });

    // Emit event for real-time update
    const io = req.app.get('socketio');
    if (io) {
      io.emit('taskCreated', task);
    }

    res.status(201).json(task);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getTasks = async (req, res) => {
  try {
    const { status, priority, search, sortBy, order, page, limit, dueDate } = req.query;
    
    // Admin sees all, User sees only theirs
    const query = req.user.role === 'admin' ? {} : { assignedUser: req.user._id };

    if (status) query.status = status;
    if (priority) query.priority = priority;
    if (search) query.title = { $regex: search, $options: 'i' };

    if (dueDate) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      if (dueDate === 'today') {
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);
        query.dueDate = { $gte: today, $lt: tomorrow };
      } else if (dueDate === 'upcoming') {
        query.dueDate = { $gte: today };
      } else if (dueDate === 'overdue') {
        query.dueDate = { $lt: today };
      }
    }

    // Pagination
    const pageNum = parseInt(page, 10) || 1;
    const limitNum = parseInt(limit, 10) || 10;
    const skip = (pageNum - 1) * limitNum;

    // Sorting
    const sortField = sortBy || 'createdAt';
    const sortOrder = order === 'asc' ? 1 : -1;

    const tasks = await Task.find(query)
      .sort({ [sortField]: sortOrder })
      .skip(skip)
      .limit(limitNum)
      .populate('assignedUser', 'username');

    const total = await Task.countDocuments(query);

    res.json({
      tasks,
      page: pageNum,
      pages: Math.ceil(total / limitNum),
      total
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getTaskById = async (req, res) => {
  try {
    const task = await Task.findById(req.params.id).populate('assignedUser', 'username');
    
    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    // Check if user is admin or owns the task
    if (req.user.role !== 'admin' && task.assignedUser._id.toString() !== req.user._id.toString()) {
      return res.status(401).json({ message: 'Not authorized to view this task' });
    }

    res.json(task);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const updateTask = async (req, res) => {
  try {
    let task = await Task.findById(req.params.id);

    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    // Check authorization
    if (req.user.role !== 'admin' && task.assignedUser.toString() !== req.user._id.toString()) {
      return res.status(401).json({ message: 'Not authorized to update this task' });
    }

    // Process new attachments if any
    let newAttachments = req.files ? req.files.map(file => ({
      filename: file.filename,
      path: file.path,
      mimetype: file.mimetype,
      size: file.size
    })) : [];

    if (req.body.existingAttachments) {
      try {
        task.attachments = JSON.parse(req.body.existingAttachments);
      } catch (e) {
        console.error('Error parsing existingAttachments', e);
      }
    }

    const totalAttachments = task.attachments.length + newAttachments.length;
    if (totalAttachments > 3) {
      return res.status(400).json({ message: 'Cannot exceed 3 PDFs per task' });
    }

    task.title = req.body.title || task.title;
    task.description = req.body.description !== undefined ? req.body.description : task.description;
    task.status = req.body.status || task.status;
    task.priority = req.body.priority || task.priority;
    task.dueDate = req.body.dueDate || task.dueDate;
    if (req.user.role === 'admin' && req.body.assignedUser) {
      task.assignedUser = req.body.assignedUser;
    }
    if (newAttachments.length > 0) {
      task.attachments = [...task.attachments, ...newAttachments];
    }

    const updatedTask = await task.save();

    // Emit event for real-time update
    const io = req.app.get('socketio');
    if (io) {
      io.emit('taskUpdated', updatedTask);
    }

    res.json(updatedTask);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const deleteTask = async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);

    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    // Check authorization
    if (req.user.role !== 'admin' && task.assignedUser.toString() !== req.user._id.toString()) {
      return res.status(401).json({ message: 'Not authorized to delete this task' });
    }

    await task.deleteOne();

    // Emit event for real-time update
    const io = req.app.get('socketio');
    if (io) {
      io.emit('taskDeleted', req.params.id);
    }

    res.json({ message: 'Task removed' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  createTask,
  getTasks,
  getTaskById,
  updateTask,
  deleteTask
};
