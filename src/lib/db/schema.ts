import {
  pgTable,
  text,
  timestamp,
  boolean,
  integer,
  jsonb,
  pgEnum,
  serial,
  varchar,
  numeric,
  index,
  unique,
} from "drizzle-orm/pg-core";

export const userRoleEnum = pgEnum("us_mil_user_role", ["admin", "user"]);
export const opportunityStatusEnum = pgEnum("us_mil_opportunity_status", ["active", "inactive", "archived", "cancelled"]);
export const syncStatusEnum = pgEnum("us_mil_sync_status", ["running", "success", "failed"]);
export const notificationStatusEnum = pgEnum("us_mil_notification_status", ["pending", "sent", "failed"]);
export const notificationChannelEnum = pgEnum("us_mil_notification_channel", ["email", "sms", "slack"]);

// ─── Users ───────────────────────────────────────────
export const users = pgTable("us_mil_users", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  email: varchar("email", { length: 255 }).notNull().unique(),
  name: varchar("name", { length: 255 }),
  passwordHash: text("password_hash"),
  role: userRoleEnum("role").notNull().default("user"),
  isActive: boolean("is_active").notNull().default(true),
  emailVerified: timestamp("email_verified", { withTimezone: true }),
  image: text("image"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
  lastLoginAt: timestamp("last_login_at", { withTimezone: true }),
});

// ─── Auth (NextAuth compatible) ──────────────────────
export const accounts = pgTable("us_mil_accounts", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  type: text("type").notNull(),
  provider: text("provider").notNull(),
  providerAccountId: text("provider_account_id").notNull(),
  refreshToken: text("refresh_token"),
  accessToken: text("access_token"),
  expiresAt: integer("expires_at"),
  tokenType: text("token_type"),
  scope: text("scope"),
  idToken: text("id_token"),
  sessionState: text("session_state"),
}, (table) => [
  unique("us_mil_accounts_provider_compound").on(table.provider, table.providerAccountId),
]);

export const sessions = pgTable("us_mil_sessions", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  sessionToken: text("session_token").notNull().unique(),
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  expires: timestamp("expires", { withTimezone: true }).notNull(),
}, (table) => [
  index("idx_us_mil_sessions_user_id").on(table.userId),
]);

