import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/client';
import { EyeOff, Eye, User } from 'lucide-react';

export default function Login() {
    const [name, setName] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');
    const navigate = useNavigate();

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const { data } = await api.post('/auth/login', { name, password });
            localStorage.setItem('token', data.token);
            localStorage.setItem('user', JSON.stringify(data.user));

            if (data.user.role === 'admin') {
                navigate('/admin');
            } else {
                navigate('/employee');
            }
        } catch (err: any) {
            setError(err.response?.data?.error || 'Failed to login');
        }
    };

    return (
        <div className="no-banana flex min-h-screen bg-[#0a0f1c] items-center justify-center p-4 lg:p-8 font-sans overflow-hidden">

            {/* Main Floating Card */}
            <div className="flex flex-col-reverse lg:flex-row w-full max-w-[1100px] bg-white rounded-[2rem] lg:rounded-[2.5rem] shadow-[0_20px_60px_-15px_rgba(0,0,0,0.5)] overflow-hidden relative z-10 min-h-[700px]">

                {/* Left Column: Clean White Form */}
                <div className="w-full lg:w-1/2 flex flex-col p-8 lg:p-14 bg-white relative">

                    {/* Header Logo & Brand at the top left */}
                    <div className="absolute top-10 left-10 flex items-center gap-4 mb-12">
                        <img
                            src="/logo.jpg"
                            alt="Khul Ke Pucho Logo"
                            className="w-16 h-16 object-contain rounded-2xl shadow-md border border-slate-100"
                        />
                        <span className="font-extrabold text-2xl text-slate-800 tracking-tight">Khul Ke Pucho</span>
                    </div>

                    <div className="w-full max-w-[380px] mx-auto space-y-8 flex-1 flex flex-col justify-center mt-24">
                        <div className="space-y-2">
                            <h2 className="text-4xl font-semibold text-slate-900 tracking-tight">
                                Welcome Back!
                            </h2>
                            <p className="text-slate-500 text-sm font-medium">
                                We Are Happy To See You Again
                            </p>
                        </div>

                        <form onSubmit={handleLogin} className="space-y-5">
                            {error && <div className="text-red-500 bg-red-50 p-3 rounded-xl text-xs font-bold border border-red-200 text-center">{error}</div>}

                            <div className="space-y-4">
                                <div className="relative flex items-center group">
                                    <input
                                        type="text"
                                        placeholder="Enter your JS ID"
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                        className="w-full bg-slate-50 border border-slate-200 focus:border-[#ec4899] focus:bg-white rounded-2xl px-5 py-4 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-4 focus:ring-[#ec4899]/10 transition-all font-medium text-sm"
                                    />
                                    <User size={18} className="absolute right-5 text-slate-400 group-focus-within:text-[#ec4899] transition-colors" />
                                </div>

                                <div className="relative flex items-center group">
                                    <input
                                        type={showPassword ? 'text' : 'password'}
                                        placeholder="Enter your password"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        className="w-full bg-slate-50 border border-slate-200 focus:border-[#ec4899] focus:bg-white rounded-2xl px-5 py-4 pr-12 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-4 focus:ring-[#ec4899]/10 transition-all font-medium text-sm"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-5 text-slate-400 hover:text-slate-600 focus:outline-none transition-colors group-focus-within:text-[#ec4899]"
                                    >
                                        {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                    </button>
                                </div>
                            </div>

                            <div className="flex items-center text-xs font-medium py-1">
                                <label className="flex items-center gap-2 cursor-pointer text-slate-500 hover:text-slate-700 transition-colors">
                                    <div className="w-4 h-4 rounded-md border border-[#ec4899] flex items-center justify-center">
                                        <div className="w-2 h-2 rounded-sm bg-[#3b82f6]" />
                                    </div>
                                    Remember me
                                </label>
                            </div>

                            <button
                                type="submit"
                                className="w-full bg-gradient-to-r from-[#ec4899] to-[#3b82f6] hover:opacity-90 text-white font-bold py-4 px-6 rounded-2xl transition-all shadow-lg shadow-blue-500/20 mt-4 active:scale-[0.98]"
                            >
                                Login
                            </button>
                        </form>
                    </div>
                </div>

                {/* Right Column: Visual Brand Hero (Abstract Liquid Waves in Pink & Blue) */}
                <div className="hidden lg:flex w-1/2 relative bg-[#0b0c10] overflow-hidden">
                    {/* Dark gradient base mapping */}
                    <div className="absolute inset-0 bg-gradient-to-br from-[#0c0822] via-[#051126] to-[#120921]" />

                    {/* Pink/Blue Marble CSS Simulation using multiple stacked gradients/blurs */}
                    <div className="absolute inset-x-0 top-0 h-full w-[150%] -left-1/4 mix-blend-screen opacity-70">
                        {/* Dominant Deep Blue sweeps */}
                        <div className="absolute top-10 w-[80%] h-[120%] bg-gradient-to-tr from-[#1d4ed8] via-[#3b82f6] to-transparent rounded-[100%] blur-[80px] origin-top-left -rotate-12 transform scale-y-150" />
                        <div className="absolute -bottom-20 right-0 w-[60%] h-[100%] bg-gradient-to-tl from-[#2563eb] via-[#60a5fa] to-transparent rounded-[100%] blur-[60px] -rotate-45" />

                        {/* Pink Ribbons cutting through */}
                        <div className="absolute top-1/4 -right-10 w-[70%] h-[60%] bg-gradient-to-bl from-[#ec4899] via-[#db2777] to-transparent rounded-[100%] blur-[70px] rotate-45" />
                        <div className="absolute bottom-1/4 -left-20 w-[60%] h-[40%] bg-gradient-to-tr from-[#be185d] via-[#f472b6] to-transparent rounded-[100%] blur-[90px] -rotate-12" />

                        {/* High contrast wave lines (thin bright curves) */}
                        <div className="absolute top-1/3 left-0 w-full h-[30%] bg-gradient-to-r from-transparent via-[#93c5fd] to-transparent blur-[20px] rotate-12 opacity-50 transform skew-y-12 scale-y-50" />
                        <div className="absolute bottom-1/3 left-1/4 w-full h-[20%] bg-gradient-to-r from-transparent via-[#f9a8d4] to-transparent blur-[15px] -rotate-12 opacity-60 transform -skew-y-12 scale-y-50" />
                    </div>

                    {/* Overlay darkening for edge contrast */}
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_30%,rgba(0,0,0,0.6)_100%)] pointer-events-none" />

                    {/* Faux Glass Pill Footer */}
                    <div className="absolute bottom-8 left-1/2 -translate-x-1/2 w-[85%] max-w-sm rounded-[1.5rem] bg-white/5 backdrop-blur-xl border border-white/10 p-4 shadow-2xl z-20">
                        <p className="text-[9px] text-white/50 text-center leading-relaxed">
                            © 2026 Khul Ke Pucho. All rights reserved.<br />
                            Unauthorized use or reproduction of any content or materials from this interface is strictly prohibited. For more information, visit our Terms of Service and Privacy Policy.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
