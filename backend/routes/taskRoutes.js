import express from 'express';
import { protect } from '../middleware/auth.js';
import {
  getTasks,
  getTaskById,
  createTask,
  updateTask,
  deleteTask,
  summarizeTask,
} from '../controllers/taskController.js';

const router = express.Router();

router.route('/')
  .get(protect, getTasks)
  .post(protect, createTask);

router.route('/:id')
  .get(protect, getTaskById)
  .put(protect, updateTask)
  .delete(protect, deleteTask);

router.post('/:id/summarize', protect, summarizeTask);

export default router;
