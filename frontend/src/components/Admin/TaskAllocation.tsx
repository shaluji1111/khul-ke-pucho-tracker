import React, { useState, useEffect } from 'react';
import { ClipboardList, Sparkles, CheckCircle2, Clock, Trash2, RefreshCw, Pencil } from 'lucide-react';
import api from '../../api/client';

export default function TaskAllocation() {
    const [tasks, setTasks] = useState<any[]>([]);
    const [recurringTasks, setRecurringTasks] = useState<any[]>([]);
    const [users, setUsers] = useState<any[]>([]);

    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [type, setType] = useState('daily');
    const [assignedTo, setAssignedTo] = useState('');
    const [deadline, setDeadline] = useState('');
    const [points, setPoints] = useState('25');
    const [loading, setLoading] = useState(false);

    const [listTab, setListTab] = useState<'tasks' | 'templates'>('tasks');
    const [templateEmployeeFilter, setTemplateEmployeeFilter] = useState<string>('all');

    const [editingTemplate, setEditingTemplate] = useState<any>(null);
    const [editTemplateTitle, setEditTemplateTitle] = useState('');
    const [editTemplateDesc, setEditTemplateDesc] = useState('');
    const [editTemplateAssignee, setEditTemplateAssignee] = useState('');

    // For editing active tasks
    const [editingTask, setEditingTask] = useState<any>(null);
    const [editTaskTitle, setEditTaskTitle] = useState('');
    const [editTaskDesc, setEditTaskDesc] = useState('');
    const [editTaskDeadline, setEditTaskDeadline] = useState('');
    const [editTaskAssignee, setEditTaskAssignee] = useState('');
    const [editTaskPoints, setEditTaskPoints] = useState('');

    useEffect(() => {
        fetchData();
        const interval = setInterval(() => {
            fetchData();
        }, 5000);
        return () => clearInterval(interval);
    }, []);

    const fetchData = async () => {
        try {
            const [tasksRes, recurringRes, usersRes] = await Promise.all([
                api.get('/tasks'),
                api.get('/tasks/recurring'),
                api.get('/users')
            ]);
            setTasks(tasksRes.data);
            setRecurringTasks(recurringRes.data);
            const employees = usersRes.data.filter((u: any) => u.role === 'employee');
            setUsers(employees);
            if (employees.length > 0 && !assignedTo) {
                setAssignedTo(employees[0].id);
            }
        } catch (e) {
            console.error(e);
        }
    };

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!assignedTo) return;
        setLoading(true);
        try {
            if (type === 'daily') {
                await api.post('/tasks/recurring', { title, description, assigned_to: assignedTo });
            } else {
                await api.post('/tasks', { title, description, type, assigned_to: assignedTo, deadline: deadline || undefined, points: Number(points) });
            }
            setTitle('');
            setDescription('');
            setDeadline('');
            fetchData();
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteTemplate = async (id: string) => {
        if (!window.confirm('Delete this daily template?')) return;
        try {
            await api.delete(`/tasks/recurring/${id}`);
            fetchData();
        } catch (e) {
            console.error(e);
        }
    };

    const openEditTemplate = (template: any) => {
        setEditingTemplate(template);
        setEditTemplateTitle(template.title);
        setEditTemplateDesc(template.description || '');
        setEditTemplateAssignee(template.assigned_to);
    };

    const handleEditTemplate = async (id: string) => {
        if (!editTemplateTitle.trim() || !editTemplateAssignee) return;
        try {
            await api.put(`/tasks/recurring/${id}`, {
                title: editTemplateTitle,
                description: editTemplateDesc,
                assigned_to: editTemplateAssignee
            });
            setEditingTemplate(null);
            fetchData();
        } catch (e) {
            console.error(e);
        }
    };

    const openEditTask = (task: any) => {
        setEditingTask(task);
        setEditTaskTitle(task.title);
        setEditTaskDesc(task.description || '');
        setEditTaskDeadline(task.deadline ? new Date(task.deadline).toISOString().slice(0, 16) : '');
        setEditTaskAssignee(task.assigned_to);
        setEditTaskPoints(task.points?.toString() || (task.type === 'daily' ? '10' : '25'));
    };

    const handleEditTask = async (id: string) => {
        if (!editTaskTitle.trim() || !editTaskAssignee) return;
        try {
            await api.put(`/tasks/${id}`, {
                title: editTaskTitle,
                description: editTaskDesc,
                deadline: editTaskDeadline || null,
                assigned_to: editTaskAssignee,
                points: Number(editTaskPoints)
            });
            setEditingTask(null);
            fetchData();
        } catch (e) {
            console.error(e);
        }
    };

    const handleDeleteTask = async (id: string) => {
        if (!window.confirm('Delete this task?')) return;
        try {
            await api.delete(`/tasks/${id}`);
            fetchData();
        } catch (e) {
            console.error(e);
        }
    };

    return (
        <div className="space-y-8 animate-slide-up">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-extrabold text-white flex items-center gap-3">
                        Task Allocation
                        <button onClick={fetchData} className="p-2 bg-primary/20 text-primary hover:bg-primary/30 rounded-xl transition-colors" title="Refresh Tasks">
                            <RefreshCw className="w-5 h-5" />
                        </button>
                    </h2>
                    <p className="text-muted-foreground mt-1 text-sm font-medium">Assign daily baseline or extra bonus tasks.</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Assignment Form */}
                <div className="lg:col-span-1 glass border border-border/50 rounded-2xl p-6 h-fit shadow-lg relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-accent/10 rounded-bl-full pointer-events-none" />
                    <h3 className="text-xl font-bold flex items-center gap-2 mb-6 text-foreground">
                        <ClipboardList className="w-5 h-5 text-accent" /> Assign Task
                    </h3>
                    <form onSubmit={handleCreate} className="space-y-5 relative z-10">
                        <div>
                            <label className="block text-sm font-bold text-muted-foreground mb-2">Task Title</label>
                            <input
                                required
                                className="w-full bg-input/50 border border-border/60 rounded-xl px-4 py-3 text-foreground focus:ring-2 focus:ring-accent/50 transition-all font-medium"
                                value={title}
                                onChange={e => setTitle(e.target.value)}
                                placeholder="What needs to be done?"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-muted-foreground mb-2">Description <span className="text-xs font-normal">(Optional)</span></label>
                            <textarea
                                className="w-full bg-input/50 border border-border/60 rounded-xl px-4 py-3 text-foreground focus:ring-2 focus:ring-accent/50 transition-all font-medium min-h-[100px]"
                                value={description}
                                onChange={e => setDescription(e.target.value)}
                            />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-bold text-muted-foreground mb-2">Category</label>
                                <select
                                    className="w-full bg-input/50 border border-border/60 rounded-xl px-4 py-3 text-foreground focus:ring-2 focus:ring-accent/50 transition-all font-medium appearance-none"
                                    value={type}
                                    onChange={e => setType(e.target.value)}
                                >
                                    <option value="daily">Daily Template (Recurring)</option>
                                    <option value="miscellaneous">Extra Bonus (One-time)</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-muted-foreground mb-2">Assignee</label>
                                <select
                                    required
                                    className="w-full bg-input/50 border border-border/60 rounded-xl px-4 py-3 text-foreground focus:ring-2 focus:ring-accent/50 transition-all font-medium appearance-none"
                                    value={assignedTo}
                                    onChange={e => setAssignedTo(e.target.value)}
                                >
                                    {users.map(u => (
                                        <option key={u.id} value={u.id}>{u.full_name ? `${u.full_name} (${u.name})` : u.name}</option>
                                    ))}
                                    {users.length === 0 && <option value="" disabled>No employees</option>}
                                </select>
                            </div>
                        </div>

                        {type === 'miscellaneous' && (
                            <div className="grid grid-cols-2 gap-4 animate-fade-in">
                                <div>
                                    <label className="block text-sm font-bold text-muted-foreground mb-2">Deadline</label>
                                    <input
                                        type="datetime-local"
                                        required
                                        className="w-full bg-input/50 border border-border/60 rounded-xl px-4 py-3 text-foreground focus:ring-2 focus:ring-accent/50 transition-all font-medium"
                                        value={deadline}
                                        onChange={e => setDeadline(e.target.value)}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-muted-foreground mb-2">Points</label>
                                    <input
                                        type="number"
                                        required
                                        className="w-full bg-input/50 border border-border/60 rounded-xl px-4 py-3 text-foreground focus:ring-2 focus:ring-accent/50 transition-all font-medium"
                                        value={points}
                                        onChange={e => setPoints(e.target.value)}
                                        min="0"
                                    />
                                </div>
                            </div>
                        )}

                        <button
                            disabled={loading || users.length === 0}
                            className="w-full mt-4 bg-gradient-to-r from-accent to-primary hover:from-accent/90 hover:to-primary/90 text-primary-foreground font-bold py-3.5 rounded-xl shadow-lg shadow-accent/20 transition-transform active:scale-[0.98] disabled:opacity-50"
                        >
                            {loading ? 'Assigning...' : 'Dispatch Task'}
                        </button>
                    </form>
                </div>

                {/* Task List Overview */}
                <div className="lg:col-span-2 space-y-4">
                    <div className="flex gap-4 mb-2">
                        <button onClick={() => setListTab('tasks')} className={`px-5 py-2.5 rounded-xl font-bold text-sm transition-all ${listTab === 'tasks' ? 'bg-primary text-white shadow-md' : 'glass text-muted-foreground hover:bg-white/5'}`}>Active Tasks</button>
                        <button onClick={() => setListTab('templates')} className={`px-5 py-2.5 rounded-xl font-bold text-sm transition-all ${listTab === 'templates' ? 'bg-accent text-white shadow-md' : 'glass text-muted-foreground hover:bg-white/5'}`}>Daily Templates</button>
                    </div>

                    {listTab === 'tasks' ? (
                        <>
                            <div className="grid grid-cols-2 gap-4 mb-6">
                                <div className="glass rounded-xl p-4 border border-border/50">
                                    <span className="text-sm font-bold text-muted-foreground uppercase tracking-wider">Total Tasks</span>
                                    <div className="text-3xl font-black text-white mt-1">{tasks.length}</div>
                                </div>
                                <div className="glass rounded-xl p-4 border border-border/50">
                                    <span className="text-sm font-bold text-muted-foreground uppercase tracking-wider">Completed</span>
                                    <div className="text-3xl font-black text-primary mt-1">{tasks.filter(t => t.status === 'completed').length}</div>
                                </div>
                            </div>

                            <div className="space-y-3">
                                {tasks.map(t => (
                                    <div key={t.id} className="glass border border-border/50 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:border-primary/40 transition-colors">
                                        {editingTask?.id === t.id ? (
                                            <div className="flex-1 space-y-3 w-full">
                                                <input
                                                    className="w-full bg-input/50 border border-border/60 rounded-lg px-3 py-2 text-sm text-foreground focus:ring-2 focus:ring-primary/50 transition-all font-medium"
                                                    value={editTaskTitle}
                                                    onChange={e => setEditTaskTitle(e.target.value)}
                                                    placeholder="Task Title"
                                                    autoFocus
                                                />
                                                <select
                                                    className="w-full bg-input/50 border border-border/60 rounded-lg px-3 py-2 text-sm text-foreground focus:ring-2 focus:ring-primary/50 transition-all font-medium appearance-none"
                                                    value={editTaskAssignee}
                                                    onChange={e => setEditTaskAssignee(e.target.value)}
                                                >
                                                    {users.map(u => (
                                                        <option key={u.id} value={u.id}>{u.full_name ? `${u.full_name} (${u.name})` : u.name}</option>
                                                    ))}
                                                </select>
                                                <div className="grid grid-cols-2 gap-3 w-full">
                                                    {t.type === 'miscellaneous' && (
                                                        <input
                                                            type="datetime-local"
                                                            className="w-full bg-input/50 border border-border/60 rounded-lg px-3 py-2 text-sm text-foreground focus:ring-2 focus:ring-primary/50 transition-all font-medium"
                                                            value={editTaskDeadline}
                                                            onChange={e => setEditTaskDeadline(e.target.value)}
                                                        />
                                                    )}
                                                    <input
                                                        type="number"
                                                        className="w-full bg-input/50 border border-border/60 rounded-lg px-3 py-2 text-sm text-foreground focus:ring-2 focus:ring-primary/50 transition-all font-medium"
                                                        value={editTaskPoints}
                                                        onChange={e => setEditTaskPoints(e.target.value)}
                                                        placeholder="Points"
                                                    />
                                                </div>
                                                <div className="flex gap-2 justify-end">
                                                    <button onClick={() => setEditingTask(null)} className="px-3 py-1.5 text-xs font-bold text-muted-foreground hover:bg-white/5 rounded-lg transition-colors">Cancel</button>
                                                    <button onClick={() => handleEditTask(t.id)} className="px-3 py-1.5 text-xs font-bold bg-primary text-white hover:bg-primary/90 rounded-lg transition-colors shadow-sm">Save</button>
                                                </div>
                                            </div>
                                        ) : (
                                            <>
                                                <div>
                                                    <div className="flex items-center gap-2">
                                                        <h4 className="font-bold text-lg text-foreground">{t.title}</h4>
                                                        <span className="bg-primary/20 text-primary text-[10px] font-black uppercase px-2 py-0.5 rounded-md border border-primary/30 flex items-center gap-1">
                                                            {t.points || (t.type === 'daily' ? 10 : 25)} pts
                                                        </span>
                                                        {t.type === 'miscellaneous' && (
                                                            <span className="bg-amber-500/20 text-amber-500 text-[10px] font-black uppercase px-2 py-0.5 rounded-md flex items-center gap-1 border border-amber-500/30">
                                                                <Sparkles className="w-3 h-3" /> Bonus
                                                            </span>
                                                        )}
                                                    </div>
                                                    <p className="text-sm text-muted-foreground mt-1">Assigned to: <strong className="text-primary/90">{users.find(u => u.name === t.assignee_name)?.full_name ? `${users.find(u => u.name === t.assignee_name)?.full_name} (${t.assignee_name})` : t.assignee_name}</strong></p>
                                                </div>

                                                <div className="flex flex-col items-end gap-2">
                                                    {t.deadline && t.type === 'miscellaneous' && (
                                                        <span className="text-xs font-bold text-amber-500/80 bg-amber-500/10 px-2 py-1 rounded-md border border-amber-500/20">
                                                            Due: {new Date(t.deadline).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                                        </span>
                                                    )}
                                                    <div className="flex items-center gap-3">
                                                        <button
                                                            onClick={() => openEditTask(t)}
                                                            className="p-1.5 text-muted-foreground hover:bg-primary/10 hover:text-primary rounded-lg transition-colors"
                                                            title="Edit Task"
                                                        >
                                                            <Pencil className="w-4 h-4" />
                                                        </button>
                                                        <button
                                                            onClick={() => handleDeleteTask(t.id)}
                                                            className="p-1.5 text-muted-foreground hover:bg-destructive/10 hover:text-destructive rounded-lg transition-colors"
                                                            title="Delete Task"
                                                        >
                                                            <Trash2 className="w-4 h-4" />
                                                        </button>
                                                        {t.status === 'completed' ? (
                                                            <span className="flex items-center gap-1.5 text-sm font-bold text-emerald-400 bg-emerald-400/10 px-3 py-1.5 rounded-lg border border-emerald-400/20">
                                                                <CheckCircle2 className="w-4 h-4" /> Completed
                                                            </span>
                                                        ) : t.status === 'in_progress' ? (
                                                            <span className="flex items-center gap-1.5 text-sm font-bold text-blue-400 bg-blue-400/10 px-3 py-1.5 rounded-lg border border-blue-400/20">
                                                                <Clock className="w-4 h-4" /> In Progress
                                                            </span>
                                                        ) : (
                                                            <span className="flex items-center gap-1.5 text-sm font-bold text-muted-foreground bg-muted/40 px-3 py-1.5 rounded-lg border border-border/50">
                                                                Pending
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                            </>
                                        )}
                                    </div>
                                ))}
                                {tasks.length === 0 && (
                                    <div className="text-center p-10 glass rounded-xl border border-dashed border-border text-muted-foreground font-medium">
                                        No active tasks found.
                                    </div>
                                )}
                            </div>
                        </>
                    ) : (
                        <div className="space-y-3 pt-2">
                            {/* Filter Dropdown */}
                            <div className="mb-4">
                                <label className="block text-sm font-bold text-muted-foreground mb-2">Filter Templates by Employee</label>
                                <select
                                    className="w-full sm:w-64 bg-input/50 border border-border/60 rounded-xl px-4 py-2 text-sm text-foreground focus:ring-2 focus:ring-accent/50 transition-all font-medium appearance-none"
                                    value={templateEmployeeFilter}
                                    onChange={e => setTemplateEmployeeFilter(e.target.value)}
                                >
                                    <option value="all">All Employees</option>
                                    {users.map(u => (
                                        <option key={u.id} value={u.name}>{u.full_name ? `${u.full_name} (${u.name})` : u.name}</option>
                                    ))}
                                </select>
                            </div>

                            {recurringTasks
                                .filter(rt => templateEmployeeFilter === 'all' || rt.assignee_name === templateEmployeeFilter)
                                .map(rt => (
                                    <div key={rt.id} className="glass border border-border/50 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:border-accent/40 transition-colors">
                                        {editingTemplate?.id === rt.id ? (
                                            <div className="flex-1 space-y-3 w-full">
                                                <input
                                                    className="w-full bg-input/50 border border-border/60 rounded-lg px-3 py-2 text-sm text-foreground focus:ring-2 focus:ring-accent/50 transition-all font-medium"
                                                    value={editTemplateTitle}
                                                    onChange={e => setEditTemplateTitle(e.target.value)}
                                                    placeholder="Task Title"
                                                    autoFocus
                                                />
                                                <select
                                                    className="w-full bg-input/50 border border-border/60 rounded-lg px-3 py-2 text-sm text-foreground focus:ring-2 focus:ring-accent/50 transition-all font-medium appearance-none"
                                                    value={editTemplateAssignee}
                                                    onChange={e => setEditTemplateAssignee(e.target.value)}
                                                >
                                                    {users.map(u => (
                                                        <option key={u.id} value={u.id}>{u.full_name ? `${u.full_name} (${u.name})` : u.name}</option>
                                                    ))}
                                                </select>
                                                <div className="flex gap-2 justify-end">
                                                    <button onClick={() => setEditingTemplate(null)} className="px-3 py-1.5 text-xs font-bold text-muted-foreground hover:bg-white/5 rounded-lg transition-colors">Cancel</button>
                                                    <button onClick={() => handleEditTemplate(rt.id)} className="px-3 py-1.5 text-xs font-bold bg-accent text-white hover:bg-accent/90 rounded-lg transition-colors shadow-sm">Save</button>
                                                </div>
                                            </div>
                                        ) : (
                                            <>
                                                <div>
                                                    <h4 className="font-bold text-lg text-foreground flex items-center gap-2">
                                                        {rt.title}
                                                        <span className="bg-primary/20 text-primary text-[10px] font-black uppercase px-2 py-0.5 rounded-md border border-primary/30">
                                                            Daily
                                                        </span>
                                                    </h4>
                                                    <p className="text-sm text-muted-foreground mt-1">Assigned to: <strong className="text-accent/90">{users.find(u => u.name === rt.assignee_name)?.full_name ? `${users.find(u => u.name === rt.assignee_name)?.full_name} (${rt.assignee_name})` : rt.assignee_name}</strong></p>
                                                </div>
                                                <div className="flex items-center gap-1 shrink-0">
                                                    <button
                                                        onClick={() => openEditTemplate(rt)}
                                                        className="p-2.5 text-muted-foreground hover:bg-accent/10 hover:text-accent rounded-xl transition-colors"
                                                        title="Edit Template"
                                                    >
                                                        <Pencil className="w-5 h-5" />
                                                    </button>
                                                    <button
                                                        onClick={() => handleDeleteTemplate(rt.id)}
                                                        className="p-2.5 text-muted-foreground hover:bg-destructive/10 hover:text-destructive rounded-xl transition-colors"
                                                        title="Delete Template"
                                                    >
                                                        <Trash2 className="w-5 h-5" />
                                                    </button>
                                                </div>
                                            </>
                                        )}
                                    </div>
                                ))}
                            {recurringTasks.filter(rt => templateEmployeeFilter === 'all' || rt.assignee_name === templateEmployeeFilter).length === 0 && (
                                <div className="text-center p-10 glass rounded-xl border border-dashed border-border text-muted-foreground font-medium">
                                    No daily templates found for this selection.
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
