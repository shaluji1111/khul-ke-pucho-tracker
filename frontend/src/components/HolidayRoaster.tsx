import { useState, useEffect } from 'react';
import { Calendar, Clock, CheckCircle, XCircle, Plus, Lock, Unlock } from 'lucide-react';
import api from '../api/client';

export default function HolidayRoaster({ isAdmin = false }: { isAdmin?: boolean }) {
    const [leaves, setLeaves] = useState<any[]>([]);
    const [weekConfigs, setWeekConfigs] = useState<any[]>([]);
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [reason, setReason] = useState('');
    const [loading, setLoading] = useState(false);
    const [togglingWeek, setTogglingWeek] = useState<string | null>(null);
    const [error, setError] = useState('');

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const [leavesRes, configsRes] = await Promise.all([
                api.get('/leaves'),
                api.get('/leaves/week-configs')
            ]);
            setLeaves(leavesRes.data);
            setWeekConfigs(configsRes.data);
        } catch (e) {
            console.error(e);
        }
    };

    const handleSubmitLeave = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            await api.post('/leaves', { start_date: startDate, end_date: endDate, reason });
            setStartDate('');
            setEndDate('');
            setReason('');
            fetchData();
        } catch (err: any) {
            setError(err.response?.data?.error || 'Failed to submit leave');
        } finally {
            setLoading(false);
        }
    };

    const handleStatusUpdate = async (id: string, status: 'approved' | 'rejected') => {
        try {
            await api.patch(`/leaves/${id}/status`, { status });
            fetchData();
        } catch (e) {
            console.error(e);
        }
    };

    const toggleWeek = async (weekStart: string, currentlyOpen: boolean) => {
        setTogglingWeek(weekStart);
        try {
            await api.post('/leaves/week-configs', { week_start_date: weekStart, is_open: !currentlyOpen });
            await fetchData();
        } catch (e) {
            console.error(e);
            setError('Failed to update week status');
        } finally {
            setTogglingWeek(null);
        }
    };

    return (
        <div className="space-y-8 animate-fade-in">
            <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-3xl font-black text-foreground">Holiday Roaster</h2>
                    <p className="text-muted-foreground font-medium">Schedule and manage team availability</p>
                </div>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* Left Side: Forms & Management */}
                <div className="lg:col-span-4 space-y-6">
                    {!isAdmin && (
                        <div className="glass border border-border/50 rounded-3xl p-6 shadow-xl">
                            <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                                <Plus className="w-5 h-5 text-primary" /> Request Leave
                            </h3>
                            <form onSubmit={handleSubmitLeave} className="space-y-4">
                                <div>
                                    <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1 ml-1">Start Date</label>
                                    <input
                                        type="date"
                                        required
                                        className="w-full bg-input/50 border border-border/60 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-primary/50 outline-none"
                                        value={startDate}
                                        onChange={e => setStartDate(e.target.value)}
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1 ml-1">End Date</label>
                                    <input
                                        type="date"
                                        required
                                        className="w-full bg-input/50 border border-border/60 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-primary/50 outline-none"
                                        value={endDate}
                                        onChange={e => setEndDate(e.target.value)}
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1 ml-1">Reason</label>
                                    <textarea
                                        className="w-full bg-input/50 border border-border/60 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-primary/50 outline-none min-h-[80px]"
                                        placeholder="Optional reason..."
                                        value={reason}
                                        onChange={e => setReason(e.target.value)}
                                    />
                                </div>
                                {error && <p className="text-destructive text-xs font-bold px-1">{error}</p>}
                                <button
                                    disabled={loading}
                                    className="w-full bg-primary text-white py-3 rounded-xl font-black shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50"
                                >
                                    {loading ? 'Submitting...' : 'Submit Request'}
                                </button>
                                <p className="text-[10px] text-muted-foreground text-center font-bold uppercase tracking-tighter">
                                    Note: 3-day lead time required unless overridden by Admin
                                </p>
                            </form>
                        </div>
                    )}

                    {isAdmin && (
                        <div className="glass border border-border/50 rounded-3xl p-6 shadow-xl">
                            <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                                <Clock className="w-5 h-5 text-accent" /> Week Management
                            </h3>
                            <div className="space-y-3">
                                {[0, 1, 2, 3].map(offset => {
                                    const d = new Date();
                                    const day = d.getDay();
                                    const diff = d.getDate() - day + (day === 0 ? -6 : 1) + (offset * 7);
                                    const monday = new Date();
                                    monday.setDate(diff);

                                    const mondayStr = `${monday.getFullYear()}-${String(monday.getMonth() + 1).padStart(2, '0')}-${String(monday.getDate()).padStart(2, '0')}`;
                                    const config = weekConfigs.find(c => c.week_start_date === mondayStr);
                                    const isOpen = config?.is_open == 1 || config?.is_open === true;
                                    const isToggling = togglingWeek === mondayStr;

                                    return (
                                        <div key={mondayStr} className="flex items-center justify-between p-3 bg-muted/30 rounded-2xl border border-border/40">
                                            <div>
                                                <p className="text-sm font-black">{offset === 0 ? 'This Week' : offset === 1 ? 'Next Week' : `Week of ${monday.toLocaleDateString()}`}</p>
                                                <p className="text-[10px] text-muted-foreground font-bold uppercase">{mondayStr}</p>
                                                {offset === 1 && <p className="text-[9px] text-amber-500 font-bold uppercase mt-0.5">Locks this Friday</p>}
                                            </div>
                                            <button
                                                disabled={isToggling}
                                                onClick={() => toggleWeek(mondayStr, isOpen)}
                                                className={`p-2 rounded-xl transition-all ${isToggling ? 'opacity-50 animate-pulse' : ''} ${isOpen ? 'bg-emerald-500/10 text-emerald-500' : 'bg-muted/50 text-muted-foreground hover:text-amber-500 hover:bg-amber-500/10'}`}
                                                title={isOpen ? 'Unlocked (Admin Override)' : 'Locked (Standard Rules)'}
                                            >
                                                {isOpen ? <Unlock className="w-5 h-5" /> : <Lock className="w-5 h-5" />}
                                            </button>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}
                </div>

                {/* Right Side: List of Leaves */}
                <div className="lg:col-span-8 space-y-4">
                    <div className="flex items-center justify-between px-2">
                        <h3 className="text-xl font-bold">Planned Absences</h3>
                        <span className="text-xs font-bold text-muted-foreground uppercase">{leaves.length} Total</span>
                    </div>

                    <div className="space-y-3">
                        {leaves.map(l => (
                            <div key={l.id} className="glass border border-border/50 rounded-2xl p-5 flex items-center justify-between hover:border-primary/30 transition-colors">
                                <div className="flex items-center gap-4">
                                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center font-black ${l.status === 'approved' ? 'bg-emerald-500/10 text-emerald-500' :
                                        l.status === 'rejected' ? 'bg-destructive/10 text-destructive' :
                                            'bg-primary/10 text-primary'
                                        }`}>
                                        <Calendar className="w-6 h-6" />
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <p className="font-black text-foreground">{new Date(l.start_date).toLocaleDateString()} - {new Date(l.end_date).toLocaleDateString()}</p>
                                            {isAdmin && <span className="text-xs font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-full">{l.user_name}</span>}
                                        </div>
                                        <p className="text-sm text-muted-foreground italic">"{l.reason || 'No reason provided'}"</p>
                                    </div>
                                </div>

                                <div className="flex items-center gap-2">
                                    {isAdmin && l.status === 'pending' ? (
                                        <>
                                            <button onClick={() => handleStatusUpdate(l.id, 'approved')} className="p-2 bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20 rounded-xl transition-colors">
                                                <CheckCircle className="w-5 h-5" />
                                            </button>
                                            <button onClick={() => handleStatusUpdate(l.id, 'rejected')} className="p-2 bg-destructive/10 text-destructive hover:bg-destructive/20 rounded-xl transition-colors">
                                                <XCircle className="w-5 h-5" />
                                            </button>
                                        </>
                                    ) : (
                                        <span className={`text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-lg ${l.status === 'approved' ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20' :
                                            l.status === 'rejected' ? 'bg-destructive/10 text-destructive border border-destructive/20' :
                                                'bg-primary/10 text-primary border border-primary/20'
                                            }`}>
                                            {l.status}
                                        </span>
                                    )}
                                </div>
                            </div>
                        ))}

                        {leaves.length === 0 && (
                            <div className="glass border border-dashed border-border rounded-2xl p-12 text-center flex flex-col items-center">
                                <Calendar className="w-12 h-12 text-muted-foreground/30 mb-4" />
                                <p className="text-muted-foreground font-medium">No leaves scheduled yet.</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
