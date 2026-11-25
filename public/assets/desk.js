// Check-in desk: scan a ticket (or search by surname), check the person in
// and print their name badge. Needs an administrator signed in on the device.
import './logo-trim.js';
const $ = s => document.querySelector(s);
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]));
const EDUHUB_ID = 'eduhub-2027';
let bookings = [];

// Remember the chosen badge size on this device.
const sizeSel = $('#badge-size'), autoPrint = $('#auto-print');
try{ sizeSel.value = localStorage.getItem('desk-badge-size') || sizeSel.value; autoPrint.checked = localStorage.getItem('desk-auto-print') !== 'no'; }catch{}
const applySize = () => { $('#badge-page-size').textContent = `@page{size:${sizeSel.value};margin:0}`; document.body.dataset.badge = sizeSel.value.replace(/\s/g, ''); };
applySize();
sizeSel.addEventListener('change', () => { applySize(); try{ localStorage.setItem('desk-badge-size', sizeSel.value); }catch{} });
autoPrint.addEventListener('change', () => { try{ localStorage.setItem('desk-auto-print', autoPrint.checked ? 'yes' : 'no'); }catch{} });

async function loadBookings(){
  const res = await fetch('/api/admin-data', { cache: 'no-store' });
  if(res.status === 401){ $('#desk-signin').classList.remove('hidden'); $('#desk-main').classList.add('hidden'); return; }
  const data = await res.json();
  bookings = (data.bookings || []).filter(b => b.itemId === EDUHUB_ID && !b.cancelled);
  const confirmed = bookings.filter(b => !b.waitingList);
  $('#desk-count').textContent = `${confirmed.filter(b => b.checkedInAt).length} of ${confirmed.length} checked in`;
}

// The scanner types the ticket link, so pull the booking id and signature out of it.
function parseTicket(text){
  try{
    const u = new URL(text.trim(), location.origin);
    const b = u.searchParams.get('b'), s = u.searchParams.get('s');
    if(b && s) return { b, s };
  }catch{}
  return null;
}

const show = (kind, html) => { $('#desk-result').innerHTML = `<div class="desk-result ${kind}">${html}</div>`; };

function whereFrom(t){
  if(t.role === 'speaker') return t.leading ? `Speaker: ${t.leading}` : 'Speaker';
  if(t.role === 'trustee') return 'Trustee';
  if(t.role === 'governor') return t.organisation ? `Governor, ${t.organisation}` : 'Governor';
  return t.organisation || '';
}

function badgeHtml(t){
  const sessions = (t.sessions || []).filter(x => x.title);
  return `<div class="badge">
    <img class="badge-logo" src="${document.querySelector('.desk-logo').src}" alt="">
    <div class="badge-first">${esc(t.firstName)}</div>
    <div class="badge-last">${esc(t.lastName)}</div>
    <div class="badge-where">${esc(whereFrom(t))}</div>
    ${sessions.length ? `<ul class="badge-sessions">${sessions.map(x => `<li><strong>${esc(x.time)}</strong> ${esc(x.title)}${x.room ? `, ${esc(x.room)}` : ''}</li>`).join('')}</ul>` : ''}
  </div>`;
}

function printBadge(t){
  $('#badge').innerHTML = badgeHtml(t);
  const img = $('#badge img');
  const go = () => { window.print(); $('#scan').focus(); };
  if(img && !img.complete) img.addEventListener('load', go, { once: true }); else go();
}

async function checkIn(b, s, force = false){
  const res = await fetch('/api/ticket', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ b, s, force }) });
  const data = await res.json().catch(() => ({}));
  const detail = await fetch(`/api/ticket?b=${encodeURIComponent(b)}&s=${encodeURIComponent(s)}`, { cache: 'no-store' }).then(r => r.json()).catch(() => null);
  const name = detail ? `${esc(detail.firstName)} ${esc(detail.lastName || '')}` : 'This person';
  const reprint = '<button type="button" class="button secondary small-button" data-reprint>Print badge again</button>';
  if(!res.ok){
    if(data.canForce){
      show('warn', `<p class="desk-name">${name}</p><p>${esc(data.error)}</p><button type="button" class="button" data-force>Check in anyway</button>`);
      $('[data-force]').onclick = () => checkIn(b, s, true);
    }else show('error', `<p class="desk-name">${name}</p><p>${esc(data.error || 'This ticket could not be checked in.')}</p>`);
    return;
  }
  show(data.already ? 'warn' : 'ok', `<p class="desk-name">${name}</p><p>${data.already ? 'Already checked in earlier.' : 'Checked in. Welcome!'}</p>${detail ? reprint : ''}`);
  if(detail){
    $('[data-reprint]').onclick = () => printBadge(detail);
    if(autoPrint.checked && !data.already) printBadge(detail);
  }
  loadBookings();
}

