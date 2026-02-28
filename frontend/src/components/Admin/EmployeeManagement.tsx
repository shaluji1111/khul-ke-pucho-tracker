import React, { useState, useEffect } from 'react';
import { UserPlus, Trash2, Shield, User } from 'lucide-react';
import api from '../../api/client';

export default function EmployeeManagement() {
    const [users, setUsers] = useState<any[]>([]);
    const [name, setName] = useState('');
    const [password, setPassword] = useState('');
    const [role, setRole] = useState('employee');
    const [designation, setDesignation] = useState('');
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        fetchUsers();
    }, []);

    const fetchUsers = async () => {
        try {
            const { data } = await api.get('/users');
            setUsers(data);
        } catch (e) {
            console.error(e);
        }
    };

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            await api.post('/users', { name, role, password, designation });
            setName('');
            setPassword('');
            setDesignation('');
            fetchUsers();
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!window.confirm('Are you sure?')) return;
        try {
            await api.delete(`/users/${id}`);
            fetchUsers();
        } catch (e) {
            console.error(e);
        }
    };

    return (
        <div className="space-y-8 animate-slide-up">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-extrabold text-white">Team Members</h2>
                    <p className="text-muted-foreground mt-1 text-sm font-medium">Manage your workforce access and roles.</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Create Form */}
                <div className="lg:col-span-1 glass border border-border/50 rounded-2xl p-6 h-fit shadow-lg relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-bl-full pointer-events-none" />
                    <h3 className="text-xl font-bold flex items-center gap-2 mb-6">
                        <UserPlus className="w-5 h-5 text-primary" /> Add New User
                    </h3>
                    <form onSubmit={handleCreate} className="space-y-5 relative z-10">
                        <div>
                            <label className="block text-sm font-bold text-muted-foreground mb-2">JS ID</label>
                            <input
                                required
                                className="w-full bg-input/50 border border-border/60 rounded-xl px-4 py-3 text-foreground focus:ring-2 focus:ring-primary/50 transition-all font-medium"
                                value={name}
                                onChange={e => setName(e.target.value)}
                                placeholder="e.g. JS1234"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-muted-foreground mb-2">Password</label>
                            <input
                                required
                                type="password"
                                className="w-full bg-input/50 border border-border/60 rounded-xl px-4 py-3 text-foreground focus:ring-2 focus:ring-primary/50 transition-all font-medium"
                                value={password}
                                onChange={e => setPassword(e.target.value)}
                                placeholder="••••••••"
                            />
                        </div>
                        {role === 'employee' && (
                            <div>
                                <label className="block text-sm font-bold text-muted-foreground mb-2">Designation</label>
                                <input
                                    className="w-full bg-input/50 border border-border/60 rounded-xl px-4 py-3 text-foreground focus:ring-2 focus:ring-primary/50 transition-all font-medium"
                                    value={designation}
                                    onChange={e => setDesignation(e.target.value)}
                                    placeholder="e.g. Senior Developer"
                                />
                            </div>
                        )}
                        <div>
                            <label className="block text-sm font-bold text-muted-foreground mb-2">Role</label>
                            <select
                                className="w-full bg-input/50 border border-border/60 rounded-xl px-4 py-3 text-foreground focus:ring-2 focus:ring-primary/50 transition-all font-medium appearance-none"
                                value={role}
                                onChange={e => setRole(e.target.value)}
                            >
                                <option value="employee">Employee</option>
                                <option value="admin">Administrator</option>
                            </select>
                        </div>
                        <button
                            disabled={loading}
                            className="w-full mt-2 bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90 text-primary-foreground font-bold py-3.5 rounded-xl shadow-lg transition-transform active:scale-[0.98] disabled:opacity-50"
                        >
                            {loading ? 'Creating...' : 'Create Account'}
                        </button>
                    </form>
                </div>

                {/* User List */}
                <div className="lg:col-span-2 space-y-4">
                    {users.map(u => (
                        <div key={u.id} className="glass border border-border/50 rounded-2xl p-5 flex items-center justify-between hover:border-primary/50 transition-colors group shadow-md">
                            <div className="flex items-center gap-5">
                                <div className={`w-12 h-12 rounded-full flex items-center justify-center ${u.role === 'admin' ? 'bg-accent/20 text-accent' : 'bg-primary/20 text-primary'}`}>
                                    {u.role === 'admin' ? <Shield className="w-6 h-6" /> : <User className="w-6 h-6" />}
                                </div>
                                <div>
                                    <h4 className="font-bold text-lg">{u.name}</h4>
                                    <div className="flex gap-2 mt-1">
                                        <span className={`text-xs font-bold uppercase tracking-wider px-2.5 py-1 rounded-md inline-block ${u.role === 'admin' ? 'bg-destructive/20 text-destructive-foreground' : 'bg-muted text-muted-foreground'}`}>
                                            {u.role}
                                        </span>
                                        {u.designation && (
                                            <span className="text-xs font-bold uppercase tracking-wider px-2.5 py-1 rounded-md inline-block bg-primary/10 text-primary">
                                                {u.designation}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </div>
                            <button
                                onClick={() => handleDelete(u.id)}
                                className="p-3 text-muted-foreground hover:bg-destructive/10 hover:text-destructive rounded-xl transition-colors opacity-0 group-hover:opacity-100"
                                title="Remove User"
                            >
                                <Trash2 className="w-5 h-5" />
                            </button>
                        </div>
                    ))}
                    {users.length === 0 && (
                        <div className="text-center p-12 glass rounded-2xl border border-dashed border-border text-muted-foreground">
                            No users found.
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
