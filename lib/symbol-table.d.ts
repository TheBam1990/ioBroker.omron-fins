export interface PlcVariable {
  name: string;
  value: string;
  type: string;
  write?: boolean;
  source?: string;
}

export function nameToId(name: unknown): string;
export function normalizeAddress(address: unknown): string;
export function parseSymbolTable(text: unknown): PlcVariable[];
export function mergeDeviceTables(manual: PlcVariable[], imported: PlcVariable[]): PlcVariable[];
