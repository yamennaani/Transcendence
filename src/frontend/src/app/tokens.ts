// Design tokens as typed TS constants — import wherever needed
// Mirrors colors_and_type.css custom properties
export const DS = {
  colors: {
    bg: "oklch(10% 0.025 272)",
    surface: "oklch(15% 0.025 272)",
    surfaceRaised: "oklch(19% 0.028 272)",
    border: "oklch(27% 0.03 272)",
    borderSubtle: "oklch(22% 0.025 272)",
    fg1: "oklch(94% 0.005 272)",
    fg2: "oklch(68% 0.01 272)",
    fg3: "oklch(48% 0.01 272)",
    violet: "oklch(64% 0.28 296)",
    violetDim: "oklch(55% 0.25 296)",
    violetSubtle: "oklch(22% 0.08 296)",
    violetBorder: "oklch(40% 0.16 296)",
    cyan: "oklch(72% 0.15 200)",
    cyanSubtle: "oklch(20% 0.05 200)",
    cyanBorder: "oklch(38% 0.09 200)",
    green: "oklch(68% 0.18 145)",
    greenSubtle: "oklch(18% 0.06 145)",
    greenBorder: "oklch(36% 0.10 145)",
    red: "oklch(62% 0.22 20)",
    redSubtle: "oklch(18% 0.07 20)",
    redBorder: "oklch(36% 0.12 20)",
    amber: "oklch(75% 0.18 80)",
    amberSubtle: "oklch(20% 0.06 80)",
    amberBorder: "oklch(38% 0.10 80)",
  },
  fonts: {
    display: "'Space Grotesk', sans-serif",
    body: "'DM Sans', sans-serif",
    mono: "'JetBrains Mono', monospace",
  },
  radius: { sm: "6px", md: "8px", lg: "12px", xl: "16px", full: "9999px" },
  space: { 1: "4px", 2: "8px", 3: "12px", 4: "16px", 6: "24px", 8: "32px" },
} as const;

// Badge types and styles
export type BadgeVariant =
  | "validated"
  | "failed"
  | "under_review"
  | "submitted"
  | "pending"
  | "violet"
  | "cyan";

export interface BadgeStyle {
  bg: string;
  color: string;
  border: string;
}

export const BADGE_STYLES: Record<BadgeVariant, BadgeStyle> = {
  validated: {
    bg: DS.colors.greenSubtle,
    color: DS.colors.green,
    border: DS.colors.greenBorder,
  },
  failed: {
    bg: DS.colors.redSubtle,
    color: DS.colors.red,
    border: DS.colors.redBorder,
  },
  under_review: {
    bg: DS.colors.amberSubtle,
    color: DS.colors.amber,
    border: DS.colors.amberBorder,
  },
  submitted: {
    bg: "oklch(18% 0.06 270)",
    color: "oklch(62% 0.20 270)",
    border: "oklch(36% 0.10 270)",
  },
  pending: {
    bg: DS.colors.surfaceRaised,
    color: DS.colors.fg2,
    border: DS.colors.border,
  },
  violet: {
    bg: DS.colors.violetSubtle,
    color: DS.colors.violet,
    border: DS.colors.violetBorder,
  },
  cyan: {
    bg: DS.colors.cyanSubtle,
    color: DS.colors.cyan,
    border: DS.colors.cyanBorder,
  },
};


export const BADGE_LABELS = {
  validated: "Validated",
  failed: "Failed",
  under_review: "Under Review",
  submitted: "Submitted",
  pending: "Pending",
  violet: "",
  cyan: "",
};

// Enums from Prisma schema
export type Role = "Admin" | "Bocal" | "Student";
export type EnrollmentStatus = "Active" | "Dropped";
export type SubmissionStatus = "Open" | "Close";
export type SubmissionType = "FILE" | "IMAGE" | "PDF";
export type EvalSectionType = "Toggle" | "Slider";
export type GroupInviteStatus = "Pending" | "Accepted" | "Rejected";

