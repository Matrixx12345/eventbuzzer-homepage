import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import Navbar from '@/components/Navbar';
import { Shield, AlertTriangle, Activity, TrendingUp, Calendar, Lock } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { Navigate } from 'react-router-dom';

interface HoneypotLog {
  id: string;
  user_agent: string;
  ip_address: string | null;
  referrer: string | null;
  honeypot_path: string;
  bot_type: string;
  visited_at: string;
  request_method: string | null;
}

interface Stats {
  total: number;
  today: number;
  week: number;
  bad_bots: number;
}

// Admin emails allowed to access honeypot dashboard
const ADMIN_EMAILS = ["eventbuzzer1@gmail.com", "j.straton111@gmail.com"];

const AdminHoneypot = () => {
  const { user } = useAuth();
  const isAdmin = user && ADMIN_EMAILS.includes(user.email || "");

  const [logs, setLogs] = useState<HoneypotLog[]>([]);
  const [stats, setStats] = useState<Stats>({ total: 0, today: 0, week: 0, bad_bots: 0 });
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'bad' | 'good'>('all');

  // Redirect if not admin
  if (!isAdmin) {
    return <Navigate to="/auth" replace />;
  }

  // Fetch logs
  const fetchLogs = async () => {
    try {
      setLoading(true);

      let query = supabase
        .from('honeypot_logs')
        .select('*')
        .order('visited_at', { ascending: false })
        .limit(100);

      if (filter === 'bad') {
        query = query.eq('bot_type', 'bad');
      } else if (filter === 'good') {
        query = query.eq('bot_type', 'good');
      }

      const { data, error } = await query;

      if (error) throw error;

      setLogs(data || []);
    } catch (err) {
      console.error('Error fetching logs:', err);
      toast.error('Fehler beim Laden der Logs');
    } finally {
      setLoading(false);
    }
  };

  // Fetch stats
  const fetchStats = async () => {
    try {
      // Total count
      const { count: total } = await supabase
        .from('honeypot_logs')
        .select('*', { count: 'exact', head: true });

      // Today
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const { count: todayCount } = await supabase
        .from('honeypot_logs')
        .select('*', { count: 'exact', head: true })
        .gte('visited_at', today.toISOString());

      // This week
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      const { count: weekCount } = await supabase
        .from('honeypot_logs')
        .select('*', { count: 'exact', head: true })
        .gte('visited_at', weekAgo.toISOString());

      // Bad bots
      const { count: badBots } = await supabase
        .from('honeypot_logs')
        .select('*', { count: 'exact', head: true })
        .eq('bot_type', 'bad');

      setStats({
        total: total || 0,
        today: todayCount || 0,
        week: weekCount || 0,
        bad_bots: badBots || 0,
      });
    } catch (err) {
      console.error('Error fetching stats:', err);
    }
  };

  useEffect(() => {
    fetchLogs();
    fetchStats();
  }, [filter]);

  // Format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('de-CH', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    }).format(date);
  };

  // Truncate user agent
  const truncateUA = (ua: string, maxLength: number = 50) => {
    if (ua.length <= maxLength) return ua;
    return ua.substring(0, maxLength) + '...';
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <Shield className="text-red-600" size={32} />
            <h1 className="text-3xl font-bold text-gray-900">Honeypot Dashboard 🍯</h1>
          </div>
          <p className="text-gray-600">
            Überwachung aller Bots die robots.txt ignoriert haben
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
            <div className="flex items-center justify-between mb-2">
              <Activity className="text-blue-600" size={24} />
              <span className="text-2xl font-bold text-gray-900">{stats.total}</span>
            </div>
            <p className="text-sm text-gray-600">Gesamt Logs</p>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
            <div className="flex items-center justify-between mb-2">
              <Calendar className="text-green-600" size={24} />
              <span className="text-2xl font-bold text-gray-900">{stats.today}</span>
            </div>
            <p className="text-sm text-gray-600">Heute</p>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
            <div className="flex items-center justify-between mb-2">
              <TrendingUp className="text-purple-600" size={24} />
              <span className="text-2xl font-bold text-gray-900">{stats.week}</span>
            </div>
            <p className="text-sm text-gray-600">Diese Woche</p>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6 border border-red-200 bg-red-50">
            <div className="flex items-center justify-between mb-2">
              <AlertTriangle className="text-red-600" size={24} />
              <span className="text-2xl font-bold text-red-900">{stats.bad_bots}</span>
            </div>
            <p className="text-sm text-red-700 font-medium">Böse Bots</p>
          </div>
        </div>

        {/* Filter Buttons */}
        <div className="bg-white rounded-lg shadow-sm p-4 mb-6 border border-gray-200">
          <div className="flex gap-3">
            <button
              onClick={() => setFilter('all')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                filter === 'all'
                  ? 'bg-gray-900 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Alle ({stats.total})
            </button>
            <button
              onClick={() => setFilter('bad')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                filter === 'bad'
                  ? 'bg-red-600 text-white'
                  : 'bg-red-50 text-red-700 hover:bg-red-100'
              }`}
            >
              Böse Bots ({stats.bad_bots})
            </button>
            <button
              onClick={() => setFilter('good')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                filter === 'good'
                  ? 'bg-green-600 text-white'
                  : 'bg-green-50 text-green-700 hover:bg-green-100'
              }`}
            >
              Gute Bots ({stats.total - stats.bad_bots})
            </button>
            <button
              onClick={() => {
                fetchLogs();
                fetchStats();
                toast.success('Logs aktualisiert');
              }}
              className="ml-auto px-4 py-2 rounded-lg font-medium bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors"
            >
              🔄 Aktualisieren
            </button>
          </div>
        </div>

        {/* Logs Table */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Zeitpunkt
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Falle
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Bot Type
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    User Agent
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    IP
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Referrer
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {loading ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center text-gray-500">
                      Lade Logs...
                    </td>
                  </tr>
                ) : logs.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center text-gray-500">
                      Noch keine Logs vorhanden
                    </td>
                  </tr>
                ) : (
                  logs.map((log) => (
                    <tr key={log.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3 text-sm text-gray-900 whitespace-nowrap">
                        {formatDate(log.visited_at)}
                      </td>
                      <td className="px-4 py-3 text-sm">
                        <code className="bg-gray-100 px-2 py-1 rounded text-xs font-mono">
                          {log.honeypot_path}
                        </code>
                      </td>
                      <td className="px-4 py-3 text-sm">
                        <span
                          className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                            log.bot_type === 'bad'
                              ? 'bg-red-100 text-red-800'
                              : log.bot_type === 'good'
                              ? 'bg-green-100 text-green-800'
                              : 'bg-gray-100 text-gray-800'
                          }`}
                        >
                          {log.bot_type === 'bad' ? '❌ Böse' : log.bot_type === 'good' ? '✅ Gut' : '❓ Unbekannt'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">
                        <span title={log.user_agent} className="cursor-help">
                          {truncateUA(log.user_agent)}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">
                        {log.ip_address || '-'}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">
                        {log.referrer || 'direct'}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Info Box */}
        <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h3 className="font-semibold text-blue-900 mb-2 flex items-center gap-2">
            <Shield size={20} />
            Wie funktioniert der Honeypot?
          </h3>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>• Seiten wie <code className="bg-blue-100 px-1 rounded">/honeypot</code>, <code className="bg-blue-100 px-1 rounded">/secret-admin</code> sind in robots.txt verboten</li>
            <li>• Brave Bots (Google, Bing) respektieren robots.txt → besuchen die Seiten NICHT</li>
            <li>• Böse Bots ignorieren robots.txt → werden hier geloggt! 🎯</li>
            <li>• <strong>Rot markiert = Böse Bots</strong> die definitiv gegen robots.txt verstoßen</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default AdminHoneypot;
