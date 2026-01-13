import type { AuditProfile } from './toolbox';

export type AuditStatus = 'active' | 'complete' | 'overdue';

export interface Checkout {
  id?: string;
  userId: string;
  toolboxId: string;
  checkoutTime: Date;
  returnTime: Date | null;

  // Denormalized Fields
  status: 'active' | 'complete';
  toolboxName: string;
  auditProfile: AuditProfile;

  // Audit Scheduling Logic
  lastAuditTime: Date | null;     // When the last audit was completed
  nextAuditDue: Date | null;      // When the audit should be / was issued

  // The Audit
  currentAuditId: string | null;
  auditStatus: AuditStatus;
}