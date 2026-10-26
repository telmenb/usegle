import express, { Request, Response, NextFunction } from 'express';
import { EditorError, requireValue } from '../services/editor/store';
import {
  candidates,
  decide,
  getQueue,
  undoDecision,
} from '../services/editor/review';
import {
  previewSchedule,
  saveSchedule,
  scheduleRange,
  summary,
} from '../services/editor/schedule';
import {
  checkSession,
  cookieToken,
  login,
  logout,
} from '../services/editor/session';

const router = express.Router();
type Handler = (req: Request, res: Response) => Promise<unknown>;
const handle =
  (handler: Handler) => (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(handler(req, res)).catch(next);
  };
const pageNumber = (input: unknown, fallback: number, max: number): number => {
  const value = input === undefined ? fallback : Number(input);
  requireValue(
    Number.isInteger(value) && value >= 0 && value <= max,
    'Invalid page range.',
  );
  return value;
};
const text = (input: unknown, max: number): string => {
  requireValue(
    input === undefined || (typeof input === 'string' && input.length <= max),
    'Invalid search.',
  );
  return (input as string) || '';
};

router.use((req, res, next) => {
  res.setHeader('Cache-Control', 'no-store');
  if (
    !['GET', 'HEAD'].includes(req.method) &&
    (!process.env.EDITOR_ORIGIN ||
      req.headers.origin !== process.env.EDITOR_ORIGIN)
  ) {
    res.status(403).json({ errorMessage: 'Untrusted editor origin.' });
    return;
  }
  next();
});
router.post(
  '/session/login',
  handle(async (req, res) => {
    // Only accept the server bridge's IP after its deployment proxy has been verified.
    const ip =
      process.env.EDITOR_TRUST_CLIENT_IP === 'true'
        ? text(req.headers['x-editor-client-ip'], 128)
        : 'owner';
    res.json(await login(req.body.password, ip));
  }),
);
router.use((req, _res, next) => {
  checkSession(cookieToken(req.headers.cookie)).then(() => next(), next);
});
router.get(
  '/session',
  handle(async (_req, res) => {
    res.json({ authenticated: true });
  }),
);
router.post(
  '/session/logout',
  handle(async (req, res) => {
    await logout(cookieToken(req.headers.cookie));
    res.json({ ok: true });
  }),
);
router.get(
  '/summary',
  handle(async (_req, res) => {
    res.json(await summary());
  }),
);
router.get(
  '/candidates',
  handle(async (req, res) => {
    const seed = text(req.query.seed, 64);
    requireValue(seed.length > 0, 'A review session seed is required.');
    res.json(
      await candidates(
        seed,
        pageNumber(req.query.offset, 0, 100000),
        text(req.query.search, 80),
      ),
    );
  }),
);
router.get(
  '/queue',
  handle(async (req, res) => {
    res.json(
      await getQueue(
        text(req.query.search, 80),
        pageNumber(req.query.offset, 0, 100000),
      ),
    );
  }),
);
router.post(
  '/decisions',
  handle(async (req, res) => {
    res.json(await decide(req.body.word, req.body.decision, req.body.revision));
  }),
);
router.post(
  '/queue/top',
  handle(async (req, res) => {
    res.json(await decide(req.body.word, 'approved', req.body.revision, true));
  }),
);
router.post(
  '/undo',
  handle(async (req, res) => {
    res.json(await undoDecision(req.body.token));
  }),
);
router.get(
  '/schedule',
  handle(async (req, res) => {
    res.json(
      await scheduleRange(req.query.from, pageNumber(req.query.days, 30, 30)),
    );
  }),
);
router.post(
  '/schedule/preview',
  handle(async (req, res) => {
    res.json(await previewSchedule(req.body.date));
  }),
);
router.post(
  '/schedule/save',
  handle(async (req, res) => {
    try {
      res.json(await saveSchedule(req.body));
    } catch (err) {
      if (err instanceof EditorError && err.status === 409) {
        const date = req.body.replacement
          ? req.body.assignments?.[0]?.date
          : undefined;
        res
          .status(409)
          .json({
            errorMessage: err.message,
            preview: await previewSchedule(date),
          });
      } else throw err;
    }
  }),
);
router.use(
  (err: unknown, _req: Request, res: Response, _next: NextFunction) => {
    const known = err instanceof EditorError;
    res
      .status(known ? err.status : 503)
      .json({
        errorMessage: known ? err.message : 'Editor unavailable. Please retry.',
      });
  },
);
export default router;
