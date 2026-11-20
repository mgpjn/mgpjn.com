import { readFile, writeFile, mkdir, copyFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const root = fileURLToPath(new URL('../', import.meta.url));
const source = path.join(root, 'src/data/legalPolicies.json');
const data = JSON.parse(await readFile(source, 'utf8'));
if (!data.version || !data.updated || !data.operator?.email || !Array.isArray(data.policies) || !data.policies.length) throw Error('Invalid policy metadata');
const ids = new Set();
for (const p of data.policies) {
  if (!/^[a-z-]+$/.test(p.id) || ids.has(p.id) || !p.title || !p.sections?.length) throw Error(`Invalid policy: ${p.id}`);
  ids.add(p.id);
  for (const s of p.sections) if (!s.heading || !s.paragraphs?.length || s.paragraphs.some(x => typeof x !== 'string' || !x.trim())) throw Error(`Invalid section: ${p.id}`);
}
const out = path.join(root, 'public/legal');
await mkdir(out, { recursive: true });
const esc = (value) => String(value).replace(/[&<>"']/g, x => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[x]));
const link = (p) => `/legal/${p.id}.html`;
const nav = `<nav aria-label="All policies"><ul>${data.policies.map(p => `<li><a href="${link(p)}">${esc(p.title)}</a></li>`).join('')}</ul></nav>`;
const wrap = (title, description, body, canonical) => `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>${esc(title)} | MediGlaxo</title><meta name="description" content="${esc(description)}"><link rel="canonical" href="https://mgpjn.com${canonical}"><style>html{scroll-behavior:smooth}body{font:16px/1.75 system-ui,sans-serif;color:#263649;background:#f8fafc;margin:0}main{max-width:900px;margin:auto;padding:28px 20px 60px}a{color:#004e89;text-underline-offset:3px;overflow-wrap:anywhere}a:focus-visible{outline:3px solid #f95b29;outline-offset:3px}h1{font-size:clamp(26px,6vw,38px);line-height:1.25;color:#0f172a}h2{font-size:21px;line-height:1.4;color:#0f172a}section,aside,nav{background:white;border:1px solid #dce3eb;border-radius:16px;padding:20px;margin:22px 0}section{scroll-margin-top:16px}p{overflow-wrap:anywhere}.meta{font-size:13px;color:#64748b}nav ul{padding-left:22px}li{margin:8px 0}</style></head><body><main><a href="/">MediGlaxo home</a> · <a href="/legal/index.html">Policies &amp; Help</a><header><h1>${esc(title)}</h1><p>${esc(description)}</p><p class="meta">Updated ${esc(data.updated)} · ${esc(data.version)}</p></header>${body}${nav}</main></body></html>\n`;
for (const p of data.policies) {
  const contents = `<nav aria-label="On this page"><strong>On this page</strong><ol>${p.sections.map((s,i) => `<li><a href="#section-${i+1}">${esc(s.heading)}</a></li>`).join('')}</ol></nav>`;
  const sections = p.sections.map((s,i) => `<section id="section-${i+1}"><h2>${i+1}. ${esc(s.heading)}</h2>${s.paragraphs.map(t => `<p>${esc(t)}</p>`).join('')}</section>`).join('');
  const subject = p.id === 'account-deletion' ? 'Account Deletion Request' : p.id === 'return-and-refund-policy' ? 'Damaged Delivery Complaint' : 'MediGlaxo Support Request';
  const help = `<aside><h2>Need help?</h2><p><a href="mailto:${data.operator.email}?subject=${encodeURIComponent(subject)}">${esc(p.id === 'account-deletion' ? 'Open account deletion email' : 'Email support')}</a> · <a href="tel:+919650582703">${esc(data.operator.phone)}</a></p><p>The email link opens a draft. Add your details and any evidence, then send it yourself. If no email app opens, use webmail to write to ${esc(data.operator.email)}.</p>${p.id === 'grievance-policy' ? '<a href="https://consumerhelpline.gov.in/">National Consumer Helpline</a>' : ''}</aside>`;
  await writeFile(path.join(out, `${p.id}.html`), wrap(p.title, p.summary, contents+sections+help, link(p)));
}
await writeFile(path.join(out, 'index.html'), wrap('Policies & Help', 'Policies for the MediGlaxo website and Mediglaxo Pharma (Mgpjn) mobile app.', `<p>${esc(data.operator.name)} · ${esc(data.operator.email)}</p>`, '/legal/index.html'));
await copyFile(source, path.join(out, 'policies.json'));

console.log(`Generated ${data.policies.length} public HTML policies and shared policy JSON.`);
