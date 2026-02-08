import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { format, subMonths, addMonths } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { ChevronLeft, ChevronRight, Calendar, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import API_BASE_URL from '../config/api';

export default function MonthlyTotals() {
    const navigate = useNavigate();
    const [currentDate, setCurrentDate] = useState(new Date());
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchStats();
    }, [currentDate]);

    const fetchStats = async () => {
        setLoading(true);
        try {
            const month = currentDate.getMonth() + 1; // 1-12
            const year = currentDate.getFullYear();
            const res = await axios.get(`${API_BASE_URL}/api/dashboard/monthly-stats?month=${month}&year=${year}`);
            setStats(res.data);
        } catch (error) {
            console.error('Error fetching monthly stats:', error);
        } finally {
            setLoading(false);
        }
    };

    const nextMonth = () => setCurrentDate(addMonths(currentDate, 1));
    const prevMonth = () => setCurrentDate(subMonths(currentDate, 1));

    return (
        <div className="fade-in">
            <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '30px' }}>
                <button onClick={() => navigate('/')} className="btn-outline" style={{ padding: '8px' }}>
                    <ArrowLeft size={20} />
                </button>
                <h1 style={{ fontSize: '1.8rem', fontWeight: 700, margin: 0 }}>Total de Aulas</h1>
            </div>

            {/* Date Navigator */}
            <div style={{
                background: 'var(--bg-primary)',
                padding: '20px',
                borderRadius: '12px',
                border: '1px solid var(--border-color)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: '30px',
                maxWidth: '500px',
                margin: '0 auto 30px auto',
                boxShadow: 'var(--card-shadow)'
            }}>
                <button className="btn-icon" onClick={prevMonth}><ChevronLeft /></button>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <Calendar size={24} color="var(--text-secondary)" />
                    <span style={{ fontSize: '1.2rem', fontWeight: 600, textTransform: 'capitalize' }}>
                        {format(currentDate, 'MMMM yyyy', { locale: ptBR })}
                    </span>
                </div>
                <button className="btn-icon" onClick={nextMonth}><ChevronRight /></button>
            </div>

            {loading ? (
                <div style={{ textAlign: 'center', padding: '50px' }}>Carregando estatísticas...</div>
            ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px' }}>

                    {/* Total Card */}
                    <div style={{ background: '#E3F2FD', padding: '25px', borderRadius: '16px', textAlign: 'center', border: '1px solid #BBDEFB' }}>
                        <div style={{ fontSize: '0.9rem', fontWeight: 600, color: '#1565C0', marginBottom: '10px' }}>TOTAL NO MÊS</div>
                        <div style={{ fontSize: '3rem', fontWeight: 800, color: '#0D47A1' }}>{stats?.total || 0}</div>
                        <div style={{ fontSize: '0.9rem', color: '#1E88E5' }}>aulas atribuídas</div>
                    </div>

                    {/* Periods Breakdown */}
                    <div style={{ background: 'var(--bg-primary)', padding: '25px', borderRadius: '16px', border: '1px solid var(--border-color)', boxShadow: 'var(--card-shadow)' }}>
                        <h3 style={{ margin: '0 0 20px 0', fontSize: '1.1rem', color: 'var(--text-secondary)' }}>Por Período</h3>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                            <PeriodRow label="Manhã" count={stats?.byPeriod['Manhã']} icon="☀️" color="#FBC02D" />
                            <PeriodRow label="Tarde" count={stats?.byPeriod['Tarde']} icon="🌤️" color="#FB8C00" />
                            <PeriodRow label="Noite" count={stats?.byPeriod['Noite']} icon="🌙" color="#5E35B1" />
                        </div>
                    </div>

                    {/* Classes Breakdown */}
                    <div style={{ background: 'var(--bg-primary)', padding: '25px', borderRadius: '16px', border: '1px solid var(--border-color)', boxShadow: 'var(--card-shadow)' }}>
                        <h3 style={{ margin: '0 0 20px 0', fontSize: '1.1rem', color: 'var(--text-secondary)' }}>Por Turma (Top 5)</h3>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                            {Object.entries(stats?.byClass || {})
                                .sort(([, a], [, b]) => b - a)
                                .slice(0, 5)
                                .map(([key, value]) => (
                                    <div key={key} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--border-color)' }}>
                                        <span style={{ fontWeight: 500 }}>{key}</span>
                                        <span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{value}</span>
                                    </div>
                                ))}
                            {Object.keys(stats?.byClass || {}).length === 0 && <span style={{ color: '#999' }}>Nenhuma aula registrada.</span>}
                        </div>
                    </div>

                </div>
            )}
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
