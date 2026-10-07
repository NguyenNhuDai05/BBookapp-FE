import { useCallback, useEffect, useRef, useState } from 'react';
import { DeviceLocationError, getCurrentLocationCandidate, reverseLocation } from '../services/locationService';
import type { LocationCandidate, LocationSelectionPhase } from '../types/location';

// Technical candidate state only. Callers decide what may be confirmed/stored.
export function useLocationSelection() {
  const operation = useRef(0);
  const inFlight = useRef<number | null>(null);
  const [phase, setPhase] = useState<LocationSelectionPhase>('idle');
  const [candidate, setCandidate] = useState<LocationCandidate>();
  const [error, setError] = useState('');
  const [blocked, setBlocked] = useState(false);
  const [errorCode, setErrorCode] = useState<DeviceLocationError['code']>();
  const cancel = useCallback(() => { operation.current++; inFlight.current = null; setPhase('idle'); setError(''); setBlocked(false); setErrorCode(undefined); setCandidate(undefined); }, []);
  useEffect(() => () => { operation.current++; inFlight.current = null; }, []);
  const locate = async () => {
    if (inFlight.current != null) return;
    const id = ++operation.current;
    inFlight.current = id;
    setError(''); setBlocked(false); setErrorCode(undefined); setCandidate(undefined); setPhase('requestingPermission');
    try {
      const result = await getCurrentLocationCandidate(next => { if (id === operation.current) setPhase(next); }, () => id === operation.current, next => { if (id === operation.current) setCandidate(next); });
      if (id === operation.current) { setCandidate(result); setPhase('ready'); }
    } catch (failure) {
      if (id !== operation.current) return;
      setError(failure instanceof DeviceLocationError ? failure.message : 'Không thể lấy vị trí. Bạn có thể nhập địa chỉ thủ công.');
      setBlocked(failure instanceof DeviceLocationError && failure.code === 'BLOCKED'); setPhase('error');
      setErrorCode(failure instanceof DeviceLocationError ? failure.code : 'UNAVAILABLE');
    } finally { if (inFlight.current === id) inFlight.current = null; }
  };
  const retryReverse = async () => {
    if (!candidate || inFlight.current != null) return;
    const id = ++operation.current; setPhase('resolving');
    inFlight.current = id;
    try {
      const result = await reverseLocation(candidate);
      if (id === operation.current) { setCandidate(result); setPhase('ready'); }
    } finally { if (inFlight.current === id) inFlight.current = null; }
  };
  const busy = phase === 'requestingPermission' || phase === 'locating' || phase === 'resolving';
  return { phase, candidate, error, errorCode, blocked, busy, locate, retryReverse, cancel };
}
