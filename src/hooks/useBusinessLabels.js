import { useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import { getBusinessLabels } from '../utils/businessLabels';

export function useBusinessLabels() {
  const { session } = useAuth();

  return useMemo(
    () => getBusinessLabels(session?.businessType),
    [session?.businessType]
  );
}
