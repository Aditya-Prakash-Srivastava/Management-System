import React from 'react';

const Sidebar = ({ filters, setFilters }) => {
  const handleStatusChange = (status) => {
    setFilters(prev => ({ ...prev, status: prev.status === status ? '' : status }));
  };

  const handlePriorityChange = (priority) => {
    setFilters(prev => ({ ...prev, priority: prev.priority === priority ? '' : priority }));
  };

  return (
    <aside className="w-64 bg-white border-r border-gray-200 h-[calc(100vh-4rem)] p-5 sticky top-16 hidden md:block">
      <h2 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4">Filters</h2>
      
      <div className="mb-6">
        <h3 className="text-sm font-semibold text-gray-700 mb-3">Status</h3>
        <div className="space-y-2">
          {['TODO', 'IN_PROGRESS', 'DONE'].map(status => (
            <label key={status} className="flex items-center gap-2 cursor-pointer group">
              <input 
                type="checkbox" 
                checked={filters.status === status}
                onChange={() => handleStatusChange(status)}
                className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
              />
              <span className="text-sm text-gray-600 group-hover:text-gray-900 transition-colors capitalize">
                  {status.replace('_', ' ').toLowerCase()}
              </span>
            </label>
          ))}
        </div>
      </div>

      <div>
        <h3 className="text-sm font-semibold text-gray-700 mb-3">Priority</h3>
        <div className="space-y-2">
          {['LOW', 'MEDIUM', 'HIGH'].map(priority => (
            <label key={priority} className="flex items-center gap-2 cursor-pointer group">
              <input 
                type="checkbox" 
                checked={filters.priority === priority}
                onChange={() => handlePriorityChange(priority)}
                className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
              />
              <span className="text-sm text-gray-600 group-hover:text-gray-900 transition-colors capitalize">
                  {priority.toLowerCase()}
              </span>
            </label>
          ))}
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
