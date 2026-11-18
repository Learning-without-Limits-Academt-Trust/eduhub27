// Food choice radio buttons with allergens, shared by the staff booking form
// and the speaker lunch form.
import { allergenSummary, SUITABLE_FOR } from './allergens.js';

export const NO_FOOD = 'no-food';
// Shown wherever a food choice contains Quorn: on the booking forms, the
// speaker page and confirmations. Keep the wording in step with QUORN_NOTE
// in netlify/functions/_tickets.mjs, which uses it in emails.
export const QUORN_NOTE = 'The Quorn in our meals has been supplied locally and free of charge. We are very grateful for this generous support.';
export const hasQuorn = name => /quorn/i.test(String(name || ''));
const esc = str => String(str ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]));

function foodOptionHtml(choice){
  const summary = allergenSummary(choice);
  const allergens = summary
    ? `<span class="food-allergens"><strong>Contains:</strong> ${esc(summary)}</span>`
    : choice.allergensConfirmed
      ? '<span class="food-allergens">Contains none of the 14 main allergens</span>'
      : '<span class="food-allergens">Please check the allergen matrix for this option</span>';
  const tags = (choice.suitableFor || []).map(code => SUITABLE_FOR.find(s => s.code === code)?.name).filter(Boolean);
  return `<label class="food-option">
    <input type="radio" name="foodChoiceId" value="${esc(choice.id)}" required>
    <span class="food-option-body">
      <span class="food-name">${esc(choice.name)}</span>
      ${tags.length || hasQuorn(choice.name) ? `<span class="food-tags">${tags.map(t => `<span class="tag">${esc(t)}</span>`).join('')}${hasQuorn(choice.name) ? '<span class="tag quorn-tag">Quorn supplied free of charge</span>' : ''}</span>` : ''}
      ${choice.description ? `<span class="food-description">${esc(choice.description)}</span>` : ''}
      ${allergens}
    </span>
  </label>`;
}

// Returns '' when there is no menu yet.
export function foodOptionsHtml(eduhub){
  const choices = Array.isArray(eduhub.foodChoices) ? eduhub.foodChoices : [];
  if(!choices.length) return '';
  const groups = [];
  for(const c of choices){
    const name = c.group || '';
    let g = groups.find(x => x.name === name);
    if(!g) groups.push(g = { name, items: [] });
    g.items.push(c);
  }
  let html = groups.map(g => `
    ${g.name ? `<p class="food-group">${esc(g.name)}</p>` : ''}
    ${g.items.some(c => hasQuorn(c.name)) ? `<p class="quorn-note" role="note">${esc(QUORN_NOTE)}</p>` : ''}
    ${g.items.map(foodOptionHtml).join('')}`).join('');
  if(eduhub.allowNoFood){
    html += `<label class="food-option"><input type="radio" name="foodChoiceId" value="${NO_FOOD}" required>
      <span class="food-option-body"><span class="food-name">I will bring my own food</span></span></label>`;
  }
  return html;
}
