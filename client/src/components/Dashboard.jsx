import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
    PieChart, Pie, Cell, LineChart, Line
} from 'recharts';
import {
    BookOpen, Users, GraduationCap, Calendar, Clock,
    Activity, TrendingUp, Layers, School, ChevronLeft, ChevronRight
} from 'lucide-react';
import { format, subMonths, addMonths } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import API_BASE_URL from '../config/api';


export default function Dashboard() {
    console.log("Dashboard component rendering..."); // DEBUG
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Monthly stats state
    const [monthlyDate, setMonthlyDate] = useState(new Date());
    const [monthlyStats, setMonthlyStats] = useState(null);
    const [loadingMonthly, setLoadingMonthly] = useState(false);

    useEffect(() => {
        fetchStats();
    }, []);

    useEffect(() => {
        fetchMonthlyStats();
    }, [monthlyDate]);

    const fetchMonthlyStats = async () => {
        setLoadingMonthly(true);
        try {
            const month = monthlyDate.getMonth() + 1;
            const year = monthlyDate.getFullYear();
            const res = await axios.get(`${API_BASE_URL}/api/dashboard/monthly-stats?month=${month}&year=${year}`);
            setMonthlyStats(res.data);
        } catch (error) {
            console.error('Error fetching monthly stats:', error);
        } finally {
            setLoadingMonthly(false);
        }
    };

    const fetchStats = async () => {
        setLoading(true);
        setError(null);
        try {
            const res = await axios.get(`${API_BASE_URL}/api/dashboard/stats`);
            setStats(res.data);
        } catch (error) {
            console.error('Dashboard Stats Error:', error);
            setError(error.response?.data?.error || 'Falha ao carregar estatísticas');
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%', color: 'var(--text-primary)' }}>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px' }}>
                    <div className="animate-spin" style={{ width: '30px', height: '30px', border: '3px solid var(--text-tertiary)', borderTop: '3px solid var(--text-primary)', borderRadius: '50%' }}></div>
                    <span>Carregando estatísticas...</span>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div style={{ padding: '24px', maxWidth: '1600px', margin: '0 auto', color: 'var(--text-primary)', textAlign: 'center' }}>
                <h1 style={{ marginBottom: '24px' }}>Dashboard Acadêmico</h1>
                <div style={{ padding: '40px', background: 'var(--bg-primary)', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
                    <Activity size={48} color="var(--text-tertiary)" style={{ marginBottom: '20px' }} />
                    <h3 style={{ marginBottom: '10px' }}>Ops, algo deu errado</h3>
                    <p style={{ color: 'var(--text-secondary)' }}>{error}</p>
                    <button
                        onClick={() => window.location.reload()}
                        className="btn-primary"
                        style={{ marginTop: '20px' }}
                    >
                        Tentar novamente
                    </button>
                </div>
            </div>
        );
    }

    // Fallback if stats is null but no error (rare edge case)
    // if (!stats) return null; // MOVED TO BELOW TO RENDER SKELETON OR EMPTY STATE

    // Instead of null, render the empty structure or a specific 'init' state
    const safeStats = stats || {
        kpis: { courses: 0, classes: 0, ucs: 0, lessons: 0, users: 0 },
        charts: { byPeriod: [], byMonth: [], topCourses: [] },
        recentActivity: []
    };

    // Use safeStats for rendering if stats is null to avoid crash during transition or strict null checks
    const currentStats = stats || safeStats;


    const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];


    return (
        <div style={{ padding: '24px', maxWidth: '1600px', margin: '0 auto' }}>
            <h1 style={{ color: 'var(--text-primary)', marginBottom: '24px', fontSize: '1.8rem' }}>Dashboard Acadêmico</h1>

            {/* 1. KPIs - Row layout on desktop, 2 cols on mobile */}
            <div className="dashboard-kpis" style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
                gap: '20px',
                marginBottom: '24px'
            }}>
                <KPICard icon={<BookOpen />} title="Cursos" value={currentStats.kpis.courses} color="#2196F3" />
                <KPICard icon={<Layers />} title="Turmas" value={currentStats.kpis.classes} color="#4CAF50" />
                <KPICard icon={<School />} title="UCs" value={currentStats.kpis.ucs} color="#FF9800" />
                <KPICard icon={<Calendar />} title="Aulas" value={currentStats.kpis.lessons} color="#F44336" />
                <KPICard icon={<Users />} title="Usuários" value={currentStats.kpis.users} color="#9C27B0" />
            </div>

            {/* 1.5 Monthly Summary */}
            <div style={{ marginBottom: '32px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
                    <h2 style={{ fontSize: '1.4rem', fontWeight: 600, margin: 0 }}>Estatísticas do Mês</h2>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <button onClick={() => setMonthlyDate(subMonths(monthlyDate, 1))} className="btn-icon"><ChevronLeft size={20} /></button>
                        <span style={{ fontSize: '1rem', fontWeight: 600, textTransform: 'capitalize', minWidth: '150px', textAlign: 'center' }}>
                            {format(monthlyDate, 'MMMM yyyy', { locale: ptBR })}
                        </span>
                        <button onClick={() => setMonthlyDate(addMonths(monthlyDate, 1))} className="btn-icon"><ChevronRight size={20} /></button>
                    </div>
                </div>

                {loadingMonthly ? (
                    <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-tertiary)' }}>Carregando...</div>
                ) : monthlyStats ? (
                    <div className="monthly-stats-grid">
                        {/* Total Card */}
                        <div style={{ background: '#E3F2FD', padding: '25px', borderRadius: '16px', textAlign: 'center', border: '1px solid #BBDEFB' }}>
                            <div style={{ fontSize: '0.9rem', fontWeight: 600, color: '#1565C0', marginBottom: '10px' }}>TOTAL NO MÊS</div>
                            <div style={{ fontSize: '3rem', fontWeight: 800, color: '#0D47A1' }}>{monthlyStats.total || 0}</div>
                            <div style={{ fontSize: '0.9rem', color: '#1E88E5' }}>aulas atribuídas</div>
                        </div>

                        {/* By Period */}
                        <div style={{ background: 'var(--bg-primary)', padding: '25px', borderRadius: '16px', border: '1px solid var(--border-color)' }}>
                            <h3 style={{ margin: '0 0 20px 0', fontSize: '1.1rem' }}>Por Período</h3>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                                <PeriodRow label="Manhã" count={monthlyStats.byPeriod['Manhã']} icon="☀️" color="#FBC02D" />
                                <PeriodRow label="Tarde" count={monthlyStats.byPeriod['Tarde']} icon="🌤️" color="#FB8C00" />
                                <PeriodRow label="Noite" count={monthlyStats.byPeriod['Noite']} icon="🌙" color="#5E35B1" />
                            </div>
                        </div>

                        {/* Top Classes */}
                        <div style={{ background: 'var(--bg-primary)', padding: '25px', borderRadius: '16px', border: '1px solid var(--border-color)' }}>
                            <h3 style={{ margin: '0 0 20px 0', fontSize: '1.1rem' }}>Top 5 Turmas</h3>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                {Object.entries(monthlyStats.byClass || {})
                                    .sort(([, a], [, b]) => b - a)
                                    .slice(0, 5)
                                    .map(([key, value]) => (
                                        <div key={key} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--border-color)' }}>
                                            <span style={{ fontWeight: 500 }}>{key}</span>
                                            <span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{value}</span>
                                        </div>
                                    ))}
                                {Object.keys(monthlyStats.byClass || {}).length === 0 && <span style={{ color: '#999' }}>Nenhuma aula registra da.</span>}
                            </div>
                        </div>
                    </div>
                ) : null}
            </div>

            {/* 2. Charts Row 1 */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '24px', marginBottom: '24px' }}>

                {/* Aulas por Período */}
                <ChartCard title="Aulas por Período">
                    <ResponsiveContainer width="100%" height={300}>
                        <PieChart>
                            <Pie
                                data={currentStats.charts.byPeriod}
                                dataKey="count"
                                nameKey="period"
                                cx="50%"
                                cy="50%"
                                outerRadius={100}
                                fill="#8884d8"
                                label
                            >
                                {currentStats.charts.byPeriod.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                ))}
                            </Pie>
                            <Tooltip contentStyle={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)', color: 'var(--text-primary)' }} />
                            <Legend />
                        </PieChart>
                    </ResponsiveContainer>
                </ChartCard>

                {/* Aulas por Mês */}
                <ChartCard title="Evolução de Aulas (Meses)">
                    <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={currentStats.charts.byMonth}>
                            <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" />
                            <XAxis dataKey="month" stroke="var(--text-secondary)" />
                            <YAxis stroke="var(--text-secondary)" />
                            <Tooltip cursor={{ fill: 'rgba(255,255,255,0.05)' }} contentStyle={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)', color: 'var(--text-primary)' }} />
                            <Bar dataKey="count" name="Aulas" fill="#004587" radius={[4, 4, 0, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                </ChartCard>
            </div>

            {/* 3. Row 2 */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '24px', marginBottom: '24px' }}>
                {/* Top Cursos */}
                <ChartCard title="Cursos com Mais Aulas">
                    <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={currentStats.charts.topCourses} layout="vertical">
                            <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" />
                            <XAxis type="number" stroke="var(--text-secondary)" />
                            <YAxis dataKey="name" type="category" width={150} stroke="var(--text-secondary)" />
                            <Tooltip contentStyle={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)', color: 'var(--text-primary)' }} />
                            <Bar dataKey="count" name="Aulas" fill="#F57F17" radius={[0, 4, 4, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                </ChartCard>

                {/* Recent Activity */}
                <div style={{
                    backgroundColor: 'var(--bg-primary)',
                    borderRadius: '16px',
                    padding: '24px',
                    border: '1px solid var(--border-color)',
                    display: 'flex',
                    flexDirection: 'column'
                }}>
                    <h3 style={{ margin: '0 0 20px 0', color: 'var(--text-primary)', fontSize: '1.2rem', display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <Activity size={20} color="#F57F17" />
                        Atividade Recente
                    </h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                        {currentStats.recentActivity.map(lesson => (
                            <div key={lesson.id} style={{
                                display: 'flex',
                                gap: '15px',
                                alignItems: 'center',
                                borderBottom: '1px solid var(--border-color)',
                                paddingBottom: '10px'
                            }}>
                                <div style={{
                                    backgroundColor: 'var(--bg-secondary)',
                                    padding: '10px',
                                    borderRadius: '8px',
                                    color: 'var(--text-secondary)'
                                }}>
                                    <Clock size={16} />
                                </div>
                                <div>
                                    <div style={{ color: 'var(--text-primary)', fontWeight: 600 }}>
                                        {lesson.ucName} - {lesson.turma}
                                    </div>
                                    <div style={{ color: 'var(--text-tertiary)', fontSize: '0.85rem' }}>
                                        DATA: {new Date(lesson.date).toLocaleDateString('pt-BR')} • ID: {lesson.id}
                                    </div>
                                </div>
                            </div>
                        ))}
                        {currentStats.recentActivity.length === 0 && (
                            <div style={{ color: 'var(--text-tertiary)', textAlign: 'center', paddingTop: '20px' }}>
                                Nenhuma atividade recente.
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <style>{`
                @media (max-width: 768px) {
                    .dashboard-kpis {
                        grid-template-columns: repeat(2, 1fr) !important;
                        gap: 15px !important;
                    }
                }
                
                @media (min-width: 769px) {
                    .dashboard-kpis {
                        grid-template-columns: repeat(5, 1fr) !important;
                    }
                }
            `}</style>
        </div>
    );
}

function KPICard({ icon, title, value, color }) {
    return (
        <div style={{
            backgroundColor: 'var(--bg-primary)',
            borderRadius: '16px',
            padding: '24px',
            border: '1px solid var(--border-color)',
            display: 'flex',
            alignItems: 'center',
            gap: '20px'
        }}>
            <div style={{
                backgroundColor: `${color}20`,
                color: color,
                padding: '16px',
                borderRadius: '12px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
            }}>
                {React.cloneElement(icon, { size: 28 })}
            </div>
            <div>
                <div style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '5px' }}>
                    {title}
                </div>
                <div style={{ color: 'var(--text-primary)', fontSize: '1.8rem', fontWeight: 700 }}>
                    {value}
                </div>
            </div>
        </div>
    );
}

function ChartCard({ title, children }) {
    return (
        <div style={{
            backgroundColor: 'var(--bg-primary)',
            borderRadius: '16px',
            padding: '24px',
            border: '1px solid var(--border-color)'
        }}>
            <h3 style={{ margin: '0 0 20px 0', color: 'var(--text-primary)', fontSize: '1.2rem' }}>{title}</h3>
            {children}
        </div>
    );
}

function PeriodRow({ label, count, icon, color }) {
    return (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{ fontSize: '1.2rem' }}>{icon}</span>
                <span style={{ fontWeight: 500 }}>{label}</span>
            </div>
            <div style={{ fontWeight: 700, fontSize: '1.1rem', color: color }}>{count || 0}</div>
        </div>
    );
}
