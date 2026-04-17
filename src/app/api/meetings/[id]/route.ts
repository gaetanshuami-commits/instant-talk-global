import { NextRequest, NextResponse } from "next/server";
import { pool } from "@/lib/prisma";
import { meetingStatusFromDates } from "@/lib/meetings";

type Params = { params: Promise<{ id: string }> };

export async function GET(_: NextRequest, ctx: Params) {
  const { id } = await ctx.params;
  try {
    const { rows } = await pool.query(
      `SELECT m.*,
        COALESCE(json_agg(DISTINCT jsonb_build_object('id', i.id, 'email', i.email, 'status', i.status))
          FILTER (WHERE i.id IS NOT NULL), '[]') AS invitees
       FROM "Meeting" m
       LEFT JOIN "MeetingInvite" i ON i."meetingId" = m.id
       WHERE m.id = $1 GROUP BY m.id`,
      [id]
    );
    if (!rows[0]) return NextResponse.json({ error: "not_found" }, { status: 404 });
    return NextResponse.json({ meeting: rows[0] });
  } catch (err) {
    console.error("[meeting GET]", err);
    return NextResponse.json({ error: "db_unavailable" }, { status: 503 });
  }
}

export async function PATCH(req: NextRequest, ctx: Params) {
  const { id } = await ctx.params;
  const body = await req.json();
  try {
    const { rows } = await pool.query(`SELECT * FROM "Meeting" WHERE id = $1`, [id]);
    if (!rows[0]) return NextResponse.json({ error: "not_found" }, { status: 404 });

    const startsAt = body.startsAt ? new Date(body.startsAt) : new Date(rows[0].startsAt);
    const endsAt   = body.endsAt   ? new Date(body.endsAt)   : new Date(rows[0].endsAt);
    if (endsAt <= startsAt) return NextResponse.json({ error: "invalid_range" }, { status: 400 });

    await pool.query(
      `UPDATE "Meeting"
       SET title=$2, description=$3, "startsAt"=$4, "endsAt"=$5, timezone=$6, status=$7, "updatedAt"=NOW()
       WHERE id=$1`,
      [id, body.title ?? rows[0].title, body.description ?? rows[0].description,
       startsAt, endsAt, body.timezone ?? rows[0].timezone,
       meetingStatusFromDates(startsAt, endsAt)]
    );
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[meeting PATCH]", err);
    return NextResponse.json({ error: "db_unavailable" }, { status: 503 });
  }
}

export async function DELETE(_: NextRequest, ctx: Params) {
  const { id } = await ctx.params;
  try {
    await pool.query(`DELETE FROM "Meeting" WHERE id = $1`, [id]);
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[meeting DELETE]", err);
    return NextResponse.json({ error: "db_unavailable" }, { status: 503 });
  }
}
