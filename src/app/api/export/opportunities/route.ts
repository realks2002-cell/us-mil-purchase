import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { opportunities } from "@/lib/db/schema";
import { desc } from "drizzle-orm";
import ExcelJS from "exceljs";

export async function GET() {
  const session = await auth();
  if (!session?.user || session.user.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const data = await db
    .select({
      noticeId: opportunities.noticeId,
      title: opportunities.title,
      department: opportunities.department,
      office: opportunities.office,
      type: opportunities.type,
      naicsCode: opportunities.naicsCode,
      setAside: opportunities.setAside,
      postedDate: opportunities.postedDate,
      responseDeadline: opportunities.responseDeadline,
      placeCity: opportunities.placeCity,
      placeCountry: opportunities.placeCountry,
      status: opportunities.status,
    })
    .from(opportunities)
    .orderBy(desc(opportunities.postedDate))
    .limit(5000);

  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet("입찰 공고");

  sheet.columns = [
    { header: "공고번호", key: "noticeId", width: 20 },
    { header: "공고명", key: "title", width: 50 },
    { header: "기관", key: "department", width: 25 },
    { header: "부서", key: "office", width: 25 },
    { header: "유형", key: "type", width: 20 },
    { header: "NAICS", key: "naicsCode", width: 10 },
    { header: "Set-Aside", key: "setAside", width: 20 },
    { header: "게시일", key: "postedDate", width: 15 },
    { header: "마감일", key: "responseDeadline", width: 15 },
    { header: "수행도시", key: "placeCity", width: 15 },
    { header: "수행국가", key: "placeCountry", width: 10 },
    { header: "상태", key: "status", width: 10 },
  ];

  // 헤더 스타일
  sheet.getRow(1).font = { bold: true };
  sheet.getRow(1).fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: "FF1F2937" },
  };
  sheet.getRow(1).font = { bold: true, color: { argb: "FFFFFFFF" } };

  for (const row of data) {
    sheet.addRow({
      ...row,
      postedDate: row.postedDate?.toLocaleDateString("ko-KR") || "",
      responseDeadline: row.responseDeadline?.toLocaleDateString("ko-KR") || "",
    });
  }

  const buffer = await workbook.xlsx.writeBuffer();

  return new NextResponse(buffer, {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="opportunities_${new Date().toISOString().split("T")[0]}.xlsx"`,
    },
  });
}
