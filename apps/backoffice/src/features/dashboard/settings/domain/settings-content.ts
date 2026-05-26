export const settingsContent = {
  sidebar: {
    status: "Settings synced",
    operatorRole: "Admin",
  },
  header: {
    title: "Settings",
    description:
      "Configure store operations, permissions, payments, notifications and local workflow preferences.",
    actionLabel: "Save changes",
  },
  tabs: [
    ["general", "General", ""],
    ["store", "Store", "store"],
    ["payments", "Payments", "payments"],
    ["team-security", "Team & Security", "team-security"],
    ["notifications", "Notifications", "notifications"],
  ],
  handoff:
    "This frame is a separate route/state for implementation handoff. Use the tabs as navigation and preserve URL-level state per option.",
  health: [
    ["Required fields", "Complete"],
    ["Last saved", "2 min ago"],
    ["Audit status", "Tracked"],
  ],
  sections: {
    general: {
      title: "General",
      description: "Separated design state for the active settings tab.",
      rows: [
        ["Language and region", "Default locale, date format and currency for the store.", "Edit"],
        ["Low stock threshold", "Global warning level used by inventory and order workflows.", "Edit"],
        ["Auto-save dashboard filters", "Keep each operator's table filters between sessions.", ""],
        ["Daily opening checklist", "Require shift checklist before register opening.", ""],
      ],
    },
    store: {
      title: "Store",
      description: "Separated design state for the active settings tab.",
      rows: [
        ["Store profile", "Business name, tax ID, public contact and address.", "Edit"],
        ["Opening hours", "Weekly schedule and holiday exceptions.", "Edit"],
        ["Pickup instructions", "Customer-facing instructions for online order pickup.", "Edit"],
        ["Receipt footer message", "Custom text printed on receipts and invoices.", "Edit"],
      ],
    },
    payments: {
      title: "Payments",
      description: "Separated design state for the active settings tab.",
      rows: [
        ["Payment providers", "Stone, Pix and manual cash settlement configuration.", "Manage"],
        ["Card batch reconciliation", "Auto-match terminal batches against register close.", ""],
        ["Refund approval", "Require manager PIN for refunds above R$ 150.", ""],
        ["Installment rules", "Allowed installment count and minimum order value.", "Edit"],
      ],
    },
    "team-security": {
      title: "Team & Security",
      description: "Separated design state for the active settings tab.",
      rows: [
        ["Team members", "Invite operators, managers and inventory leads.", "Manage"],
        ["Roles and permissions", "Control access to cash close, refunds and supplier data.", "Edit"],
        ["Two-factor authentication", "Require second factor for admin accounts.", ""],
        ["Session timeout", "Automatically lock inactive registers and dashboards.", "Edit"],
      ],
    },
    notifications: {
      title: "Notifications",
      description: "Separated design state for the active settings tab.",
      rows: [
        ["WhatsApp updates", "Customer pickup and order-ready messaging.", ""],
        ["Low stock alerts", "Notify inventory lead when critical SKUs drop below threshold.", ""],
        ["Cash variance alerts", "Send manager alert when register variance is detected.", ""],
        ["Daily summary email", "End-of-day sales, stock and cash report recipients.", "Edit"],
      ],
    },
  },
} as const;

export type SettingsSection = keyof typeof settingsContent.sections;
