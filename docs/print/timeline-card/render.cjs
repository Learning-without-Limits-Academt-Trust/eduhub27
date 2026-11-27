// Renders the A5 card as a transparent 300 dpi PNG and a print PDF.
const { chromium } = require('/opt/node22/lib/node_modules/playwright');
const dir = process.argv[2];
(async () => {
  const b = await chromium.launch();
  // A5 at 96 CSS px per inch is 559 x 794; scale 3.125 gives 300 dpi (1748 x 2480).
  const p = await b.newPage({ viewport: { width: 559, height: 794 }, deviceScaleFactor: 3.125 });
  await p.goto('file://' + dir + '/timeline.html'); await p.waitForTimeout(1800);
  const over = await p.evaluate(() => document.documentElement.scrollHeight - 794);
  console.log('overflow px:', over);
  await p.screenshot({ path: dir + '/EduHub-2027-timeline-A5-transparent.png', omitBackground: true });
  await p.pdf({ path: dir + '/EduHub-2027-timeline-A5.pdf', width: '148mm', height: '210mm', printBackground: true });
  // A preview on the site's teal, to check it reads well on a dark background.
  await p.evaluate(() => { document.body.style.background = 'radial-gradient(900px 700px at 15% 5%,#098F88,#00706A 50%,#00524E)'; });
  await p.screenshot({ path: dir + '/preview-on-teal.png' });
  await b.close();
})().catch(e => { console.error('FAILED', e.message); process.exit(1); });