// User related interfaces
export interface UserProfile {
  id: number;
  bio: string;
  avatar:string;
  userId: number;
  last_update: string;
}

export interface UserAuth {
  id: number;
  pass_hash?: string;
  forty_two_id?: string;
  forty_two_token?: string;
  userId: number;
}

export interface User {
  id: number;
  username: string;
  role: Role;
  email: string;
  created_at: string;
  orgId?: number;
  profile?: UserProfile;
  userAuth?: UserAuth;
}

// Organization related interfaces
export interface OrgProfile {
  id: number;
  bio: string;
  tel_num: string;
  orgid: number;
}

export interface Organization {
  id: number;
  email: string;
  name: string;
  tag: string;
  created_at: string;
  profile?: OrgProfile;
  users?: User[];
  classes?: Course[];
}

// Course/Class related interfaces
export interface Course {
  id: number;
  name: string;
  description: string;
  created_at: string;
  pass_threshold: number;
  created_by: number;
  org_id: number;
  done: number; // Number of completed/submitted assignments
  assignments: Assignment[]; // Made required with default empty array
  enrollments?: Enrollment[];
  creator?: User;
  org?: Organization;
}

export interface Assignment {
  id: number;
  classid: number;
  name: string;
  description: string;
  groupSize: number;
  reqEval: number;
  maxScore: number;
  passThreshold: number;
  created_at: string;
  requiresStaffReview?: boolean;
  subtype?: SubmissionType;
  class?: Course;
  groups?: Group[];
  evalSheet?: EvalSheet;
  fileId?: number | null;
}

// Enrollment related interfaces
export interface Enrollment {
  id: number;
  status: EnrollmentStatus;
  userId: number;
  classId: number;
  user: User;
  course: Course;
  enrollDate: string;
}

// Group related interfaces
export interface GroupMember {
  id: number;
  userId: number;
  groupId: number;
  user: User;
  group?: Group;
}

export interface Group {
  id: number;
  assId: number;
  name: string;
  size: number;
  created_at: string;
  leaderId: number;
  members?: GroupMember[];
  submissions?: Submission[];
  invitations?: GroupInvite[];
  assignment?: Assignment;
}

export interface GroupInvite {
  id: number;
  senderId: number;
  reciverId: number;
  targetGroupId: number;
  status: GroupInviteStatus;
  senderUser: User;
  reciverUser: User;
  targetGroup: Group;
  createdAt: string;
}

// File related interfaces
export interface File {
  id: number;
  name: string;
  mimiType: string;
  size: number;
  url: string;
  uploadedBy: number;
  uploader: User;
  submission?: Submission;
  createdAt: string;
}

// Submission related interfaces
export interface Submission {
  id: number;
  groupId: number;
  fileId?: number;
  status: SubmissionStatus;
  passkey: string
  type: SubmissionType;
  group: Group;
  file?: File;
  createdAt: string;
  closedAt?: string;
  responses?: EvalResponse[];
  finalScore?: number;
  passed?: boolean;
}

// Evaluation related interfaces
export interface EvalSection {
  id: number;
  name: string;
  description: string;
  marks: number;
  sectionType: EvalSectionType;
  evalSheetId: number;
  evalSheet?: EvalSheet;
  scores?: EvalSectionScore[];
}

export interface EvalSheet {
  id: number;
  assId: number;
  sections: EvalSection[];
  assignment?: Assignment;
}

export interface EvalSectionScore {
  id: number;
  responseId: number;
  sectionId: number;
  score: number;
  response?: EvalResponse;
  section?: EvalSection;
}

export interface EvalResponse {
  id: number;
  isStaffReview: boolean;
  subId?: number;
  submission?: Submission;
  userId: number;
  user?: Partial<User>;
  givenMarks: number;
  comment: string;
  reply?: string | null;
  rating?: number | null;
  scores?: EvalSectionScore[];
}