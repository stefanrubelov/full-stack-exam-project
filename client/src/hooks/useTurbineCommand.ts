import { useState } from 'react';
import toast from 'react-hot-toast';
import { turbinesApi } from '../api/apiClient';
import { type TurbineAction } from '../generated-ts-client';

export function useTurbineCommand(turbineId: string) {
  const [loading, setLoading] = useState<string | null>(null);
  const [error, setError] = useState('');

  const send = async (
    action: TurbineAction,
    params?: Record<string, unknown>,
    onSuccess?: () => void,
  ) => {
    setError('');
    setLoading(action);
    try {
      await turbinesApi.sendCommand(turbineId, action, params);
      onSuccess?.();
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Command failed';
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(null);
    }
  };

  return { loading, error, setError, send };
}
