import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { LogOut, CheckCircle2, Circle, Clock, Flame, Award, ShieldAlert } from 'lucide-react';
import api from '../api/client';

export default function EmployeeDashboard() {
    const [tasks, setTasks] = useState<any[]>([]);
    const navigate = useNavigate();
    const user = JSON.parse(localStorage.getItem('user') || '{}');

    useEffect(() => {
        fetchTasks();
    }, []);

    const fetchTasks = async () => {
        try {
            const { data } = await api.get('/tasks');
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

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        navigate('/login');
    };

    const dailyTasks = tasks.filter(t => t.type === 'daily');
    const bonusTasks = tasks.filter(t => t.type === 'miscellaneous');

    const dailyCompleted = dailyTasks.filter(t => t.status === 'completed').length;
    const bonusCompleted = bonusTasks.filter(t => t.status === 'completed').length;

    const getPercentage = () => {
        if (dailyTasks.length === 0) return 0;
        return Math.round((dailyCompleted / dailyTasks.length) * 100);
    };

    return (
        <div className="min-h-screen bg-background relative overflow-hidden font-sans">
            {/* Abstract Backgrounds - Khul Ke Pucho Theme */}
            <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-primary/10 rounded-full blur-[100px] pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-accent/10 rounded-full blur-[100px] pointer-events-none" />

            {/* Easter Egg Drop */}
            <div className="absolute -bottom-20 right-20 w-80 h-80 border-2 border-primary/5 rounded-t-[100px] rounded-b-[40px] opacity-20 pointer-events-none blur-sm" />

            {/* Header */}
            <header className="glass border-b border-white/5 sticky top-0 z-50 backdrop-blur-2xl">
                <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-primary to-accent flex items-center justify-center text-white font-black shadow-[0_0_15px_rgba(255,107,158,0.3)]">
                            KP
                        </div>
                        <h1 className="text-xl font-bold text-foreground">
                            Welcome back, <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-accent">{user.name}</span>
                        </h1>
                    </div>
                    <button
                        onClick={handleLogout}
                        className="flex items-center gap-2 px-4 py-2 text-sm font-bold text-destructive hover:bg-destructive/10 rounded-xl transition-colors"
                    >
                        <LogOut className="w-4 h-4" /> Sign Out
                    </button>
                </div>
            </header>

            <main className="max-w-7xl mx-auto px-6 py-10 grid grid-cols-1 lg:grid-cols-12 gap-10 animate-fade-in relative z-10">

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
                            <div className="absolute text-center">
                                <span className="text-4xl font-black text-foreground">{getPercentage()}%</span>
                                <span className="block text-xs font-bold text-muted-foreground uppercase tracking-widest mt-1">Completion</span>
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
                                <TaskCard key={t.id} task={t} onUpdate={handleStatusUpdate} isBonus={false} />
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
                    {bonusTasks.length > 0 && (
                        <section>
                            <h3 className="text-2xl font-black mb-6 text-amber-500 flex items-center gap-2">
                                <Flame className="w-6 h-6" /> Bonus Opportunities
                            </h3>
                            <div className="space-y-4">
                                {bonusTasks.map(t => (
                                    <TaskCard key={t.id} task={t} onUpdate={handleStatusUpdate} isBonus={true} />
                                ))}
                            </div>
                        </section>
                    )}

                </div>
            </main>
        </div>
    );
}

// Subcomponent for Tasks
function TaskCard({ task, onUpdate, isBonus }: { task: any, onUpdate: (id: string, s: string) => void, isBonus: boolean }) {
    const isCompleted = task.status === 'completed';
    const isInProgress = task.status === 'in_progress';

    return (
        <div className={`glass border rounded-2xl p-5 flex flex-col sm:flex-row gap-4 sm:items-center justify-between transition-all duration-300 ${isCompleted ? 'border-emerald-500/30 bg-emerald-500/5 opacity-80' : isBonus ? 'border-amber-500/30 hover:border-amber-500/50' : 'border-border/50 hover:border-primary/40'} shadow-md hover:shadow-xl`}>
            <div className="flex-1">
                <h4 className={`text-lg font-bold flex items-center gap-2 ${isCompleted ? 'line-through text-muted-foreground' : 'text-foreground'}`}>
                    {task.title}
                </h4>
                {task.description && (
                    <p className="text-muted-foreground text-sm mt-1">{task.description}</p>
                )}
            </div>

            <div className="flex items-center gap-2">
                {isCompleted ? (
                    <span className="flex items-center gap-1.5 px-4 py-2 font-bold text-sm text-emerald-400 bg-emerald-400/10 rounded-xl">
                        <CheckCircle2 className="w-5 h-5" /> Completed
                    </span>
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
