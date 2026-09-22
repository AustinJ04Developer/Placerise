import { Router, Response } from 'express';
import { DashboardService } from './dashboard.service.js';
import { authenticate, AuthRequest } from '../../middleware/auth.js';

const router = Router();

router.use(authenticate);

router.get('/stats', async (req: AuthRequest, res: Response) => {
  const stats = await DashboardService.getStats(req.user);
  res.json({ success: true, data: stats });
});

export const dashboardRoutes = router;
