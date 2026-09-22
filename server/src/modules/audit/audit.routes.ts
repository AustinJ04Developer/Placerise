import { Router, Request, Response } from 'express';
import { AuditLog } from '../../models/AuditLog.js';
import { authenticate, requireRoles } from '../../middleware/auth.js';
import { ROLES } from '../../config/constants.js';

const router = Router();

router.use(authenticate, requireRoles(ROLES.PLACEMENT_OFFICER, ROLES.HOD));

router.get('/', async (req: Request, res: Response) => {
  const authUser = (req as any).user;
  const { action, entity, userEmail, page = 1, limit = 50 } = req.query;
  const query: any = {};
  if (action) query.action = action;
  if (entity) query.entity = entity;
  if (userEmail) query.userEmail = { $regex: userEmail, $options: 'i' };

  // HOD only oversees events/actions within their department
  if (authUser?.role === ROLES.HOD && authUser.departmentId) {
    const { User } = await import('../../models/User.js');
    const deptUsers = await User.find({ departmentId: authUser.departmentId }).select('_id');
    const deptUserIds = deptUsers.map((u) => u._id);
    query.userId = { $in: deptUserIds };
  }

  const skip = (Number(page) - 1) * Number(limit);
  const [logs, total] = await Promise.all([
    AuditLog.find(query).sort({ createdAt: -1 }).skip(skip).limit(Number(limit)),
    AuditLog.countDocuments(query),
  ]);

  res.json({
    success: true,
    data: logs,
    pagination: {
      total,
      page: Number(page),
      limit: Number(limit),
      totalPages: Math.ceil(total / Number(limit)),
    },
  });
});

export const auditRoutes = router;