$('#scan-form').addEventListener('submit', e => {
  e.preventDefault();
  const t = parseTicket($('#scan').value);
  $('#scan').value = '';
  if(!t){ show('error', '<p>That does not look like an EduHub ticket. Please scan the QR code again, or search by surname.</p>'); return; }
  checkIn(t.b, t.s);
});

$('#search').addEventListener('input', () => {
  const q = $('#search').value.trim().toLowerCase();
  if(q.length < 2){ $('#search-results').innerHTML = ''; return; }
  const found = bookings.filter(b => String(b.lastName).toLowerCase().startsWith(q)).sort((a, b) => a.lastName.localeCompare(b.lastName) || a.firstName.localeCompare(b.firstName)).slice(0, 12);
  $('#search-results').innerHTML = found.length ? `<ul class="desk-list">${found.map(b => `<li>
      <span><strong>${esc(b.firstName)} ${esc(b.lastName)}</strong><br><span class="muted">${esc(b.organisation || b.roleName || '')}${b.waitingList ? ', waiting list' : ''}${b.checkedInAt ? ', already checked in' : ''}</span></span>
      <button type="button" class="button small-button" data-id="${esc(b.id)}">${b.checkedInAt ? 'Print badge' : 'Check in and print'}</button></li>`).join('')}</ul>`
    : '<p class="muted">Nobody found with that surname. Check the spelling, or look in admin under Bookings.</p>';
});
$('#search-results').addEventListener('click', e => {
  const btn = e.target.closest('[data-id]'); if(!btn) return;
  const b = bookings.find(x => x.id === btn.dataset.id); if(!b) return;
  $('#search').value = ''; $('#search-results').innerHTML = '';
  if(b.checkedInAt) fetch(`/api/ticket?b=${encodeURIComponent(b.id)}&s=${encodeURIComponent(b.ticketSig)}`).then(r => r.json()).then(printBadge);
  else checkIn(b.id, b.ticketSig);
});

// "Arriving now": people who signed in with the welcome QR code. Checked every
// few seconds, so names appear before the person reaches the desk.
async function loadArrivals(){
  const res = await fetch('/api/arrivals', { cache: 'no-store' }).catch(() => null);
  if(!res || !res.ok) return;
  const { people = [] } = await res.json();
  $('#arrivals-count').textContent = people.length ? `(${people.length})` : '';
  const ago = t => { const m = Math.round((Date.now() - new Date(t)) / 60000); return m < 1 ? 'just now' : `${m} min ago`; };
  $('#arrivals').innerHTML = people.length ? `<ul class="arrivals-list">${people.map(p => `<li>
      <button type="button" class="arrival" data-arrival="${esc(p.id)}" data-sig="${esc(p.sig)}">
        <span class="arrival-name">${esc(p.firstName)} ${esc(p.lastName)}</span>
        <span class="arrival-where">${esc(p.organisation || p.roleName)}</span>
        <span class="arrival-when">${ago(p.arrivedAt)}</span>
        <span class="arrival-go">Check in and print</span>
      </button>
      <button type="button" class="link-button arrival-dismiss" data-dismiss="${esc(p.id)}">Not here</button></li>`).join('')}</ul>`
    : '<p class="muted">Nobody waiting yet.</p>';
}
$('#arrivals').addEventListener('click', async e => {
  const go = e.target.closest('[data-arrival]'), dismiss = e.target.closest('[data-dismiss]');
  if(go){ go.disabled = true; await checkIn(go.dataset.arrival, go.dataset.sig); loadArrivals(); }
  if(dismiss){ await fetch('/api/arrivals', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ id: dismiss.dataset.dismiss }) }); loadArrivals(); }
});

loadBookings();
loadArrivals();
setInterval(loadBookings, 60000);
setInterval(loadArrivals, 4000);
