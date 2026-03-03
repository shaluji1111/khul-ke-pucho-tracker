import { useState, useEffect } from 'react';
import { X, TrendingUp, CheckCircle2, PieChart as PieIcon, Filter } from 'lucide-react';
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import api from '../../api/client';

export default function EmployeeReportModal({ employee, onClose }: { employee: any, onClose: () => void }) {
    const [timeframe, setTimeframe] = useState<'7d' | '30d' | 'custom'>('7d');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [data, setData] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchReport();
    }, [timeframe, startDate, endDate]);

    const fetchReport = async () => {
        setLoading(true);
        try {
            const params: any = { timeframe };
            if (timeframe === 'custom' && startDate && endDate) {
                params.startDate = startDate;
                params.endDate = endDate;
            }
            const { data } = await api.get(`/tasks/report/${employee.id}`, { params });
            setData(data);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const COLORS = ['#FF6B9E', '#FF9F00', '#00C49F', '#0088FE'];

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

            <div className="relative w-full max-w-5xl max-h-[90vh] glass border border-white/10 rounded-[40px] shadow-2xl overflow-hidden flex flex-col animate-scale-in">
                {/* Modal Header */}
                <div className="p-8 border-b border-white/5 flex items-center justify-between bg-gradient-to-r from-primary/5 to-accent/5">
                    <div className="flex items-center gap-4">
                        <div className="w-14 h-14 bg-primary/20 rounded-2xl flex items-center justify-center text-primary font-black text-2xl shadow-inner">
                            {employee.name.charAt(0)}
                        </div>
                        <div>
                            <h2 className="text-2xl font-black text-foreground">{employee.name} {employee.full_name ? `- ${employee.full_name}` : ''}</h2>
                            <p className="text-muted-foreground font-bold text-xs uppercase tracking-widest">{employee.designation || 'Team Member'} • Performance Analysis</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-4">
                        <div className="flex bg-muted/30 p-1.5 rounded-2xl border border-border/50">
                            {(['7d', '30d', 'custom'] as const).map((t) => (
                                <button
                                    key={t}
                                    onClick={() => setTimeframe(t)}
                                    className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${timeframe === t
                                        ? 'bg-primary text-white shadow-lg shadow-primary/20 scale-105'
                                        : 'text-muted-foreground hover:text-foreground'
                                        }`}
                                >
                                    {t === '7d' ? '7 Days' : t === '30d' ? '30 Days' : 'Custom'}
                                </button>
                            ))}
                        </div>
                        <button onClick={onClose} className="p-3 hover:bg-destructive/10 text-destructive rounded-2xl transition-colors">
                            <X className="w-6 h-6" />
                        </button>
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto p-8 space-y-8 scrollbar-hide">
                    {timeframe === 'custom' && (
                        <div className="flex items-center gap-4 animate-fade-in p-4 bg-primary/5 rounded-2xl border border-primary/10">
                            <Filter className="w-5 h-5 text-primary" />
                            <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="bg-transparent border-none text-sm font-bold focus:ring-0" />
                            <span className="text-muted-foreground text-xs font-black">TO</span>
                            <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="bg-transparent border-none text-sm font-bold focus:ring-0" />
                        </div>
                    )}

                    {loading ? (
                        <div className="h-96 flex items-center justify-center">
                            <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary border-t-transparent"></div>
                        </div>
                    ) : data ? (
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                            {/* Points Trend */}
                            <div className="glass border border-white/5 rounded-3xl p-6 shadow-lg">
                                <h3 className="text-lg font-black mb-6 flex items-center gap-2">
                                    <TrendingUp className="w-5 h-5 text-primary" /> Daily Points Trend
                                </h3>
                                <div className="h-64">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <LineChart data={data.pointsTrend}>
                                            <CartesianGrid strokeDasharray="3 3" stroke="#2a2a2a" />
                                            <XAxis dataKey="date" stroke="#666" fontSize={10} tickFormatter={(str) => new Date(str).toLocaleDateString(undefined, { day: 'numeric', month: 'short' })} />
                                            <YAxis stroke="#666" fontSize={10} />
                                            <Tooltip contentStyle={{ backgroundColor: '#1a1a1a', border: '1px solid #333', borderRadius: '12px', fontSize: '10px' }} />
                                            <Line type="monotone" dataKey="points" stroke="#FF6B9E" strokeWidth={4} dot={{ r: 6, fill: '#FF6B9E', strokeWidth: 2, stroke: '#fff' }} activeDot={{ r: 8 }} />
                                        </LineChart>
                                    </ResponsiveContainer>
                                </div>
                            </div>

                            {/* Deadline Performance */}
                            <div className="glass border border-white/5 rounded-3xl p-6 shadow-lg">
                                <h3 className="text-lg font-black mb-6 flex items-center gap-2">
                                    <CheckCircle2 className="w-5 h-5 text-emerald-500" /> Deadline Accuracy
                                </h3>
                                <div className="h-64">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <BarChart data={[
                                            { name: 'On-Time', value: data.deadlineStats.on_time },
                                            { name: 'Late', value: data.deadlineStats.late },
                                            { name: 'Missed', value: data.deadlineStats.missed }
                                        ]}>
                                            <CartesianGrid strokeDasharray="3 3" stroke="#2a2a2a" />
                                            <XAxis dataKey="name" stroke="#666" fontSize={10} />
                                            <YAxis stroke="#666" fontSize={10} />
                                            <Tooltip contentStyle={{ backgroundColor: '#1a1a1a', border: '1px solid #333', borderRadius: '12px', fontSize: '10px' }} />
                                            <Bar dataKey="value" radius={[8, 8, 0, 0]}>
                                                {[0, 1, 2].map((_, index) => (
                                                    <Cell key={`cell-${index}`} fill={index === 0 ? '#00C49F' : index === 1 ? '#FF9F00' : '#FF4B4B'} />
                                                ))}
                                            </Bar>
                                        </BarChart>
                                    </ResponsiveContainer>
                                </div>
                            </div>

                            {/* Task Distribution */}
                            <div className="glass border border-white/5 rounded-3xl p-6 shadow-lg lg:col-span-2">
                                <h3 className="text-lg font-black mb-6 flex items-center gap-2">
                                    <PieIcon className="w-5 h-5 text-accent" /> Task Type Distribution
                                </h3>
                                <div className="h-64 flex flex-col md:flex-row items-center border-t border-white/5 pt-6">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <PieChart>
                                            <Pie
                                                data={data.typeDistribution.map((t: any) => ({ name: t.type.toUpperCase(), value: t.count }))}
                                                cx="50%" cy="50%"
                                                innerRadius={60}
                                                outerRadius={80}
                                                paddingAngle={5}
                                                dataKey="value"
                                            >
                                                {data.typeDistribution.map((_: any, index: number) => (
                                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                                ))}
                                            </Pie>
                                            <Tooltip contentStyle={{ backgroundColor: '#1a1a1a', border: '1px solid #333', borderRadius: '12px', fontSize: '10px' }} />
                                            <Legend verticalAlign="middle" align="right" layout="vertical" />
                                        </PieChart>
                                    </ResponsiveContainer>
                                    <div className="w-full md:w-1/2 p-6 flex items-center justify-around">
                                        <div className="text-center">
                                            <p className="text-3xl font-black text-primary">{data.pointsTrend.reduce((acc: any, curr: any) => acc + curr.points, 0)}</p>
                                            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Total Points</p>
                                        </div>
                                        <div className="text-center">
                                            <p className="text-3xl font-black text-emerald-400">{Math.round((data.deadlineStats.on_time / (data.deadlineStats.on_time + data.deadlineStats.late + data.deadlineStats.missed || 1)) * 100)}%</p>
                                            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Reliability Score</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <p className="text-center text-muted-foreground py-20">No data available for this timeframe.</p>
                    )}
                </div>
            </div>
        </div>
    );
}
