import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { LogOut, CheckCircle2, Circle, Clock, Flame, Award, ShieldAlert, RefreshCw, ListTodo, Calendar, ChevronLeft, ChevronRight, Copy } from 'lucide-react';
import api from '../api/client';
import Confetti from 'react-confetti';
import { useWindowSize } from 'react-use';
import HolidayRoaster from '../components/HolidayRoaster';

export default function EmployeeDashboard() {
    const [tasks, setTasks] = useState<any[]>([]);
    const [newTaskTitle, setNewTaskTitle] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const navigate = useNavigate();
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    const { width, height } = useWindowSize();
    const [activeTab, setActiveTab] = useState<'tasks' | 'roaster'>('tasks');

    // Get today's date in local timezone (IST) as YYYY-MM-DD
    // new Date().toISOString() returns UTC which can be yesterday in IST (12am-5:30am)
    const getLocalDateStr = () => {
        const d = new Date();
        d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
        return d.toISOString().split('T')[0];
    };

    const [selectedDate, setSelectedDate] = useState(getLocalDateStr());

    // Easter egg states
    const [logoClicks, setLogoClicks] = useState(0);
    const [nightMode, setNightMode] = useState(false);

    const [copied, setCopied] = useState(false);

    useEffect(() => {
        fetchTasks();
        const interval = setInterval(() => {
            fetchTasks();
        }, 5000);
        return () => clearInterval(interval);
    }, [selectedDate]);

    const fetchTasks = async () => {
        try {
            const { data } = await api.get(`/tasks?date=${selectedDate}`);
            setTasks(data);
        } catch (e) {
            console.error(e);
        }
    };

    const handleStatusUpdate = async (id: string, newStatus: string) => {
        try {
            await api.patch(`/tasks/${id}/status`, { status: newStatus });
            fetchTasks();
        } catch (e) {
            console.error(e);
        }
    };

    const handleDeleteTask = async (id: string) => {
        if (!window.confirm("Delete this bonus task?")) return;
        try {
            await api.delete(`/tasks/${id}`);
            fetchTasks();
        } catch (e) {
            console.error(e);
        }
    };

    const handleEditTask = async (id: string, newTitle: string) => {
        try {
            await api.put(`/tasks/${id}`, { title: newTitle });
            fetchTasks();
        } catch (e) {
            console.error(e);
        }
    };

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        navigate('/login');
    };

    const handleAddBonus = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newTaskTitle.trim()) return;
        setIsSubmitting(true);
        try {
            await api.post('/tasks', { title: newTaskTitle, type: 'miscellaneous', assigned_to: user.id });
            setNewTaskTitle('');
            fetchTasks();
        } catch (e) {
            console.error(e);
        } finally {
            setIsSubmitting(false);
        }
    };

    const dailyTasks = tasks.filter(t => t.type === 'daily');
    const bonusTasks = tasks.filter(t => t.type === 'miscellaneous');

    const dailyCompleted = dailyTasks.filter(t => t.status === 'completed').length;
    const bonusCompleted = bonusTasks.filter(t => t.status === 'completed').length;

    const getPercentage = () => {
        if (dailyTasks.length === 0) return 0;
        return Math.round((dailyCompleted / dailyTasks.length) * 100);
    };

    const handleCopyDPR = () => {
        const completedDaily = dailyTasks.filter(t => t.status === 'completed');
        const completedBonus = bonusTasks.filter(t => t.status === 'completed');

        let dprText = `*DPR - ${new Date(selectedDate).toLocaleDateString()}*\n\n`;
        dprText += `*Name:* ${user.name}\n\n`;
        dprText += `*Baseline Tasks:*\n`;
        if (completedDaily.length > 0) {
            completedDaily.forEach((t, i) => {
                dprText += `${i + 1}. ${t.title}\n`;
            });
        } else {
            dprText += `None\n`;
        }

        dprText += `\n*Bonus Tasks:*\n`;
        if (completedBonus.length > 0) {
            completedBonus.forEach((t, i) => {
                dprText += `${i + 1}. ${t.title}\n`;
            });
        } else {
            dprText += `None\n`;
        }

        dprText += `\n*Total Completion:* ${getPercentage()}%\n`;

        navigator.clipboard.writeText(dprText);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const handleLogoClick = () => {
        const newClicks = logoClicks + 1;
        setLogoClicks(newClicks);
        if (newClicks >= 3) {
            setNightMode(true);
            setLogoClicks(0);
        }
    };

    const isClimax = getPercentage() === 100 && dailyTasks.length > 0;

    return (
        <div className={`min-h-screen relative overflow-hidden font-sans transition-colors duration-1000 ${nightMode ? 'bg-[#0a0510]' : 'bg-background'} ${isClimax ? 'cursor-[url(/banana-cursor.png),_auto]' : ''}`}>
            {/* Climax Confetti */}
            {isClimax && <Confetti width={width} height={height} recycle={false} numberOfPieces={300} colors={['#ec4899', '#f472b6', '#3b82f6', '#fcd34d']} />}

            {/* Abstract Backgrounds - Khul Ke Pucho Theme */}
            <div className={`absolute top-0 right-0 w-[600px] h-[600px] rounded-full blur-[100px] pointer-events-none transition-colors duration-1000 ${nightMode ? 'bg-purple-900/30' : 'bg-primary/10'}`} />
            <div className={`absolute bottom-0 left-0 w-[400px] h-[400px] rounded-full blur-[100px] pointer-events-none transition-colors duration-1000 ${nightMode ? 'bg-red-900/20' : 'bg-accent/10'}`} />

            {/* Easter Egg Drop */}
            <div className="absolute -bottom-20 right-20 w-80 h-80 border-2 border-primary/5 rounded-t-[100px] rounded-b-[40px] opacity-20 pointer-events-none blur-sm" />

            {/* Header */}
            <header className="glass border-b border-white/5 sticky top-0 z-50 backdrop-blur-2xl">
                <div className="max-w-7xl mx-auto px-4 md:px-6 h-16 md:h-20 flex items-center justify-between">
                    <div className="flex items-center gap-3 md:gap-4 flex-1 min-w-0" onClick={handleLogoClick}>
                        <div className={`w-8 h-8 md:w-10 md:h-10 shrink-0 cursor-pointer rounded-xl flex items-center justify-center text-white font-black shadow-[0_0_15px_rgba(255,107,158,0.3)] transition-colors duration-500 overflow-hidden`}>
                            <img src="/logo.jpg" alt="Khul Ke Pucho" className="w-full h-full object-cover" />
                        </div>
                        <h1 className="text-sm md:text-xl font-bold text-foreground truncate pl-1">
                            Welcome, <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-accent">{user.name}</span>
                        </h1>
                    </div>
                    <div className="flex items-center gap-2 md:gap-4 shrink-0">
                        {activeTab === 'tasks' && (
                            <div className="flex items-center gap-2 bg-muted/30 p-1.5 rounded-xl border border-white/5 mr-2">
                                <button
                                    onClick={() => {
                                        const d = new Date(selectedDate);
                                        d.setDate(d.getDate() - 1);
                                        setSelectedDate(d.toISOString().split('T')[0]);
                                    }}
                                    className="p-1.5 hover:bg-white/10 rounded-lg text-muted-foreground hover:text-foreground transition-colors"
                                >
                                    <ChevronLeft className="w-4 h-4" />
                                </button>
                                <div className="px-2 text-xs font-bold text-foreground min-w-[90px] text-center">
                                    {selectedDate === getLocalDateStr() ? 'Today' : selectedDate}
                                </div>
                                <button
                                    onClick={() => {
                                        const d = new Date(selectedDate);
                                        d.setDate(d.getDate() + 1);
                                        setSelectedDate(d.toISOString().split('T')[0]);
                                    }}
                                    className="p-1.5 hover:bg-white/10 rounded-lg text-muted-foreground hover:text-foreground transition-colors"
                                >
                                    <ChevronRight className="w-4 h-4" />
                                </button>
                            </div>
                        )}
                        <div className="hidden sm:flex bg-muted/30 p-1 rounded-xl border border-white/5 mr-2">
                            <button
                                onClick={() => setActiveTab('tasks')}
                                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all ${activeTab === 'tasks' ? 'bg-primary text-white shadow-md' : 'text-muted-foreground hover:text-foreground'}`}
                            >
                                <ListTodo className="w-4 h-4" /> Tasks
                            </button>
                            <button
                                onClick={() => setActiveTab('roaster')}
                                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all ${activeTab === 'roaster' ? 'bg-accent text-white shadow-md' : 'text-muted-foreground hover:text-foreground'}`}
                            >
                                <Calendar className="w-4 h-4" /> Roaster
                            </button>
                        </div>
                        <button
                            onClick={fetchTasks}
                            className="p-2 md:p-2.5 bg-primary/20 text-primary hover:bg-primary/30 rounded-xl transition-colors"
                            title="Refresh Tasks"
                        >
                            <RefreshCw className="w-4 h-4 md:w-5 md:h-5" />
                        </button>
                        <button
                            onClick={handleLogout}
                            className="flex items-center gap-2 px-3 md:px-4 py-2 text-xs md:text-sm font-bold text-destructive hover:bg-destructive/10 rounded-xl transition-colors whitespace-nowrap"
                        >
                            <LogOut className="w-4 h-4 md:w-5 md:h-5" /> <span className="hidden sm:inline">Sign Out</span>
                        </button>
                    </div>
                </div>
            </header>

            <main className="max-w-7xl mx-auto px-4 md:px-6 py-6 md:py-10 animate-fade-in relative z-10">
                {activeTab === 'tasks' ? (
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 md:gap-10">

                        {/* Progress Sidebar */}
                        <div className="lg:col-span-4 space-y-6">
                            <div className="glass border border-border/50 rounded-3xl p-8 relative overflow-hidden shadow-2xl">
                                <h2 className="text-xl font-black mb-8 flex items-center gap-2">
                                    <Award className="w-6 h-6 text-primary" /> Daily Scorecard
                                </h2>

                                <div className="relative w-48 h-48 mx-auto mb-8 flex items-center justify-center">
                                    <svg className="w-full h-full transform -rotate-90">
                                        <circle cx="96" cy="96" r="88" className="stroke-input/50 fill-none" strokeWidth="12" />
                                        <circle
                                            cx="96" cy="96" r="88"
                                            className="stroke-primary fill-none transition-all duration-1000 ease-out"
                                            strokeWidth="12"
                                            strokeDasharray="553"
                                            strokeDashoffset={553 - (553 * getPercentage()) / 100}
                                            strokeLinecap="round"
                                        />
                                    </svg>
                                    <div className="absolute text-center transition-all">
                                        {isClimax ? (
                                            <>
                                                <span className="text-3xl font-black text-primary animate-pulse tracking-tight">Ooh la la!</span>
                                                <span className="block text-[10px] font-bold text-muted-foreground uppercase tracking-widest mt-1">Peak Performance</span>
                                            </>
                                        ) : (
                                            <>
                                                <span className="text-4xl font-black text-foreground">{getPercentage()}%</span>
                                                <span className="block text-xs font-bold text-muted-foreground uppercase tracking-widest mt-1">Completion</span>
                                            </>
                                        )}
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <div className="flex justify-between items-center text-sm font-bold bg-muted/30 p-4 rounded-2xl border border-border/50">
                                        <span className="text-muted-foreground">Baseline Tasks</span>
                                        <span className="text-foreground">{dailyCompleted} / {dailyTasks.length}</span>
                                    </div>
                                    <div className="flex justify-between items-center text-sm font-bold bg-amber-500/10 p-4 rounded-2xl border border-amber-500/20 text-amber-500">
                                        <span className="flex items-center gap-1.5"><Flame className="w-4 h-4" /> Extra Bonus</span>
                                        <span className="text-xl">{bonusCompleted}</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Task Lists */}
                        <div className="lg:col-span-8 space-y-10">

                            {/* Daily Checklist */}
                            <section>
                                <h3 className="text-2xl font-black mb-6 text-foreground">Baseline Responsibilities</h3>
                                <div className="space-y-4">
                                    {dailyTasks.map(t => (
                                        <TaskCard key={t.id} task={t} onUpdate={handleStatusUpdate} isBonus={false} currentUser={user} onEdit={handleEditTask} onDelete={handleDeleteTask} />
                                    ))}
                                    {dailyTasks.length === 0 && (
                                        <div className="glass p-8 text-center rounded-2xl border border-dashed border-border flex flex-col items-center">
                                            <ShieldAlert className="w-10 h-10 text-muted-foreground mb-3" />
                                            <p className="text-muted-foreground font-medium">You have no baseline tasks assigned.</p>
                                        </div>
                                    )}
                                </div>
                            </section>

                            {/* Bonus Tasks */}
                            <section>
                                <div className="flex items-center justify-between mb-6">
                                    <h3 className="text-2xl font-black text-amber-500 flex items-center gap-2">
                                        <Flame className="w-6 h-6" /> Bonus Opportunities
                                    </h3>
                                </div>

                                {/* Add Bonus Form */}
                                <form onSubmit={handleAddBonus} className="mb-6 glass p-4 rounded-xl flex gap-3 items-center border border-amber-500/20 shadow-sm">
                                    <input
                                        type="text"
                                        placeholder="Log your own extra work..."
                                        className="flex-1 bg-input/50 border border-border/60 rounded-lg px-4 py-2 text-foreground focus:ring-2 focus:ring-amber-500/50 transition-all font-medium text-sm"
                                        value={newTaskTitle}
                                        onChange={e => setNewTaskTitle(e.target.value)}
                                        disabled={isSubmitting}
                                    />
                                    <button
                                        disabled={isSubmitting || !newTaskTitle.trim()}
                                        className="bg-amber-500/20 text-amber-500 hover:bg-amber-500/30 px-5 py-2 rounded-lg font-bold text-sm transition-colors border border-amber-500/30 disabled:opacity-50"
                                    >
                                        {isSubmitting ? 'Adding...' : 'Add'}
                                    </button>
                                </form>

                                <div className="space-y-4">
                                    {bonusTasks.map(t => (
                                        <TaskCard key={t.id} task={t} onUpdate={handleStatusUpdate} isBonus={true} currentUser={user} onEdit={handleEditTask} onDelete={handleDeleteTask} />
                                    ))}
                                    {bonusTasks.length === 0 && (
                                        <div className="text-center p-8 glass rounded-xl border border-dashed border-border text-muted-foreground font-medium text-sm">
                                            No bonus tasks logged yet. Add some extra work to boost your performance!
                                        </div>
                                    )}
                                </div>

                                <div className="mt-8 flex justify-end pb-20 sm:pb-8">
                                    <button
                                        onClick={handleCopyDPR}
                                        className="flex items-center gap-2 px-6 py-3 bg-primary/20 hover:bg-primary/30 text-primary border border-primary/30 rounded-full transition-colors shadow-lg font-bold text-sm"
                                        title="Copy all completed tasks for the day"
                                    >
                                        {copied ? <CheckCircle2 className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
                                        {copied ? 'Copied to Clipboard!' : 'Copy DPR'}
                                    </button>
                                </div>
                            </section>

                        </div>
                    </div>
                ) : (
                    <div className="max-w-5xl mx-auto">
                        <HolidayRoaster isAdmin={user.role === 'admin'} />
                    </div>
                )}
            </main>

            {/* Mobile Bottom Nav */}
            <div className={`sm:hidden fixed bottom-0 left-0 right-0 glass border-t border-white/5 p-2 flex justify-around items-center z-50`}>
                <button
                    onClick={() => setActiveTab('tasks')}
                    className={`flex flex-col items-center gap-1 p-2 transition-colors ${activeTab === 'tasks' ? 'text-primary' : 'text-muted-foreground'}`}
                >
                    <ListTodo className="w-6 h-6" />
                    <span className="text-[10px] font-bold">Tasks</span>
                </button>
                <button
                    onClick={() => setActiveTab('roaster')}
                    className={`flex flex-col items-center gap-1 p-2 transition-colors ${activeTab === 'roaster' ? 'text-accent' : 'text-muted-foreground'}`}
                >
                    <Calendar className="w-6 h-6" />
                    <span className="text-[10px] font-bold">Roaster</span>
                </button>
            </div>
        </div>
    );
}

