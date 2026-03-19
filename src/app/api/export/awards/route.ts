import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { awards } from "@/lib/db/schema";
import { desc } from "drizzle-orm";
import ExcelJS from "exceljs";

export async function GET() {
  const session = await auth();
  if (!session?.user || session.user.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const data = await db
    .select({
      contractNumber: awards.contractNumber,
      title: awards.title,
      awardeeName: awards.awardeeName,
      awardeeUei: awards.awardeeUei,
      awardAmount: awards.awardAmount,
      dateSigned: awards.dateSigned,
      naicsCode: awards.naicsCode,
      fundingAgency: awards.fundingAgency,
      performanceCountry: awards.performanceCountry,
    })
    .from(awards)
    .orderBy(desc(awards.dateSigned))
    .limit(5000);

  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet("낙찰 정보");

  sheet.columns = [
    { header: "계약번호", key: "contractNumber", width: 20 },
    { header: "제목", key: "title", width: 50 },
    { header: "낙찰 업체", key: "awardeeName", width: 30 },
    { header: "UEI", key: "awardeeUei", width: 15 },
    { header: "낙찰 금액", key: "awardAmount", width: 18 },
    { header: "계약일", key: "dateSigned", width: 15 },
    { header: "NAICS", key: "naicsCode", width: 10 },
    { header: "발주 기관", key: "fundingAgency", width: 25 },
    { header: "수행 국가", key: "performanceCountry", width: 10 },
  ];

  sheet.getRow(1).font = { bold: true, color: { argb: "FFFFFFFF" } };
  sheet.getRow(1).fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: "FF1F2937" },
  };

  for (const row of data) {
    sheet.addRow({
      ...row,
      awardAmount: row.awardAmount ? `$${parseFloat(row.awardAmount).toLocaleString()}` : "",
      dateSigned: row.dateSigned?.toLocaleDateString("ko-KR") || "",
    });
  }

  const buffer = await workbook.xlsx.writeBuffer();

  return new NextResponse(buffer, {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="awards_${new Date().toISOString().split("T")[0]}.xlsx"`,
    },
  });
}
