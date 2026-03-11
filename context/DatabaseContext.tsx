import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';

import { initDatabase } from '@/lib/database';

type DatabaseReady = boolean;

const DatabaseContext = createContext<DatabaseReady>(false);

export function DatabaseProvider({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;
    initDatabase()
      .then(() => {
        if (!cancelled) setReady(true);
      })
      .catch(() => {
        if (!cancelled) setReady(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return <DatabaseContext.Provider value={ready}>{children}</DatabaseContext.Provider>;
}

export function useDatabaseReady(): DatabaseReady {
  return useContext(DatabaseContext);
}
