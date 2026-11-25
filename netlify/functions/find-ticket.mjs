// "Find my booking": someone enters their surname and email address, and if
// both match a confirmed EduHub booking, they get the link to their ticket.
// Both must match, so nobody can look up a colleague by name alone, and the
// reply never says which of the two was wrong. Failed attempts are limited
// per network, with a generous limit because everyone at the venue shares
// the same wifi.
import crypto from "node:crypto";
import { json, readJSON, updateJSON, clientIp, clean, EDUHUB_ID, bookingStatusOf } from "./_utils.mjs";
import { ticketUrl } from "./_tickets.mjs";

const WINDOW = 15 * 60 * 1000, MAX_FAILURES = 40;
export const ARRIVAL_KEEP = 4 * 60 * 60 * 1000; // arrivals drop off the desk screen after four hours
const key = ip => crypto.createHash("sha256").update("find:" + ip).digest("hex").slice(0, 24);
const same = (a, b) => String(a || "").trim().toLowerCase().replace(/\s+/g, " ") === String(b || "").trim().toLowerCase().replace(/\s+/g, " ");
const NOT_FOUND = "We could not find a booking with that surname and email address. Please check them, or ask at the registration desk.";

async function failures(ip, add){
  return updateJSON("find-attempts", {}, attempts => {
    const now = Date.now();
    for(const [k, v] of Object.entries(attempts)) if(now - v.first > WINDOW) delete attempts[k];
    const k = key(ip);
    if(!add) return { value: attempts, result: attempts[k]?.count || 0 };
    attempts[k] = attempts[k] ? { ...attempts[k], count: attempts[k].count + 1 } : { first: now, count: 1 };
    return { value: attempts, result: attempts[k].count };
  }).catch(() => 0);
}

export default async request => {
  if(request.method !== "POST") return json({ error: "Method not allowed" }, 405);
  const ip = clientIp(request);
  if(await failures(ip, false) >= MAX_FAILURES) return json({ error: "Too many unsuccessful attempts. Please ask at the registration desk." }, 429);
  const body = await request.json().catch(() => ({}));
  const lastName = clean(body.lastName, 80), email = clean(body.email, 160);
  if(!lastName || !email) return json({ error: "Please enter your surname and email address." }, 400);
  const bookings = await readJSON("bookings", []);
  const matches = bookings.filter(b => b.itemId === EDUHUB_ID && same(b.email, email) && same(b.lastName, lastName));
  const b = matches.find(x => bookingStatusOf(x) === "booked") || matches.find(x => bookingStatusOf(x) === "waiting");
  if(!b){ await failures(ip, true); return json({ error: NOT_FOUND }, 404); }
  const url = ticketUrl("", b.id);
  if(!url) return json({ error: "Tickets are not available at the moment. Please ask at the registration desk." }, 503);
  // Let the registration desk know this person has arrived, so their name is
  // waiting on the desk screen before they reach it.
  if(bookingStatusOf(b) === "booked" && !b.checkedInAt){
    await updateJSON("arrivals", {}, list => {
      const now = Date.now();
      for(const [id, t] of Object.entries(list)) if(now - t > ARRIVAL_KEEP) delete list[id];
      list[b.id] = now;
      return { value: list, result: null };
    }).catch(() => {});
  }
  return json({ ok: true, ticketPath: url + "&arrived=1" });
};
