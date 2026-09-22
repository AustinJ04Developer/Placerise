import { Router, Response } from 'express';
import { Notification } from '../../models/Notification.js';
import { authenticate, AuthRequest } from '../../middleware/auth.js';

const router = Router();

router.use(authenticate);

router.get('/', async (req: AuthRequest, res: Response) => {
  const notifications = await Notification.find({ userId: req.user!._id })
    .sort({ createdAt: -1 })
    .limit(30);

  const unreadCount = await Notification.countDocuments({
    userId: req.user!._id,
    isRead: false,
  });

  res.json({ success: true, data: notifications, unreadCount });
});

router.patch('/:id/read', async (req: AuthRequest, res: Response) => {
  await Notification.findOneAndUpdate(
    { _id: req.params.id, userId: req.user!._id },
    { isRead: true }
  );
  res.json({ success: true, message: 'Notification marked as read' });
});

router.patch('/read-all', async (req: AuthRequest, res: Response) => {
  await Notification.updateMany({ userId: req.user!._id }, { isRead: true });
  res.json({ success: true, message: 'All notifications marked as read' });
});

export const notificationRoutes = router;