// Subcomponent for Tasks
function TaskCard({ task, onUpdate, isBonus, currentUser, onEdit, onDelete }: { task: any, onUpdate: (id: string, s: string) => void, isBonus: boolean, currentUser: any, onEdit: (id: string, title: string) => void, onDelete: (id: string) => void }) {
    const isCompleted = task.status === 'completed';
    const isInProgress = task.status === 'in_progress';
    const isCreator = task.created_by === currentUser.id;

    const [isEditing, setIsEditing] = useState(false);
    const [editTitle, setEditTitle] = useState(task.title);

    const handleSaveEdit = () => {
        if (editTitle.trim() && editTitle !== task.title) {
            onEdit(task.id, editTitle);
        }
        setIsEditing(false);
    };

    return (
        <div className={`glass border rounded-2xl p-5 flex flex-col sm:flex-row gap-4 sm:items-center justify-between transition-all duration-300 ${isCompleted ? 'border-emerald-500/30 bg-emerald-500/5 opacity-80' : isBonus ? 'border-amber-500/30 hover:border-amber-500/50' : 'border-border/50 hover:border-primary/40'} shadow-md hover:shadow-xl`}>
            <div className="flex-1">
                {isEditing ? (
                    <input
                        type="text"
                        value={editTitle}
                        onChange={e => setEditTitle(e.target.value)}
                        onBlur={handleSaveEdit}
                        onKeyDown={e => e.key === 'Enter' && handleSaveEdit()}
                        className="bg-input/50 border border-border/60 rounded-lg px-3 py-1 text-foreground focus:ring-2 focus:ring-amber-500/50 transition-all font-bold text-lg w-full mb-1"
                        autoFocus
                    />
                ) : (
                    <h4 className={`text-lg font-bold flex items-center gap-2 ${isCompleted ? 'line-through text-muted-foreground' : 'text-foreground'}`}>
                        {task.title}
                        {isCreator && !isCompleted && (
                            <div className="flex items-center gap-1 opacity-50 hover:opacity-100 transition-opacity ml-2">
                                <button onClick={() => setIsEditing(true)} className="text-xs text-blue-400 hover:bg-blue-400/10 px-2 py-0.5 rounded">Edit</button>
                                <button onClick={() => onDelete(task.id)} className="text-xs text-destructive hover:bg-destructive/10 px-2 py-0.5 rounded">Delete</button>
                            </div>
                        )}
                    </h4>
                )}
                {task.description && (
                    <p className="text-muted-foreground text-sm mt-1">{task.description}</p>
                )}
                {task.deadline && task.type === 'miscellaneous' && (
                    <div className="mt-2 text-xs font-bold text-amber-500/80 bg-amber-500/10 px-2 py-1 rounded-md border border-amber-500/20 w-fit">
                        Due: {new Date(task.deadline).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </div>
                )}
            </div>

            <div className="flex items-center gap-2">
                {isCompleted ? (
                    <button
                        onClick={() => onUpdate(task.id, 'pending')}
                        className="flex items-center gap-1.5 px-4 py-2 font-bold text-sm text-emerald-400 bg-emerald-400/10 hover:bg-emerald-400/20 rounded-xl transition-colors"
                        title="Click to undo completion"
                    >
                        <CheckCircle2 className="w-5 h-5" /> Completed
                    </button>
                ) : (
                    <>
                        <button
                            onClick={() => onUpdate(task.id, isInProgress ? 'pending' : 'in_progress')}
                            className={`flex items-center gap-2 px-4 py-2 font-bold text-sm rounded-xl transition-colors ${isInProgress ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30' : 'bg-muted/50 text-muted-foreground hover:bg-muted focus:ring-2 focus:ring-accent/50'}`}
                        >
                            <Clock className="w-4 h-4" /> {isInProgress ? 'Working...' : 'Start'}
                        </button>

                        {isInProgress && (
                            <button
                                onClick={() => onUpdate(task.id, 'completed')}
                                className="flex items-center gap-2 px-4 py-2 font-bold text-sm text-emerald-400 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 rounded-xl transition-colors focus:ring-2 focus:ring-emerald-500/50"
                            >
                                <CheckCircle2 className="w-4 h-4" /> Finish
                            </button>
                        )}

                        {!isInProgress && (
                            <button
                                onClick={() => onUpdate(task.id, 'completed')}
                                className="p-2 text-muted-foreground hover:text-emerald-400 hover:bg-emerald-400/10 rounded-xl transition-colors"
                                title="Quick Complete"
                            >
                                <Circle className="w-5 h-5" />
                            </button>
                        )}
                    </>
                )}
            </div>
        </div>
    );
}
