const { dayRange } = require('./time');

// CURRENT: start <= agora < end. NEXT: primeiro programa com start > agora.
const findCurrentAndNext = (programs, now = Date.now()) => {
  let current = null;
  let next = null;
  for (const program of programs) {
    const start = Date.parse(program.start);
    const end = Date.parse(program.end);
    if (start <= now && now < end) {
      current = program;
    } else if (start > now && !next) {
      next = program;
    }
  }
  return { current, next };
};

const programsForDate = (programs, key) => {
  const { start, end } = dayRange(key);
  return programs.filter((program) => (
    Date.parse(program.end) > start.getTime() && Date.parse(program.start) < end.getTime()
  ));
};

const hasUpcomingData = (programs, now = Date.now()) => (
  programs.some((program) => Date.parse(program.end) > now)
);

module.exports = { findCurrentAndNext, programsForDate, hasUpcomingData };
