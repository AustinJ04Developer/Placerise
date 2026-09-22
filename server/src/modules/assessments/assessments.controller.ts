import { Request, Response } from 'express';
import { AssessmentsService } from './assessments.service.js';
import { AuthRequest } from '../../middleware/auth.js';
import { recordAuditLog } from '../../middleware/auditLogger.js';

export class AssessmentsController {
  static async createAssessment(req: AuthRequest, res: Response): Promise<void> {
    try {
      const assessment = await AssessmentsService.createAssessment(
        req.body,
        req.user!._id.toString()
      );
      await recordAuditLog(req, {
        action: 'CREATE_ASSESSMENT',
        entity: 'Assessment',
        entityId: assessment._id,
        newValue: assessment,
        details: `Created assessment: ${assessment.title}`,
      });
      res.status(201).json({ success: true, data: assessment });
    } catch (error: any) {
      res.status(400).json({ success: false, message: error.message });
    }
  }

  static async getByProgram(req: Request, res: Response): Promise<void> {
    const assessments = await AssessmentsService.getAssessmentsByProgram(req.params.programId);
    res.json({ success: true, data: assessments });
  }

  static async getAssessmentRoster(req: Request, res: Response): Promise<void> {
    try {
      const roster = await AssessmentsService.getAssessmentRoster(req.params.id);
      res.json({ success: true, data: roster });
    } catch (error: any) {
      res.status(404).json({ success: false, message: error.message });
    }
  }

  static async submitBulkResults(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { results } = req.body;

      if (!Array.isArray(results) || results.length === 0) {
        res.status(400).json({ success: false, message: 'Assessment results array is required' });
        return;
      }

      const outcome = await AssessmentsService.submitBulkResults({
        assessmentId: id,
        results,
        evaluatedBy: req.user!._id.toString(),
      });

      await recordAuditLog(req, {
        action: 'SUBMIT_ASSESSMENT_RESULTS',
        entity: 'Assessment',
        entityId: id,
        details: `Submitted assessment results for ${results.length} students`,
      });

      res.json({ success: true, message: `Graded ${results.length} students`, data: outcome });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  }
}
