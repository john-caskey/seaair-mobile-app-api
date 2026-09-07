import { useQuery } from '@tanstack/react-query';
import { useAccessToken } from '../auth/useAuth';
import { apiFetch } from '../lib/api';
import type { DeviceListResponse } from '../lib/types';

// Polls the rolled-up device list for the active window. The window argument
// is passed straight through to the backend (parseWindow accepts e.g. "30s",
// "1m", "24h"; the literal "all" drops the recency cutoff and lists every
// device ever seen).
export function useDeviceList(window: string = '1h', refetchMs = 3000) {
  const token = useAccessToken();
  return useQuery<DeviceListResponse>({
    queryKey: ['device-list', window],
    queryFn: () =>
      apiFetch<DeviceListResponse>(token!, `/devices?window=${window}`),
    enabled: !!token,
    refetchInterval: refetchMs,
    refetchIntervalInBackground: false,
  });
}
