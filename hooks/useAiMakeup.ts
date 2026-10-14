import { useCallback, useEffect, useRef, useState } from 'react';
import { useFocusEffect } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { aiMakeupService } from '../services/aiMakeupService';
import { deleteAiPhoto, pickAiPhoto, prepareAiPhoto } from '../services/aiMakeupPhoto';
import { getApiError } from '../services/api';
import type { AiMakeupPhoto, AiMakeupResult } from '../types/aiMakeup';

export function useAiMakeup() {
  const capabilities = useQuery({ queryKey: ['ai-makeup-capabilities'], queryFn: ({ signal }) => aiMakeupService.capabilities(signal), retry: false, staleTime: 0 });
  const [photo, setPhoto] = useState<AiMakeupPhoto | null>(null);
  const photoRef = useRef<AiMakeupPhoto | null>(null);
  const [result, setResult] = useState<AiMakeupResult | null>(null);
  const [consent, setConsent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [preferences, setPreferences] = useState('');
  const [occasion, setOccasion] = useState('');
  const gate = useRef(false); const alive = useRef(true); const generation = useRef(0);
  const controller = useRef<AbortController | null>(null);
  const replacePhoto = useCallback((next: AiMakeupPhoto | null) => {
    void deleteAiPhoto(photoRef.current?.uri); photoRef.current = next; setPhoto(next); setConsent(false);
  }, []);
  useEffect(() => { const lifecycleGeneration = generation; alive.current = true; return () => { alive.current = false; lifecycleGeneration.current++; controller.current?.abort(); void deleteAiPhoto(photoRef.current?.uri); }; }, []);
  useFocusEffect(useCallback(() => () => { generation.current++; controller.current?.abort(); gate.current = false; setBusy(false); replacePhoto(null); }, [replacePhoto]));
  const choosePhoto = async (camera: boolean) => {
    if (gate.current || !capabilities.data?.enabled) return;
    gate.current = true; setBusy(true); setError('');
    const stamp = generation.current;
    try {
      const next = await pickAiPhoto(camera, capabilities.data.maxImageBytes);
      if (!alive.current || generation.current !== stamp) { await deleteAiPhoto(next?.uri); return; }
      if (next) { replacePhoto(next); setResult(null); }
    } catch (e) { if (alive.current && stamp === generation.current) setError(e instanceof Error ? e.message : 'Không mở được ảnh.'); }
    finally { if (alive.current && stamp === generation.current) { gate.current = false; setBusy(false); } }
  };
  const analyze = async () => {
    if (gate.current || !photoRef.current || !consent || !capabilities.data?.enabled) return;
    gate.current = true; setBusy(true); setError('');
    const stamp = generation.current; const abort = new AbortController(); controller.current = abort;
    try {
      const next = await aiMakeupService.analyze(photoRef.current, capabilities.data.consentVersion, preferences, occasion, abort.signal);
      if (alive.current && stamp === generation.current && !abort.signal.aborted) { setResult(next); replacePhoto(null); }
    } catch (e) { if (alive.current && stamp === generation.current && !abort.signal.aborted) setError(getApiError(e).message || 'Không thể phân tích. Vui lòng kiểm tra kết nối.'); }
    finally { if (alive.current && stamp === generation.current) { gate.current = false; setBusy(false); controller.current = null; } }
  };
  const reset = () => { generation.current++; controller.current?.abort(); gate.current = false; setBusy(false); replacePhoto(null); setResult(null); setError(''); };
  const acceptCapture = async (capture: AiMakeupPhoto) => {
    if (gate.current || !capabilities.data?.enabled) { await deleteAiPhoto(capture.uri); return; }
    const stamp = generation.current; gate.current = true; setBusy(true); setError('');
    try {
      const next = await prepareAiPhoto(capture, capabilities.data.maxImageBytes);
      if (!alive.current || stamp !== generation.current) { await deleteAiPhoto(next.uri); return; }
      replacePhoto(next); setResult(null);
    } catch (e) { if (alive.current && stamp === generation.current) setError(e instanceof Error ? e.message : 'Không đọc được ảnh.'); }
    finally { if (alive.current && stamp === generation.current) { gate.current = false; setBusy(false); } }
  };
  return { capabilities, photo, result, consent, setConsent, busy, error, preferences, setPreferences, occasion, setOccasion, choosePhoto, acceptCapture, analyze, reset };
}