// ─── Opportunities (입찰 공고) ───────────────────────
export const opportunities = pgTable("us_mil_opportunities", {
  id: serial("id").primaryKey(),
  noticeId: varchar("notice_id", { length: 100 }).notNull().unique(),
  title: text("title").notNull(),
  solicitationNumber: varchar("solicitation_number", { length: 100 }),
  department: text("department"),
  subTier: text("sub_tier"),
  office: text("office"),
  postedDate: timestamp("posted_date", { withTimezone: true }),
  type: varchar("type", { length: 100 }),
  baseType: varchar("base_type", { length: 50 }),
  archiveType: varchar("archive_type", { length: 50 }),
  archiveDate: timestamp("archive_date", { withTimezone: true }),
  responseDeadline: timestamp("response_deadline", { withTimezone: true }),
  naicsCode: varchar("naics_code", { length: 10 }),
  classificationCode: varchar("classification_code", { length: 10 }),
  setAside: text("set_aside"),
  setAsideDescription: text("set_aside_description"),
  placeCity: text("place_city"),
  placeState: text("place_state"),
  placeCountry: varchar("place_country", { length: 10 }),
  placeZip: varchar("place_zip", { length: 20 }),
  description: text("description"),
  organizationType: text("organization_type"),
  uiLink: text("ui_link"),
  resourceLinks: jsonb("resource_links"),
  pointOfContact: jsonb("point_of_contact"),
  status: opportunityStatusEnum("status").notNull().default("active"),
  rawData: jsonb("raw_data"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
}, (table) => [
  index("idx_us_mil_opp_naics").on(table.naicsCode),
  index("idx_us_mil_opp_posted_date").on(table.postedDate),
  index("idx_us_mil_opp_deadline").on(table.responseDeadline),
  index("idx_us_mil_opp_status_date").on(table.status, table.postedDate),
  index("idx_us_mil_opp_country").on(table.placeCountry),
]);

// ─── Awards (낙찰 정보) ─────────────────────────────
export const awards = pgTable("us_mil_awards", {
  id: serial("id").primaryKey(),
  contractNumber: varchar("contract_number", { length: 100 }),
  opportunityId: integer("opportunity_id").references(() => opportunities.id, { onDelete: "set null" }),
  noticeId: varchar("notice_id", { length: 100 }),
  title: text("title"),
  awardeeName: text("awardee_name"),
  awardeeUei: varchar("awardee_uei", { length: 50 }),
  awardAmount: numeric("award_amount", { precision: 15, scale: 2 }),
  dateSigned: timestamp("date_signed", { withTimezone: true }),
  naicsCode: varchar("naics_code", { length: 10 }),
  psc: varchar("psc", { length: 10 }),
  contractType: text("contract_type"),
  fundingAgency: text("funding_agency"),
  fundingOffice: text("funding_office"),
  performanceCountry: varchar("performance_country", { length: 10 }),
  rawData: jsonb("raw_data"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  index("idx_us_mil_award_naics").on(table.naicsCode),
  index("idx_us_mil_award_awardee").on(table.awardeeName),
  index("idx_us_mil_award_date").on(table.dateSigned),
  index("idx_us_mil_award_date_naics").on(table.dateSigned, table.naicsCode),
  index("idx_us_mil_award_date_awardee").on(table.dateSigned, table.awardeeName),
  index("idx_us_mil_award_country").on(table.performanceCountry),
]);

// ─── User Filters (맞춤 필터) ───────────────────────
export const userFilters = pgTable("us_mil_user_filters", {
  id: serial("id").primaryKey(),
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  name: varchar("name", { length: 255 }).notNull(),
  naicsCodes: text("naics_codes").array(),
  keywords: text("keywords").array(),
  noticeTypes: text("notice_types").array(),
  setAsides: text("set_asides").array(),
  departments: text("departments").array(),
  isActive: boolean("is_active").notNull().default(true),
  notifyEmail: boolean("notify_email").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
}, (table) => [
  index("idx_us_mil_filters_user_id").on(table.userId),
]);

// ─── Notifications (알림) ───────────────────────────
export const notifications = pgTable("us_mil_notifications", {
  id: serial("id").primaryKey(),
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  opportunityId: integer("opportunity_id").references(() => opportunities.id, { onDelete: "set null" }),
  filterId: integer("filter_id").references(() => userFilters.id, { onDelete: "set null" }),
  channel: notificationChannelEnum("channel").notNull().default("email"),
  status: notificationStatusEnum("status").notNull().default("pending"),
  subject: text("subject"),
  body: text("body"),
  sentAt: timestamp("sent_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  index("idx_us_mil_notif_user_id").on(table.userId),
]);

// ─── Sync Logs (수집 로그) ──────────────────────────
export const syncLogs = pgTable("us_mil_sync_logs", {
  id: serial("id").primaryKey(),
  apiType: varchar("api_type", { length: 50 }).notNull(),
  status: syncStatusEnum("status").notNull().default("running"),
  recordsFetched: integer("records_fetched").default(0),
  recordsNew: integer("records_new").default(0),
  recordsUpdated: integer("records_updated").default(0),
  errorMessage: text("error_message"),
  duration: integer("duration"),
  startedAt: timestamp("started_at", { withTimezone: true }).notNull().defaultNow(),
  completedAt: timestamp("completed_at", { withTimezone: true }),
});

// ─── Type Exports ───────────────────────────────────
export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type Opportunity = typeof opportunities.$inferSelect;
export type NewOpportunity = typeof opportunities.$inferInsert;
export type Award = typeof awards.$inferSelect;
export type NewAward = typeof awards.$inferInsert;
export type UserFilter = typeof userFilters.$inferSelect;
export type NewUserFilter = typeof userFilters.$inferInsert;
export type Notification = typeof notifications.$inferSelect;
export type NewNotification = typeof notifications.$inferInsert;
export type SyncLog = typeof syncLogs.$inferSelect;
export type NewSyncLog = typeof syncLogs.$inferInsert;
