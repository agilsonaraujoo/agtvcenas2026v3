const TIMEZONE = 'America/Sao_Paulo';
// O Brasil não adota horário de verão desde 2019: Brasília é sempre UTC-03:00.
const SP_OFFSET = '-03:00';
const DAY_MS = 24 * 60 * 60 * 1000;

const dateFormatter = new Intl.DateTimeFormat('en-CA', {
  timeZone: TIMEZONE,
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
});

const dateKey = (date) => dateFormatter.format(date);

const isValidDateKey = (value) => {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const parsed = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(parsed.getTime()) && parsed.toISOString().startsWith(value);
};

const dayRange = (key) => {
  const start = new Date(`${key}T00:00:00${SP_OFFSET}`);
  return { start, end: new Date(start.getTime() + DAY_MS) };
};

// XMLTV: "YYYYMMDDHHmmss +ZZZZ" (o deslocamento é opcional e assume UTC).
const parseXmltvTime = (value) => {
  const match = /^(\d{4})(\d{2})(\d{2})(\d{2})(\d{2})(\d{2})?\s*([+-])?(\d{2})?(\d{2})?$/.exec(String(value || '').trim());
  if (!match) return null;
  const [, year, month, day, hour, minute, second = '00', sign = '+', offsetHour = '00', offsetMinute = '00'] = match;
  const utc = Date.UTC(+year, +month - 1, +day, +hour, +minute, +second);
  const offsetMs = (Number(offsetHour) * 60 + Number(offsetMinute)) * 60 * 1000;
  const date = new Date(sign === '-' ? utc + offsetMs : utc - offsetMs);
  return Number.isNaN(date.getTime()) ? null : date;
};

module.exports = {
  TIMEZONE,
  DAY_MS,
  dateKey,
  isValidDateKey,
  dayRange,
  parseXmltvTime,
};
