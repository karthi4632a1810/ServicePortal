let requestCounter = 0;

export function generateRequestNumber() {
  const year = new Date().getFullYear();
  requestCounter += 1;
  const seq = String(Date.now()).slice(-4) + String(requestCounter).padStart(3, '0');
  return `REQ-${year}-${seq.slice(0, 4)}`;
}

export function getInitials(name) {
  return name
    .split(' ')
    .map((part) => part[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

export function formatFileSize(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
