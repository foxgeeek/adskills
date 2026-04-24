import kleur from 'kleur';

type Level = 'debug' | 'info' | 'warn' | 'error';

const order: Record<Level, number> = { debug: 10, info: 20, warn: 30, error: 40 };

function currentLevel(): Level {
  const raw = (process.env.LOG_LEVEL ?? 'info').toLowerCase();
  return (['debug', 'info', 'warn', 'error'] as const).includes(raw as Level)
    ? (raw as Level)
    : 'info';
}

function shouldLog(level: Level): boolean {
  return order[level] >= order[currentLevel()];
}

export const logger = {
  debug(msg: string, meta?: unknown) {
    if (shouldLog('debug')) console.log(kleur.gray(`[debug] ${msg}`), meta ?? '');
  },
  info(msg: string, meta?: unknown) {
    if (shouldLog('info')) console.log(kleur.cyan(`[info]  ${msg}`), meta ?? '');
  },
  warn(msg: string, meta?: unknown) {
    if (shouldLog('warn')) console.warn(kleur.yellow(`[warn]  ${msg}`), meta ?? '');
  },
  error(msg: string, meta?: unknown) {
    if (shouldLog('error')) console.error(kleur.red(`[error] ${msg}`), meta ?? '');
  },
};
