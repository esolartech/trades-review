'use client';

import { useEffect } from 'react';

// ---- Types & helpers ----
type Composite = {
  rel: number; qual: number; safe: number; comm: number; pct: number; band: string;
};
const clamp = (v: number, min: number, max: number) => Math.max(min, Math.min(max, v));
const $ = <T extends HTMLElement>(id: string) => document.getElementById(id) as T;

export default function Page() {
  useEffect(() => {
    const minutesLateToScore = (mins: number) => {
      if (mins <= 0) return 5;
      if (mins >= 45) return 1;
      if (mins >= 30) return 2;
      if (mins >= 15) return 3;
      if (mins >= 5)  return 4;
      return 5;
    };

    function compute(): Composite {
      // weights: Rel 30%, Qual 35%, Safety 15%, Comms 20%
      const W = { rel: 0.30, qual: 0.35, safe: 0.15, comm: 0.20 };

      const noShow = ( $('f_noshow') as HTMLInputElement )?.checked ?? false;
      const late   = Number(( $('f_late') as HTMLInputElement )?.value ?? 0);

      const rel = noShow ? 0 : minutesLateToScore(late);

      let qual = Number(( $('f_work') as HTMLInputElement )?.value ?? 0);
      if (( $('f_callback') as HTMLInputElement )?.checked) qual -= 1.5;
      if (!( $('f_punch') as HTMLInputElement )?.checked)   qual -= 0.5;
      qual = clamp(qual, 0, 5);

      let safe = Number(( $('f_ppe') as HTMLInputElement )?.value ?? 0);
      if (( $('f_incident') as HTMLInputElement )?.checked) safe = Math.max(0, safe - 3);
      safe = clamp(safe, 0, 5);

      const comm = Number(( $('f_prof') as HTMLInputElement )?.value ?? 0);

      const pct = Math.round(((rel*W.rel + qual*W.qual + safe*W.safe + comm*W.comm)/5)*100);
      const band = pct >= 90 ? 'Elite' :
                   pct >= 75 ? 'Strong' :
                   pct >= 60 ? 'Solid'  :
                   pct >= 40 ? 'Developing' : 'At Risk';

      return { rel, qual, safe, comm, pct, band };
    }

    function toJSON(c: Composite): string {
      return JSON.stringify({
        meta: { schema: 'reverse-glassdoor.v1', createdAt: new Date().toISOString() },
        job: {
          date:  ( $('f_date')  as HTMLInputElement )?.value,
          trade: ( $('f_trade') as HTMLSelectElement )?.value,
          role:  ( $('f_role')  as HTMLSelectElement )?.value,
          type:  ( $('f_type')  as HTMLSelectElement )?.value,
        },
        worker: { name: ( $('f_worker') as HTMLInputElement )?.value },
        metrics: {
          reliability:  { minutesLate: Number(( $('f_late') as HTMLInputElement )?.value ?? 0),
                          noShow: ( $('f_noshow') as HTMLInputElement )?.checked ?? false },
          quality:      { workmanship: Number(( $('f_work') as HTMLInputElement )?.value ?? 0),
                          callback: ( $('f_callback') as HTMLInputElement )?.checked ?? false,
                          punchlistResolved: ( $('f_punch') as HTMLInputElement )?.checked ?? true },
          safety:       { incident: ( $('f_incident') as HTMLInputElement )?.checked ?? false,
                          ppeAdherence: Number(( $('f_ppe') as HTMLInputElement )?.value ?? 0) },
          communication:{ professionalism: Number(( $('f_prof') as HTMLInputElement )?.value ?? 0) },
          customer:     { rating: Number(( $('f_cs') as HTMLInputElement )?.value ?? 0) }
        },
        composite: { score: c.pct, band: c.band },
        notes: (( $('f_notes') as HTMLTextAreaElement )?.value ?? '').slice(0,240),
        attestation: 'Submitted in good faith; job record on file.'
      }, null, 2);
    }

    function update() {
      const c = compute();
      ( $('bar') as HTMLDivElement ).style.width = `${c.pct}%`;
      $('pct').textContent   = String(c.pct);
      $('band').textContent  = c.band;
      $('s_rel').textContent = `${c.rel}/5`;
      $('s_qual').textContent= `${c.qual}/5`;
      $('s_safe').textContent= `${c.safe}/5`;
      $('s_comms').textContent= `${c.comm}/5`;
      $('jsonOut').textContent = toJSON(c);
    }

    // Bind scorecard inputs
    const ids = ['f_worker','f_trade','f_role','f_date','f_type','f_late','f_noshow','f_callback',
                 'f_punch','f_work','f_incident','f_ppe','f_prof','f_cs','f_notes'];
    ids.forEach(id => {
      const el = $(id);
      el?.addEventListener('input', () => {
        if (id === 'f_work') $('v_work').textContent = (el as HTMLInputElement).value;
        if (id === 'f_ppe')  $('v_ppe' ).textContent = (el as HTMLInputElement).value;
        if (id === 'f_prof') $('v_prof').textContent = (el as HTMLInputElement).value;
        if (id === 'f_cs')   $('v_cs'  ).textContent = (el as HTMLInputElement).value;
        update();
      });
      el?.addEventListener('change', update);
    });

    // Defaults
    const d = $('f_date') as HTMLInputElement;
    if (d && !d.value) {
      const t = new Date();
      d.value = `${t.getFullYear()}-${String(t.getMonth()+1).padStart(2,'0')}-${String(t.getDate()).padStart(2,'0')}`;
    }
    const y = $('year'); if (y) y.textContent = String(new Date().getFullYear());

    // Copy JSON
    ( $('copyBtn') as HTMLButtonElement )?.addEventListener('click', async () => {
      await navigator.clipboard.writeText($('jsonOut').textContent || '');
      const btn = $('copyBtn') as HTMLButtonElement;
      btn.textContent = 'Copied!'; setTimeout(() => (btn.textContent = 'Copy'), 1200);
    });

    // Pilot tabs + simple enabling
    const tabEmp  = $('tabEmp');
    const tabWkr  = $('tabWkr');
    const empForm = $('empForm');
    const wkrForm = $('wkrForm');
    const eSubmit = $('e_submit') as HTMLButtonElement | null;
    const wSubmit = $('w_submit') as HTMLButtonElement | null;

    const setTab = (emp: boolean) => {
      tabEmp?.classList.toggle('bg-white', emp);
      tabEmp?.classList.toggle('shadow', emp);
      tabEmp?.classList.toggle('border', emp);
      tabEmp?.classList.toggle('text-slate-600', !emp);
      tabWkr?.classList.toggle('bg-white', !emp);
      tabWkr?.classList.toggle('shadow', !emp);
      tabWkr?.classList.toggle('border', !emp);
      tabWkr?.classList.toggle('text-slate-600',  emp);
      empForm?.classList.toggle('hidden', !emp);
      wkrForm?.classList.toggle('hidden',  emp);
    };
    tabEmp?.addEventListener('click', () => setTab(true));
    tabWkr?.addEventListener('click', () => setTab(false));

    const toggleEmp = () => {
      if (!eSubmit) return;
      const ok = ( $('e_company') as HTMLInputElement )?.value &&
                 ( $('e_email')   as HTMLInputElement )?.value &&
                 ( $('e_consent') as HTMLInputElement )?.checked;
      eSubmit.disabled = !ok;
    };
    const toggleWkr = () => {
      if (!wSubmit) return;
      const ok = ( $('w_name') as HTMLInputElement )?.value &&
                 ( $('w_email')as HTMLInputElement )?.value &&
                 ( $('w_consent') as HTMLInputElement )?.checked;
      wSubmit.disabled = !ok;
    };
    ['e_company','e_email','e_consent'].forEach(id => $(id)?.addEventListener('input', toggleEmp));
    ['w_name','w_email','w_consent'].forEach(id => $(id)?.addEventListener('input', toggleWkr));
    toggleEmp(); toggleWkr();

    // Demo submit handlers (replace with your webhook)
    empForm?.addEventListener('submit', (e) => { e.preventDefault(); alert('Employer application submitted (demo).'); });
    wkrForm?.addEventListener('submit',  (e) => { e.preventDefault(); alert('Worker application submitted (demo).'); });

    update();
  }, []);

  return (
    <main className="bg-slate-50 text-slate-900">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur border-b border-slate-200">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-xl bg-blue-600 text-white grid place-items-center font-extrabold">RG</div>
            <span className="font-semibold">Reverse Glassdoor for Trades</span>
          </div>
          <nav className="hidden md:flex items-center gap-6 text-sm text-slate-600">
            <a href="#how" className="hover:text-slate-900">How it works</a>
            <a href="#scorecard" className="hover:text-slate-900">Scorecard</a>
            <a href="#pilot" className="hover:text-slate-900">Join pilot</a>
          </nav>
        </div>
      </header>

      {/* Hero (black) */}
      <section className="bg-black text-white">
        <div className="max-w-6xl mx-auto px-4 py-16 md:py-24 grid md:grid-cols-2 gap-10 items-center">
          <div>
            <h1 className="text-4xl md:text-5xl font-extrabold leading-tight">Hire by proof, not promises.</h1>
            <p className="mt-4 text-lg text-slate-300">
              A shared, portable track record for techs and subs—built from verified jobs. Cut no-shows and callbacks. Fill shifts faster.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <a href="#pilot" className="bg-white text-blue-700 hover:bg-blue-50 font-semibold px-5 py-3 rounded-xl shadow">Join the closed pilot</a>
              <a href="#scorecard" className="bg-white/10 hover:bg-white/20 border border-white/30 px-5 py-3 rounded-xl">Try the scorecard</a>
            </div>
            <p className="mt-4 text-sm text-slate-300">Chicago metro • HVAC/Electrical/Plumbing in v1 • Worker-owned profiles</p>
          </div>

          <div className="bg-white/10 rounded-2xl p-6 border border-white/20 shadow-lg">
            <h3 className="font-semibold mb-3">Overall Reputation</h3>
            <ul className="grid grid-cols-2 gap-3 text-sm">
              <li className="p-3 rounded-xl bg-white/10 border border-white/20">Reliability: on-time %, no-shows</li>
              <li className="p-3 rounded-xl bg-white/10 border border-white/20">Quality: callbacks, punchlist</li>
              <li className="p-3 rounded-xl bg-white/10 border border-white/20">Safety: incidents, PPE</li>
              <li className="p-3 rounded-xl bg-white/10 border border-white/20">Comms: professionalism</li>
            </ul>
            <p className="mt-3 text-xs text-slate-300">Structured reviews only • Dispute & response flow • Consent-based data</p>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="how" className="max-w-6xl mx-auto px-4 py-16">
        <h2 className="text-2xl md:text-3xl font-bold">How it works</h2>
        <div className="mt-6 grid md:grid-cols-3 gap-6">
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
            <h3 className="font-semibold">Verify</h3>
            <p className="mt-2 text-sm text-slate-600">ID + license check. Reviews only accepted if tied to a real job ticket.</p>
          </div>
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
            <h3 className="font-semibold">Review</h3>
            <p className="mt-2 text-sm text-slate-600">Structured rubric per job: reliability, quality, safety, communication.</p>
          </div>
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
            <h3 className="font-semibold">Aggregate</h3>
            <p className="mt-2 text-sm text-slate-600">Recent jobs weigh more. Workers keep their reputation across shops.</p>
          </div>
        </div>
      </section>

      {/* Scorecard */}
      <section id="scorecard" className="bg-white border-y border-slate-200">
        <div className="max-w-6xl mx-auto px-4 py-16">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl md:text-3xl font-bold">Structured scorecard (live demo)</h2>
            <div className="inline-flex items-center gap-2 text-sm">
              <span className="px-3 py-1 rounded-full bg-slate-100 text-slate-700 border">Schema v1</span>
              <span className="px-3 py-1 rounded-full bg-slate-100 text-slate-700 border">Export JSON</span>
            </div>
          </div>

          <div className="mt-8 grid lg:grid-cols-2 gap-8 items-start">
            {/* Form */}
            <form id="empFormX" className="bg-slate-50 rounded-2xl p-6 border border-slate-200">
              <div className="grid sm:grid-cols-2 gap-4">
                <label className="flex flex-col gap-1 text-sm"><span className="font-medium">Worker name</span><input id="f_worker" className="px-3 py-2 rounded-lg border border-slate-300" placeholder="Jane Tech" /></label>
                <label className="flex flex-col gap-1 text-sm"><span className="font-medium">Trade</span>
                  <select id="f_trade" className="px-3 py-2 rounded-lg border border-slate-300">
                    <option>HVAC</option><option>Electrical</option><option>Plumbing</option><option>General Contractor</option><option>Carpentry</option><option>Roofing</option>
                  </select>
                </label>
                <label className="flex flex-col gap-1 text-sm"><span className="font-medium">Role</span>
                  <select id="f_role" className="px-3 py-2 rounded-lg border border-slate-300">
                    <option>Tech</option><option>Apprentice</option><option>Journeyman</option><option>Master</option><option>Installer</option><option>Foreman</option>
                  </select>
                </label>
                <label className="flex flex-col gap-1 text-sm"><span className="font-medium">Job date</span><input id="f_date" type="date" className="px-3 py-2 rounded-lg border border-slate-300" /></label>
                <label className="flex flex-col gap-1 text-sm"><span className="font-medium">Job type</span>
                  <select id="f_type" className="px-3 py-2 rounded-lg border border-slate-300">
                    <option>Service Call</option><option>Install</option><option>Rough-in</option><option>Finish</option><option>Emergency</option><option>Maintenance</option>
                  </select>
                </label>
                <label className="flex flex-col gap-1 text-sm"><span className="font-medium">Minutes late (0 if on time)</span><input id="f_late" type="number" min={0} max={60} defaultValue={0} className="px-3 py-2 rounded-lg border border-slate-300" /></label>
                <label className="inline-flex items-center gap-2 text-sm mt-1"><input id="f_noshow" type="checkbox" className="h-4 w-4 rounded border-slate-300" /><span>No-show</span></label>
                <label className="inline-flex items-center gap-2 text-sm mt-1"><input id="f_callback" type="checkbox" className="h-4 w-4 rounded border-slate-300" /><span>Callback occurred</span></label>
                <label className="inline-flex items-center gap-2 text-sm mt-1"><input id="f_punch" type="checkbox" defaultChecked className="h-4 w-4 rounded border-slate-300" /><span>Punchlist fully resolved</span></label>
                <label className="flex flex-col gap-1 text-sm"><div className="flex items-center justify-between"><span className="font-medium">Workmanship (1–5)</span><span id="v_work" className="text-xs text-slate-500">4</span></div><input id="f_work" type="range" min={1} max={5} defaultValue={4} step={1} className="accent-blue-600" /></label>
                <label className="inline-flex items-center gap-2 text-sm mt-1"><input id="f_incident" type="checkbox" className="h-4 w-4 rounded border-slate-300" /><span>Safety incident</span></label>
                <label className="flex flex-col gap-1 text-sm"><div className="flex items-center justify-between"><span className="font-medium">PPE adherence (1–5)</span><span id="v_ppe" className="text-xs text-slate-500">5</span></div><input id="f_ppe" type="range" min={1} max={5} defaultValue={5} step={1} className="accent-blue-600" /></label>
                <label className="flex flex-col gap-1 text-sm"><div className="flex items-center justify-between"><span className="font-medium">Professionalism (1–5)</span><span id="v_prof" className="text-xs text-slate-500">4</span></div><input id="f_prof" type="range" min={1} max={5} defaultValue={4} step={1} className="accent-blue-600" /></label>
                <label className="flex flex-col gap-1 text-sm"><div className="flex items-center justify-between"><span className="font-medium">Customer rating (1–5)</span><span id="v_cs" className="text-xs text-slate-500">4</span></div><input id="f_cs" type="range" min={1} max={5} defaultValue={4} step={1} className="accent-blue-600" /></label>
              </div>
              <label className="flex flex-col gap-1 text-sm mt-2"><span className="font-medium">Notes (optional, 240 char max)</span><textarea id="f_notes" maxLength={240} className="px-3 py-2 rounded-lg border border-slate-300 min-h-[90px]" /></label>
              <p className="text-xs text-slate-500 mt-2">Submitting this review implies you have consent and a job record on file. For hiring use, follow FCRA adverse-action steps.</p>
            </form>

            {/* Output */}
            <div className="space-y-4">
              <div className="bg-white rounded-2xl p-6 border border-slate-200">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold">Composite score</h3>
                  <span className="text-xs text-slate-500">Rel 30% · Qual 35% · Safety 15% · Comms 20%</span>
                </div>
                <div className="mt-4 flex items-center gap-4">
                  <div className="relative h-3 w-full rounded-full bg-slate-100">
                    <div id="bar" className="absolute inset-y-0 left-0 rounded-full bg-emerald-500" style={{ width: '0%' }} />
                  </div>
                  <div className="min-w-[110px] text-right">
                    <div id="pct" className="text-2xl font-extrabold">0</div>
                    <div id="band" className="text-xs uppercase tracking-wide text-slate-500">—</div>
                  </div>
                </div>
                <ul className="mt-4 grid grid-cols-2 gap-2 text-sm text-slate-700">
                  <li className="flex justify-between"><span>Reliability</span><span id="s_rel">–/5</span></li>
                  <li className="flex justify-between"><span>Quality</span><span id="s_qual">–/5</span></li>
                  <li className="flex justify-between"><span>Safety</span><span id="s_safe">–/5</span></li>
                  <li className="flex justify-between"><span>Comms</span><span id="s_comms">–/5</span></li>
                </ul>
              </div>

              <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200">
                <div className="flex items-center justify-between">
                  <h4 className="font-semibold">JSON export</h4>
                  <button id="copyBtn" className="text-xs px-3 py-1 rounded-lg border bg-white hover:bg-slate-50">Copy</button>
                </div>
                <pre id="jsonOut" className="mt-2 text-xs overflow-auto max-h-72 whitespace-pre-wrap"></pre>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Pilot */}
      <section id="pilot" className="max-w-6xl mx-auto px-4 py-16">
        <h2 className="text-2xl md:text-3xl font-bold">Join the Chicago pilot</h2>
        <p className="mt-2 text-slate-600">We’re onboarding 20–30 shops and 150–300 workers. Zero cost during pilot. Data stays portable to workers.</p>

        <div className="mt-6 inline-flex rounded-xl bg-slate-100 p-1">
          <button id="tabEmp" className="px-4 py-2 rounded-lg text-sm font-medium bg-white shadow border">For Shops / GCs</button>
          <button id="tabWkr" className="px-4 py-2 rounded-lg text-sm font-medium text-slate-600">For Workers</button>
        </div>

        <div className="mt-8 grid lg:grid-cols-2 gap-8 items-start">
          <div className="bg-white rounded-2xl p-6 border border-slate-200">
            {/* Employer form */}
            <form id="empForm" className="grid sm:grid-cols-2 gap-4">
              <label className="flex flex-col gap-1 text-sm"><span className="font-medium">Company name</span><input id="e_company" className="px-3 py-2 rounded-lg border border-slate-300" required /></label>
              <label className="flex flex-col gap-1 text-sm"><span className="font-medium">Contact name</span><input id="e_contact" className="px-3 py-2 rounded-lg border border-slate-300" required /></label>
              <label className="flex flex-col gap-1 text-sm"><span className="font-medium">Email</span><input id="e_email" type="email" className="px-3 py-2 rounded-lg border border-slate-300" required /></label>
              <label className="flex flex-col gap-1 text-sm"><span className="font-medium">Phone</span><input id="e_phone" className="px-3 py-2 rounded-lg border border-slate-300" /></label>
              <label className="flex flex-col gap-1 text-sm"><span className="font-medium">Primary trade</span>
                <select id="e_trade" className="px-3 py-2 rounded-lg border border-slate-300">
                  <option>HVAC</option><option>Electrical</option><option>Plumbing</option><option>General Contractor</option><option>Carpentry</option><option>Roofing</option>
                </select>
              </label>
              <label className="flex flex-col gap-1 text-sm"><span className="font-medium">Metro</span><input id="e_metro" defaultValue="Chicago, IL" className="px-3 py-2 rounded-lg border border-slate-300" /></label>
              <label className="flex flex-col gap-1 text-sm"><span className="font-medium"># of field staff</span>
                <select id="e_head" className="px-3 py-2 rounded-lg border border-slate-300"><option>1-5</option><option>6-15</option><option>16-30</option><option>31-60</option><option>60+</option></select>
              </label>
              <label className="flex flex-col gap-1 text-sm sm:col-span-2"><span className="font-medium">Dispatch/CRM tools (optional)</span><input id="e_tools" className="px-3 py-2 rounded-lg border border-slate-300" /></label>
              <div className="sm:col-span-2 flex items-center justify-between mt-2">
                <label className="inline-flex items-center gap-2 text-sm"><input id="e_consent" type="checkbox" className="h-4 w-4" /><span>I agree to be contacted about the pilot</span></label>
                <button className="px-4 py-2 rounded-lg bg-blue-600 text-white font-semibold disabled:opacity-50" disabled id="e_submit">Apply</button>
              </div>
            </form>

            {/* Worker form */}
            <form id="wkrForm" className="hidden grid sm:grid-cols-2 gap-4">
              <label className="flex flex-col gap-1 text-sm"><span className="font-medium">Full name</span><input id="w_name" className="px-3 py-2 rounded-lg border border-slate-300" required /></label>
              <label className="flex flex-col gap-1 text-sm"><span className="font-medium">Email</span><input id="w_email" type="email" className="px-3 py-2 rounded-lg border border-slate-300" required /></label>
              <label className="flex flex-col gap-1 text-sm"><span className="font-medium">Phone</span><input id="w_phone" className="px-3 py-2 rounded-lg border border-slate-300" /></label>
              <label className="flex flex-col gap-1 text-sm"><span className="font-medium">Trade</span>
                <select id="w_trade" className="px-3 py-2 rounded-lg border border-slate-300">
                  <option>HVAC</option><option>Electrical</option><option>Plumbing</option><option>General Contractor</option><option>Carpentry</option><option>Roofing</option>
                </select>
              </label>
              <label className="flex flex-col gap-1 text-sm"><span className="font-medium">Years experience</span><input id="w_years" type="number" min={0} max={50} defaultValue={1} className="px-3 py-2 rounded-lg border border-slate-300" /></label>
              <label className="flex flex-col gap-1 text-sm"><span className="font-medium">Home ZIP</span><input id="w_zip" className="px-3 py-2 rounded-lg border border-slate-300" /></label>
              <label className="flex flex-col gap-1 text-sm"><span className="font-medium">Radius willing to travel (mi)</span><input id="w_radius" type="number" min={5} max={100} defaultValue={20} className="px-3 py-2 rounded-lg border border-slate-300" /></label>
              <div className="sm:col-span-2 flex items-center justify-between mt-2">
                <label className="inline-flex items-center gap-2 text-sm"><input id="w_consent" type="checkbox" className="h-4 w-4" /><span>I agree to be contacted about the pilot</span></label>
                <button className="px-4 py-2 rounded-lg bg-blue-600 text-white font-semibold disabled:opacity-50" disabled id="w_submit">Apply</button>
              </div>
            </form>
          </div>

          <div className="bg-slate-50 rounded-2xl p-6 border border-slate-200">
            <h3 className="font-semibold">What you get in pilot</h3>
            <ul className="mt-3 space-y-3 text-slate-700 text-sm">
              <li>Structured scorecard + composite reputation</li>
              <li>Search & discovery in Chicago metro</li>
              <li>License verification (credits included)</li>
              <li>Dispute & response workflow</li>
              <li>CSV import of last 90 days jobs (optional)</li>
            </ul>
            <p className="mt-4 text-xs text-slate-500">By applying, you agree to be contacted and to our pilot terms. For hiring decisions, you’ll use consent-based checks and follow FCRA guidelines.</p>
          </div>
        </div>
      </section>

      <footer className="border-t border-slate-200">
        <div className="max-w-6xl mx-auto px-4 py-8 text-sm text-slate-600 flex flex-col md:flex-row items-center justify-between gap-3">
          <p>© <span id="year" /> Reverse Glassdoor for Trades</p>
          <div className="flex items-center gap-4">
            <a className="hover:text-slate-900" href="#">Privacy</a>
            <a className="hover:text-slate-900" href="#">Terms</a>
            <a className="hover:text-slate-900" href="#scorecard">Scorecard</a>
          </div>
        </div>
      </footer>
    </main>
  );
}
