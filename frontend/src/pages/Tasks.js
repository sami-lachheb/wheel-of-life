import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUser } from '../contexts/UserContext.js';
import { createTask } from '../utils/api.js';
import { ArrowLeft } from 'lucide-react';

const ASPECTS = ['Health & Fitness', 'Finance & Wealth', 'Relationships & Family', 'Career & Work', 'Personal Growth', 'Fun & Recreation', 'Environment', 'Community', 'Spirituality', 'Partner & Love'];

export default function Tasks() {
  const navigate = useNavigate();
  const { state } = useUser();
  const [tasks, setTasks] = useState([]);
  const [newTask, setNewTask] = useState({
    name: '',
    description: '',
    priority: 'medium',
    deadline: '',
    aspect: ASPECTS[0],
  });

  const handleAddTask = async (e) => {
    e.preventDefault();
    
    const task = {
      name: newTask.name,
      description: newTask.description,
      priority: newTask.priority,
      deadline: newTask.deadline,
      aspect: newTask.aspect,
    };

    try {
      const created = await createTask(task);
      setTasks((prev) => [...prev, created]);
      setNewTask({
        name: '',
        description: '',
        priority: 'medium',
        deadline: '',
        aspect: ASPECTS[0],
      });
    } catch (error) {
      console.error('Failed to create task:', error);
    }
  };

  return (
    <div className="min-h-screen bg-light-gray py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center gap-2 mb-6">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-1.5 text-gray-500 hover:text-primary transition-colors text-xs font-bold uppercase tracking-wider bg-white/60 px-3 py-1.5 rounded-xl border border-gray-100/50 shadow-sm"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Previous
          </button>
        </div>

        <h1 className="text-3xl font-bold text-primary mb-8">Tasks</h1>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h2 className="text-xl font-bold text-primary mb-4">Add New Task</h2>
            
            <form onSubmit={handleAddTask} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Task Name
                </label>
                <input
                  type="text"
                  value={newTask.name}
                  onChange={(e) => setNewTask({ ...newTask, name: e.target.value })}
                  placeholder="What needs to be done?"
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gold focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description
                </label>
                <textarea
                  value={newTask.description}
                  onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
                  placeholder="Details about the task..."
                  className="w-full h-24 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gold focus:border-transparent"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Priority
                  </label>
                  <select
                    value={newTask.priority}
                    onChange={(e) => setNewTask({ ...newTask, priority: e.target.value })}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gold focus:border-transparent"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Deadline
                  </label>
                  <input
                    type="date"
                    value={newTask.deadline}
                    onChange={(e) => setNewTask({ ...newTask, deadline: e.target.value })}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gold focus:border-transparent"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Wheel Aspect
                </label>
                <select
                  value={newTask.aspect}
                  onChange={(e) => setNewTask({ ...newTask, aspect: e.target.value })}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gold focus:border-transparent"
                >
                  {ASPECTS.map((aspect) => (
                    <option key={aspect} value={aspect}>{aspect}</option>
                  ))}
                </select>
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-gold text-primary font-bold rounded-lg hover:bg-gold-dark"
              >
                Add Task
              </button>
            </form>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6">
            <h2 className="text-xl font-bold text-primary mb-4">Your Tasks</h2>
            
            {tasks.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <p>No tasks yet. Add your first task above!</p>
              </div>
            ) : (
              <div className="space-y-3">
                {tasks.map((task) => (
                  <div key={task.id} className="flex items-start gap-3 p-4 border rounded-lg">
                    <input
                      type="checkbox"
                      className="w-5 h-5 text-gold rounded focus:ring-gold"
                    />
                    <div className="flex-1">
                      <h3 className={`font-semibold ${task.completed ? 'line-through text-gray-500' : 'text-primary'}`}>
                        {task.name}
                      </h3>
                      <p className="text-sm text-gray-600">{task.description}</p>
                      <div className="flex gap-2 mt-2 text-xs">
                        <span className={`px-2 py-1 rounded ${
                          task.priority === 'high' ? 'bg-red-100 text-red-800' :
                          task.priority === 'medium' ? 'bg-gold text-primary' :
                          'bg-green-100 text-green-800'
                        }`}>
                          {task.priority}
                        </span>
                        <span className="text-gray-500">{task.aspect}</span>
                        <span className="text-gray-500">Due: {task.deadline}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
