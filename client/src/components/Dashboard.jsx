import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
    PieChart, Pie, Cell, LineChart, Line
} from 'recharts';
import {
    BookOpen, Users, GraduationCap, Calendar, Clock,
    Activity, TrendingUp, Layers, School
} from 'lucide-react';
import API_BASE_URL from '../config/api';


export default function Dashboard() {
    console.log("Dashboard component rendering..."); // DEBUG
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const token = localStorage.getItem('token');
                const res = await axios.get(`${API_BASE_URL}/api/dashboard/stats`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                setStats(res.data);
            } catch (error) {
                console.error("Error fetching dashboard stats", error);
                setError("Não foi possível carregar os dados do painel. Tente novamente mais tarde.");
            } finally {
                setLoading(false);
            }
        };

        fetchStats();
    }, []);

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
            {/* DEBUG: Visible indicator */}
            <div style={{ fontSize: '0.8rem', color: 'var(--text-tertiary)', marginBottom: '10px' }}>
                Rendered at: {new Date().toLocaleTimeString()}
            </div>


            {/* 1. KPIs */}
            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                gap: '20px',
                marginBottom: '32px'
            }}>
                <KPICard icon={<BookOpen />} title="Cursos" value={currentStats.kpis.courses} color="#2196F3" />
                <KPICard icon={<Layers />} title="Turmas" value={currentStats.kpis.classes} color="#4CAF50" />
                <KPICard icon={<School />} title="UCs" value={currentStats.kpis.ucs} color="#FF9800" />
                <KPICard icon={<Calendar />} title="Aulas" value={currentStats.kpis.lessons} color="#F44336" />
                <KPICard icon={<Users />} title="Usuários" value={currentStats.kpis.users} color="#9C27B0" />
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
