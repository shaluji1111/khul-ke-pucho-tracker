import { useState, useEffect } from 'react';
import { Target, Trophy, Flame, RefreshCw, BarChart2 } from 'lucide-react';
import api from '../../api/client';
import EmployeeReportModal from './EmployeeReportModal';

export default function PerformanceDashboard() {
    const [metrics, setMetrics] = useState<any[]>([]);
    const [dateRange, setDateRange] = useState<'today' | '7days' | 'month' | 'all' | 'custom'>('today');
    const [customStartDate, setCustomStartDate] = useState('');
    const [customEndDate, setCustomEndDate] = useState('');
    const [selectedEmployee, setSelectedEmployee] = useState<any>(null);

    useEffect(() => {
        fetchMetrics();
        const interval = setInterval(() => {
            fetchMetrics();
        }, 5000);
        return () => clearInterval(interval);
    }, []);

    const fetchMetrics = async () => {
        try {
            let params = new URLSearchParams();

            if (dateRange !== 'all') {
                const today = new Date();
                let start = new Date();
                let end = new Date();

                if (dateRange === 'today') {
                    // start & end are already today
                } else if (dateRange === '7days') {
                    start.setDate(today.getDate() - 7);
                } else if (dateRange === 'month') {
                    start.setMonth(today.getMonth() - 1);
                } else if (dateRange === 'custom') {
                    if (!customStartDate || !customEndDate) return; // Wait for both
                    start = new Date(customStartDate);
                    end = new Date(customEndDate);
                }

                params.append('startDate', start.toISOString().split('T')[0]);
                params.append('endDate', end.toISOString().split('T')[0]);
            }

            const { data } = await api.get(`/tasks/metrics?${params.toString()}`);
            setMetrics(data);
        } catch (e) {
            console.error(e);
        }
    };

    // Refetch when range changes
    useEffect(() => {
        fetchMetrics();
    }, [dateRange, customStartDate, customEndDate]);

    return (
        <div className="space-y-8 animate-slide-up">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-3xl font-extrabold text-white flex items-center gap-3">
                        Performance Overview
                        <button onClick={fetchMetrics} className="p-2 bg-primary/20 text-primary hover:bg-primary/30 rounded-xl transition-colors" title="Refresh Metrics">
                            <RefreshCw className="w-5 h-5" />
                        </button>
                    </h2>
                    <p className="text-muted-foreground mt-1 text-sm font-medium">Track team productivity and bonus achievements.</p>
                </div>

                <div className="flex flex-wrap items-center gap-3 bg-muted/20 p-2 rounded-xl border border-border/50">
                    <select
                        value={dateRange}
                        onChange={(e) => setDateRange(e.target.value as any)}
                        className="bg-input/50 border border-border/60 rounded-lg px-3 py-2 text-foreground focus:ring-2 focus:ring-primary/50 text-sm font-bold"
                    >
                        <option value="today">Today</option>
                        <option value="7days">Last 7 Days</option>
                        <option value="month">Last 30 Days</option>
                        <option value="all">All Time</option>
                        <option value="custom">Custom Range</option>
                    </select>

                    {dateRange === 'custom' && (
                        <div className="flex items-center gap-2 animate-fade-in">
                            <input
                                type="date"
                                value={customStartDate}
                                onChange={e => setCustomStartDate(e.target.value)}
                                className="bg-input/50 border border-border/60 rounded-lg px-2 py-1.5 text-foreground text-sm"
                            />
                            <span className="text-muted-foreground text-sm font-bold">to</span>
                            <input
                                type="date"
                                value={customEndDate}
                                onChange={e => setCustomEndDate(e.target.value)}
                                className="bg-input/50 border border-border/60 rounded-lg px-2 py-1.5 text-foreground text-sm"
                            />
                        </div>
                    )}
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {metrics.map(m => {
                    const dailyCompletion = m.daily_total > 0
                        ? Math.round((m.daily_completed / m.daily_total) * 100)
                        : 0;

                    return (
                        <div
                            key={m.id}
                            onClick={() => setSelectedEmployee(m)}
                            className="glass border border-border/50 rounded-2xl p-6 relative overflow-hidden group shadow-lg transition-transform hover:-translate-y-1 cursor-pointer hover:border-primary/50"
                        >
                            <div className="flex justify-between items-start mb-6">
                                <div>
                                    <h3 className="font-bold text-xl text-foreground group-hover:text-primary transition-colors">{m.name}</h3>
                                    <span className="text-xs text-muted-foreground uppercase tracking-widest font-bold">Employee</span>
                                </div>
                                <div className="text-right">
                                    <div className="bg-primary/10 px-3 py-1.5 rounded-xl text-primary border border-primary/20 shadow-[0_0_15px_rgba(255,107,158,0.2)]">
                                        <span className="text-2xl font-black">{m.total_points || 0}</span>
                                        <span className="text-[10px] ml-1 uppercase font-bold tracking-wider">Pts</span>
                                    </div>
                                    {m.extra_completed > 0 && (
                                        <div className="text-amber-500 flex items-center justify-end gap-1 mt-1 text-xs font-bold animate-pulse">
                                            <Trophy className="w-3 h-3" /> MVP
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="space-y-6">
                                {/* Baseline Progress */}
                                <div>
                                    <div className="flex justify-between items-center mb-2">
                                        <span className="text-sm font-bold text-muted-foreground flex items-center gap-1.5">
                                            <Target className="w-4 h-4 text-primary" /> Baseline Progress
                                        </span>
                                        <span className="font-bold text-sm text-foreground">{dailyCompletion}%</span>
                                    </div>
                                    <div className="h-2.5 w-full bg-input/50 rounded-full overflow-hidden">
                                        <div
                                            className="h-full bg-gradient-to-r from-primary/50 to-primary rounded-full transition-all duration-1000 ease-out"
                                            style={{ width: `${dailyCompletion}%` }}
                                        />
                                    </div>
                                    <div className="text-xs text-muted-foreground mt-2 font-medium">
                                        {m.daily_completed} of {m.daily_total || 0} tasks completed
                                    </div>
                                </div>

                                {/* Extra Work Metrics */}
                                <div className="pt-4 border-t border-border/50">
                                    <div className="flex justify-between items-center mb-3">
                                        <span className="text-sm font-bold text-muted-foreground flex items-center gap-1.5">
                                            <Flame className="w-4 h-4 text-accent" /> Bonus Contributions
                                        </span>
                                        <span className="font-black text-xl text-accent">{m.extra_completed || 0}</span>
                                    </div>

                                    <div className="grid grid-cols-2 gap-2 mt-4">
                                        <div className="bg-primary/10 rounded-xl p-3 border border-primary/20 text-center flex flex-col items-center justify-center gap-1 group-hover:bg-primary/20 transition-colors">
                                            <BarChart2 className="w-4 h-4 text-primary" />
                                            <div className="text-[10px] font-bold text-primary uppercase tracking-wider">View Report</div>
                                        </div>
                                        <div className="bg-muted/30 rounded-xl p-3 border border-border/40 text-center">
                                            <div className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1">Overdue</div>
                                            <div className={`font-black ${m.overdue_count > 0 ? 'text-destructive' : 'text-foreground'}`}>{m.overdue_count || 0}</div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )
                })}

                {metrics.length === 0 && (
                    <div className="col-span-full text-center p-16 glass rounded-2xl border border-dashed border-border">
                        <h3 className="text-lg font-bold text-foreground">No data available</h3>
                        <p className="text-muted-foreground mt-2">Assign and complete tasks to see performance metrics here.</p>
                    </div>
                )}
            </div>

            {selectedEmployee && (
                <EmployeeReportModal
                    employee={selectedEmployee}
                    onClose={() => setSelectedEmployee(null)}
                />
            )}
        </div>
    );
}
