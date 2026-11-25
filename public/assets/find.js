// "Find my booking": shows someone their own ticket on the day.
import './logo-trim.js';
const $ = s => document.querySelector(s);
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]));
const form = $('#find-form');
form.addEventListener('submit', async e => {
  e.preventDefault();
  const lastName = form.lastName.value.trim(), email = form.email.value.trim();
  if(!lastName || !email){ $('#find-message').innerHTML = '<p class="notice error">Please enter your surname and email address.</p>'; return; }
  const button = $('#find-button');
  button.disabled = true; button.textContent = 'Signing you in';
  try{
    const res = await fetch('/api/find-ticket', { method:'POST', headers:{'content-type':'application/json'}, body: JSON.stringify({ lastName, email }) });
    const data = await res.json().catch(() => ({}));
    if(!res.ok || !data.ticketPath) throw new Error(data.error || 'Something went wrong. Please ask at the registration desk.');
    location.href = data.ticketPath;
  }catch(err){
    $('#find-message').innerHTML = `<p class="notice error" role="alert">${esc(err.message)}</p>`;
    button.disabled = false; button.textContent = 'Sign in';
  }
});
