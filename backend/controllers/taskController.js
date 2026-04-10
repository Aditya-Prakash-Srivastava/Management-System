import prisma from '../db/prisma.js';
import { GoogleGenerativeAI } from '@google/generative-ai';

// Initialize Gemini API inside the function when needed.

// Helper function to log activity
const logActivity = async (taskId, action, userId, io) => {
  const activity = await prisma.activityLog.create({
    data: { taskId, action, userId },
    include: { user: { select: { name: true, email: true } } },
  });
  
  if (io) {
    io.emit('taskActivity', activity);
  }
};

export const getTasks = async (req, res) => {
  try {
    const { status, priority, page = 1, limit = 10, sortBy = 'createdAt', order = 'desc' } = req.query;

    const query = {};
    if (status) query.status = status;
    if (priority) query.priority = priority;

    const skip = (Number(page) - 1) * Number(limit);

    const tasks = await prisma.task.findMany({
      where: query,
      take: Number(limit),
      skip,
      orderBy: { [sortBy]: order },
      include: {
        author: { select: { id: true, name: true, email: true } },
        assignedTo: { select: { id: true, name: true, email: true } },
      },
    });

    const total = await prisma.task.count({ where: query });

    res.json({
      tasks,
      pagination: {
        total,
        page: Number(page),
        pages: Math.ceil(total / Number(limit)),
      },
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

export const getTaskById = async (req, res) => {
  try {
    const task = await prisma.task.findUnique({
      where: { id: req.params.id },
      include: {
        author: { select: { id: true, name: true, email: true } },
        assignedTo: { select: { id: true, name: true, email: true } },
        activities: {
          orderBy: { timestamp: 'desc' },
          include: { user: { select: { name: true } } },
        },
      },
    });

    if (task) {
      res.json(task);
    } else {
      res.status(404).json({ message: 'Task not found' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

export const createTask = async (req, res) => {
  try {
    const { title, description, status, priority, assignedToId } = req.body;

    const task = await prisma.task.create({
      data: {
        title,
        description,
        status,
        priority,
        authorId: req.user.id,
        assignedToId,
      },
    });

    await logActivity(task.id, 'Task Created', req.user.id, req.io);
    
    // Notify all clients about the new task
    if (req.io) {
       req.io.emit('taskCreated', task);
    }

    res.status(201).json(task);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

export const updateTask = async (req, res) => {
  try {
    const { title, description, status, priority, assignedToId } = req.body;
    
    const existingTask = await prisma.task.findUnique({ where: { id: req.params.id } });
    if (!existingTask) return res.status(404).json({ message: 'Task not found' });

    // Enforce RBAC: Only Admin or Author can update
    if (req.user.role !== 'ADMIN' && existingTask.authorId !== req.user.id && existingTask.assignedToId !== req.user.id) {
       return res.status(403).json({ message: 'Not authorized to update this task' });
    }

    const task = await prisma.task.update({
      where: { id: req.params.id },
      data: { title, description, status, priority, assignedToId },
    });

    // Determine what changed for activity log
    const changes = [];
    if (existingTask.status !== status && status) changes.push(`Status updated to ${status}`);
    if (existingTask.priority !== priority && priority) changes.push(`Priority updated to ${priority}`);
    if (existingTask.title !== title && title) changes.push('Title updated');
    
    const actionDesc = changes.length > 0 ? changes.join(', ') : 'Task Updated';

    await logActivity(task.id, actionDesc, req.user.id, req.io);
    
    // Notify clients about update
    if (req.io) {
       req.io.emit('taskUpdated', task);
    }

    res.json(task);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

export const deleteTask = async (req, res) => {
  try {
    const existingTask = await prisma.task.findUnique({ where: { id: req.params.id } });
    if (!existingTask) return res.status(404).json({ message: 'Task not found' });

    // Only Admin or Author can delete
    if (req.user.role !== 'ADMIN' && existingTask.authorId !== req.user.id) {
       return res.status(403).json({ message: 'Not authorized to delete this task' });
    }

    await prisma.task.delete({ where: { id: req.params.id } });

    if (req.io) {
        req.io.emit('taskDeleted', req.params.id);
    }

    res.json({ message: 'Task removed' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

export const summarizeTask = async (req, res) => {
  try {
    const { id } = req.params;
    const task = await prisma.task.findUnique({ where: { id } });

    if (!task) return res.status(404).json({ message: 'Task not found' });
    if (!task.description) return res.status(400).json({ message: 'Task has no description to summarize' });

    if (!process.env.GEMINI_API_KEY) {
       return res.status(500).json({ message: 'Gemini API key is not configured' });
    }

    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const prompt = `Please provide a concise and clear summary of the following task description:\n\n${task.description}`;
    
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const summary = response.text();

    await logActivity(task.id, 'Generated AI Summary', req.user.id, req.io);

    res.json({ summary });
  } catch (error) {
    res.status(500).json({ message: 'AI Generation failed', error: error.message });
  }
};
