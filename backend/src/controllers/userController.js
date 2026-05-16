const User = require('../models/User');
const Task = require('../models/Task');
const bcrypt = require('bcryptjs');

const getUsers = async (req, res) => {
  try {
    const { search, role, sortBy, order, page, limit } = req.query;
    
    const query = {};
    if (search) query.username = { $regex: search, $options: 'i' };
    if (role) query.role = role;

    const sortField = sortBy || 'username';
    const sortOrder = order === 'desc' ? -1 : 1;

    // If no pagination params are provided, return the raw array to not break the frontend dropdown
    if (!page && !limit) {
      const users = await User.find(query).sort({ [sortField]: sortOrder }).select('-password');
      return res.json(users);
    }

    const pageNum = parseInt(page, 10) || 1;
    const limitNum = parseInt(limit, 10) || 10;
    const skip = (pageNum - 1) * limitNum;

    const users = await User.find(query)
      .sort({ [sortField]: sortOrder })
      .skip(skip)
      .limit(limitNum)
      .select('-password');

    const total = await User.countDocuments(query);

    res.json({
      users,
      page: pageNum,
      pages: Math.ceil(total / limitNum),
      total
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const createUser = async (req, res) => {
  try {
    const { username, password, role } = req.body;

    const userExists = await User.findOne({ username });
    if (userExists) {
      return res.status(400).json({ message: 'User already exists' });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const user = await User.create({
      username,
      password: hashedPassword,
      role: role || 'user'
    });

    res.status(201).json({
      _id: user._id,
      username: user.username,
      role: user.role
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password');
    if (user) {
      res.json(user);
    } else {
      res.status(404).json({ message: 'User not found' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const updateUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);

    if (user) {
      user.username = req.body.username || user.username;
      user.role = req.body.role || user.role;

      if (req.body.password) {
        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(req.body.password, salt);
      }

      const updatedUser = await user.save();
      
      res.json({
        _id: updatedUser._id,
        username: updatedUser.username,
        role: updatedUser.role
      });
    } else {
      res.status(404).json({ message: 'User not found' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const deleteUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);

    if (user) {
      // Cascade delete tasks
      await Task.deleteMany({ assignedUser: user._id });
      
      await user.deleteOne();
      res.json({ message: 'User and their tasks removed' });
    } else {
      res.status(404).json({ message: 'User not found' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { getUsers, createUser, getUserById, updateUser, deleteUser };
