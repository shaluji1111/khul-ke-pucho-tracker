import { useState, useEffect } from 'react';
import { X, TrendingUp, PieChart, CheckCircle2, AlertCircle } from 'lucide-react';
import {
    LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    PieChart as RePieChart, Pie, Cell, BarChart, Bar, Legend
} from 'recharts';
import api from "../../api/client";

interface ReportData {
    trend: any[];
    types: any[];
    deadLines: {
        total: number;
        on_time: number;
        late: number;
        overdue_pending: number;
    };
}

export default function EmployeeReportModal({ employee, onClose }: { employee: any, onClose: () => void }) {
    const [data, setData] = useState<ReportData | null>(null);
    const [timeframe, setTimeframe] = useState<'7days' | '30days' | 'custom'>('30days');
    const [customStart, setCustomStart] = useState('');
    const [customEnd, setCustomEnd] = useState('');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchReport();
    }, [employee.id, timeframe, customStart, customEnd]);

    const fetchReport = async () => {
        if (timeframe === 'custom' && (!customStart || !customEnd)) return;
        setLoading(true);
        try {
            let params = new URLSearchParams();
            const today = new Date();
            let start = new Date();

            if (timeframe === '7days') {
                start.setDate(today.getDate() - 7);
                params.append('startDate', start.toISOString().split('T')[0]);
                params.append('endDate', today.toISOString().split('T')[0]);
            } else if (timeframe === '30days') {
                start.setDate(today.getDate() - 30);
                params.append('startDate', start.toISOString().split('T')[0]);
                params.append('endDate', today.toISOString().split('T')[0]);
            } else if (timeframe === 'custom') {
                params.append('startDate', customStart);
                params.append('endDate', customEnd);
            }

            const res = await api.get(`/tasks/employee-report/${employee.id}?${params.toString()}`);
            setData(res.data);
        } catch (err) {
            console.error('Failed to fetch report');
        } finally {
            setLoading(false);
        }
    };

    if (!employee) return null;

    const COLORS = ['#ec4899', '#3b82f6', '#f59e0b', '#ef4444'];

    const pieData = data ? [
        { name: 'On Time', value: data.deadLines.on_time },
        { name: 'Late', value: data.deadLines.late },
        { name: 'Overdue Pending', value: data.deadLines.overdue_pending }
    ].filter(v => v.value > 0) : [];

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm">
            <div className="glass border border-border/50 rounded-3xl w-full max-w-5xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl animate-scale-in">
                {/* Header */}
                <div className="p-6 border-b border-border/50 flex justify-between items-center bg-muted/10">
                    <div>
                        <h2 className="text-2xl font-black text-white">{employee.name} - Detailed Report</h2>
                        <p className="text-muted-foreground text-sm font-bold uppercase tracking-widest">Performance Analysis</p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-muted/50 rounded-xl transition-colors">
                        <X className="w-6 h-6 text-muted-foreground" />
                    </button>
                </div>

                {/* Controls */}
                <div className="p-4 bg-muted/5 border-b border-border/50 flex flex-wrap items-center gap-4">
                    <div className="flex bg-input/50 p-1 rounded-xl border border-border/40">
                        {(['7days', '30days', 'custom'] as const).map((t) => (
                            <button
                                key={t}
                                onClick={() => setTimeframe(t)}
                                className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${timeframe === t ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'text-muted-foreground hover:text-foreground'}`}
                            >
                                {t === '7days' ? '7 Days' : t === '30days' ? '30 Days' : 'Custom'}
                            </button>
                        ))}
                    </div>

                    {timeframe === 'custom' && (
                        <div className="flex items-center gap-2 animate-fade-in">
                            <input
                                type="date"
                                value={customStart}
                                onChange={e => setCustomStart(e.target.value)}
                                className="bg-input/20 border border-border/40 rounded-lg px-2 py-1 text-xs text-white"
                            />
                            <span className="text-muted-foreground text-xs">to</span>
                            <input
                                type="date"
                                value={customEnd}
                                onChange={e => setCustomEnd(e.target.value)}
                                className="bg-input/20 border border-border/40 rounded-lg px-2 py-1 text-xs text-white"
                            />
                        </div>
                    )}
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6 space-y-8 bg-gradient-to-b from-transparent to-muted/5">
                    {loading ? (
                        <div className="h-64 flex items-center justify-center">
                            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
                        </div>
                    ) : data ? (
                        <>
                            {/* Top Stats */}
                            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                <div className="glass p-4 rounded-2xl border border-border/40">
                                    <div className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-1">Total Tasks</div>
                                    <div className="text-2xl font-black text-white">{data.types.reduce((acc, t) => acc + t.count, 0)}</div>
                                </div>
                                <div className="glass p-4 rounded-2xl border border-border/40">
                                    <div className="text-[10px] font-black text-emerald-500 uppercase tracking-widest mb-1">Completed</div>
                                    <div className="text-2xl font-black text-emerald-500">{data.types.reduce((acc, t) => acc + t.completed, 0)}</div>
                                </div>
                                <div className="glass p-4 rounded-2xl border border-border/40">
                                    <div className="text-[10px] font-black text-amber-500 uppercase tracking-widest mb-1">On-Time</div>
                                    <div className="text-2xl font-black text-amber-500">{data.deadLines.on_time}</div>
                                </div>
                                <div className="glass p-4 rounded-2xl border border-border/40">
                                    <div className="text-[10px] font-black text-destructive uppercase tracking-widest mb-1">Overdue/Late</div>
                                    <div className="text-2xl font-black text-destructive">{data.deadLines.late + data.deadLines.overdue_pending}</div>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                                {/* Points Trend */}
                                <div className="glass p-6 rounded-2xl border border-border/40 h-80">
                                    <h3 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
                                        <TrendingUp className="w-4 h-4 text-primary" /> Daily Points Trend
                                    </h3>
                                    <ResponsiveContainer width="100%" height="100%">
                                        <LineChart data={data.trend}>
                                            <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                                            <XAxis dataKey="date" stroke="#94a3b8" fontSize={10} tickFormatter={(str) => str.split('-').slice(1).join('/')} />
                                            <YAxis stroke="#94a3b8" fontSize={10} />
                                            <Tooltip
                                                contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '12px', fontSize: '12px', fontWeight: 'bold' }}
                                                itemStyle={{ color: '#ec4899' }}
                                            />
                                            <Line type="monotone" dataKey="points" stroke="#ec4899" strokeWidth={3} dot={{ fill: '#ec4899' }} activeDot={{ r: 8 }} />
                                        </LineChart>
                                    </ResponsiveContainer>
                                </div>

                                {/* Deadline Distribution */}
                                <div className="glass p-6 rounded-2xl border border-border/40 h-80 flex flex-col">
                                    <h3 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
                                        <PieChart className="w-4 h-4 text-accent" /> Task Completion vs Deadlines
                                    </h3>
                                    <div className="flex-1 flex items-center">
                                        <ResponsiveContainer width="100%" height="100%">
                                            <RePieChart>
                                                <Pie
                                                    data={pieData}
                                                    cx="50%"
                                                    cy="50%"
                                                    innerRadius={60}
                                                    outerRadius={80}
                                                    paddingAngle={5}
                                                    dataKey="value"
                                                >
                                                    {pieData.map((_, index) => (
                                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                                    ))}
                                                </Pie>
                                                <Tooltip
                                                    contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '12px', fontSize: '12px' }}
                                                />
                                                <Legend wrapperStyle={{ fontSize: '10px', fontWeight: 'bold' }} />
                                            </RePieChart>
                                        </ResponsiveContainer>
                                    </div>
                                </div>

                                {/* Task Types */}
                                <div className="glass p-6 rounded-2xl border border-border/40 h-80 lg:col-span-2">
                                    <h3 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
                                        <CheckCircle2 className="w-4 h-4 text-emerald-500" /> Types of Tasks Completed
                                    </h3>
                                    <ResponsiveContainer width="100%" height="100%">
                                        <BarChart data={data.types}>
                                            <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                                            <XAxis dataKey="type" stroke="#94a3b8" fontSize={10} />
                                            <YAxis stroke="#94a3b8" fontSize={10} />
                                            <Tooltip
                                                contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '12px', fontSize: '12px' }}
                                            />
                                            <Bar dataKey="completed" name="Completed" fill="#10b981" radius={[4, 4, 0, 0]} />
                                            <Bar dataKey="count" name="Total Assigned" fill="#3b82f6" radius={[4, 4, 0, 0]} opacity={0.3} />
                                        </BarChart>
                                    </ResponsiveContainer>
                                </div>
                            </div>
                        </>
                    ) : (
                        <div className="h-64 flex flex-col items-center justify-center text-muted-foreground italic">
                            <AlertCircle className="w-12 h-12 mb-2 opacity-20" />
                            No data available for this timeframe.
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
