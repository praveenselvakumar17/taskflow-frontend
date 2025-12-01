import React, { useEffect, useState } from "react";
import {
  getPriorityBadgeColor,
  getPriorityColor,
  MENU_OPTIONS,
  TI_CLASSES,
} from "../assets/dummy";
import { CheckCircle2, MoreVertical, Calendar, Clock } from "lucide-react";
import axios from "axios";
import { isToday, format } from "date-fns";
import TaskModel from "./TaskModel";

const API_BASE = "http://localhost:4000/api/tasks";

const TaskItem = ({ task, onRefresh, onLogout, showCompleteCheckbox }) => {
  const [isCompleted, setIsCompleted] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [showEditModel, setShowEditModel] = useState(false);
  const [subtasks, setSubtasks] = useState(task.subtasks || []);

  useEffect(() => {
    // Normalize completed status - handle both boolean and string formats
    const completed = task.completed;
    const isTaskCompleted = 
      completed === true || 
      completed === 1 || 
      completed === 'Yes' ||
      (typeof completed === 'string' && completed.toLowerCase() === 'yes');
    
    setIsCompleted(isTaskCompleted);
  }, [task.completed]);

  const getAuthHeaders = () => {
    const token = localStorage.getItem("token");
    if (!token) throw new Error("No Auth token found");
    return { Authorization: `Bearer ${token}` };
  };

  const borderColor = isCompleted
    ? "border-green-500"
    : getPriorityColor(task.priority).split(" ")[0];

  const handleComplete = async () => {
    // ✅ FIX: Send boolean instead of "Yes"/"No" string
    const newStatus = !isCompleted; // true or false
    const taskId = task._id;

    try {
      await axios.put(
        `${API_BASE}/${taskId}/gp`,
        { completed: newStatus }, // ✅ Send boolean
        { headers: getAuthHeaders() }
      );
      
      // Update local state immediately for better UX
      setIsCompleted(newStatus);
      
      // Refresh tasks to sync with server
      if (onRefresh) {
        await onRefresh();
      }
    } catch (err) {
      console.error("Error updating task:", err);
      console.error("Error details:", err.response?.data);
      
      // Revert local state on error
      setIsCompleted(isCompleted);
      
      if (err.response?.status === 401 && onLogout) {
        onLogout();
      }
    }
  };

  const handleAction = (action) => {
    setShowMenu(false);
    if (action === "edit") setShowEditModel(true);
    if (action === "delete") handleDelete();
  };

  const handleDelete = async () => {
    const taskId = task._id;
    try {
      await axios.delete(`${API_BASE}/${taskId}/gp`, { headers: getAuthHeaders() });
      if (onRefresh) {
        await onRefresh();
      }
    } catch (err) {
      console.error("Error deleting task:", err);
      if (err.response?.status === 401 && onLogout) {
        onLogout();
      }
    }
  };

  const handleSave = async (updatedTask) => {
    try {
      // ✅ FIX: Convert completed to boolean if it's a string
      let completedValue = updatedTask.completed;
      if (typeof completedValue === 'string') {
        completedValue = completedValue === 'Yes' || completedValue.toLowerCase() === 'yes';
      }

      const payload = {
        title: updatedTask.title,
        description: updatedTask.description,
        priority: updatedTask.priority,
        dueDate: updatedTask.dueDate,
        completed: completedValue // ✅ Send boolean
      };

      await axios.put(`${API_BASE}/${task._id}/gp`, payload, { headers: getAuthHeaders() });
      setShowEditModel(false);
      
      if (onRefresh) {
        await onRefresh();
      }
    } catch (err) {
      console.error("Error saving task:", err);
      if (err.response?.status === 401 && onLogout) {
        onLogout();
      }
    }
  };

  const progress = subtasks.length
    ? (subtasks.filter((st) => st.completed).length / subtasks.length) * 100
    : 0;

  return (
    <>
      <div className={`${TI_CLASSES.wrapper} ${borderColor}`}>
        <div className={TI_CLASSES.leftContainer}>
          {showCompleteCheckbox && (
            <button
              onClick={handleComplete}
              className={`${TI_CLASSES.completeBtn} ${
                isCompleted ? "text-green-500" : "text-gray-300"
              }`}
              title={isCompleted ? "Mark as incomplete" : "Mark as complete"}
            >
              <CheckCircle2
                size={18}
                className={`${TI_CLASSES.checkboxIconBase} ${
                  isCompleted ? "fill-green-500" : ""
                }`}
              />
            </button>
          )}

          <div className="flex-1 min-w-0">
            <div className="flex items-baseline gap-2 mb-1 flex-wrap">
              <h3
                className={`${TI_CLASSES.titleBase} ${
                  isCompleted ? "text-gray-400 line-through" : "text-gray-800"
                }`}
              >
                {task.title}
              </h3>

              <span
                className={`${TI_CLASSES.priorityBadge} ${getPriorityBadgeColor(
                  task.priority
                )}`}
              >
                {task.priority}
              </span>
            </div>

            {task.description && <p className={TI_CLASSES.description}>{task.description}</p>}
          </div>
        </div>

        <div className={TI_CLASSES.rightContainer}>
          <div className="relative">
            <button onClick={() => setShowMenu(!showMenu)} className={TI_CLASSES.menuButton}>
              <MoreVertical className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>

            {showMenu && (
              <div className={TI_CLASSES.menuDropdown}>
                {MENU_OPTIONS.map((opt) => (
                  <button
                    key={opt.action}
                    onClick={() => handleAction(opt.action)}
                    className="w-full px-3 sm:px-4 py-2 text-left text-xs sm:text-sm hover:bg-purple-50 flex items-center gap-2 transition-colors duration-200"
                  >
                    {opt.icon}
                    {opt.label}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div
            className={`${TI_CLASSES.dateRow} ${
              task.dueDate && isToday(new Date(task.dueDate))
                ? "text-fuchsia-600"
                : "text-gray-500"
            }`}
          >
            <Calendar className="w-3.5 h-3.5" />
            <div>
              {task.dueDate
                ? isToday(new Date(task.dueDate))
                  ? "Today"
                  : format(new Date(task.dueDate), "MMM dd")
                : "-"}
            </div>

            <div className={TI_CLASSES.createdRow}>
              <Clock className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
              {task.createdAt
                ? `Created ${format(new Date(task.createdAt), "MMM dd")}`
                : "No date"}
            </div>
          </div>
        </div>
      </div>

      <TaskModel
        isOpen={showEditModel}
        onClose={() => setShowEditModel(false)}
        taskToEdit={task}
        onSave={handleSave}
      />
    </>
  );
};

export default TaskItem;