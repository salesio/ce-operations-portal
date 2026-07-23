import { getDataSource } from "./config";
import type { DataProvider, DataSourceName } from "./types/repository";
import { createMockProvider } from "./adapters/mockProvider";
import { createLocalStorageProvider } from "./adapters/localStorageProvider";
import { createApiProvider } from "./adapters/apiProvider";
import { createSupabaseProvider } from "./adapters/supabaseProvider";

let cached: DataProvider | null = null;
let cachedSource: DataSourceName | null = null;

function buildProvider(source: DataSourceName): DataProvider {
  switch (source) {
    case "local":
      return createLocalStorageProvider();
    case "api":
      return createApiProvider();
    case "supabase":
      return createSupabaseProvider();
    case "mock":
    default:
      return createMockProvider();
  }
}

/**
 * Central entry: returns the active DataProvider based on VITE_DATA_SOURCE.
 * Default is "mock". Safe to call from future modules; does not alter UI state.
 */
export function getDataProvider(): DataProvider {
  const source = getDataSource();
  if (!cached || cachedSource !== source) {
    cached = buildProvider(source);
    cachedSource = source;
  }
  return cached;
}

/** Force rebuild (e.g. after runtime env change). */
export function resetDataProvider(): void {
  cached = null;
  cachedSource = null;
}

export function getActiveDataSource(): DataSourceName {
  return getDataSource();
}
