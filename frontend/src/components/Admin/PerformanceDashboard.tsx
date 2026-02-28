import { useState, useEffect } from 'react';
import { Target, Trophy, Flame } from 'lucide-react';
import api from '../../api/client';

export default function PerformanceDashboard() {
    const [metrics, setMetrics] = useState<any[]>([]);

    useEffect(() => {
        fetchMetrics();
    }, []);

    const fetchMetrics = async () => {
        try {
            const { data } = await api.get('/tasks/metrics');
            setMetrics(data);
        } catch (e) {
            console.error(e);
        }
    };

    return (
        <div className="space-y-8 animate-slide-up">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-extrabold text-white">Performance Overview</h2>
                    <p className="text-muted-foreground mt-1 text-sm font-medium">Track team productivity and bonus achievements.</p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {metrics.map(m => {
                    const dailyCompletion = m.daily_total > 0
                        ? Math.round((m.daily_completed / m.daily_total) * 100)
                        : 0;

                    return (
                        <div key={m.id} className="glass border border-border/50 rounded-2xl p-6 relative overflow-hidden group shadow-lg transition-transform hover:-translate-y-1">
                            <div className="flex justify-between items-start mb-6">
                                <div>
                                    <h3 className="font-bold text-xl text-foreground group-hover:text-primary transition-colors">{m.name}</h3>
                                    <span className="text-xs text-muted-foreground uppercase tracking-widest font-bold">Employee</span>
                                </div>
                                {m.extra_completed > 0 && (
                                    <div className="bg-amber-500/10 p-2 rounded-xl text-amber-500 border border-amber-500/20 shadow-[0_0_15px_rgba(245,158,11,0.2)] animate-pulse">
                                        <Trophy className="w-6 h-6" />
                                    </div>
                                )}
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
                                    <div className="flex justify-between items-center">
                                        <span className="text-sm font-bold text-muted-foreground flex items-center gap-1.5">
                                            <Flame className="w-4 h-4 text-accent" /> Bonus Contributions
                                        </span>
                                        <span className="font-black text-xl text-accent">{m.extra_completed}</span>
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
        </div>
    );
}
