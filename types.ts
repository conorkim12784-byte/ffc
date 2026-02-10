
export interface Trainee {
  id: string;
  name: string;
  timestamp: string;
}

export enum ExportFormat {
  CSV = 'csv',
  JSON = 'json',
  TXT = 'txt'
}
