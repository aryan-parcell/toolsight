import type { AuditProfile } from './toolbox';

export type AuditStatus = 'active' | 'complete' | 'overdue';

export interface Checkout {
  id?: string;
  userId: string;
  toolboxId: string;
  checkoutTime: Date;
  returnTime: Date | null;

  // Audit Scheduling Logic
  lastAuditTime: Date | null;     // When the last audit was completed
  nextAuditDue: Date | null;      // When the audit should be / was issued

  // Denormalized Checkout Info
  status: 'active' | 'complete';

  // Denormalized Toolbox Info
  toolboxName: string;
  auditProfile: AuditProfile;
  organizationId: string;

  // Denormalized Audit Info
  currentAuditId: string | null;
  auditStatus: AuditStatus;
}