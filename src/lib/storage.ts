import { AppData, DEFAULT_APP_DATA } from './types';

const STORAGE_KEY = 'productivito_meter_data';
const BACKUP_KEY = 'productivito_meter_backup';

export function loadData(): AppData {
  if (typeof window === 'undefined') return DEFAULT_APP_DATA;
  
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_APP_DATA;
    const parsed = JSON.parse(raw) as AppData;
    return {
      ...DEFAULT_APP_DATA,
      ...parsed,
    };
  } catch (e) {
    console.error('Failed to load data from localStorage:', e);
    // Try backup
    try {
      const backup = localStorage.getItem(BACKUP_KEY);
      if (backup) {
        const parsed = JSON.parse(backup) as AppData;
        localStorage.setItem(STORAGE_KEY, backup);
        return { ...DEFAULT_APP_DATA, ...parsed };
      }
    } catch (e2) {
      console.error('Backup also failed:', e2);
    }
    return DEFAULT_APP_DATA;
  }
}

export function saveData(data: AppData): void {
  if (typeof window === 'undefined') return;
  
  try {
    // Save backup of current data first
    const current = localStorage.getItem(STORAGE_KEY);
    if (current) {
      localStorage.setItem(BACKUP_KEY, current);
    }
    // Save new data
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (e) {
    console.error('Failed to save data:', e);
    alert('Warning: Failed to save data! Please export your data immediately.');
  }
}

export function exportData(data: AppData): void {
  const json = JSON.stringify(data, null, 2);
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `productivito_backup_${new Date().toISOString().split('T')[0]}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function importData(file: File): Promise<AppData> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target?.result as string) as AppData;
        if (!data.schedules || !data.dailyProgress || !data.templates || !data.rewards) {
          reject(new Error('Invalid data format'));
          return;
        }
        resolve({ ...DEFAULT_APP_DATA, ...data });
      } catch (err) {
        reject(new Error('Failed to parse file'));
      }
    };
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsText(file);
  });
}
