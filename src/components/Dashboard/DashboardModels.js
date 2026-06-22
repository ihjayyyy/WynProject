import { getAuthData } from '../../services/Auth';
import {
  getModulesByUser,
  getSummaryByModule,
  getForApprovalByModule,
  getNeedsAttentionByModule,
} from '../../services/Dashboard';

const PARENT_MODULES = new Set([
  'Dashboard',
  'Projects',
  'Purchase',
  'Finance',
  'Storage',
  'Materials',
  'Inventory',
  'Employees',
  'Staff',
  'Maintenance',
  'Reports',
]);

function toApiModuleName(moduleName) {
  return moduleName.toLowerCase();
}

function mapSummaryToCards(summary) {
  const stats = Array.isArray(summary?.stats) ? summary.stats : [];
  const title = summary?.title ?? 'Stat';

  return stats.map((item, index) => {
    const statName = item?.statName || `Stat ${index + 1}`;
    const number = item?.statValue ?? 0;
    const value = Number(number);

    return {
      id: `${statName}-${index}`,
      label: title,
      number,
      change: value === 0 ? `No records of ${statName}` : statName,
      isPositive: true,
    };
  });
}

function extractListData(res) {
  if (res?.error) return { data: [], error: res.error };
  const raw = res?.data?.value ?? res?.data;
  return {
    data: Array.isArray(raw?.data) ? raw.data : [],
    error: null,
  };
}

export async function getUserModules() {
  const authData = getAuthData();
  const userId = authData?.userId;

  if (!userId) return { modules: [], allModules: [], error: 'Missing userId' };

  const res = await getModulesByUser(userId);
  const all = Array.isArray(res?.data?.value?.modules)
    ? res.data.value.modules
    : Array.isArray(res?.data?.modules)
    ? res.data.modules
    : [];

  const leafModules = all.filter((m) => !PARENT_MODULES.has(m));

  return {
    modules: leafModules,  // for stats
    allModules: all,       // for for-approval / needs-attention
    error: res?.error ?? null,
  };
}

export async function getAllDashboardCards(modules = []) {
  const results = await Promise.all(
    modules.map((moduleName) =>
      getSummaryByModule(moduleName).then((res) => ({
        moduleName,
        data: res?.error ? [] : mapSummaryToCards(res?.data),
        error: res?.error ?? null,
      }))
    )
  );

  return Object.fromEntries(
    results.map(({ moduleName, data, error }) => [moduleName, { data, error }])
  );
}

export async function getAllForApproval(modules = []) {
  const results = await Promise.all(
    modules.map((moduleName) =>
      getForApprovalByModule(toApiModuleName(moduleName)).then((res) => ({
        moduleName,
        ...extractListData(res),
      }))
    )
  );

  return Object.fromEntries(
    results.map(({ moduleName, data, error }) => [moduleName, { data, error }])
  );
}

export async function getAllNeedsAttention(modules = []) {
  const results = await Promise.all(
    modules.map((moduleName) =>
      getNeedsAttentionByModule(toApiModuleName(moduleName)).then((res) => ({
        moduleName,
        ...extractListData(res),
      }))
    )
  );

  return Object.fromEntries(
    results.map(({ moduleName, data, error }) => [moduleName, { data, error }])
  );
}