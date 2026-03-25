import "dotenv/config";
import { hash } from "bcryptjs";
import { getDb } from "./db";
import { users, awards } from "./db/schema";

async function seed() {
  if (process.env.NODE_ENV === "production") {
    console.error("프로덕션 환경에서는 seed를 실행할 수 없습니다.");
    process.exit(1);
  }

  const db = getDb();
  const adminPassword = process.env.SEED_ADMIN_PASSWORD;
  const userPassword = process.env.SEED_USER_PASSWORD;

  if (!adminPassword || !userPassword) {
    console.error("SEED_ADMIN_PASSWORD와 SEED_USER_PASSWORD 환경변수가 필요합니다.");
    process.exit(1);
  }

  await db
    .insert(users)
    .values({
      email: "admin@usfk-procurement.kr",
      name: "관리자",
      passwordHash: await hash(adminPassword, 12),
      role: "admin",
      isActive: true,
    })
    .onConflictDoNothing({ target: users.email });

  await db
    .insert(users)
    .values({
      email: "user@usfk-procurement.kr",
      name: "김대리",
      passwordHash: await hash(userPassword, 12),
      role: "user",
      isActive: true,
    })
    .onConflictDoNothing({ target: users.email });

  // ─── Awards 샘플 데이터 ───
  const sampleAwards = [
    // NAICS 561210 - 시설 지원 서비스 (Facilities Support Services)
    { noticeId: "SAMPLE-AW-001", title: "Camp Humphreys Base Operations Support", awardeeName: "DynCorp International", awardeeUei: "DYN123456789", awardAmount: "45000000.00", dateSigned: new Date("2025-08-15"), naicsCode: "561210", psc: "S216", contractType: "Firm-Fixed-Price", fundingAgency: "Department of the Army", fundingOffice: "408th Contracting Support Brigade", performanceCountry: "KOR" },
    { noticeId: "SAMPLE-AW-002", title: "USAG Yongsan-Casey Facility Maintenance", awardeeName: "Vectrus Systems Corporation", awardeeUei: "VEC987654321", awardAmount: "32000000.00", dateSigned: new Date("2025-07-20"), naicsCode: "561210", psc: "S216", contractType: "Firm-Fixed-Price", fundingAgency: "Department of the Army", fundingOffice: "408th Contracting Support Brigade", performanceCountry: "KOR" },
    { noticeId: "SAMPLE-AW-003", title: "Osan AB Facility Management Services", awardeeName: "KBR Inc.", awardeeUei: "KBR111222333", awardAmount: "28500000.00", dateSigned: new Date("2025-06-10"), naicsCode: "561210", psc: "S216", contractType: "Cost-Plus-Fixed-Fee", fundingAgency: "Department of the Air Force", fundingOffice: "51st Contracting Squadron", performanceCountry: "KOR" },
    { noticeId: "SAMPLE-AW-004", title: "Camp Walker Base Support Services", awardeeName: "DynCorp International", awardeeUei: "DYN123456789", awardAmount: "18700000.00", dateSigned: new Date("2025-05-05"), naicsCode: "561210", psc: "S216", contractType: "Firm-Fixed-Price", fundingAgency: "Department of the Army", fundingOffice: "408th Contracting Support Brigade", performanceCountry: "KOR" },
    { noticeId: "SAMPLE-AW-005", title: "Kunsan AB Operations & Maintenance", awardeeName: "Fluor Corporation", awardeeUei: "FLR444555666", awardAmount: "22300000.00", dateSigned: new Date("2025-04-18"), naicsCode: "561210", psc: "S216", contractType: "Firm-Fixed-Price", fundingAgency: "Department of the Air Force", fundingOffice: "8th Contracting Squadron", performanceCountry: "KOR" },
    { noticeId: "SAMPLE-AW-006", title: "Camp Humphreys Housing Maintenance", awardeeName: "Hanwha Defense Systems", awardeeUei: "HAN777888999", awardAmount: "15200000.00", dateSigned: new Date("2025-03-12"), naicsCode: "561210", psc: "S216", contractType: "Firm-Fixed-Price", fundingAgency: "Department of the Army", fundingOffice: "408th Contracting Support Brigade", performanceCountry: "KOR" },
    { noticeId: "SAMPLE-AW-007", title: "USAG Daegu Grounds Maintenance", awardeeName: "Lotte E&C", awardeeUei: "LOT000111222", awardAmount: "8900000.00", dateSigned: new Date("2025-02-28"), naicsCode: "561210", psc: "S216", contractType: "Firm-Fixed-Price", fundingAgency: "Department of the Army", fundingOffice: "408th Contracting Support Brigade", performanceCountry: "KOR" },
    { noticeId: "SAMPLE-AW-008", title: "K-16 Air Base Facility Support", awardeeName: "Vectrus Systems Corporation", awardeeUei: "VEC987654321", awardAmount: "12400000.00", dateSigned: new Date("2025-01-15"), naicsCode: "561210", psc: "S216", contractType: "Firm-Fixed-Price", fundingAgency: "Department of the Army", fundingOffice: "408th Contracting Support Brigade", performanceCountry: "KOR" },
    // NAICS 722310 - 급식 서비스 (Food Service Contractors)
    { noticeId: "SAMPLE-AW-009", title: "Camp Humphreys Dining Facility Operations", awardeeName: "Sodexo Government Services", awardeeUei: "SOD333444555", awardAmount: "19800000.00", dateSigned: new Date("2025-09-01"), naicsCode: "722310", psc: "S205", contractType: "Cost-Plus-Fixed-Fee", fundingAgency: "Department of the Army", fundingOffice: "408th Contracting Support Brigade", performanceCountry: "KOR" },
    { noticeId: "SAMPLE-AW-010", title: "Osan AB Food Services Contract", awardeeName: "Aramark Corporation", awardeeUei: "ARA666777888", awardAmount: "14500000.00", dateSigned: new Date("2025-07-22"), naicsCode: "722310", psc: "S205", contractType: "Firm-Fixed-Price", fundingAgency: "Department of the Air Force", fundingOffice: "51st Contracting Squadron", performanceCountry: "KOR" },
    { noticeId: "SAMPLE-AW-011", title: "USAG Yongsan Dining Services", awardeeName: "CJ Freshway", awardeeUei: "CJF999000111", awardAmount: "11200000.00", dateSigned: new Date("2025-05-30"), naicsCode: "722310", psc: "S205", contractType: "Firm-Fixed-Price", fundingAgency: "Department of the Army", fundingOffice: "408th Contracting Support Brigade", performanceCountry: "KOR" },
    { noticeId: "SAMPLE-AW-012", title: "Camp Casey Mess Hall Operations", awardeeName: "Sodexo Government Services", awardeeUei: "SOD333444555", awardAmount: "8700000.00", dateSigned: new Date("2025-03-10"), naicsCode: "722310", psc: "S205", contractType: "Cost-Plus-Fixed-Fee", fundingAgency: "Department of the Army", fundingOffice: "408th Contracting Support Brigade", performanceCountry: "KOR" },
    // NAICS 236220 - 건설 (Commercial and Institutional Building Construction)
    { noticeId: "SAMPLE-AW-013", title: "Camp Humphreys New Barracks Construction", awardeeName: "Samsung C&T Corporation", awardeeUei: "SAM222333444", awardAmount: "87000000.00", dateSigned: new Date("2025-10-05"), naicsCode: "236220", psc: "Y1AA", contractType: "Firm-Fixed-Price", fundingAgency: "Department of the Army", fundingOffice: "US Army Corps of Engineers - Far East District", performanceCountry: "KOR" },
    { noticeId: "SAMPLE-AW-014", title: "Osan AB Runway Rehabilitation", awardeeName: "Daewoo E&C", awardeeUei: "DAE555666777", awardAmount: "42000000.00", dateSigned: new Date("2025-08-20"), naicsCode: "236220", psc: "Y1AA", contractType: "Firm-Fixed-Price", fundingAgency: "Department of the Air Force", fundingOffice: "US Army Corps of Engineers - Far East District", performanceCountry: "KOR" },
    { noticeId: "SAMPLE-AW-015", title: "Camp Humphreys Medical Center Expansion", awardeeName: "Hyundai Engineering & Construction", awardeeUei: "HYU888999000", awardAmount: "65000000.00", dateSigned: new Date("2025-06-15"), naicsCode: "236220", psc: "Y1AA", contractType: "Firm-Fixed-Price", fundingAgency: "Department of the Army", fundingOffice: "US Army Corps of Engineers - Far East District", performanceCountry: "KOR" },
    { noticeId: "SAMPLE-AW-016", title: "Kunsan AB Weapons Storage Facility", awardeeName: "Samsung C&T Corporation", awardeeUei: "SAM222333444", awardAmount: "35500000.00", dateSigned: new Date("2025-04-25"), naicsCode: "236220", psc: "Y1AA", contractType: "Firm-Fixed-Price", fundingAgency: "Department of the Air Force", fundingOffice: "US Army Corps of Engineers - Far East District", performanceCountry: "KOR" },
    { noticeId: "SAMPLE-AW-017", title: "USAG Daegu Community Center Renovation", awardeeName: "GS Engineering & Construction", awardeeUei: "GSE111000222", awardAmount: "18000000.00", dateSigned: new Date("2025-02-10"), naicsCode: "236220", psc: "Y1AA", contractType: "Firm-Fixed-Price", fundingAgency: "Department of the Army", fundingOffice: "US Army Corps of Engineers - Far East District", performanceCountry: "KOR" },
    // NAICS 561612 - 경비 서비스 (Security Guards and Patrol Services)
    { noticeId: "SAMPLE-AW-018", title: "Camp Humphreys Security Guard Services", awardeeName: "Securitas Security Services", awardeeUei: "SEC123000456", awardAmount: "25000000.00", dateSigned: new Date("2025-09-15"), naicsCode: "561612", psc: "S206", contractType: "Firm-Fixed-Price", fundingAgency: "Department of the Army", fundingOffice: "408th Contracting Support Brigade", performanceCountry: "KOR" },
    { noticeId: "SAMPLE-AW-019", title: "USAG Yongsan Access Control Services", awardeeName: "Korea Security Corporation", awardeeUei: "KSC789000123", awardAmount: "12000000.00", dateSigned: new Date("2025-06-20"), naicsCode: "561612", psc: "S206", contractType: "Firm-Fixed-Price", fundingAgency: "Department of the Army", fundingOffice: "408th Contracting Support Brigade", performanceCountry: "KOR" },
    { noticeId: "SAMPLE-AW-020", title: "Osan AB Perimeter Security", awardeeName: "Securitas Security Services", awardeeUei: "SEC123000456", awardAmount: "16500000.00", dateSigned: new Date("2025-03-25"), naicsCode: "561612", psc: "S206", contractType: "Firm-Fixed-Price", fundingAgency: "Department of the Air Force", fundingOffice: "51st Contracting Squadron", performanceCountry: "KOR" },
  ];

  for (const award of sampleAwards) {
    await db.insert(awards).values(award).onConflictDoNothing({ target: awards.noticeId });
  }

  console.log(`Awards 샘플 데이터 ${sampleAwards.length}건 생성 완료`);

  console.log("시드 데이터 생성 완료");
  process.exit(0);
}

seed().catch((e) => {
  console.error("시드 실패:", e);
  process.exit(1);
});
