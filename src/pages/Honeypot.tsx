import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Shield, Lock, AlertTriangle } from 'lucide-react';

/**
 * HONEYPOT SEITE 🍯
 *
 * Diese Seite ist eine FALLE für böse Bots!
 * - In robots.txt verboten (Disallow: /honeypot)
 * - Brave Bots (Google, Bing) besuchen sie NICHT
 * - Böse Bots ignorieren robots.txt und besuchen sie TROTZDEM
 * - Wir loggen jeden Besuch → erwischt! 🎯
 *
 * WARNUNG: Niemals diese Seite in der normalen Navigation verlinken!
 */
const Honeypot = () => {
  const [logged, setLogged] = useState(false);
  const [botInfo, setBotInfo] = useState<string>('');

  useEffect(() => {
    // Log this visit to Supabase
    const logHoneypotVisit = async () => {
      try {
        // Get user agent
        const userAgent = navigator.userAgent;

        // Get current path
        const honeypotPath = window.location.pathname;

        // Get referrer (woher kam der Bot?)
        const referrer = document.referrer || 'direct';

        // Klassifizierung: Ist es ein bekannter guter Bot?
        const isGoodBot = /googlebot|bingbot|slurp|duckduckbot/i.test(userAgent);
        const botType = isGoodBot ? 'good' : 'bad';

        // Log to Supabase
        const { data, error } = await supabase
          .from('honeypot_logs')
          .insert({
            user_agent: userAgent,
            honeypot_path: honeypotPath,
            referrer: referrer,
            bot_type: botType,
            request_method: 'GET',
            visited_at: new Date().toISOString()
          })
          .select();

        if (error) {
          console.error('❌ Honeypot Log Error:', error);
        } else {
          console.log('✅ Honeypot triggered! Logged:', data);
          setLogged(true);
          setBotInfo(`${botType.toUpperCase()} BOT detected: ${userAgent.substring(0, 50)}...`);
        }
      } catch (err) {
        console.error('❌ Honeypot Error:', err);
      }
    };

    logHoneypotVisit();
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center p-4">
      {/* Fake Admin Login - sieht aus als wäre es eine echte Admin Seite */}
      <div className="max-w-md w-full bg-white rounded-lg shadow-2xl p-8">
        {/* Header mit Warnung */}
        <div className="flex items-center justify-center mb-6">
          <div className="bg-red-100 text-red-600 p-3 rounded-full">
            <AlertTriangle size={32} />
          </div>
        </div>

        <h1 className="text-2xl font-bold text-center text-gray-900 mb-2">
          Admin Access
        </h1>
        <p className="text-center text-gray-600 mb-8">
          Restricted Area - Authorized Personnel Only
        </p>

        {/* Fake Login Form */}
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Username
            </label>
            <div className="relative">
              <input
                type="text"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter username"
                disabled
              />
              <Shield className="absolute right-3 top-3 text-gray-400" size={20} />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Password
            </label>
            <div className="relative">
              <input
                type="password"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter password"
                disabled
              />
              <Lock className="absolute right-3 top-3 text-gray-400" size={20} />
            </div>
          </div>

          <button
            className="w-full bg-gray-400 text-white py-2 rounded-lg font-medium cursor-not-allowed"
            disabled
          >
            Sign In
          </button>
        </div>

        {/* Debug Info (nur in development sichtbar) */}
        {import.meta.env.DEV && logged && (
          <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg">
            <p className="text-xs font-mono text-green-800 break-all">
              🎯 HONEYPOT TRIGGERED!<br />
              {botInfo}
            </p>
          </div>
        )}

        {/* Footer Warning */}
        <div className="mt-8 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <p className="text-xs text-yellow-800 text-center">
            ⚠️ This page is restricted. All access attempts are logged and monitored.
          </p>
        </div>
      </div>

      {/* Invisible pixel tracker (zusätzliche Sicherheit) */}
      <img
        src="data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7"
        alt=""
        className="hidden"
        onLoad={() => {
          // Zusätzlicher Log wenn Bild geladen wird
          console.log('🍯 Honeypot pixel loaded');
        }}
      />
    </div>
  );
};

export default Honeypot;
