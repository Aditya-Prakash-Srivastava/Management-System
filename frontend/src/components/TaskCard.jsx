import React, { useState, useContext } from 'react';
import api from '../utils/api';
import { AuthContext } from '../context/AuthContext';

const TaskCard = ({ task, onTaskUpdate }) => {
  const { user } = useContext(AuthContext);
  const [loadingObj, setLoadingObj] = useState({ summarize: false, update: false, delete: false });
  const [summary, setSummary] = useState('');

  const handleStatusChange = async (newStatus) => {
    setLoadingObj(prev => ({ ...prev, update: true }));
    try {
      const res = await api.put(`/tasks/${task.id}`, { status: newStatus });
      onTaskUpdate(res.data);
    } catch (err) {
      console.error('Failed to update status', err);
    } finally {
      setLoadingObj(prev => ({ ...prev, update: false }));
    }
  };

  const handleSummarize = async () => {
    setLoadingObj(prev => ({ ...prev, summarize: true }));
    try {
      const res = await api.post(`/tasks/${task.id}/summarize`);
      setSummary(res.data.summary);
    } catch (err) {
      console.error('Summarize error', err);
      const errorMessage = err.response?.data?.error || err.message || 'Failed to generate summary.';
      setSummary(`Error: ${errorMessage}`);
    } finally {
      setLoadingObj(prev => ({ ...prev, summarize: false }));
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Delete this task?')) return;
    setLoadingObj(prev => ({ ...prev, delete: true }));
    try {
      await api.delete(`/tasks/${task.id}`);
      // Usually socket will handle removal from list, or we trigger callback
    } catch (err) {
      console.error('Delete error', err);
      setLoadingObj(prev => ({ ...prev, delete: false }));
    }
  };

  const statusColors = {
    TODO: 'bg-gray-100 text-gray-700',
    IN_PROGRESS: 'bg-blue-100 text-blue-700',
    DONE: 'bg-green-100 text-green-700'
  };

  const priorityColors = {
    LOW: 'text-gray-500 bg-gray-50 border-gray-200',
    MEDIUM: 'text-orange-500 bg-orange-50 border-orange-200',
    HIGH: 'text-red-500 bg-red-50 border-red-200'
  };

  const canEdit = user?.role === 'ADMIN' || user?.id === task.authorId;

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm hover:shadow-md transition-shadow group">
      <div className="flex justify-between items-start mb-3">
        <h3 className="font-bold text-gray-800 text-lg line-clamp-1">{task.title}</h3>
        <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${statusColors[task.status]}`}>
          {task.status.replace('_', ' ')}
        </span>
      </div>
      
      <p className="text-gray-600 text-sm mb-4 line-clamp-2 min-h-[40px]">{task.description}</p>
      
      <div className="flex items-center justify-between mb-4">
        <span className={`text-xs border px-2 py-0.5 rounded font-semibold ${priorityColors[task.priority]}`}>
          {task.priority} Priority
        </span>
        <div className="text-xs text-gray-500">
          By <span className="font-medium text-gray-700">{task.author?.name || 'Unknown'}</span>
        </div>
      </div>

      {summary && (
        <div className="mb-4 bg-purple-50 border border-purple-100 p-3 rounded-lg">
          <h4 className="text-xs font-bold text-purple-700 mb-1 flex items-center gap-1">
            ✨ AI Summary
          </h4>
          <p className="text-xs text-purple-900 leading-relaxed">{summary}</p>
        </div>
      )}

      <div className="border-t border-gray-100 pt-4 flex items-center justify-between mt-auto">
        <div className="flex gap-2">
          {canEdit && task.status !== 'DONE' && (
            <button 
              onClick={() => handleStatusChange('DONE')}
              disabled={loadingObj.update}
              className="text-xs text-green-600 hover:text-green-700 hover:bg-green-50 px-2 py-1 rounded transition-colors font-medium"
            >
              Mark Done
            </button>
          )}
          {canEdit && task.status === 'TODO' && (
             <button 
              onClick={() => handleStatusChange('IN_PROGRESS')}
              disabled={loadingObj.update}
              className="text-xs text-blue-600 hover:text-blue-700 hover:bg-blue-50 px-2 py-1 rounded transition-colors font-medium"
            >
              Start
            </button>
          )}
        </div>

        <div className="flex items-center gap-2">
           <button 
             onClick={handleSummarize}
             disabled={loadingObj.summarize || !task.description}
             className="text-xs bg-purple-100 text-purple-700 hover:bg-purple-200 px-3 py-1.5 rounded-lg transition-colors font-medium flex items-center gap-1 disabled:opacity-50"
             title="Summarize with AI"
           >
             {loadingObj.summarize ? '...' : '✨ AI'}
           </button>
           {canEdit && (
             <button 
               onClick={handleDelete}
               disabled={loadingObj.delete}
               className="text-xs text-gray-400 hover:text-red-500 hover:bg-red-50 p-1.5 rounded-lg transition-colors"
             >
               Delete
             </button>
           )}
        </div>
      </div>
    </div>
  );
};

export default TaskCard;
