import React, { useState, useEffect, useRef, useCallback } from 'react';
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';
import TaskCard from '../components/TaskCard';
import CreateTaskModal from '../components/CreateTaskModal';
import api from '../utils/api';
import { io } from 'socket.io-client';

const Dashboard = () => {
  const [tasks, setTasks] = useState([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState({ status: '', priority: '' });
  const [isModalOpen, setIsModalOpen] = useState(false);

  const observer = useRef();
  
  const lastTaskElementRef = useCallback(node => {
    if (loading) return;
    if (observer.current) observer.current.disconnect();
    
    observer.current = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && hasMore) {
        setPage(prevPage => prevPage + 1);
      }
    });
    
    if (node) observer.current.observe(node);
  }, [loading, hasMore]);

  const fetchTasks = async (pageNum = 1, reset = false) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: pageNum,
        limit: 10,
        ...filters
      });
      
      const res = await api.get(`/tasks?${params}`);
      
      setTasks(prev => {
        if (reset) return res.data.tasks;
        // Prevent duplicates in case of hot-reload or fast scroll
        const newTasks = res.data.tasks.filter(t => !prev.some(p => p.id === t.id));
        return [...prev, ...newTasks];
      });
      
      setHasMore(pageNum < res.data.pagination.pages);
    } catch (error) {
      console.error("Error fetching tasks", error);
    } finally {
      setLoading(false);
    }
  };

  // Reset pagination when filters change
  useEffect(() => {
    setPage(1);
    fetchTasks(1, true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters]);

  // Load more tasks on page change
  useEffect(() => {
    if (page > 1) fetchTasks(page, false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page]);

  // Socket.io for Real-time Update
  useEffect(() => {
    const socket = io('http://localhost:5000');

    socket.on('taskCreated', (task) => {
      // Check if it matches current filters before prepending
      if (
         (!filters.status || task.status === filters.status) &&
         (!filters.priority || task.priority === filters.priority)
      ) {
         setTasks(prev => [task, ...prev]);
      }
    });

    socket.on('taskUpdated', (updatedTask) => {
      setTasks(prev => prev.map(t => t.id === updatedTask.id ? { ...t, ...updatedTask } : t));
    });

    socket.on('taskDeleted', (taskId) => {
      setTasks(prev => prev.filter(t => t.id !== taskId));
    });

    return () => socket.disconnect();
  }, [filters]);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Navbar />
      
      <div className="flex flex-1 overflow-hidden">
        <Sidebar filters={filters} setFilters={setFilters} />
        
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          <div className="max-w-6xl mx-auto">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-8 gap-4">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Task Overview</h1>
                <p className="text-sm text-gray-500 mt-1">Manage and track your latest activities</p>
              </div>
              
              <button 
                onClick={() => setIsModalOpen(true)}
                className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg shadow-sm transition-colors text-sm flex items-center justify-center gap-2"
              >
                <span>+</span> New Task
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {tasks.map((task, index) => {
                if (tasks.length === index + 1) {
                  return <div ref={lastTaskElementRef} key={task.id}><TaskCard task={task} onTaskUpdate={(updated) => setTasks(prev => prev.map(t => t.id === updated.id ? updated : t))} /></div>
                } else {
                  return <TaskCard key={task.id} task={task} onTaskUpdate={(updated) => setTasks(prev => prev.map(t => t.id === updated.id ? updated : t))} />
                }
              })}
            </div>

            {loading && (
              <div className="flex justify-center my-8">
                <div className="w-8 h-8 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
              </div>
            )}
            
            {!loading && tasks.length === 0 && (
              <div className="text-center py-20 bg-white rounded-xl border border-dashed border-gray-300">
                <div className="text-gray-400 mb-2">📋</div>
                <h3 className="text-gray-900 font-medium">No tasks found</h3>
                <p className="text-gray-500 text-sm mt-1">Adjust filters or create a new task to get started.</p>
              </div>
            )}
          </div>
        </main>
      </div>

      <CreateTaskModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </div>
  );
};

export default Dashboard;
