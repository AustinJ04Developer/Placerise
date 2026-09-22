import { Router, Request, Response } from 'express';
import { ReportsService } from './reports.service.js';
import { authenticate } from '../../middleware/auth.js';

const router = Router();

router.use(authenticate);

router.get('/class/:sectionId/export', async (req: Request, res: Response) => {
  try {
    const authUser = (req as any).user;
    if (authUser?.role === 'hod' && authUser.departmentId) {
      const { ClassSection } = await import('../../models/ClassSection.js');
      const section = await ClassSection.findById(req.params.sectionId);
      if (section && section.departmentId.toString() !== authUser.departmentId.toString()) {
        res.status(403).json({ success: false, message: 'Access Denied: HOD can only export classes in their department' });
        return;
      }
    }

    const csv = await ReportsService.exportClassMatrixCSV(req.params.sectionId);
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="class-training-matrix-${req.params.sectionId}.csv"`
    );
    res.send(csv);
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.get('/training/:programId/absentees/export', async (req: Request, res: Response) => {
  try {
    const authUser = (req as any).user;
    const deptId = authUser?.role === 'hod' && authUser.departmentId ? authUser.departmentId.toString() : undefined;
    const csv = await ReportsService.exportAbsenteesCSV(req.params.programId, deptId);
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="training-absentees-${req.params.programId}.csv"`
    );
    res.send(csv);
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

export const reportsRoutes = router;
