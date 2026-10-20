export function formatMemberDate(value) {
  if (!value) return 'Not recorded';
  // SQL timestamps without an offset in older APIs represent UTC.
  const normalized = /^\d{4}-\d{2}-\d{2}[ T]\d{2}:\d{2}:\d{2}(\.\d+)?$/.test(value)
    ? value.replace(' ', 'T') + 'Z' : value;
  const date = new Date(normalized);
  if (Number.isNaN(date.getTime())) return 'Not recorded';
  return new Intl.DateTimeFormat('en-IN', {
    timeZone: 'Asia/Kolkata', day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit', hour12: true,
  }).format(date) + ' IST';
}
