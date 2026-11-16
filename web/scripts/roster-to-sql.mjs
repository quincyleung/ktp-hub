#!/usr/bin/env node
// Turns the roster sheet's CSV download into SQL for the Supabase SQL editor.
//
//   1. In the sheet: File → Download → Comma-separated values (.csv)
//   2. node web/scripts/roster-to-sql.mjs ~/Downloads/<file>.csv | pbcopy
//   3. Supabase → SQL Editor → paste → Run
//
// The sheet is the source of truth: people on it are added or updated, and
// people no longer on it are removed (they become guests). Safe to re-run.
// Columns are found by header, in any order and any case: Name, Email, Year,
// Role (Board or Member), Status (blank for brothers, or Pledge or Alumni).
// Merged email cells are fine.
// The SQL goes to stdout; a summary goes to stderr, so piping to pbcopy works.

import { existsSync, readFileSync } from "node:fs";

const file = process.argv[2];
if (!file) {
  console.error("Usage: node web/scripts/roster-to-sql.mjs <roster.csv>");
  process.exit(1);
}
if (!existsSync(file)) {
  console.error(`Can't find ${file}. Download the sheet as CSV first (File → Download → .csv).`);
  process.exit(1);
}

// Minimal CSV parser: quoted fields, doubled quotes, commas and newlines inside quotes.
function parseCsv(text) {
  const rows = [];
  let row = [];
  let field = "";
  let quoted = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (quoted) {
      if (c === '"' && text[i + 1] === '"') {
        field += '"';
        i++;
      } else if (c === '"') {
        quoted = false;
      } else {
        field += c;
      }
    } else if (c === '"') {
      quoted = true;
    } else if (c === ",") {
      row.push(field);
      field = "";
    } else if (c === "\n" || c === "\r") {
      if (c === "\r" && text[i + 1] === "\n") i++;
      row.push(field);
      rows.push(row);
      row = [];
      field = "";
    } else {
      field += c;
    }
  }
  if (field !== "" || row.length) {
    row.push(field);
    rows.push(row);
  }
  return rows;
}

const rows = parseCsv(readFileSync(file, "utf8").replace(/^﻿/, ""));
const header = (rows[0] ?? []).map((h) => h.trim().toLowerCase());
const col = (name) => header.indexOf(name);
const cols = { name: col("name"), email: col("email"), year: col("year"), role: col("role"), status: col("status") };
if (cols.email < 0) {
  console.error(`No "Email" column found. Headers were: ${rows[0]?.join(", ")}`);
  process.exit(1);
}

const cell = (r, i) => (i >= 0 ? (r[i] ?? "").trim() : "");
const emailOk = /^[^\s@,;]+@[^\s@,;]+\.[a-z]{2,}$/;

const members = [];
const errors = [];
const seen = new Map();
const noName = [];
const notUchicago = [];

rows.slice(1).forEach((r, i) => {
  const line = i + 2;
  if (r.every((v) => v.trim() === "")) return; // blank row
  const email = cell(r, cols.email).toLowerCase();
  if (!email) return errors.push(`row ${line}: no email`);
  if (!emailOk.test(email)) return errors.push(`row ${line}: "${email}" doesn't look like an email`);
  if (seen.has(email)) return errors.push(`row ${line}: ${email} is also on row ${seen.get(email)}`);
  seen.set(email, line);

  const roleRaw = cell(r, cols.role).toLowerCase();
  if (roleRaw && roleRaw !== "board" && roleRaw !== "member") {
    return errors.push(`row ${line}: role "${cell(r, cols.role)}" should be Board or Member`);
  }

  // Status sorts people in the app's People tab. Blank means an active brother.
  const statusRaw = cell(r, cols.status).toLowerCase();
  let status = null;
  if (statusRaw.startsWith("pledge")) status = "pledge";
  else if (statusRaw.startsWith("alum")) status = "alumni";
  else if (statusRaw && !["brother", "active", "member"].includes(statusRaw)) {
    return errors.push(`row ${line}: status "${cell(r, cols.status)}" should be blank, Brother, Pledge or Alumni`);
  }

  let name = cell(r, cols.name);
  if (!name) {
    name = email.split("@")[0]; // placeholder until the sheet has a name
    noName.push(email);
  }
  if (!email.endsWith("@uchicago.edu")) notUchicago.push(email);

  members.push({
    name,
    email,
    year: cell(r, cols.year) || null,
    status,
    role: roleRaw || "member",
  });
});

if (errors.length) {
  console.error(`Fix these in the sheet, download it again, and re-run:\n  ${errors.join("\n  ")}`);
  process.exit(1);
}
if (members.length === 0) {
  console.error("No members found in the CSV.");
  process.exit(1);
}

const q = (v) => (v === null ? "null" : `'${String(v).replace(/'/g, "''")}'`);
const values = members
  .map((m) => `  (${q(m.name)}, ${q(m.email)}, ${q(m.year)}, ${q(m.status)}, ${q(m.role)})`)
  .join(",\n");

process.stdout.write(`-- KTP Hub roster sync, generated ${new Date().toISOString()} from ${members.length} rows.
-- Adds and updates everyone on the sheet, and removes anyone no longer on it.
insert into public.members (name, email, year, status, role) values
${values}
on conflict (email_lower) do update
  set name = excluded.name,
      email = excluded.email,
      -- Members set their own graduation year at onboarding; the sheet only fills in blanks.
      year = coalesce(public.members.year, excluded.year),
      status = excluded.status,
      role = excluded.role;

delete from public.members
where email_lower not in (
${members.map((m) => `  ${q(m.email)}`).join(",\n")}
);

select role, count(*) from public.members group by role order by role;
`);

const boardCount = members.filter((m) => m.role === "board").length;
console.error(`OK: ${members.length} people (${boardCount} board, ${members.length - boardCount} members).`);
if (noName.length) {
  console.error(`No name in the sheet, so the app will greet them by email for now: ${noName.join(", ")}`);
}
if (notUchicago.length) {
  console.error(`Not a uchicago.edu address (they must sign in with exactly this): ${notUchicago.join(", ")}`);
}
