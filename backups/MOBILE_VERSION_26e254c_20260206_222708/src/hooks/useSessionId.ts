import { useEffect, useState } from 'react';

export function useSessionId() {
  const [sessionId, setSessionId] = useState<string>('');

  useEffect(() => {
    let storedSessionId = localStorage.getItem('user_session_id');
    if (!storedSessionId) {
      storedSessionId = 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
      localStorage.setItem('user_session_id', storedSessionId);
    }
    setSessionId(storedSessionId);
  }, []);

  return sessionId;
}
