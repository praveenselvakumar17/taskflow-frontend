import React, { useMemo, useState } from 'react';
import { CT_CLASSES, SORT_OPTIONS } from '../assets/dummy';
import { Clock, Filter } from 'lucide-react';
import { useOutletContext } from 'react-router-dom';
import TaskItem from '../components/TaskItem';

const PendingPage = () => {
    const { tasks, refreshTasks } = useOutletContext();
    const [sortBy, setSortBy] = useState('newest');

    const sortedPendingTasks = useMemo(() => {
        return tasks
            .filter(task => {
                // Check if task is NOT completed (pending)
                const completed = task.completed;
                return completed === false || 
                       completed === 0 || 
                       completed === 'No' ||
                       (typeof completed === 'string' && completed.toLowerCase() === 'no') ||
                       completed === undefined ||
                       completed === null;
            })
            .sort((a, b) => {
                switch (sortBy) {
                    case 'newest':
                        return new Date(b.createdAt) - new Date(a.createdAt);

                    case 'oldest':
                        return new Date(a.createdAt) - new Date(b.createdAt);

                    case 'priority': {
                        const order = { high: 3, medium: 2, low: 1 };
                        const aPriority = order[a.priority?.toLowerCase()] || 0;
                        const bPriority = order[b.priority?.toLowerCase()] || 0;
                        return bPriority - aPriority;
                    }

                    default:
                        return 0;
                }
            });
    }, [tasks, sortBy]);

    return (
        <div className={CT_CLASSES.page}>
            {/* HEADER */}
            <div className={CT_CLASSES.header}>
                <div className={CT_CLASSES.titleWrapper}>
                    <h1 className={CT_CLASSES.title}>
                        <Clock className='text-orange-500 w-5 h-5 md:w-6 md:h-6' />
                        <span className='truncate'>Pending Tasks</span>
                    </h1>

                    <p className={CT_CLASSES.subtitle}>
                        {sortedPendingTasks.length} task{sortedPendingTasks.length !== 1 && 's'}{' '}
                        waiting to be completed
                    </p>
                </div>

                <div className={CT_CLASSES.sortContainer}>
                    <div className={CT_CLASSES.sortBox}>
                        <div className={CT_CLASSES.filterLabel}>
                            <Filter className="w-4 h-4 text-orange-500" />
                            <span className="text-xs md:text-sm">Sort by:</span>
                        </div>

                        {/* MOBILE DROPDOWN */}
                        <select
                            value={sortBy}
                            onChange={(e) => setSortBy(e.target.value)}
                            className={CT_CLASSES.select}
                        >
                            {SORT_OPTIONS.map(opt => (
                                <option key={opt.id} value={opt.id}>
                                    {opt.label}
                                </option>
                            ))}
                        </select>

                        {/* DESKTOP BUTTONS */}
                        <div className={CT_CLASSES.btnGroup}>
                            {SORT_OPTIONS.map(opt => (
                                <button
                                    key={opt.id}
                                    onClick={() => setSortBy(opt.id)}
                                    className={[
                                        CT_CLASSES.btnBase,
                                        sortBy === opt.id ? CT_CLASSES.btnActive : CT_CLASSES.btnInactive
                                    ].join(" ")}
                                >
                                    {opt.icon}
                                    {opt.label}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* TASK LIST */}
            <div className={CT_CLASSES.list}>
                {sortedPendingTasks.length === 0 ? (
                    <div className={CT_CLASSES.emptyState}>
                        <div className={CT_CLASSES.emptyStateUpper}>
                            <Clock className="w-6 h-6 md:w-8 md:h-8 text-orange-500" />
                            <h3 className={CT_CLASSES.emptyTitle}>
                                No pending tasks!
                            </h3>
                            <p className={CT_CLASSES.emptyText}>
                                All tasks are completed. Great job!
                            </p>
                        </div>
                    </div>
                ) : (
                    sortedPendingTasks.map(task => (
                        <TaskItem
                            key={task._id || task.id}
                            task={task}
                            onRefresh={refreshTasks}
                            showCompleteCheckbox={true}
                            className="text-sm md:text-base"
                        />
                    ))
                )}
            </div>
        </div>
    );
};

export default PendingPage;