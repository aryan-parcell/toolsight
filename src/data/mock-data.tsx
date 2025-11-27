export const TENG_RED = "#E51A1A";

export const TOOLBOXES = [
  { id: "26-PRO-001", type: "26 Pro", site: "Bay A", status: "complete", lastAudit: "2025-10-08" },
  { id: "37-PRO-014", type: "37 Pro", site: "Line 4", status: "missing", lastAudit: "2025-10-10" },
  { id: "53-PRO-021", type: "53 Pro", site: "Hangar 2", status: "calibration", lastAudit: "2025-09-29" },
];

export const TRAY_LIBRARY = [
  { sku: "TT1-RATCHET-SET", name: "Ratchet & Sockets", type: "TT1" },
  { sku: "TT2-SCREWDRIVERS", name: "Driver Set", type: "TT2" },
  { sku: "TTX2-WRENCHES", name: "Metric Wrenches", type: "TTX2" },
  { sku: "TTX4-PLIERSET", name: "3pc Pliers", type: "TTX4" },
];

export const DRAWER_RULES: Record<string, { top: string[]; bottom: string[] }> = {
  "26 Pro": { top: ["TTX2", "TTX4"], bottom: ["TT1", "TT2"] },
  "37 Pro": { top: ["TTX2", "TTX4"], bottom: ["TT1", "TT2"] },
  "53 Pro": { top: ["TTX2", "TTX4"], bottom: ["TT1", "TT2"] },
};

export const MOCK_RESULTS = [
  { tool: "13mm Wrench", sku: "511413", status: "present", confidence: 0.98 },
  { tool: "15mm Wrench", sku: "511415", status: "present", confidence: 0.96 },
  { tool: "17mm Wrench", sku: "511417", status: "missing", confidence: 0.91 },
  { tool: "19mm Wrench", sku: "511419", status: "uncertain", confidence: 0.62 },
];

export const AUDITS = [
  { id: 1, box: "26-PRO-001", freq: "Daily", due: "2025-10-13", assignee: "J. Doe", status: "Due" },
  { id: 2, box: "37-PRO-014", freq: "Weekly", due: "2025-10-15", assignee: "A. Smith", status: "Scheduled" },
  { id: 3, box: "53-PRO-021", freq: "Monthly", due: "2025-10-28", assignee: "K. Lee", status: "On Track" },
];

export const CALIBRATION = [
  { sku: "TORQ-200NM", name: "Torque Wrench 200Nm", due: "2025-10-20", status: "Due Soon", certificateUrl: "#" },
  { sku: "CALIPER-150MM", name: "Digital Caliper 150mm", due: "2026-01-05", status: "Compliant", certificateUrl: "#" },
  { sku: "DIAL-IND-10MM", name: "Dial Indicator 10mm", due: "2025-09-30", status: "Overdue", certificateUrl: "#" },
];

export const toolboxes = [
  {
    id: "8yFz8Oi4LJrwcO2djQkx",
    name: 'ToolBox #1',
    organization_id: '1',
    drawers: [
      { drawerId: 'd0', drawerName: 'Drawer #1' },
      { drawerId: 'd1', drawerName: 'Drawer #2' }
    ],
    tools: [
      { toolId: 't0', drawerId: 'd0', toolName: 'Wrench 10mm' },
      { toolId: 't1', drawerId: 'd1', toolName: 'Hammer' }
    ],
    status: 'maintenance',
    currentUserId: null,
    currentCheckoutId: null,
    lastAuditId: null
  },
  {
    id: "Jo6vk514hs1VEmEu0vyz",
    name: 'ToolBox #2',
    organization_id: '1',
    drawers: [
      { drawerId: 'd0', drawerName: 'Drawer #1' }
    ],
    tools: [
      { toolId: 't0', drawerId: 'd0', toolName: 'High Precision Calipers' },
      { toolId: 't1', drawerId: 'd0', toolName: 'Screwdriver' }
    ],
    status: 'available',
    currentUserId: null,
    currentCheckoutId: null,
    lastAuditId: null
  },
  {
    id: "Aai0ibIHCOehDNdtjykm",
    name: 'ToolBox #3',
    organization_id: '1',
    drawers: [
      { drawerId: 'd0', drawerName: 'Drawer #1' },
      { drawerId: 'd1', drawerName: 'Drawer #2' },
      { drawerId: 'd2', drawerName: 'Drawer #3' },
      { drawerId: 'd3', drawerName: 'Drawer #4' }
    ],
    tools: [
      { toolId: 't0', drawerId: 'd0', toolName: 'Wrench 15mm' },
      { toolId: 't1', drawerId: 'd0', toolName: 'Mallet' },
      { toolId: 't2', drawerId: 'd1', toolName: 'Drill' },
      { toolId: 't3', drawerId: 'd1', toolName: 'Hammer' },
      { toolId: 't4', drawerId: 'd2', toolName: 'Soldering Iron' },
      { toolId: 't5', drawerId: 'd2', toolName: 'Wrench 10mm' },
      { toolId: 't6', drawerId: 'd3', toolName: 'Wrench 10mm' },
      { toolId: 't7', drawerId: 'd3', toolName: 'Hammer' }
    ],
    status: 'available',
    currentUserId: null,
    currentCheckoutId: null,
    lastAuditId: null
  }
];
