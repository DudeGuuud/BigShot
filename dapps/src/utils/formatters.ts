export function formatCountdown(ms: number) {
  if (ms <= 0) return "EXPIRED";
  const h = Math.floor(ms / 3600000);
  const m = Math.floor((ms % 3600000) / 60000);
  const s = Math.floor((ms % 60000) / 1000);
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

export function formatAddress(address: string) {
  if (!address) return "";
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

export function formatTokenAmount(raw: number | string) {
  const val = typeof raw === 'string' ? Number(raw) : raw;
  return (val / 1_000_000_000).toLocaleString(undefined, { 
    minimumFractionDigits: 0, 
    maximumFractionDigits: 4 
  });
}
