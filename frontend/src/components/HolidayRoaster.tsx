import { useState, useEffect } from 'react';
import { Calendar, Plus, Trash2, ShieldCheck, ShieldAlert, Clock } from 'lucide-react';
import api from '../api/client';

interface Leave {
    id: string;
    user_id: string;
    user_name?: string;
    leave_date: string;
}

interface WeekConfig {
    week_start_date: string;
    is_accepting: number;
    deadline: string | null;
}

export default function HolidayRoaster({ isAdmin = false }: { isAdmin?: boolean }) {
    const [leaves, setLeaves] = useState<Leave[]>([]);
    const [configs, setConfigs] = useState<WeekConfig[]>([]);
    const [newLeaveDate, setNewLeaveDate] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    // Admin state for config
    const [selectedWeek, setSelectedWeek] = useState('');
    const [isAccepting, setIsAccepting] = useState(false);
    const [deadline, setDeadline] = useState('');

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const [leavesRes, configRes] = await Promise.all([
                api.get('/leaves'),
                api.get('/leaves/config')
            ]);
            setLeaves(leavesRes.data);
            setConfigs(configRes.data);
        } catch (err) {
            console.error('Failed to fetch roaster data');
        }
    };

    const handleAddLeave = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            await api.post('/leaves', { leave_date: newLeaveDate });
            setNewLeaveDate('');
            fetchData();
        } catch (err: any) {
            setError(err.response?.data?.error || 'Failed to add leave');
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteLeave = async (id: string) => {
        if (!confirm('Are you sure you want to remove this leave?')) return;
        try {
            await api.delete(`/leaves/${id}`);
            fetchData();
        } catch (err) {
            alert('Failed to delete leave');
        }
    };

    const handleUpdateConfig = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await api.post('/leaves/config', {
                week_start_date: selectedWeek,
                is_accepting: isAccepting,
                deadline: deadline || null
            });
            alert('Week configuration updated');
            fetchData();
        } catch (err) {
            alert('Failed to update configuration');
        }
    };

    const getMonday = (d: Date) => {
        const date = new Date(d);
        const day = date.getDay();
        const diff = date.getDate() - day + (day === 0 ? -6 : 1);
        return new Date(date.setDate(diff)).toISOString().split('T')[0];
    };

    // Generate upcoming Mondays for selection
    const upcomingMondays = [];
    let curr = new Date();
    curr = new Date(getMonday(curr));
    for (let i = 0; i < 8; i++) {
        upcomingMondays.push(curr.toISOString().split('T')[0]);
        curr.setDate(curr.getDate() + 7);
    }

    return (
        <div className="space-y-8 animate-slide-up">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-3xl font-extrabold text-white flex items-center gap-3">
                        <Calendar className="w-8 h-8 text-primary" />
                        Holiday Roaster
                    </h2>
                    <p className="text-muted-foreground mt-1 text-sm font-medium">
                        {isAdmin ? 'Manage employee leaves and week availability.' : 'Plan your upcoming leaves and view the roaster.'}
                    </p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left Column: Actions */}
                <div className="space-y-6">
                    {!isAdmin && (
                        <div className="glass border border-border/50 rounded-2xl p-6">
                            <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                                <Plus className="w-5 h-5 text-primary" />
                                Request Leave
                            </h3>
                            <form onSubmit={handleAddLeave} className="space-y-4">
                                <div>
                                    <label className="block text-xs font-bold text-muted-foreground uppercase tracking-widest mb-1.5 ml-1">Leave Date</label>
                                    <input
                                        type="date"
                                        required
                                        value={newLeaveDate}
                                        onChange={(e) => setNewLeaveDate(e.target.value)}
                                        className="w-full bg-input/50 border border-border/60 rounded-xl px-4 py-3 text-foreground focus:ring-2 focus:ring-primary/50 transition-all outline-none"
                                    />
                                </div>
                                {error && <p className="text-destructive text-xs font-bold bg-destructive/10 p-3 rounded-lg border border-destructive/20">{error}</p>}
                                <button
                                    disabled={loading}
                                    className="w-full bg-primary hover:bg-primary/90 text-white font-bold py-3 rounded-xl transition-all shadow-lg shadow-primary/25 disabled:opacity-50"
                                >
                                    {loading ? 'Submitting...' : 'Add to Roaster'}
                                </button>
                                <p className="text-[10px] text-muted-foreground italic text-center">
                                    * Leaves must be booked at least 3 days in advance unless the week is specifically opened by Admin.
                                </p>
                            </form>
                        </div>
                    )}

                    {isAdmin && (
                        <div className="glass border border-border/50 rounded-2xl p-6">
                            <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                                <ShieldCheck className="w-5 h-5 text-primary" />
                                Week Controls
                            </h3>
                            <form onSubmit={handleUpdateConfig} className="space-y-4">
                                <div>
                                    <label className="block text-xs font-bold text-muted-foreground uppercase tracking-widest mb-1.5 ml-1">Select Week (Starting Monday)</label>
                                    <select
                                        value={selectedWeek}
                                        onChange={(e) => {
                                            const val = e.target.value;
                                            setSelectedWeek(val);
                                            const existing = configs.find(c => c.week_start_date === val);
                                            setIsAccepting(existing ? existing.is_accepting === 1 : false);
                                            setDeadline(existing?.deadline ? existing.deadline.split('T')[0] : '');
                                        }}
                                        required
                                        className="w-full bg-input/50 border border-border/60 rounded-xl px-4 py-3 text-foreground focus:ring-2 focus:ring-primary/50 transition-all outline-none font-bold"
                                    >
                                        <option value="">Choose a week...</option>
                                        {upcomingMondays.map(m => (
                                            <option key={m} value={m}>Week of {m}</option>
                                        ))}
                                    </select>
                                </div>

                                <div className="flex items-center gap-3 p-3 bg-muted/30 rounded-xl border border-border/40">
                                    <input
                                        type="checkbox"
                                        id="isAccepting"
                                        checked={isAccepting}
                                        onChange={(e) => setIsAccepting(e.target.checked)}
                                        className="w-5 h-5 rounded border-border/60 bg-input/50 text-primary focus:ring-primary/50"
                                    />
                                    <label htmlFor="isAccepting" className="text-sm font-bold text-white cursor-pointer">
                                        Accept Leaves (Override 3-day rule)
                                    </label>
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-muted-foreground uppercase tracking-widest mb-1.5 ml-1">Submission Deadline (Optional)</label>
                                    <input
                                        type="datetime-local"
                                        value={deadline}
                                        onChange={(e) => setDeadline(e.target.value)}
                                        className="w-full bg-input/50 border border-border/60 rounded-xl px-4 py-3 text-foreground focus:ring-2 focus:ring-primary/50 transition-all outline-none"
                                    />
                                </div>

                                <button className="w-full bg-accent hover:bg-accent/90 text-white font-bold py-3 rounded-xl transition-all shadow-lg shadow-accent/25">
                                    Save Week Config
                                </button>
                            </form>
                        </div>
                    )}

                    <div className="glass border border-border/50 rounded-2xl p-6">
                        <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                            <Clock className="w-5 h-5 text-accent" />
                            Active Week Configs
                        </h3>
                        <div className="space-y-3">
                            {configs.filter(c => c.is_accepting || c.deadline).map(c => (
                                <div key={c.week_start_date} className="text-xs p-3 bg-muted/20 rounded-lg border border-border/40">
                                    <div className="font-bold text-white">Week: {c.week_start_date}</div>
                                    <div className="flex items-center gap-2 mt-1">
                                        {c.is_accepting ?
                                            <span className="text-green-500 flex items-center gap-1 font-bold"><ShieldCheck className="w-3 h-3" /> Open</span> :
                                            <span className="text-amber-500 flex items-center gap-1 font-bold"><ShieldAlert className="w-3 h-3" /> Default</span>
                                        }
                                        {c.deadline && <span className="text-muted-foreground">| Deadline: {new Date(c.deadline).toLocaleString()}</span>}
                                    </div>
                                </div>
                            ))}
                            {configs.length === 0 && <p className="text-xs text-muted-foreground italic text-center">No custom week rules set.</p>}
                        </div>
                    </div>
                </div>

                {/* Right Column: Roaster List */}
                <div className="lg:col-span-2">
                    <div className="glass border border-border/50 rounded-2xl overflow-hidden shadow-xl">
                        <div className="p-6 border-b border-border/50 bg-muted/10">
                            <h3 className="text-xl font-bold text-white">Upcoming Leaves</h3>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="bg-muted/20">
                                        {isAdmin && <th className="px-6 py-4 text-xs font-bold text-muted-foreground uppercase tracking-widest">Employee</th>}
                                        <th className="px-6 py-4 text-xs font-bold text-muted-foreground uppercase tracking-widest">Date</th>
                                        <th className="px-6 py-4 text-xs font-bold text-muted-foreground uppercase tracking-widest">Day</th>
                                        <th className="px-6 py-4 text-xs font-bold text-muted-foreground uppercase tracking-widest text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-border/50">
                                    {leaves.map((leave) => {
                                        const d = new Date(leave.leave_date);
                                        const isPast = d < new Date(new Date().setHours(0,0,0,0));
                                        return (
                                            <tr key={leave.id} className={`hover:bg-muted/10 transition-colors ${isPast ? 'opacity-50' : ''}`}>
                                                {isAdmin && <td className="px-6 py-4 font-bold text-white">{leave.user_name}</td>}
                                                <td className="px-6 py-4 text-foreground font-medium">{leave.leave_date}</td>
                                                <td className="px-6 py-4 text-muted-foreground font-bold">
                                                    {d.toLocaleDateString('en-US', { weekday: 'long' })}
                                                </td>
                                                <td className="px-6 py-4 text-right">
                                                    <button
                                                        onClick={() => handleDeleteLeave(leave.id)}
                                                        className="p-2 text-destructive hover:bg-destructive/10 rounded-lg transition-colors"
                                                        title="Delete Leave"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                    {leaves.length === 0 && (
                                        <tr>
                                            <td colSpan={isAdmin ? 4 : 3} className="px-6 py-12 text-center text-muted-foreground italic font-medium">
                                                No leaves found in the roaster.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
