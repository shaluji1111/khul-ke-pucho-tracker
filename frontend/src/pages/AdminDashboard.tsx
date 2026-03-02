import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, CheckSquare, BarChart3, LogOut } from 'lucide-react';
import EmployeeManagement from '../components/Admin/EmployeeManagement';
import TaskAllocation from '../components/Admin/TaskAllocation';
import PerformanceDashboard from '../components/Admin/PerformanceDashboard';

export default function AdminDashboard() {
    const [activeTab, setActiveTab] = useState<'employees' | 'tasks' | 'performance'>('employees');
    const navigate = useNavigate();

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        navigate('/login');
    };

    return (
        <div className="flex h-screen bg-background overflow-hidden font-sans">
            {/* Mobile Header */}
            <header className="md:hidden glass border-b border-border/50 p-4 flex justify-between items-center absolute top-0 w-full z-50">
                <h1 className="text-lg font-black text-transparent bg-clip-text bg-gradient-to-r from-primary to-accent">Khul Ke Pucho</h1>
                <button onClick={handleLogout} className="p-2 text-destructive hover:bg-destructive/10 rounded-xl transition-colors"><LogOut className="w-5 h-5" /></button>
            </header>

            {/* Sidebar (Desktop) */}
            <aside className="hidden md:flex w-72 glass border-r border-border/50 flex flex-col z-20 shadow-2xl">
                <div className="p-8 border-b border-border/50">
                    <h1 className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-primary to-accent">
                        Khul Ke Pucho <span className="text-sm block mt-1 text-muted-foreground uppercase opacity-70 tracking-widest font-bold">Workspace</span>
                    </h1>
                </div>

                <nav className="flex-1 p-6 space-y-3">
                    <button
                        onClick={() => setActiveTab('employees')}
                        className={`flex items-center gap-3 w-full px-4 py-3.5 rounded-xl font-bold transition-all ${activeTab === 'employees'
                            ? 'bg-primary/10 text-primary scale-105 shadow-sm border border-primary/20'
                            : 'text-muted-foreground hover:bg-muted/50 hover:text-foreground'
                            }`}
                    >
                        <Users className="w-5 h-5" />
                        Employees
                    </button>

                    <button
                        onClick={() => setActiveTab('tasks')}
                        className={`flex items-center gap-3 w-full px-4 py-3.5 rounded-xl font-bold transition-all ${activeTab === 'tasks'
                            ? 'bg-primary/10 text-primary scale-105 shadow-sm border border-primary/20'
                            : 'text-muted-foreground hover:bg-muted/50 hover:text-foreground'
                            }`}
                    >
                        <CheckSquare className="w-5 h-5" />
                        Task Allocation
                    </button>

                    <button
                        onClick={() => setActiveTab('performance')}
                        className={`flex items-center gap-3 w-full px-4 py-3.5 rounded-xl font-bold transition-all ${activeTab === 'performance'
                            ? 'bg-primary/10 text-primary scale-105 shadow-sm border border-primary/20'
                            : 'text-muted-foreground hover:bg-muted/50 hover:text-foreground'
                            }`}
                    >
                        <BarChart3 className="w-5 h-5" />
                        Performance
                    </button>
                </nav>

                <div className="p-6 border-t border-border/50">
                    <button
                        onClick={handleLogout}
                        className="flex items-center gap-3 w-full px-4 py-3 text-destructive hover:bg-destructive/10 rounded-xl font-bold transition-colors"
                    >
                        <LogOut className="w-5 h-5" />
                        Sign Out
                    </button>
                </div>
            </aside>

            {/* Main Content Area */}
            <main className="flex-1 overflow-y-auto bg-gradient-to-br from-background via-background to-muted/20 relative pt-16 md:pt-0 pb-20 md:pb-0">
                <div className="p-4 sm:p-6 md:p-10 max-w-6xl mx-auto min-h-full animate-fade-in relative z-10">
                    {activeTab === 'employees' && <EmployeeManagement />}
                    {activeTab === 'tasks' && <TaskAllocation />}
                    {activeTab === 'performance' && <PerformanceDashboard />}
                </div>
                {/* Decorative flair */}
                <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-accent/5 rounded-full blur-[100px] pointer-events-none" />
            </main>

            {/* Mobile Bottom Nav */}
            <nav className="md:hidden fixed bottom-0 w-full glass border-t border-border/50 flex justify-around items-center p-2 z-50">
                <button onClick={() => setActiveTab('employees')} className={`p-2 rounded-xl flex flex-col items-center gap-1 flex-1 ${activeTab === 'employees' ? 'text-primary' : 'text-muted-foreground'}`}>
                    <Users className="w-6 h-6" />
                    <span className="text-[10px] font-bold">Team</span>
                </button>
                <button onClick={() => setActiveTab('tasks')} className={`p-2 rounded-xl flex flex-col items-center gap-1 flex-1 ${activeTab === 'tasks' ? 'text-primary' : 'text-muted-foreground'}`}>
                    <CheckSquare className="w-6 h-6" />
                    <span className="text-[10px] font-bold">Tasks</span>
                </button>
                <button onClick={() => setActiveTab('performance')} className={`p-2 rounded-xl flex flex-col items-center gap-1 flex-1 ${activeTab === 'performance' ? 'text-primary' : 'text-muted-foreground'}`}>
                    <BarChart3 className="w-6 h-6" />
                    <span className="text-[10px] font-bold">Stats</span>
                </button>
            </nav>
        </div>
    );
}
