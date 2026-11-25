// The desk screen's "Arriving now" list: people who have signed in with the
// welcome QR code but have not been checked in at the desk yet. Admin only.
import { json, readJSON, updateJSON, requireAdmin, clean, bookingStatusOf } from "./_utils.mjs";
import { ticketSignature } from "./_tickets.mjs";
import { ARRIVAL_KEEP } from "./find-ticket.mjs";

export default async request => {
  if(!requireAdmin(request)) return json({ error: "Not signed in" }, 401);
  if(request.method === "POST"){
    // "Not here" removes someone from the list without checking them in.
    const { id } = await request.json().catch(() => ({}));
    await updateJSON("arrivals", {}, list => { delete list[clean(id, 80)]; return { value: list, result: null }; });
    return json({ ok: true });
  }
  const [arrivals, bookings] = await Promise.all([readJSON("arrivals", {}), readJSON("bookings", [])]);
  const now = Date.now();
  const people = Object.entries(arrivals)
    .filter(([, t]) => now - t <= ARRIVAL_KEEP)
    .map(([id, t]) => ({ b: bookings.find(x => x.id === id), t }))
    .filter(({ b }) => b && !b.checkedInAt && bookingStatusOf(b) === "booked")
    .sort((x, y) => x.t - y.t)
    .map(({ b, t }) => ({ id: b.id, sig: ticketSignature(b.id), firstName: b.firstName, lastName: b.lastName,
      organisation: b.organisation || "", roleName: b.roleName || "", arrivedAt: new Date(t).toISOString() }));
  return json({ people });
};
