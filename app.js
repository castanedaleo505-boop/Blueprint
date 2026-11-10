/* Blueprint. One file, no libraries. All data stays in this phone's localStorage. */
(function () {
'use strict';

var KEY = 'blueprint.v1', PLAN_REV = 3;
var DN = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
var DNF = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
var MON = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
var ALL = [0, 1, 2, 3, 4, 5, 6];
var EVL = { strong: 'Strong', moderate: 'Moderate', limited: 'Limited', habit: 'Habit' };
var PHN = { 1: 'Weeks 1–2', 2: 'Weeks 3–4', 3: 'Week 5 on' };
var DEF_START = '2026-11-09';

/* ---------- helpers ---------- */
function $(s, r) { return (r || document).querySelector(s); }
function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
function pad(n) { return n < 10 ? '0' + n : '' + n; }
function dkey(d) { return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()); }
function parseKey(k) { var p = k.split('-'); return new Date(+p[0], +p[1] - 1, +p[2]); }
function addDays(d, n) { return new Date(d.getFullYear(), d.getMonth(), d.getDate() + n); }
function mondayOf(d) { var x = new Date(d.getFullYear(), d.getMonth(), d.getDate()); return addDays(x, -((x.getDay() + 6) % 7)); }
function fmtMD(d) { return MON[d.getMonth()] + ' ' + d.getDate(); }
function diffDays(aKey, bKey) { return Math.round((parseKey(bKey) - parseKey(aKey)) / 864e5); }
function validKey(k) { return typeof k === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(k) && !isNaN(parseKey(k).getTime()); }
function uid() { return 's' + Math.random().toString(36).slice(2, 8); }

/* ---------- the plan ----------
   d  = days the step shows up in the FULL phase (0 = Sunday ... 6 = Saturday)
   dp = optional day lists for weeks 1-2 (phase 1) and weeks 3-4 (phase 2), so the heavier things ease in
   f  = first day it appears, counted in days after the start date (so new actives start one at a time)
   sa = skip this step the day after the step with this id is scheduled (the stamp)
   sd = skip this step on the same day the step with this id is scheduled
   nl = leave it out of the "Not today" list;  wk = short label for the Week grid
   k  = c (check off) or s (sets with a weight);  e = evidence: strong / moderate / limited / habit
   No clock times anywhere: do things in this order, whenever your day allows. */
function defaultPlan() {
  var B = [
    { id: 'am', n: 'Morning', t: '' },
    { id: 'gym', n: 'Training', t: '' },
    { id: 'shower', n: 'Post-gym shower', t: '' },
    { id: 'mid', n: 'Midday', t: '' },
    { id: 'eve', n: 'Evening', t: '' },
    { id: 'bed', n: 'Before bed', t: '' }
  ];
  var LIFT = 'Your sets, reps and weights are in Redline. This line just keeps the day in order.';
  var S = [
    /* morning */
    { id: 'a1', b: 'am', n: 'Brush teeth', a: '2 min', o: 'Fluoride toothpaste. Soft brush, small circles along the gumline.', e: 'strong', en: 'Standard dental advice.', d: ALL, k: 'c' },
    { id: 'a2', b: 'am', n: 'Chin tucks', a: '10 reps, hold 5 sec each', o: 'Back and head against a wall. Pull your chin straight back, like making a double chin. Don’t tilt your head down. It’s a posture habit, so the daily reps matter more than the effort.', e: 'moderate', en: 'Exercise improves forward head posture in reviews of trials. Claims about raising the hyoid bone are not proven.', d: ALL, k: 'c' },

    /* training */
    { id: 'g0', b: 'gym', n: 'Band pull-aparts', a: '2 × 20, warm-up', o: 'Light band, arms straight out at shoulder height. Pull the band apart until it touches your chest and squeeze your shoulder blades for 1 second. No shrugging. Do them before your first lift.', e: 'moderate', en: 'Strengthening the muscles between the shoulder blades is part of the exercise programs that improved rounded-shoulder and head posture in small trials.', d: [1, 2, 3, 4, 5, 6], k: 'c' },
    { id: 't4', b: 'gym', n: 'Lift: shoulders + arms (heavy)', a: 'Open Redline', o: LIFT, e: 'habit', en: 'Your lifting split.', d: [4], k: 'c', nl: 1, wk: 'S+A' },
    { id: 't5', b: 'gym', n: 'Lift: chest + back + biceps', a: 'Open Redline', o: LIFT + ' Face pulls are already in this day.', e: 'habit', en: 'Your lifting split.', d: [5], k: 'c', nl: 1, wk: 'C+B' },
    { id: 't6', b: 'gym', n: 'Lift: legs + calves + arm finisher', a: 'Open Redline', o: LIFT, e: 'habit', en: 'Your lifting split.', d: [6], k: 'c', nl: 1, wk: 'LEG' },
    { id: 't0', b: 'gym', n: 'Rest day: easy walk', a: '30–60 min, easy pace', o: 'No gym today. A long easy walk, and stretch if you want to.', e: 'habit', en: 'Recovery day in your split.', d: [0], k: 'c', nl: 1, wk: 'OFF' },
    { id: 't1', b: 'gym', n: 'Lift: shoulders + arms (volume)', a: 'Open Redline', o: LIFT, e: 'habit', en: 'Your lifting split.', d: [1], k: 'c', nl: 1, wk: 'S+A' },
    { id: 't2', b: 'gym', n: 'Lift: back + chest + biceps', a: 'Open Redline', o: LIFT, e: 'habit', en: 'Your lifting split.', d: [2], k: 'c', nl: 1, wk: 'B+C' },
    { id: 't3', b: 'gym', n: 'Lift: legs + calves + arm pump', a: 'Open Redline', o: LIFT, e: 'habit', en: 'Your lifting split.', d: [3], k: 'c', nl: 1, wk: 'LEG' },
    { id: 'g4', b: 'gym', n: 'Face pulls', a: '3 × 15, light', o: 'Rope at upper-chest height. Pull to your forehead with your hands apart and elbows high, and squeeze your shoulder blades. Light weight, no swinging. Friday’s face pulls are already in your Redline back day, so this adds a second day.', e: 'limited', en: 'No trial tests face pulls for posture. Studies on similar pulling moves show the rear delts, rhomboids and lower traps working. Low risk, so it stays.', d: [2], k: 'c' },
    { id: 'g1', b: 'gym', n: 'Neck flexion', a: '3 sets × 12–15 reps', o: 'Lie face up, plate or harness on your forehead. Tuck your chin toward your chest, slow. Weeks 1–2: Mon + Fri only, with a light weight (5–10 lb). After that: Mon, Wed, Fri. Add 2.5 lb whenever you hit 15 reps on all 3 sets. That is what grows the neck. Stop for tingling, sharp pain or dizziness.', e: 'moderate', en: 'Any trained muscle grows with added load. Neck-specific studies are small.', d: [1, 3, 5], dp: { 1: [1, 5] }, k: 's', s: 3 },
    { id: 'g2', b: 'gym', n: 'Neck extension', a: '3 sets × 12–15 reps', o: 'Face down on a bench, head off the edge, plate or harness behind your head. Slow lift, slow lower. No jerking. Same progression as flexion.', e: 'moderate', en: 'Same as above. Go lighter than you think.', d: [1, 3, 5], dp: { 1: [1, 5] }, k: 's', s: 3 },
    { id: 'g3', b: 'gym', n: 'Neck side raise', a: '3 sets × 12–15 reps each side', o: 'Lie on your side, weight on the side of your head, lift your ear toward your shoulder. Do both sides before you check off a set.', e: 'moderate', en: 'Same as above.', d: [1, 3, 5], dp: { 1: [1, 5] }, k: 's', s: 3 },

    /* post-gym shower */
    { id: 's1', b: 'shower', n: 'Nizoral on scalp', a: 'Quarter-size, scalp only', o: 'Wet hair with warm water, not hot. Work it into the scalp with your fingertips, not your nails. Leave it 3–5 min while you wash your body, then rinse at least 30 seconds, until there’s no slippery feel. Weeks 1–4: Mon + Thu (the label says twice a week for 4 weeks). After that: Mon only. Add Thu back if flakes come back.', e: 'strong', en: 'Ketoconazole is well proven for dandruff.', d: [1], dp: { 1: [1, 4], 2: [1, 4] }, k: 'c' },
    { id: 's2', b: 'shower', n: 'Rinse hair, no shampoo', a: 'Warm water, about 1 min', o: 'Your scalp is dry and coarse hair dries out fast, so shampoo only on the Nizoral days. Change this in Edit if you want to shampoo more.', e: 'limited', en: 'Shampooing less often is common advice for dry scalps.', d: [2, 3, 4, 5, 6], dp: { 1: [2, 3, 5, 6], 2: [2, 3, 5, 6] }, k: 'c' },
    { id: 's3', b: 'shower', n: 'SheaMoisture conditioner', a: 'Golf-ball size, mid-length to ends', o: 'Keep it off the roots. Leave it 2–3 min, then rinse with cool water. Hot water dries skin and scalp.', e: 'moderate', en: 'Conditioner reduces friction and breakage in coarse hair.', d: [1, 2, 3, 4, 5, 6], k: 'c' },
    { id: 's3m', b: 'shower', n: 'Hair mask with shower cap', a: 'SheaMoisture, golf-ball size, 10 min', o: 'Sunday replaces the normal conditioner. Work it through mid-length to ends, put the shower cap on and leave it 10 min. Body heat helps it soak into coarse hair. Finish with a cool rinse.', e: 'limited', en: 'A common fix for dry coarse hair. Not well studied.', d: [0], k: 'c' },
    { id: 's4', b: 'shower', n: 'Wash face + beard', a: 'Dime-size cleanser, 30–60 sec', o: 'Gentle cleanser (Vanicream or CeraVe Hydrating), lukewarm water. Water only until you have one. Pat dry with a clean towel.', e: 'habit', en: 'Basic hygiene. Any gentle cleanser works.', d: ALL, k: 'c' },
    { id: 's5', b: 'shower', n: 'Cantu leave-in', a: 'Quarter-size on damp hair', o: 'Blot your hair with a T-shirt or towel first. Squeeze, don’t rub. Then rake it through, mostly the lengths.', e: 'habit', en: 'Product routine. Not a proven effect.', d: ALL, k: 'c' },
    { id: 's6', b: 'shower', n: 'Argan oil', a: '2–3 drops', o: 'Warm between your palms. Smooth over the lengths and ends, not the roots or scalp.', e: 'limited', en: 'Helps with shine and frizz. Limited research.', d: ALL, k: 'c' },
    { id: 's6b', b: 'shower', n: 'Pomade + style', a: 'Dime-size, warmed in your palms', o: 'Comb straight back, set the part, then leave it alone 10–15 min while it air-dries. No blow dryer. Skip this line if you don’t use pomade.', e: 'habit', en: 'Styling. No health effect.', d: ALL, k: 'c' },
    { id: 's7', b: 'shower', n: 'Azelaic acid 10%', a: 'Pea-size, thin layer over face', o: 'Clean, dry skin. Forehead, nose and cheeks. Keep it off the eyes and the beard zone at first. Mild tingling for the first 2 weeks is normal. Skipped the morning after a stamp night.', f: 3, sa: 'b4', e: 'moderate', en: 'Well studied for redness, acne and dark marks. You don’t have much acne, so expect a modest effect. It also helps keep dark marks from the stamping and adapalene in check.', d: ALL, k: 'c' },
    { id: 's8', b: 'shower', n: 'Minoxidil 5% beard', a: '1 mL (dropper to the line) or ½ capful foam', o: 'Beard fully dry first. Spread with your fingertips over the cheeks, mustache, goatee and chin. Wash your hands, then give it 10–15 min to dry before moisturizer. Off-label for beards. Label max is twice a day, and this plan uses that. Skipped the morning after a stamp night.', sa: 'b4', e: 'moderate', en: 'One randomized trial (48 men, 16 weeks, 3% twice daily) beat placebo on hair count. Side effects: dryness, itching, hair in unintended spots. Results need daily use for months.', d: ALL, k: 'c' },
    { id: 's9', b: 'shower', n: 'Minoxidil 2% brows', a: '1 swab or spoolie dip per brow', o: 'Brow only, on the brow line. Keep it out of your eyes. If your eyelids swell or your eyes sting, stop. Wash your hands after.', e: 'limited', en: 'One small trial and many personal accounts. Off-label.', d: ALL, k: 'c' },
    { id: 's10', b: 'shower', n: 'Moisturizer', a: '2 pea-sizes, face + neck', o: 'Fragrance-free (Vanicream Daily Facial Moisturizer). Wait until the minoxidil is dry. It also stops the flaking minoxidil can cause under a beard.', e: 'habit', en: 'Basic barrier care.', d: ALL, k: 'c' },
    { id: 's11', b: 'shower', n: 'SPF 30+', a: '2 finger-lengths: face, neck, ears', o: 'Broad-spectrum, every day. Tinted mineral with iron oxides is best. It protects everything else in this plan, and sun is what turns stamp and adapalene irritation into dark spots.', e: 'strong', en: 'The best-proven anti-aging and skin-cancer step there is.', d: ALL, k: 'c' },
    { id: 's12', b: 'shower', n: 'Neckline clean-up only', a: 'Once a week', o: 'Neckline about 1–2 finger-widths above your Adam’s apple, curved. Leave the rest of the beard alone so it can fill in. Skip it until you have a trimmer.', e: 'habit', en: 'Grooming habit. A clean neckline makes the jaw look sharper.', d: [0], k: 'c' },

    /* midday */
    { id: 'm1', b: 'mid', n: 'Reapply SPF', a: 'Face, neck, ears', o: 'If you’ve been outside, or driving in daylight for a couple of hours. Skip it on a day you stayed inside.', e: 'strong', en: 'Sunscreen wears off in about 2 hours of sun.', d: ALL, k: 'c' },
    { id: 'm2', b: 'mid', n: 'Chin tucks', a: '10 reps, hold 5 sec each', o: 'You can do these in the car seat with your head against the headrest.', e: 'moderate', en: 'See the morning set.', d: ALL, k: 'c' },
    { id: 'm3', b: 'mid', n: 'Posture stretches', a: 'About 4 min, all three', o: 'Doorway chest stretch: forearm on the frame, step through, 2 × 30 sec each side. Side-neck stretch: ear toward shoulder, 30 sec each side, no pulling. Thoracic extension: sit tall, hands behind your head, arch over the chair back, 10 slow reps.', e: 'moderate', en: 'Programs that combine strengthening and stretching improved forward head posture in trials. Most are small and short.', d: ALL, k: 'c' },
    { id: 'm4', b: 'mid', n: 'Daylight', a: '10+ min outside', o: 'Any time the sun is up. Daylight helps set your body clock, which helps sleep.', e: 'moderate', en: 'Daytime light supports sleep timing. Basic health, not a looks trick.', d: ALL, k: 'c' },

    /* evening */
    { id: 'e1', b: 'eve', n: 'Magnesium glycinate', a: '200–250 mg elemental magnesium', o: 'Glycinate is gentle on the stomach. Avoid magnesium oxide.', e: 'moderate', en: 'Small trials show better sleep scores. It works for you.', d: ALL, k: 'c' },
    { id: 'e2', b: 'eve', n: 'Amber glasses on', a: '2–3 hours before you sleep', o: 'Clear “blue light” computer glasses don’t do the same thing. Keep the amber ones.', e: 'limited', en: 'Small, mixed trials. It works for you.', d: ALL, k: 'c' },

    /* before bed */
    { id: 'b1', b: 'bed', n: 'Brush + floss', a: '2 min brushing, then floss', o: 'Floss first, then brush. Don’t rinse after brushing.', e: 'strong', en: 'Standard dental advice.', d: ALL, k: 'c' },
    { id: 'b2', b: 'bed', n: 'Wash face + beard', a: 'Dime-size cleanser, 60 sec', o: 'Lukewarm water. Pat dry and let your skin dry fully before adapalene or minoxidil.', e: 'habit', en: 'Basic hygiene.', d: ALL, k: 'c' },
    { id: 'b3', b: 'bed', n: 'Sanitize the dermastamp', a: '70% isopropyl alcohol, 1 min', o: 'Soak or spray the head, let it air dry. Do it before and again after stamping. Never share it. Replace the head after 10–15 uses, or when it feels dull or tugs.', f: 24, e: 'strong', en: 'Basic infection control.', d: [0], k: 'c' },
    { id: 'b4', b: 'bed', n: 'Dermastamp beard, jaw, lower cheeks', a: '0.5 mm, once a week', o: 'Press and lift, don’t drag. First 2 sessions: about 10 presses per zone. After that: about 20. Stop at light pink. Skip tonight if the last session is still pink or sore. Never on brows, eyelids, active breakouts, cold sores, cuts or sunburn. After: rinse, plain moisturizer only, no beard minoxidil until tomorrow night. If your stamp can’t go below 1.0 mm, use it every 4 weeks, not weekly.', f: 24, e: 'limited', en: 'Microneedling plus minoxidil beat minoxidil alone for scalp hair in a 12-week trial. Nobody has tested depth or schedule for the beard. Weekly is the top of what at-home guides allow at 0.5 mm.', d: [0], k: 'c' },
    { id: 'b5', b: 'bed', n: 'Adapalene 0.1%', a: 'Pea-size: forehead, nose, upper cheeks only', o: 'Dry skin only, so wait 15 min after washing. Keep it off the beard zone, brows, eyelids, nostrils and mouth corners. The beard zone is what you stamp, and guides say no retinoid on stamped skin for 5–7 days before and 3–5 days after, so this split lets both run. Starts 3 nights a week, then 4, then 5. Not on stamp night or the night after. Peeling in the first month is normal.', f: 10, e: 'strong', en: 'Retinoids are the best-studied skin ingredient for texture and aging. Adapalene is the gentler over-the-counter one. Gains show from about week 4 to 12.', d: [2, 3, 4, 5, 6], dp: { 1: [2, 4, 6], 2: [2, 3, 4, 6] }, k: 'c' },
    { id: 'b6', b: 'bed', n: 'Minoxidil 5% beard', a: '1 mL (dropper to the line) or ½ capful foam', o: 'Beard fully dry first. Let it dry before you lie down, at least 30 min, or it ends up on the pillow. Skipped on stamp night only. Wash your hands after.', sd: 'b4', e: 'moderate', en: 'Same as the morning dose.', d: ALL, k: 'c' },
    { id: 'b7', b: 'bed', n: 'Minoxidil 2% brows', a: '1 swab or spoolie dip per brow', o: 'Brow only. Keep it out of your eyes.', e: 'limited', en: 'Same as the morning dose.', d: ALL, k: 'c' },
    { id: 'b8', b: 'bed', n: 'Moisturizer', a: '2 pea-sizes, face + neck', o: 'Wait until the minoxidil is dry. You can put it on over the adapalene if your skin is irritated.', e: 'habit', en: 'Basic barrier care.', d: ALL, k: 'c' },
    { id: 'b9', b: 'bed', n: 'Mouth tape + nasal strip on', a: 'Last step, once your nose is clear', o: 'If you’re stuffed up, skip the tape that night.', e: 'habit', en: 'It works for you.', d: ALL, k: 'c' }
  ];
  return { rev: PLAN_REV, blocks: B, steps: S };
}

/* ---------- state ---------- */
var state, todayKey, selKey, weekMon, wvMon, view = 'today', ui = { open: {}, off: false }, edit = { open: {}, phase: 3 }, statusMsg = '';

function freshState() { return { v: 1, plan: defaultPlan(), log: {}, wl: {}, wt: {}, start: DEF_START, hint: false }; }
function validPlan(p) {
  if (!p || !Array.isArray(p.blocks) || !Array.isArray(p.steps)) return false;
  for (var i = 0; i < p.blocks.length; i++) { var b = p.blocks[i]; if (!b || typeof b.id !== 'string' || typeof b.n !== 'string') return false; }
  for (var j = 0; j < p.steps.length; j++) {
    var s = p.steps[j];
    if (!s || typeof s.id !== 'string' || typeof s.n !== 'string' || !Array.isArray(s.d)) return false;
    if (s.k !== 'c' && s.k !== 's') return false;
    if (s.dp != null && (typeof s.dp !== 'object' || Array.isArray(s.dp))) return false;
    if (s.f != null && typeof s.f !== 'number') return false;
    if (!p.blocks.some(function (b) { return b.id === s.b; })) return false;
  }
  return true;
}
function validState(s) {
  return !!s && typeof s === 'object' && s.v === 1 && validPlan(s.plan) && s.log && typeof s.log === 'object' &&
    s.wl && typeof s.wl === 'object' && s.wt && typeof s.wt === 'object' && (s.start == null || validKey(s.start));
}
function fixState(s) {
  if (!validKey(s.start)) s.start = DEF_START;
  delete s.goal; delete s.neck;
  if (!s.plan.rev || s.plan.rev < PLAN_REV) s.plan = defaultPlan();   /* older saved plans get the current one; history stays */
  return s;
}
function load() {
  try { var raw = localStorage.getItem(KEY); if (raw) { var s = JSON.parse(raw); if (validState(s)) return fixState(s); } } catch (e) {}
  return freshState();
}
function save() { try { localStorage.setItem(KEY, JSON.stringify(state)); statusMsg = ''; } catch (e) { statusMsg = 'Could not save. Storage is full or blocked.'; } }

/* ---------- what is due on a day ---------- */
function offset(key) { return Math.max(0, diffDays(state.start, key)); }
function weekNo(key) {
  var w = Math.floor(diffDays(dkey(mondayOf(parseKey(state.start))), dkey(mondayOf(parseKey(key)))) / 7) + 1;
  return Math.max(1, w);
}
function phaseOf(key) { var w = weekNo(key); return w <= 2 ? 1 : (w <= 4 ? 2 : 3); }
function daysFor(s, ph) { return (ph !== 3 && s.dp && Array.isArray(s.dp[ph])) ? s.dp[ph] : s.d; }
function findStep(id) { for (var i = 0; i < state.plan.steps.length; i++) if (state.plan.steps[i].id === id) return state.plan.steps[i]; return null; }
function prevKey(key) { return dkey(addDays(parseKey(key), -1)); }
/* on the calendar for that day, before the skip rules */
function rawDue(s, key) { return daysFor(s, phaseOf(key)).indexOf(parseKey(key).getDay()) >= 0 && offset(key) >= (s.f || 0); }
function stepOn(id, key) { var s = findStep(id); return !!s && rawDue(s, key); }
function stampBefore(key, id) { return key > state.start && stepOn(id, prevKey(key)); }
function skipWhy(s, key) {
  if (s.sa && stampBefore(key, s.sa)) return 'after';
  if (s.sd && stepOn(s.sd, key)) return 'same';
  return '';
}
function due(s, key) { return rawDue(s, key) && !skipWhy(s, key); }
function groupsFor(key) {
  var out = [];
  state.plan.blocks.forEach(function (b) {
    var list = state.plan.steps.filter(function (s) { return s.b === b.id && due(s, key); });
    if (list.length) out.push({ b: b, steps: list });
  });
  return out;
}
function nextDue(s, key) {
  for (var i = 1; i <= 28; i++) { var k = dkey(addDays(parseKey(key), i)); if (due(s, k)) return k; }
  return null;
}
function firstDue(s) {
  for (var i = 0; i <= 120; i++) { var k = dkey(addDays(parseKey(state.start), i)); if (due(s, k)) return k; }
  return null;
}
function backText(nx, key) {
  var d = diffDays(key, nx);
  if (d === 1) return 'tomorrow';
  if (d < 7) return DNF[parseKey(nx).getDay()];
  return DN[parseKey(nx).getDay()] + ' ' + fmtMD(parseKey(nx));
}
function offList(key) {
  var out = [], seen = {};
  state.plan.steps.forEach(function (s) {
    if (s.nl || seen[s.n] || due(s, key)) return;
    var nx = nextDue(s, key); if (!nx) return;
    seen[s.n] = 1;
    var gated = offset(key) < (s.f || 0) && key <= nx;
    out.push({ s: s, nx: nx, txt: gated ? 'Starts ' + DN[parseKey(nx).getDay()] + ' ' + fmtMD(parseKey(nx)) : (skipWhy(s, key) ? 'Skipped today · back ' + backText(nx, key) : 'Back ' + backText(nx, key)) });
  });
  return out;
}
/* steps whose very first day is this day */
function newToday(key) {
  var out = [];
  state.plan.steps.forEach(function (s) {
    if (!(s.f > 0) || !due(s, key)) return;
    for (var j = 1; j <= 60; j++) {
      var k = dkey(addDays(parseKey(key), -j));
      if (k < state.start) break;
      if (due(s, k)) return;
    }
    out.push(s);
  });
  return out;
}

/* ---------- check-offs ---------- */
function nsets(s) { return s.k === 's' ? Math.max(1, s.s || 1) : 1; }
function getDone(key, s) {
  var v = (state.log[key] || {})[s.id], n = nsets(s), a = [], i;
  for (i = 0; i < n; i++) a.push(s.k === 's' ? !!(v && v[i]) : !!v);
  return a;
}
function setDone(key, s, i, on) {
  var l = state.log[key] || (state.log[key] = {});
  if (s.k === 's') {
    var a = Array.isArray(l[s.id]) ? l[s.id].slice() : [];
    while (a.length < nsets(s)) a.push(false);
    a[i] = !!on; l[s.id] = a;
    if (!a.some(Boolean)) delete l[s.id];
  } else {
    if (on) l[s.id] = 1; else delete l[s.id];
  }
  if (!Object.keys(l).length) delete state.log[key];
}
function dayStat(key) {
  var t = 0, d = 0;
  groupsFor(key).forEach(function (g) {
    g.steps.forEach(function (s) { var a = getDone(key, s); t += a.length; d += a.filter(Boolean).length; });
  });
  return { t: t, d: d, pct: t ? Math.round(d * 100 / t) : 0 };
}
function lastWeight(s, beforeKey) {
  var best = null, bk = '';
  Object.keys(state.wl).forEach(function (k) {
    if (k < beforeKey && state.wl[k][s.id] != null && state.wl[k][s.id] !== '' && k > bk) { bk = k; best = state.wl[k][s.id]; }
  });
  return best == null ? null : { k: bk, w: best };
}

/* ---------- render: header ---------- */
var VIEWS = [['today', 'Today'], ['week', 'Week'], ['guide', 'Guide'], ['edit', 'Edit']];
function wkNav(mon, isCur, pa, na, naOff) {
  return '<div class="wk"><button data-act="' + pa + '" aria-label="Previous week">‹</button><div class="lbl">' +
    (isCur ? 'This week' : 'Week of ' + fmtMD(mon)) + ' · ' + fmtMD(mon) + ' – ' + fmtMD(addDays(mon, 6)) +
    '</div><button data-act="' + na + '" aria-label="Next week"' + (naOff ? ' disabled' : '') + '>›</button></div>';
}
function renderHeader() {
  var h = '<div class="top"><div class="brand">Blueprint<i></i></div><div class="seg">' +
    VIEWS.map(function (v) { return '<button data-act="view" data-v="' + v[0] + '" class="' + (view === v[0] ? 'on' : '') + '">' + v[1] + '</button>'; }).join('') +
    '</div></div>';
  var curMon = mondayOf(parseKey(todayKey));
  if (view === 'today') {
    var isCur = dkey(curMon) === dkey(weekMon), i;
    h += wkNav(weekMon, isCur, 'wk-prev', 'wk-next', isCur) + '<div class="tabs">';
    for (i = 0; i < 7; i++) {
      var dt = addDays(weekMon, i), k = dkey(dt), st = dayStat(k);
      h += '<button class="tab' + (k === selKey ? ' on' : '') + (k === todayKey ? ' today' : '') + (st.t && st.d === st.t ? ' hit' : '') + (k > todayKey ? ' fut' : '') + '" data-act="day" data-k="' + k + '">' +
        '<span class="dn">' + DN[dt.getDay()] + '</span><span class="dd">' + dt.getDate() + '</span></button>';
    }
    var s = dayStat(selKey), left = s.t - s.d;
    h += '</div><div class="prog"><div class="row"><span>' + (s.t && !left ? 'All done' : left + ' left') + '</span><b>' + s.d + ' of ' + s.t + '</b></div>' +
      '<div class="bar"><span class="' + (s.t && !left ? 'hit' : '') + '" style="width:' + s.pct + '%"></span></div></div>';
  } else if (view === 'week') {
    h += wkNav(wvMon, dkey(curMon) === dkey(wvMon), 'wv-prev', 'wv-next', false);
  }
  $('#hd').innerHTML = h;
}

/* ---------- render: today ---------- */
var CHECK = '<svg viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="3.2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 12.5l5 5L20 6.5"/></svg>';
var CHEV = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"><path d="M6 9l6 6 6-6"/></svg>';
function renderToday() {
  var dt = parseKey(selKey), dow = dt.getDay(), groups = groupsFor(selKey), fut = selKey > todayKey;
  var h = '<div class="dayhead"><h1>' + DNF[dow] + '</h1><span>' + fmtMD(dt) + (selKey === todayKey ? ' · today' : '') + '</span></div>';
  var nw = newToday(selKey);
  if (nw.length) h += '<div class="flag">New today: ' + esc(nw.map(function (s) { return s.n; }).join(', ')) + '. New things start one at a time, so if your skin reacts you know which one did it.</div>';
  if (stepOn('b4', selKey)) h += '<div class="flag">Stamp night. Dermastamp the beard, jaw and lower cheeks, then plain moisturizer only. No beard minoxidil tonight, and no adapalene tonight or tomorrow night.</div>';
  else if (stampBefore(selKey, 'b4')) h += '<div class="flag">Day after stamping. Skip the azelaic acid and the beard minoxidil this morning. Beard minoxidil comes back tonight. No adapalene tonight.</div>';
  if (!state.hint && !window.navigator.standalone && /iPhone|iPad|iPod/.test(navigator.userAgent)) {
    h += '<div class="hintbar"><span>Tap Share, then Add to Home Screen, to use this like an app.</span><button data-act="hint">Got it</button></div>';
  }
  if (!groups.length) h += '<div class="empty">Nothing planned for this day. Add steps in Edit.</div>';
  groups.forEach(function (g) {
    var done = 0, tot = 0;
    g.steps.forEach(function (s) { var a = getDone(selKey, s); tot += a.length; done += a.filter(Boolean).length; });
    h += '<section class="blk"><div class="bh"><h2>' + esc(g.b.n) + '</h2><span>' + (g.b.t ? esc(g.b.t) + ' · ' : '') + done + '/' + tot + '</span></div>';
    g.steps.forEach(function (s, i) { h += stepCard(s, fut, i + 1); });
    h += '</section>';
  });
  var off = offList(selKey);
  if (off.length) {
    h += '<section class="blk"><button class="offbtn" data-act="off" aria-expanded="' + ui.off + '"><span>Not today</span><span>' + off.length + CHEV + '</span></button>';
    if (ui.off) off.forEach(function (o) { h += '<div class="offrow"><b>' + esc(o.s.n) + '</b><span>' + esc(o.txt) + '</span></div>'; });
    h += '</section>';
  }
  $('#list').innerHTML = h;
  $('#ft').innerHTML = statusMsg ? '<div class="status">' + esc(statusMsg) + '</div>' : '';
}
function details(s) {
  return (s.o ? '<div class="note">' + esc(s.o) + '</div>' : '') +
    '<div class="chips"><span class="ev ' + esc(s.e || 'habit') + '"><i></i>' + (EVL[s.e] || 'Habit') + '</span></div>' +
    (s.en ? '<div class="evn">' + esc(s.en) + '</div>' : '');
}
function stepCard(s, fut, ix) {
  var a = getDone(selKey, s), all = a.every(Boolean), open = !!ui.open[s.id];
  var h = '<div class="step' + (all ? ' done' : '') + (fut ? ' fut' : '') + '" data-id="' + esc(s.id) + '">';
  if (s.k === 's') h += '<div class="chk" aria-hidden="true">' + CHECK + '</div><div class="sm">';
  else h += '<button class="chk" data-act="chk" data-id="' + esc(s.id) + '" aria-label="Mark done">' + CHECK + '</button><div class="sm">';
  h += '<button class="th" data-act="tog" data-id="' + esc(s.id) + '" aria-expanded="' + open + '"><span class="ix">' + ix + '</span><span class="nm">' + esc(s.n) + '</span><span class="car' + (open ? ' up' : '') + '">' + CHEV + '</span></button>';
  if (s.a) h += '<div class="amt">' + esc(s.a) + '</div>';
  if (s.k === 's') {
    var w = (state.wl[selKey] || {})[s.id], lw = lastWeight(s, selKey);
    var pre = w != null && w !== '' ? w : (state.wt[s.id] != null ? state.wt[s.id] : '');
    h += '<div class="sets">';
    a.forEach(function (on, i) { h += '<button class="sb' + (on ? ' on' : '') + '" data-act="set" data-id="' + esc(s.id) + '" data-i="' + i + '" aria-label="Set ' + (i + 1) + '">' + (i + 1) + '</button>'; });
    h += '<div class="wt"><label for="w-' + esc(s.id) + '">lb</label><input id="w-' + esc(s.id) + '" data-w="' + esc(s.id) + '" type="number" inputmode="decimal" step="0.5" min="0" placeholder="0" value="' + esc(pre) + '"></div></div>';
    if (lw) h += '<div class="last">Last time: ' + esc(lw.w) + ' lb (' + fmtMD(parseKey(lw.k)) + ')</div>';
  }
  if (open) h += details(s);
  h += '</div></div>';
  return h;
}

/* ---------- render: week ---------- */
function renderWeek() {
  var keys = [], i;
  for (i = 0; i < 7; i++) keys.push(dkey(addDays(wvMon, i)));
  var h = '<div class="dayhead"><h1>Week</h1><span>What’s planned each day</span></div>';
  h += '<div class="legend"><span><i class="d"></i>Do it</span><span><i class="d skip"></i>Skipped on purpose</span></div>';
  h += '<div class="wg"><div class="wr hdr"><span></span>' + keys.map(function (k) { return '<span class="c' + (k === todayKey ? ' tod' : '') + '">' + DN[parseKey(k).getDay()] + '</span>'; }).join('') + '</div>';
  state.plan.blocks.forEach(function (b) {
    var rows = [], lift = null;
    state.plan.steps.filter(function (s) { return s.b === b.id; }).forEach(function (s) {
      if (s.wk) {
        if (!lift) { lift = { n: 'Training day', cells: keys.map(function () { return ''; }), txt: true }; rows.push(lift); }
        keys.forEach(function (k, j) { if (due(s, k)) lift.cells[j] = s.wk; });
        return;
      }
      var cells = keys.map(function (k) { return due(s, k) ? 'on' : (rawDue(s, k) ? 'skip' : ''); });
      if (cells.some(Boolean)) rows.push({ n: s.n, cells: cells });
    });
    if (!rows.length) return;
    h += '<div class="wr bk"><span>' + esc(b.n) + '</span></div>';
    rows.forEach(function (r) {
      h += '<div class="wr"><span class="wn">' + esc(r.n) + '</span>' + r.cells.map(function (c, j) {
        var tod = keys[j] === todayKey ? ' tod' : '';
        if (r.txt) return '<span class="c' + tod + '"><small>' + esc(c) + '</small></span>';
        return '<span class="c' + tod + '">' + (c ? '<i class="d' + (c === 'skip' ? ' skip' : '') + '"></i>' : '') + '</span>';
      }).join('') + '</div>';
    });
  });
  h += '</div>';
  h += '<p class="fine">Schedule for the dates shown. New things start one at a time and some ease in over the first four weeks, so early weeks have fewer dots. Change any day in Edit.</p>';
  $('#list').innerHTML = h;
  $('#ft').innerHTML = '';
}

/* ---------- render: guide ---------- */
var EXPECT = [
  ['Beard + brows (minoxidil)', 'Fine new hairs around month 1–2. Some people shed a little around month 2–3 before it grows back. Darker, thicker hairs from about month 4–6, so judge it at 6 months, not before. Brows take about 3–4 months. Gains can fade if you stop.'],
  ['Skin (adapalene, azelaic acid, SPF)', 'Dryness and peeling are normal for the first 4 weeks, and weeks 3–6 can look worse before better. Real change in texture and tone by about month 3.'],
  ['Neck', 'Add weight whenever you hit 15 reps on all sets. A thicker neck usually shows up in 2–3 months.'],
  ['Hair + scalp', 'Flakes usually drop in the first few weeks of Nizoral. Softness builds over weeks of conditioner and leave-in, not days.'],
  ['Posture (chin tucks, pull-aparts, stretches)', 'Head and shoulder position shifts over weeks of daily reps. You won’t notice it day to day.']
];
var STOPS = [
  ['Skip the stamp and see a dermatologist if', 'skin is still pink after 3 days, you get scabbing, oozing or pus, dark spots start showing, a cold sore flares, or burning doesn’t fade. Darker skin tones get dark spots more easily, so daily SPF is not optional.'],
  ['Stop minoxidil and call a doctor if', 'you get a racing or pounding heartbeat, chest pain, dizziness or fainting, or swelling of the face, hands, ankles or around the eyes. Ask a doctor or pharmacist first if you have heart problems.'],
  ['Red, itchy rash where minoxidil goes', 'Usually the propylene glycol in the liquid. Stop for a few days, then switch to 5% foam.'],
  ['Peeling, burning or raw skin from adapalene', 'Drop to 1 night a week, add moisturizer, and build back up slowly.'],
  ['Hair growing where you don’t want it', 'You’re using too much or spreading too far. Use less and apply more precisely.'],
  ['Pets', 'Minoxidil is toxic to cats. Keep bottles closed and wash your hands before touching a pet.']
];
var RULES = [
  ['New things start one at a time', 'Azelaic acid, adapalene and the dermastamp each start about a week or more after the last one. If your skin reacts, you know which one did it. The dates are in the list above.'],
  ['Stamp night', 'Stamp the beard zone, then plain moisturizer only. The app skips beard minoxidil that night and the next morning, and skips adapalene that night and the next. Adapalene only ever goes on the upper face, which is why the two can both run.'],
  ['If you miss a minoxidil dose', 'Take the next one on time. Don’t double up. Missed doses are what stall beard results, so do both doses when you travel too.'],
  ['Why SPF every day', 'Adapalene, azelaic acid and stamping all make skin more sun-sensitive, and sun turns irritation into dark spots.'],
  ['Sleep and puffiness, no clock times', 'It helps to eat the last big meal a few hours before bed, keep caffeine to the early part of the day, keep the room cool and dark, and go easy on salt at dinner and on alcohol. A slightly raised head helps with morning puffiness. These are tips, not rules.']
];
var BUY_NOW = [
  ['Tinted mineral sunscreen, SPF 30+', 'EltaMD UV Physical or La Roche-Posay Anthelios Tinted. The most important gap.'],
  ['Gentle face cleanser', 'Vanicream or CeraVe Hydrating.'],
  ['Fragrance-free moisturizer', 'Vanicream Daily Facial Moisturizer. Stops minoxidil flaking.'],
  ['Disposable spoolies', 'About $6. Puts the brow minoxidil on the follicles and not the tips.']
];
var BUY_LATER = [
  ['Creatine monohydrate, 5 g a day', 'Strong evidence for strength and muscle. Plain monohydrate is all you need.'],
  ['Vitamin D3, 2,000 IU a day', 'Worth it through the winter, and more so if a blood test says you’re low.'],
  ['Beard trimmer', 'For the weekly neckline clean-up. A sharp neckline is the fastest jaw upgrade there is.'],
  ['Wedge pillow, 7–7.5 inch', 'Keeps fluid from pooling under the eyes overnight. Limited evidence, cheap.'],
  ['Caffeine eye serum', 'Mild morning de-puff. Limited evidence.'],
  ['Urea 20% cream (Eucerin Roughness Relief)', 'For rough bumps on the arms, nightly. Moderate evidence.'],
  ['Boil-and-bite night guard', 'Only if you wake with a sore jaw or tight temples, which means clenching.']
];
var LEFT_OUT = [
  ['Jaw exercisers, mastic gum, “hard mewing”', 'No trial shows a sharper jawline. They mostly widen the lower face and stress the jaw joint. Resting your tongue on the roof of your mouth with your lips closed is harmless, but evidence is weak and you should never clench.'],
  ['Facial exercise programs', 'One small 20-week trial in women aged 40–65 found fuller cheeks. It needed 30 min a day, and the method’s creator was a coauthor. Not tested in men, and not tested on a lean face.'],
  ['Biotin and “beard growth” pills', 'No benefit unless you’re deficient, and biotin can skew blood tests.'],
  ['More face pulls', 'No trial tests face pulls for posture. Your split already hits the rear delts most days and has face pulls on Friday, so I added one more day, not more volume.']
];
function renderGuide() {
  var h = '<div class="dayhead"><h1>Guide</h1><span>How it all fits</span></div>';
  var starts = [];
  state.plan.steps.forEach(function (s) { if (s.f > 0) { var k = firstDue(s); if (k) starts.push({ n: s.n, k: k }); } });
  starts.sort(function (a, b) { return a.k < b.k ? -1 : a.k > b.k ? 1 : 0; });
  if (starts.length) {
    h += '<div class="panel"><h3>What starts when</h3>' + starts.map(function (x) { return '<div class="li"><span>' + esc(x.n) + '</span><span>' + DN[parseKey(x.k).getDay()] + ' ' + fmtMD(parseKey(x.k)) + '</span></div>'; }).join('') +
      '<p class="hint">Counted from the start date in Edit. Everything else is on from day one.</p></div>';
  }
  h += '<div class="panel"><h3>Rules the schedule follows</h3>' + RULES.map(function (x) { return '<div class="exp"><b>' + esc(x[0]) + '</b>' + esc(x[1]) + '</div>'; }).join('') + '</div>';
  h += '<div class="panel"><h3>Every step</h3><p class="hint" style="margin:0 0 6px">Tap a step for how to do it and why it’s here. Evidence: Strong means solid human trials, Moderate means some trials that are small or short, Limited means case reports or evidence from related things, Habit means routine that hasn’t been tested.</p>';
  state.plan.blocks.forEach(function (b) {
    var list = state.plan.steps.filter(function (s) { return s.b === b.id && !s.wk; });
    if (!list.length) return;
    h += '<div class="gb">' + esc(b.n) + '</div>';
    list.forEach(function (s) {
      var open = !!ui.open['g-' + s.id];
      h += '<div class="gr"><button class="th" data-act="tog" data-id="g-' + esc(s.id) + '" aria-expanded="' + open + '"><span class="gn">' + esc(s.n) + '</span><span class="gd">' + daySummary(s, 3) + '</span><span class="car' + (open ? ' up' : '') + '">' + CHEV + '</span></button>' +
        (s.a ? '<div class="gam">' + esc(s.a) + '</div>' : '') + (open ? details(s) : '') + '</div>';
    });
  });
  h += '</div>';
  h += '<div class="panel"><h3>What to expect</h3>' + EXPECT.map(function (x) { return '<div class="exp"><b>' + esc(x[0]) + '</b>' + esc(x[1]) + '</div>'; }).join('') + '</div>';
  h += '<div class="panel"><h3>When to back off</h3>' + STOPS.map(function (x) { return '<div class="exp"><b>' + esc(x[0]) + '</b>' + esc(x[1]) + '</div>'; }).join('') + '</div>';
  h += '<div class="panel"><h3>Reorder and replace</h3>' + [
    ['Kirkland 5% minoxidil', 'A 1-month bottle lasts about a month at 2 mL a day. Order the 6-month pack (about $25) by late November.'],
    ['Rogaine Women’s 2% (brows)', 'Lasts many months on brows alone. Reorder when it’s low.'],
    ['Nizoral', '3–4 months. Reorder when it’s half empty.'],
    ['Dermastamp head', 'After 10–15 uses, or when it feels dull or tugs.'],
    ['Shower filter cartridge', 'On the box’s schedule, usually about every 6 months.'],
    ['SheaMoisture, Cantu, argan oil', 'As they run out, about 1–3 months each.']
  ].map(function (x) { return '<div class="exp"><b>' + esc(x[0]) + '</b>' + esc(x[1]) + '</div>'; }).join('') + '</div>';
  h += '<div class="panel"><h3>Buy next (in your steps already)</h3>' + BUY_NOW.map(function (x) { return '<div class="exp"><b>' + esc(x[0]) + '</b>' + esc(x[1]) + '</div>'; }).join('') + '</div>';
  h += '<div class="panel"><h3>Not in your steps yet</h3><p class="hint" style="margin:0 0 6px">From your earlier lists. Say the word and they go into the right spot in the day.</p>' + BUY_LATER.map(function (x) { return '<div class="exp"><b>' + esc(x[0]) + '</b>' + esc(x[1]) + '</div>'; }).join('') + '</div>';
  h += '<div class="panel"><h3>Left out on purpose</h3>' + LEFT_OUT.map(function (x) { return '<div class="exp"><b>' + esc(x[0]) + '</b>' + esc(x[1]) + '</div>'; }).join('') + '</div>';
  $('#list').innerHTML = h;
  $('#ft').innerHTML = '';
}

/* ---------- render: edit ---------- */
function daySummary(s, ph) {
  var d = daysFor(s, ph);
  if (d.length === 7) return 'Every day';
  if (!d.length) return 'No days';
  return d.slice().sort(function (a, c) { return ((a + 6) % 7) - ((c + 6) % 7); }).map(function (x) { return DN[x]; }).join(', ');
}
function renderEdit() {
  var ph = edit.phase;
  var H = 'style="font:700 16px var(--display);letter-spacing:.1em;text-transform:uppercase"';
  var h = '<div class="dayhead"><h1>Edit routine</h1><span>Saves as you type</span></div>';
  h += '<div class="ed"><div class="edh"><b ' + H + '>Start date</b></div>' +
    '<div class="two"><div><label>Routine started</label><input type="date" data-set="start" value="' + esc(state.start) + '"></div></div>' +
    '<p class="fine" style="margin:8px 0 0">New things start one at a time and some ease in over the first four weeks. Both count from this date. Weeks 1–2, weeks 3–4 and week 5 on can each have different days.</p></div>';
  h += '<div class="ed"><div class="edh"><b ' + H + '>Editing days for</b></div>' +
    '<div class="phs">' + [1, 2, 3].map(function (p) { return '<button data-act="ed-phase" data-p="' + p + '" class="' + (ph === p ? 'on' : '') + '">' + PHN[p] + '</button>'; }).join('') + '</div></div>';
  state.plan.blocks.forEach(function (b) {
    h += '<div class="ed"><div class="edh"><b ' + H + '>' + esc(b.n) + '</b></div>' +
      '<div class="two"><div><label>Section name</label><input data-bf="n" data-b="' + esc(b.id) + '" value="' + esc(b.n) + '"></div><div><label>Time (optional)</label><input data-bf="t" data-b="' + esc(b.id) + '" value="' + esc(b.t || '') + '" placeholder="None"></div></div></div>';
    state.plan.steps.filter(function (s) { return s.b === b.id; }).forEach(function (s) {
      var open = !!edit.open[s.id];
      h += '<div class="ed"><div class="edh"><div><b>' + esc(s.n) + '</b><div class="last">' + daySummary(s, ph) + (s.f > 0 ? ' · starts day ' + (s.f + 1) : '') + '</div></div>' +
        '<button class="del" data-act="ed-open" data-id="' + esc(s.id) + '">' + (open ? 'Close' : 'Edit') + '</button></div>';
      if (open) {
        h += '<label>Name</label><input data-sf="n" data-id="' + esc(s.id) + '" value="' + esc(s.n) + '">' +
          '<label>Amount</label><input data-sf="a" data-id="' + esc(s.id) + '" value="' + esc(s.a || '') + '">' +
          '<label>Note</label><textarea data-sf="o" data-id="' + esc(s.id) + '">' + esc(s.o || '') + '</textarea>' +
          '<label>Why it’s here</label><input data-sf="en" data-id="' + esc(s.id) + '" value="' + esc(s.en || '') + '">' +
          '<div class="two"><div><label>Evidence</label><select data-sf="e" data-id="' + esc(s.id) + '">' + ['strong', 'moderate', 'limited', 'habit'].map(function (e) { return '<option value="' + e + '"' + (s.e === e ? ' selected' : '') + '>' + EVL[e] + '</option>'; }).join('') + '</select></div>' +
          '<div><label>Type</label><select data-sf="k" data-id="' + esc(s.id) + '"><option value="c"' + (s.k === 'c' ? ' selected' : '') + '>Check off</option><option value="s"' + (s.k === 's' ? ' selected' : '') + '>Sets + weight</option></select></div></div>' +
          '<label>Section</label><select data-sf="b" data-id="' + esc(s.id) + '">' + state.plan.blocks.map(function (bb) { return '<option value="' + esc(bb.id) + '"' + (bb.id === s.b ? ' selected' : '') + '>' + esc(bb.n) + '</option>'; }).join('') + '</select>' +
          (s.k === 's' ? '<label>Number of sets</label><input data-sf="s" data-id="' + esc(s.id) + '" type="number" inputmode="numeric" min="1" max="8" value="' + (s.s || 3) + '">' : '') +
          '<label>Starts (days after the start date)</label><input data-sf="f" data-id="' + esc(s.id) + '" type="number" inputmode="numeric" min="0" max="365" value="' + (s.f || 0) + '">' +
          '<label>Days (' + PHN[ph] + ')</label><div class="dchips">' + [1, 2, 3, 4, 5, 6, 0].map(function (x) { return '<button class="dc' + (daysFor(s, ph).indexOf(x) >= 0 ? ' on' : '') + '" data-act="ed-day" data-id="' + esc(s.id) + '" data-x="' + x + '">' + DN[x] + '</button>'; }).join('') + '</div>' +
          '<div style="margin-top:14px"><button class="del" data-act="ed-del" data-id="' + esc(s.id) + '">Delete step</button></div>';
      }
      h += '</div>';
    });
    h += '<div style="margin-top:8px"><button class="wide-btn dim" data-act="ed-add" data-b="' + esc(b.id) + '">+ Add a step to ' + esc(b.n) + '</button></div>';
  });
  h += '<div class="ed"><div class="edh"><b ' + H + '>Backup</b></div>' +
    '<p style="color:var(--mute);font-size:14px;margin:8px 0">Your data lives only on this phone. Copy a backup and paste it into Notes now and then. To restore, paste it below.</p>' +
    '<div class="row2"><button class="btn" style="flex:1" data-act="bk-copy">Copy backup</button></div>' +
    '<label>Restore from backup</label><textarea id="bkin" placeholder="Paste backup text here" style="min-height:90px"></textarea>' +
    '<div style="margin-top:10px"><button class="wide-btn dim" data-act="bk-restore">Restore</button></div>' +
    '<div style="margin-top:10px"><button class="wide-btn dim" data-act="ed-reset">Reset plan to default</button></div></div>';
  $('#list').innerHTML = h;
  $('#ft').innerHTML = '<div class="status" id="bkstat">' + esc(statusMsg) + '</div>';
}

function render() {
  renderHeader();
  if (view === 'today') renderToday(); else if (view === 'week') renderWeek(); else if (view === 'guide') renderGuide(); else renderEdit();
}

/* ---------- actions ---------- */
function say(msg) { statusMsg = msg; var el = $('#bkstat'); if (el) el.textContent = msg; }
function copyText(txt) {
  if (navigator.clipboard && navigator.clipboard.writeText) return navigator.clipboard.writeText(txt);
  return new Promise(function (res, rej) {
    var ta = document.createElement('textarea'); ta.value = txt; ta.style.position = 'fixed'; ta.style.opacity = '0'; document.body.appendChild(ta);
    ta.select(); try { document.execCommand('copy') ? res() : rej(); } catch (e) { rej(e); } document.body.removeChild(ta);
  });
}
function scrollKeep(fn) { var y = window.scrollY; fn(); window.scrollTo(0, y); }
function daysRef(s, ph) {
  if (ph === 3) return s.d;
  if (!s.dp) s.dp = {};
  if (!Array.isArray(s.dp[ph])) s.dp[ph] = s.d.slice();
  return s.dp[ph];
}

document.addEventListener('click', function (e) {
  var el = e.target.closest('[data-act]'); if (!el) return;
  var act = el.getAttribute('data-act'), id = el.getAttribute('data-id'), s;
  switch (act) {
    case 'view':
      view = el.getAttribute('data-v');
      if (view === 'week') wvMon = mondayOf(parseKey(todayKey));
      render(); window.scrollTo(0, 0); break;
    case 'wk-prev': weekMon = addDays(weekMon, -7); selKey = dkey(weekMon); render(); break;
    case 'wk-next': weekMon = addDays(weekMon, 7); selKey = dkey(weekMon) === dkey(mondayOf(parseKey(todayKey))) ? todayKey : dkey(weekMon); render(); break;
    case 'wv-prev': wvMon = addDays(wvMon, -7); render(); break;
    case 'wv-next': wvMon = addDays(wvMon, 7); render(); break;
    case 'day': selKey = el.getAttribute('data-k'); render(); break;
    case 'hint': state.hint = true; save(); render(); break;
    case 'tog': ui.open[id] = !ui.open[id]; scrollKeep(render); break;
    case 'off': ui.off = !ui.off; scrollKeep(render); break;
    case 'chk':
      if (selKey > todayKey) return;
      s = findStep(id); if (!s) return;
      setDone(selKey, s, 0, !getDone(selKey, s)[0]); save(); scrollKeep(render); break;
    case 'set':
      if (selKey > todayKey) return;
      s = findStep(id); if (!s) return;
      var i = +el.getAttribute('data-i'); setDone(selKey, s, i, !getDone(selKey, s)[i]); save(); scrollKeep(render); break;
    case 'ed-phase': edit.phase = +el.getAttribute('data-p'); scrollKeep(render); break;
    case 'ed-open': edit.open[id] = !edit.open[id]; scrollKeep(render); break;
    case 'ed-day':
      s = findStep(id); if (!s) return;
      var ref = daysRef(s, edit.phase), x = +el.getAttribute('data-x'), at = ref.indexOf(x);
      if (at >= 0) ref.splice(at, 1); else ref.push(x);
      save(); scrollKeep(render); break;
    case 'ed-del':
      s = findStep(id); if (!s) return;
      if (!window.confirm('Delete "' + s.n + '"? Its past check-offs stay in your history but stop counting.')) return;
      state.plan.steps = state.plan.steps.filter(function (z) { return z.id !== id; }); save(); scrollKeep(render); break;
    case 'ed-add':
      var nid = uid(); state.plan.steps.push({ id: nid, b: el.getAttribute('data-b'), n: 'New step', a: '', o: '', e: 'habit', en: '', d: ALL.slice(), k: 'c' });
      edit.open[nid] = true; save(); render(); break;
    case 'ed-reset':
      if (!window.confirm('Reset the plan to the default routine? Your history stays.')) return;
      state.plan = defaultPlan(); edit.open = {}; save(); render(); say('Plan reset.'); break;
    case 'bk-copy':
      copyText(JSON.stringify(state)).then(function () { say('Backup copied. Paste it into Notes.'); }, function () { say('Copy was blocked. Try again.'); }); break;
    case 'bk-restore':
      var raw = ($('#bkin').value || '').trim(), parsed;
      if (!raw) { say('Paste your backup text first.'); return; }
      try { parsed = JSON.parse(raw); } catch (err) { say('That doesn’t look like a backup. Nothing was changed.'); return; }
      if (!validState(parsed)) { say('That backup is incomplete or damaged. Nothing was changed.'); return; }
      state = fixState(parsed); save(); render(); say('Backup restored.'); break;
  }
});

/* typing in Edit / weights: update state without re-rendering so the keyboard stays up */
document.addEventListener('input', function (e) {
  var t = e.target, id = t.getAttribute('data-id'), s;
  if (t.hasAttribute('data-w')) {
    var sid = t.getAttribute('data-w'), v = t.value;
    if (selKey > todayKey) return;
    var l = state.wl[selKey] || (state.wl[selKey] = {});
    if (v === '') delete l[sid]; else { l[sid] = v; state.wt[sid] = v; }
    if (!Object.keys(l).length) delete state.wl[selKey];
    save(); return;
  }
  if (t.hasAttribute('data-bf')) {
    var b = state.plan.blocks.filter(function (z) { return z.id === t.getAttribute('data-b'); })[0];
    if (b) { b[t.getAttribute('data-bf')] = t.value; save(); }
    return;
  }
  if (t.hasAttribute('data-sf')) {
    s = findStep(id); if (!s) return;
    var f = t.getAttribute('data-sf');
    if (f === 's') s.s = Math.min(8, Math.max(1, parseInt(t.value, 10) || 1));
    else if (f === 'f') s.f = Math.min(365, Math.max(0, parseInt(t.value, 10) || 0));
    else if (f !== 'b' && f !== 'k' && f !== 'e') s[f] = t.value;
    save();
  }
});
document.addEventListener('change', function (e) {
  var t = e.target;
  if (t.hasAttribute('data-sf') && (t.getAttribute('data-sf') === 'b' || t.getAttribute('data-sf') === 'k' || t.getAttribute('data-sf') === 'e')) {
    var s = findStep(t.getAttribute('data-id')); if (!s) return;
    s[t.getAttribute('data-sf')] = t.value;
    if (s.k === 's' && !s.s) s.s = 3;
    save(); scrollKeep(render); return;
  }
  if (t.hasAttribute('data-set')) {
    var which = t.getAttribute('data-set');
    if (!validKey(t.value)) { t.value = state[which]; return; }
    state[which] = t.value; save(); scrollKeep(render);
  }
});

/* ---------- boot ---------- */
function setToday() {
  var now = new Date(), k = dkey(now);
  if (k !== todayKey) { var wasToday = selKey === todayKey || !selKey; todayKey = k; if (wasToday || !weekMon) { selKey = k; weekMon = mondayOf(now); } return true; }
  return false;
}
function init() {
  state = load();
  setToday();
  wvMon = mondayOf(parseKey(todayKey));
  edit.phase = phaseOf(todayKey);
  render();
  document.addEventListener('visibilitychange', function () { if (!document.hidden && setToday()) render(); });
  if ('serviceWorker' in navigator && /^https?:$/.test(location.protocol)) {
    window.addEventListener('load', function () { navigator.serviceWorker.register('sw.js').catch(function () {}); });
  }
}
window.__bp = { get state() { return state; }, groupsFor: groupsFor, due: due, rawDue: rawDue, stampBefore: stampBefore, dayStat: dayStat, phaseOf: phaseOf, weekNo: weekNo, offList: offList, newToday: newToday, firstDue: firstDue };
init();
})();
