/* Blueprint. One file, no libraries. All data stays in this phone's localStorage. */
(function () {
'use strict';

var KEY = 'blueprint.v1', PLAN_REV = 5;
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
   u  = optional last day, counted the same way (for a course that ends, like whitening strips)
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
    { id: 'a0', b: 'am', n: 'Wake-up circulation + drainage', a: '2–3 min, as soon as you’re up', o: 'Do this first, standing by the bed. 1) About 30 gentle hops or bounces on the balls of your feet. 2) 15 slow calf raises. 3) 10 arm circles each direction. 4) Face: with clean, dry fingertips and very light pressure, stroke from the middle of your forehead out to your temples, from beside your nose out along the cheekbones to your ears, from your chin along the jaw to your ears, then down the sides of your neck to your collarbones. 5 slow strokes each. Light and slow, just enough to move the skin, no scraping. Skip the face part the morning after a stamp night if your skin is pink or sore.', e: 'limited', en: 'Muscle movement helps push lymph and blood back toward the heart, and manual drainage is a proven treatment for lymphedema. For ordinary morning face puffiness the effect is real but temporary, minutes to a few hours. Nothing shows it changes your face for good.', d: ALL, k: 'c' },
    { id: 'a1', b: 'am', n: 'Brush teeth', a: '2 min', o: 'Fluoride toothpaste. Soft brush, small circles along the gumline.', e: 'strong', en: 'Standard dental advice.', d: ALL, k: 'c' },
    { id: 'a2', b: 'am', n: 'Chin tucks', a: '10 reps, hold 5 sec each', o: 'Back and head against a wall. Pull your chin straight back, like making a double chin. Don’t tilt your head down. It’s a posture habit, so the daily reps matter more than the effort.', e: 'moderate', en: 'Exercise improves forward head posture in reviews of trials. Claims about raising the hyoid bone are not proven.', d: ALL, k: 'c' },
    { id: 'a4', b: 'am', n: 'Face pull: eye corners', a: '1 min, light touch', o: 'Hunter-eyes practice, with your hands. Wash your hands, then rest two fingertips just above the outer corner of each eye and hold the skin in a slight lift up and outward. Look in the mirror, hold the expression and get used to how it feels, then relax and try to recreate it without your fingers. Light touch only, no tugging, no dragging. The skin around your eyes is the thinnest on your face. Stop if it turns red or sore.', e: 'habit', en: 'No study shows this changes eye shape, which comes mostly from bone, lid structure and body fat. It can train how you hold your face. Repeated hard pulling can stretch thin skin, so keep it gentle.', d: ALL, k: 'c' },
    { id: 'a5', b: 'am', n: 'Creatine monohydrate', a: '5 g (about 1 level teaspoon), in water', o: 'With breakfast, every day, rest days too. Timing doesn’t matter, so take it whenever you’ll remember. Plain monohydrate is all you need. Drink water through the day.', e: 'strong', en: 'Well proven for strength and muscle. A 12-week randomized trial in 38 lifters found no change in DHT or hair measures. One older 20-man study saw DHT rise but stay in the normal range.', d: ALL, k: 'c' },
    { id: 'a6', b: 'am', n: 'Vitamin D3', a: 'Your usual dose (2,000 IU is typical)', o: 'With a meal that has some fat so it absorbs. Daily. Ask for a blood test next time you see a doctor, because more isn’t better.', e: 'moderate', en: 'Helps if you’re low, which is common in winter. There’s little evidence it does anything extra for looks if you’re not low.', d: ALL, k: 'c' },
    { id: 'a3', b: 'am', n: 'Morning sunlight + grounding', a: '10 min outside, barefoot if you can', o: 'You wake before sunrise, so go out when the sun is above the horizon, around 6:15–6:30 right now. Stand or walk on grass, soil or bare concrete with your shoes off. That’s the grounding part. If it’s near freezing or the ground is wet and cold, keep your shoes on, because the light is the part with the better evidence. Face the general direction of the sun and keep your eyes open, but never stare at it. Sunglasses off if you can. On a cloudy day do 15–20 min. Through a window it counts for much less, so step outside.', e: 'moderate', en: 'Outdoor light is many times brighter than indoor light, and morning light helps set your body clock. Studies link it to earlier, steadier sleep. Most trials use bright-light lamps, not casual sun, so treat the effect as modest. Grounding studies are small and short, so treat that part as free and unproven.', d: ALL, k: 'c' },

    /* training */
    { id: 't4', b: 'gym', n: 'Lift: shoulders + arms (heavy)', ti: 'Day 1 · Shoulders + Arms (heavy)', a: 'Open Redline', o: LIFT, e: 'habit', en: 'Your lifting split.', d: [4], k: 'c', nl: 1, wk: 'S+A' },
    { id: 't5', b: 'gym', n: 'Lift: chest + back + biceps', ti: 'Day 2 · Chest + Back + Biceps', a: 'Open Redline', o: LIFT, e: 'habit', en: 'Your lifting split.', d: [5], k: 'c', nl: 1, wk: 'C+B' },
    { id: 't6', b: 'gym', n: 'Lift: legs + calves', ti: 'Day 3 · Legs + Calves', a: 'Open Redline', o: LIFT, e: 'habit', en: 'Your lifting split.', d: [6], k: 'c', nl: 1, wk: 'LEG' },
    { id: 't0', b: 'gym', n: 'Rest day: easy walk', ti: 'Off · No Gym', a: '30–60 min, easy pace', o: 'No gym today. A long easy walk, and stretch if you want to.', e: 'habit', en: 'Recovery day in your split.', d: [0], k: 'c', nl: 1, wk: 'OFF' },
    { id: 't1', b: 'gym', n: 'Lift: shoulders + arms (volume)', ti: 'Day 4 · Shoulders + Arms (volume)', a: 'Open Redline', o: LIFT, e: 'habit', en: 'Your lifting split.', d: [1], k: 'c', nl: 1, wk: 'S+A' },
    { id: 't2', b: 'gym', n: 'Lift: back + chest + biceps', ti: 'Day 5 · Back + Chest + Biceps', a: 'Open Redline', o: LIFT, e: 'habit', en: 'Your lifting split.', d: [2], k: 'c', nl: 1, wk: 'B+C' },
    { id: 't3', b: 'gym', n: 'Lift: legs + calves', ti: 'Day 6 · Legs + Calves', a: 'Open Redline', o: LIFT, e: 'habit', en: 'Your lifting split.', d: [3], k: 'c', nl: 1, wk: 'LEG' },
    /* neck work: at home, off the edge of the bed, any time that day (listed with the evening) */
    { id: 'g1', b: 'eve', n: 'Neck curl (bed edge)', a: '3 sets × 12–15 slow reps', o: 'At home, any time today. Lie face up with your shoulders on the bed and your head past the edge. Start with one hand under your head to get set. Lower slowly only until your head is level with your body, never below it, then curl your chin toward your chest. About 3 sec up and 3 sec down. Weeks 1–2: Mon + Fri only, then Mon, Wed, Fri. Your head is the weight, so leave the weight box at 0. Make it harder in this order: slower reps, then up to 20 reps, then light resistance (a hand on your forehead, then a small weight). Control the range. Stop for tingling, sharp pain or dizziness.', e: 'moderate', en: 'Any muscle grows when you load it more over time. The weight of your head is a light load, so growth will be slow until you add resistance. Neck-specific studies are small.', d: [1, 3, 5], dp: { 1: [1, 5] }, k: 's', s: 3 },
    { id: 'g2', b: 'eve', n: 'Neck extension (bed edge)', a: '3 sets × 12–15 slow reps', o: 'Same session. Lie face down with your head past the edge, hands under your forehead to get set. Start with your head level, lift a little, then lower slowly back to level only. Don’t let your head hang down below your body. Slow and controlled, no jerking. Same progression. Stop for tingling, sharp pain or dizziness.', e: 'moderate', en: 'Same as above. Go lighter than you think, because the lever from your head is longer than it feels.', d: [1, 3, 5], dp: { 1: [1, 5] }, k: 's', s: 3 },
    { id: 'g3', b: 'eve', n: 'Neck side raise (bed edge)', a: '3 sets × 12–15 slow reps each side', o: 'Same session. Lie on your side with your head past the edge, supported by one hand to get set. Lift your ear toward your shoulder, then lower slowly to level. Do both sides before you check off a set. Same progression. Stop for tingling, sharp pain or dizziness.', e: 'moderate', en: 'Same as above.', d: [1, 3, 5], dp: { 1: [1, 5] }, k: 's', s: 3 },

    /* post-gym shower */
    { id: 's1', b: 'shower', n: 'Nizoral on scalp', a: 'Quarter-size, scalp only', o: 'Wet hair with warm water, not hot. Work it into the scalp with your fingertips, not your nails. Leave it 3–5 min while you wash your body, then rinse at least 30 seconds, until there’s no slippery feel. Weeks 1–4: Mon + Thu (the label says twice a week for 4 weeks). After that: Mon only. Add Thu back if flakes come back.', e: 'strong', en: 'Ketoconazole is well proven for dandruff.', d: [1], dp: { 1: [1, 4], 2: [1, 4] }, k: 'c' },
    { id: 's2', b: 'shower', n: 'Rinse hair, no shampoo', a: 'Warm water, about 1 min', o: 'Your scalp is dry and coarse hair dries out fast, so shampoo only on the Nizoral days. Change this in Edit if you want to shampoo more.', e: 'limited', en: 'Shampooing less often is common advice for dry scalps.', d: [2, 3, 4, 5, 6], dp: { 1: [2, 3, 5, 6], 2: [2, 3, 5, 6] }, k: 'c' },
    { id: 's3', b: 'shower', n: 'SheaMoisture conditioner', a: 'Golf-ball size, mid-length to ends', o: 'Keep it off the roots. Leave it 2–3 min, then rinse with cool water. Hot water dries skin and scalp.', e: 'moderate', en: 'Conditioner reduces friction and breakage in coarse hair.', d: [1, 2, 3, 4, 5, 6], k: 'c' },
    { id: 's3m', b: 'shower', n: 'Hair mask with shower cap', a: 'SheaMoisture, golf-ball size, 10 min', o: 'Sunday replaces the normal conditioner. Work it through mid-length to ends, put the shower cap on and leave it 10 min. Body heat helps it soak into coarse hair. Finish with a cool rinse.', e: 'limited', en: 'A common fix for dry coarse hair. Not well studied.', d: [0], k: 'c' },
    { id: 's4', b: 'shower', n: 'Wash face', a: 'Dime-size cleanser, 30–60 sec', o: 'Gentle cleanser (Vanicream or CeraVe Hydrating), lukewarm water. Pat dry with a clean towel.', e: 'habit', en: 'Basic hygiene. Any gentle cleanser works.', d: ALL, k: 'c' },
    { id: 's5', b: 'shower', n: 'Cantu leave-in', a: 'Quarter-size on damp hair', o: 'Blot your hair with a T-shirt or towel first. Squeeze, don’t rub. Then rake it through, mostly the lengths.', e: 'habit', en: 'Product routine. Not a proven effect.', d: ALL, k: 'c' },
    { id: 's6b', b: 'shower', n: 'Pomade + style', a: 'Dime-size, warmed in your palms', o: 'Comb straight back, set the part, then leave it alone 10–15 min while it air-dries. No blow dryer. Skip this line if you don’t use pomade.', e: 'habit', en: 'Styling. No health effect.', d: ALL, k: 'c' },
    { id: 's7', b: 'shower', n: 'Azelaic acid 10%', a: 'Pea-size, thin layer over face', o: 'Clean, dry skin. Forehead, nose and upper cheeks. Keep it off your eyes and lips, and off the lower cheeks, chin and jaw where the minoxidil goes, so those areas only get one active at a time. Mild tingling for the first 2 weeks is normal. Skipped the morning after a stamp night.', f: 3, sa: 'b4', e: 'moderate', en: 'Well studied for redness, acne and dark marks. You don’t have much acne, so expect a modest effect. It also helps keep dark marks from adapalene irritation in check.', d: ALL, k: 'c' },
    { id: 's8', b: 'shower', n: 'Minoxidil 5% on growth areas', a: '1 mL (dropper to the line) or ½ capful foam', o: 'Skin fully dry first. Spread with your fingertips over the areas where you want hair to grow: cheeks, upper lip, chin and jaw. Wash your hands, then give it 10–15 min to dry before moisturizer. Off-label for facial hair. Label max is twice a day, and this plan uses that. Skipped the morning after a stamp night.', sa: 'b4', e: 'moderate', en: 'One randomized trial (48 men, 16 weeks, 3% twice daily) beat placebo on hair count. It works on follicles you already have, and genetics set most of the final result. Side effects: dryness, itching, hair in unintended spots. Results need daily use for months.', d: ALL, k: 'c' },
    { id: 's9', b: 'shower', n: 'Minoxidil 2% brows', a: '1 swab or spoolie dip per brow', o: 'Brow only, on the brow line. Keep it out of your eyes. If your eyelids swell or your eyes sting, stop. Wash your hands after.', e: 'limited', en: 'One small trial and many personal accounts. Off-label.', d: ALL, k: 'c' },
    { id: 's10', b: 'shower', n: 'Moisturizer with sunscreen', a: '2 pea-sizes, face + neck', o: 'A moisturizer with sunscreen mixed in (broad-spectrum, SPF 30 if you can find it). Wait until the minoxidil is dry. This is your sun protection, no separate step and no reapplying. Adapalene, azelaic acid and stamping make your skin more sun-sensitive, and you drive a lot. UVA passes through car windows, so this covers that. It also stops the flaking minoxidil can cause.', e: 'strong', en: 'Sunscreen is the best-proven anti-aging and skin-cancer step there is. A moisturizer with SPF in it covers the same job, as long as you use enough.', d: ALL, k: 'c' },
    /* midday */
    { id: 'm2', b: 'mid', n: 'Chin tucks', a: '10 reps, hold 5 sec each', o: 'You can do these in the car seat with your head against the headrest.', e: 'moderate', en: 'See the morning set.', d: ALL, k: 'c' },
    { id: 'm3', b: 'mid', n: 'Posture stretches', a: 'About 4 min, all three', o: 'Doorway chest stretch: forearm on the frame, step through, 2 × 30 sec each side. Side-neck stretch: ear toward shoulder, 30 sec each side, no pulling. Thoracic extension: sit tall, hands behind your head, arch over the chair back, 10 slow reps.', e: 'moderate', en: 'Programs that combine strengthening and stretching improved forward head posture in trials. Most are small and short.', d: ALL, k: 'c' },
    { id: 'm4', b: 'mid', n: 'Midday daylight', a: '10+ min outside', o: 'You work inside all day, so get out at lunch or on a break. Daylight helps keep your body clock steady, which helps sleep.', e: 'moderate', en: 'Daytime light supports sleep timing. Basic health, not a looks trick.', d: ALL, k: 'c' },

    /* evening */
    { id: 'e1', b: 'eve', n: 'Magnesium glycinate', a: '200–250 mg elemental magnesium', o: 'Glycinate is gentle on the stomach. Avoid magnesium oxide.', e: 'moderate', en: 'Small trials show better sleep scores. It works for you.', d: ALL, k: 'c' },
    { id: 'e4', b: 'eve', n: 'Teeth whitening strips', a: 'Follow the box, usually 30 min', o: 'Course of about 2 weeks (change the end day in Edit to match your box), then stop. Brush and floss first, dry your teeth with a tissue, apply the strips as the box shows, and take them off when it says. No dark drinks or food for 30 min after. If your teeth or gums get sore, skip a day or two. Doing more than the box says doesn’t whiten faster and does irritate your gums. Repeat a course in 4–6 months by changing the start day in Edit.', f: 0, u: 13, e: 'moderate', en: 'Peroxide strips lighten teeth in trials. Tooth sensitivity and gum irritation are the main side effects.', d: ALL, k: 'c' },
    { id: 'e2', b: 'eve', n: 'Blue-light glasses on', a: '2–3 hours before you sleep', o: 'Put them on once the sun is down, or earlier if you’re on screens.', e: 'limited', en: 'Trials on blue-blocking glasses for sleep are small and mixed. Cheap and low risk, so it stays.', d: ALL, k: 'c' },

    { id: 'e3', b: 'eve', n: 'Slow breathing', a: '5 min', o: 'Sit or lie down. Breathe in through your nose for about 4–5 sec and out slowly for about 5–6 sec, around 6 breaths a minute. Nothing forced. Do it before you tape your mouth, so you’re calm and breathing through your nose.', e: 'moderate', en: 'Slow breathing lowers stress and heart rate in small trials. Any benefit to looks is indirect, through sleep and stress.', d: ALL, k: 'c' },

    /* before bed */
    { id: 'b1', b: 'bed', n: 'Brush + floss', a: '2 min brushing, then floss', o: 'Floss first, then brush. Don’t rinse after brushing.', e: 'strong', en: 'Standard dental advice.', d: ALL, k: 'c' },
    { id: 'b2', b: 'bed', n: 'Wash face', a: 'Dime-size cleanser, 60 sec', o: 'Lukewarm water. Pat dry and let your skin dry fully before adapalene or minoxidil.', e: 'habit', en: 'Basic hygiene.', d: ALL, k: 'c' },
    { id: 'b3', b: 'bed', n: 'Sanitize the dermastamp', a: '70% isopropyl alcohol, 1 min', o: 'Soak or spray the head, let it air dry. Do it before and again after stamping. Never share it. Replace the head after 10–15 uses, or when it feels dull or tugs.', f: 24, e: 'strong', en: 'Basic infection control.', d: [0], k: 'c' },
    { id: 'b4', b: 'bed', n: 'Dermastamp growth areas', a: '0.5 mm, once a week', o: 'Cheeks, upper lip, chin and jaw. Press and lift, don’t drag. First 2 sessions: about 10 presses per area. After that: about 20. Stop at light pink. Skip tonight if the last session is still pink or sore. Never on brows, eyelids, active breakouts, cold sores, cuts or sunburn. After: rinse, plain moisturizer only, no minoxidil until tomorrow night. Stay at 0.5 mm for your first 8 weeks, since you’re new to it. After that, if your skin has handled it well, you can switch to 1.0 mm every 2 weeks instead of 0.5 mm weekly. Never both. If your stamp can’t go below 1.0 mm, use it every 4 weeks.', f: 24, e: 'limited', en: 'Microneedling plus minoxidil beat minoxidil alone for scalp hair in a 12-week trial. Nobody has tested depth or schedule for facial hair. Scalp trials used 1–1.5 mm, and 0.5 mm mostly helps the minoxidil soak in. Weekly is the top of what at-home guides allow at 0.5 mm.', d: [0], k: 'c' },
    { id: 'b5', b: 'bed', n: 'Adapalene 0.1%', a: 'Pea-size: forehead, nose, upper cheeks only', o: 'Dry skin only, so wait 15 min after washing. Keep it off the growth areas (lower cheeks, upper lip, chin, jaw), brows, eyelids, nostrils and mouth corners. The growth areas are what you stamp, and guides say no retinoid on stamped skin for 5–7 days before and 3–5 days after, so this split lets both run. Starts 3 nights a week, then 4, then 5. Not on stamp night or the night after. Peeling in the first month is normal.', f: 10, e: 'strong', en: 'Retinoids are the best-studied skin ingredient for texture and aging. Adapalene is the gentler over-the-counter one. Gains show from about week 4 to 12.', d: [2, 3, 4, 5, 6], dp: { 1: [2, 4, 6], 2: [2, 3, 4, 6] }, k: 'c' },
    { id: 'b6', b: 'bed', n: 'Minoxidil 5% on growth areas', a: '1 mL (dropper to the line) or ½ capful foam', o: 'Skin fully dry first. Let it dry before you lie down, at least 30 min, or it ends up on the pillow. Skipped on stamp night only. Wash your hands after.', sd: 'b4', e: 'moderate', en: 'Same as the morning dose.', d: ALL, k: 'c' },
    { id: 'b7', b: 'bed', n: 'Minoxidil 2% brows', a: '1 swab or spoolie dip per brow', o: 'Brow only. Keep it out of your eyes.', e: 'limited', en: 'Same as the morning dose.', d: ALL, k: 'c' },
    { id: 'b8', b: 'bed', n: 'Moisturizer', a: '2 pea-sizes, face + neck', o: 'Wait until the minoxidil is dry. You can put it on over the adapalene if your skin is irritated.', e: 'habit', en: 'Basic barrier care.', d: ALL, k: 'c' },
    { id: 'b9', b: 'bed', n: 'Mouth tape + nasal strip on', a: 'Last step, once your nose is clear', o: 'If you’re stuffed up, skip the tape that night.', e: 'habit', en: 'It works for you.', d: ALL, k: 'c' }
  ];
  return { rev: PLAN_REV, blocks: B, steps: S };
}

/* ---------- state ---------- */
var state, todayKey, selKey, weekMon, wvMon, view = 'today', ui = { open: {}, off: false }, edit = { open: {}, phase: 3 }, statusMsg = '';

function freshState() { return { v: 1, plan: defaultPlan(), log: {}, wl: {}, wt: {}, start: DEF_START, hint: false, photoEvery: 28, photoLater: '' }; }
function validPlan(p) {
  if (!p || !Array.isArray(p.blocks) || !Array.isArray(p.steps)) return false;
  for (var i = 0; i < p.blocks.length; i++) { var b = p.blocks[i]; if (!b || typeof b.id !== 'string' || typeof b.n !== 'string') return false; }
  for (var j = 0; j < p.steps.length; j++) {
    var s = p.steps[j];
    if (!s || typeof s.id !== 'string' || typeof s.n !== 'string' || !Array.isArray(s.d)) return false;
    if (s.k !== 'c' && s.k !== 's') return false;
    if (s.dp != null && (typeof s.dp !== 'object' || Array.isArray(s.dp))) return false;
    if (s.f != null && typeof s.f !== 'number') return false;
    if (s.u != null && typeof s.u !== 'number') return false;
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
  if (s.photoEvery !== 7 && s.photoEvery !== 28) s.photoEvery = 28;
  if (typeof s.photoLater !== 'string') s.photoLater = '';
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
function rawDue(s, key) { return daysFor(s, phaseOf(key)).indexOf(parseKey(key).getDay()) >= 0 && offset(key) >= (s.f || 0) && (s.u == null || offset(key) <= s.u); }
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
var VIEWS = [['today', 'Today'], ['week', 'Week'], ['photos', 'Photos'], ['guide', 'Guide'], ['edit', 'Edit']];
function wkNav(mon, isCur, pa, na, naOff) {
  return '<div class="wk"><button data-act="' + pa + '" aria-label="Previous week">‹</button><div class="lbl">' +
    (isCur ? 'This week' : 'Week of ' + fmtMD(mon)) + ' · ' + fmtMD(mon) + ' – ' + fmtMD(addDays(mon, 6)) +
    '</div><button data-act="' + na + '" aria-label="Next week"' + (naOff ? ' disabled' : '') + '>›</button></div>';
}
var TL = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
function titleFor(key) {
  var ti = '';
  state.plan.steps.forEach(function (s) { if (!ti && s.ti && due(s, key)) ti = s.ti; });
  return DNF[parseKey(key).getDay()] + (ti ? ' · ' + ti : '');
}
function renderHeader() {
  var h = '<div class="top-row"><div class="seg">' +
    VIEWS.map(function (v) { return '<button data-act="view" data-v="' + v[0] + '" class="' + (view === v[0] ? 'on' : '') + '" aria-pressed="' + (view === v[0]) + '">' + v[1] + '</button>'; }).join('') +
    '</div></div>';
  var curMon = mondayOf(parseKey(todayKey));
  if (view === 'today') {
    var isCur = dkey(curMon) === dkey(weekMon), i;
    h += wkNav(weekMon, isCur, 'wk-prev', 'wk-next', isCur) + '<div class="tabs">';
    var dm = [1, 2, 3, 4, 5, 6, 0];
    for (i = 0; i < 7; i++) {
      var dt = addDays(weekMon, i), k = dkey(dt), st = dayStat(k);
      h += '<button class="tab' + (k === selKey ? ' sel' : '') + (k === todayKey ? ' today' : '') + (st.t && st.d === st.t ? ' full' : '') + (k > todayKey ? ' fut' : '') + '" data-act="day" data-k="' + k + '" aria-pressed="' + (k === selKey) + '" aria-label="' + DNF[dt.getDay()] + ' the ' + dt.getDate() + ', ' + (st.t - st.d) + ' left">' +
        '<span class="l">' + TL[dt.getDay()] + '</span><span class="n">' + dt.getDate() + '</span><span class="m" style="width:' + st.pct + '%"></span></button>';
    }
    var s = dayStat(selKey), left = s.t - s.d, dtS = parseKey(selKey), ph = phaseOf(selKey);
    h += '</div><div class="p-top"><div class="p-title">' + esc(titleFor(selKey)) + '</div><div class="p-pct">' +
      (s.t && !left ? '✓<small>Done</small>' : left + '<small>left</small>') + '</div></div>' +
      '<div class="bar"><i style="width:' + s.pct + '%"></i></div>' +
      '<div class="p-sub"><span>' + s.d + ' of ' + s.t + ' done' + (s.t && !left ? ' · day complete' : '') + '</span><span>' + (ph < 3 ? 'Easing in · ' + PHN[ph].toLowerCase() + ' · ' : '') + DN[dtS.getDay()] + ' ' + fmtMD(dtS) + '</span></div>';
  } else if (view === 'week') {
    h += wkNav(wvMon, dkey(curMon) === dkey(wvMon), 'wv-prev', 'wv-next', false);
  }
  $('#hd').innerHTML = h;
}

/* ---------- render: today ---------- */
var CHECK = '<svg viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="3.2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 12.5l5 5L20 6.5"/></svg>';
var CHECK_S = '\u2713';
var CHEV = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"><path d="M6 9l6 6 6-6"/></svg>';
function renderToday() {
  var dt = parseKey(selKey), dow = dt.getDay(), groups = groupsFor(selKey), fut = selKey > todayKey;
  var h = '';
  var nw = newToday(selKey);
  if (nw.length) h += '<div class="banner"><b>New today</b><p>' + esc(nw.map(function (s) { return s.n; }).join(', ')) + '. New things start one at a time, so if your skin reacts you know which one did it.</p></div>';
  if (stepOn('b4', selKey)) h += '<div class="banner"><b>Stamp night</b><p>Dermastamp the growth areas (cheeks, upper lip, chin, jaw), then plain moisturizer only. No minoxidil tonight, and no adapalene tonight or tomorrow night.</p></div>';
  else if (stampBefore(selKey, 'b4')) h += '<div class="banner"><b>Day after stamping</b><p>Skip the azelaic acid and the morning minoxidil. Minoxidil comes back tonight. No adapalene tonight.</p></div>';
  if (!state.hint && !window.navigator.standalone && /iPhone|iPad|iPod/.test(navigator.userAgent)) {
    h += '<div class="hint"><span>To install: tap <b>Share</b>, then <b>Add to Home Screen</b>.</span><button class="mini" data-act="hint">Got it</button></div>';
  }
  if (photoDue()) h += '<div class="banner"><b>Photo check-in</b><p>' + (lastCheckin() ? 'Your last one was ' + diffDays(lastCheckin(), todayKey) + ' days ago.' : 'Take your first one now, so you have a starting point to compare with.') + ' It takes about a minute.</p><div class="row2"><button class="wide-btn" data-act="view" data-v="photos">Open Photos</button><button class="mini" data-act="ph-later">Later</button></div></div>';
  if (!groups.length) h += '<div class="empty">Nothing planned for this day. Add steps in Edit.</div>';
  var ix = 0;
  groups.forEach(function (g) {
    var done = 0, tot = 0;
    g.steps.forEach(function (s) { var a = getDone(selKey, s); tot += a.length; done += a.filter(Boolean).length; });
    h += '<div class="sec-t"><span>' + esc(g.b.n) + '</span><span>' + (g.b.t ? esc(g.b.t) + ' · ' : '') + done + '/' + tot + '</span></div>';
    g.steps.forEach(function (s) { ix++; h += stepCard(s, fut, ix); });
  });
  var off = offList(selKey);
  if (off.length) {
    h += '<button class="offbtn" data-act="off" aria-expanded="' + ui.off + '"><span>Not today</span><span>' + off.length + CHEV + '</span></button>';
    if (ui.off) { h += '<div class="offrows">'; off.forEach(function (o) { h += '<div class="offrow"><b>' + esc(o.s.n) + '</b><span>' + esc(o.txt) + '</span></div>'; }); h += '</div>'; }
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
  var h = '<div class="ex step' + (all ? ' complete' : '') + (fut ? ' fut' : '') + '" data-id="' + esc(s.id) + '">';
  if (s.k === 's') h += '<div class="set' + (all ? ' on' : '') + '" aria-hidden="true"><span class="sn">' + ix + '</span>' + CHECK + '</div><div class="sm">';
  else h += '<button class="set' + (all ? ' on' : '') + '" data-act="chk" data-id="' + esc(s.id) + '" aria-pressed="' + all + '" aria-label="Mark ' + esc(s.n) + ' done"><span class="sn">' + ix + '</span>' + CHECK + '</button><div class="sm">';
  h += '<button class="th" data-act="tog" data-id="' + esc(s.id) + '" aria-expanded="' + open + '"><span class="ex-name">' + esc(s.n) + '</span><span class="car' + (open ? ' up' : '') + '">' + CHEV + '</span></button>';
  if (s.a) h += '<div class="amt">' + esc(s.a) + '</div>';
  if (s.k === 's') {
    var w = (state.wl[selKey] || {})[s.id], lw = lastWeight(s, selKey);
    var pre = w != null && w !== '' ? w : (state.wt[s.id] != null ? state.wt[s.id] : '');
    h += '<div class="sets">';
    a.forEach(function (on, i) { h += '<button class="sb' + (on ? ' on' : '') + '" data-act="set" data-id="' + esc(s.id) + '" data-i="' + i + '" aria-pressed="' + on + '" aria-label="Set ' + (i + 1) + '">' + (on ? CHECK_S : (i + 1)) + '</button>'; });
    h += '<div class="wt"><label for="w-' + esc(s.id) + '">lb</label><input id="w-' + esc(s.id) + '" data-w="' + esc(s.id) + '" type="number" inputmode="decimal" step="0.5" min="0" placeholder="0" aria-label="Weight in pounds, optional" value="' + esc(pre) + '"></div></div>';
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
  var h = '<div class="p-top"><div class="p-title">Week</div></div><p class="fine">What’s planned each day.</p>';
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
  ['Facial hair + brows (minoxidil)', 'You’re starting with no facial hair, so expect fine, light hairs first, around month 1–2. Some people shed a little around month 2–3 before it grows back. Darker, thicker hairs from about month 4–6, so judge it at 6 months, not before. How full it gets is mostly genetics, and minoxidil can only wake up follicles you already have. Brows take about 3–4 months. Gains can fade if you stop.'],
  ['Skin (adapalene, azelaic acid, sunscreen)', 'Dryness and peeling are normal for the first 4 weeks, and weeks 3–6 can look worse before better. Real change in texture and tone by about month 3.'],
  ['Neck', 'Your head is the weight, so it starts slow. Go slower, then add reps, then add light resistance. Expect to judge it at about 3 months.'],
  ['Hair + scalp', 'Flakes usually drop in the first few weeks of Nizoral. Softness builds over weeks of conditioner and leave-in, not days.'],
  ['Posture (chin tucks, stretches)', 'Head and shoulder position shifts over weeks of daily reps. You won’t notice it day to day.']
];
var STOPS = [
  ['Skip the stamp and see a dermatologist if', 'skin is still pink after 3 days, you get scabbing, oozing or pus, dark spots start showing, a cold sore flares, or burning doesn’t fade. Dark spots are the usual long-term risk of stamping, and sun makes them worse. That’s why your morning moisturizer has sunscreen in it.'],
  ['Stop minoxidil and call a doctor if', 'you get a racing or pounding heartbeat, chest pain, dizziness or fainting, or swelling of the face, hands, ankles or around the eyes. Ask a doctor or pharmacist first if you have heart problems.'],
  ['Red, itchy rash where minoxidil goes', 'Usually the propylene glycol in the liquid. Stop for a few days, then switch to 5% foam.'],
  ['Peeling, burning or raw skin from adapalene', 'Drop to 1 night a week, add moisturizer, and build back up slowly.'],
  ['Hair growing where you don’t want it', 'You’re using too much or spreading too far. Use less and apply more precisely.'],
  ['Neck pain, tingling or dizziness during neck work', 'Stop that set. Don’t push through it. If it comes back, skip neck work and see a doctor.'],
  ['Pets', 'Minoxidil is toxic to cats. Keep bottles closed and wash your hands before touching a pet.']
];
var RULES = [
  ['New things start one at a time', 'Azelaic acid, adapalene and the dermastamp each start about a week or more after the last one. If your skin reacts, you know which one did it. The dates are in the list above.'],
  ['Stamp night', 'Stamp the growth areas (cheeks, upper lip, chin, jaw), then plain moisturizer only. The app skips minoxidil that night and the next morning, and skips adapalene that night and the next. Adapalene only ever goes on the upper face, which is why the two can both run.'],
  ['If you miss a minoxidil dose', 'Take the next one on time. Don’t double up. Missed doses are what stall results, so do both doses when you travel too.'],
  ['Why the morning moisturizer has sunscreen', 'Adapalene, azelaic acid and stamping make skin more sun-sensitive, and you drive. UVA passes through car windows, so the SPF lotion covers that without a separate step.'],
  ['Shaving and growth', 'Shaving doesn’t change how fast or thick hair grows. Once hairs start showing on your cheeks, lip, chin and jaw, lay off the razor there so they can fill in.'],
  ['Sleep and puffiness, no clock times', 'It helps to eat the last big meal a few hours before bed, keep caffeine to the early part of the day, keep the room cool and dark, and go easy on salt at dinner and on alcohol. A slightly raised head helps with morning puffiness. These are tips, not rules.']
];
var BUY_NOW = [
  ['Moisturizer with sunscreen', 'CeraVe AM Facial Moisturizing Lotion SPF 30 or EltaMD UV Daily. This is your only sun protection, so it’s the most important gap.'],
  ['Gentle face cleanser', 'Vanicream or CeraVe Hydrating.'],
  ['Plain fragrance-free moisturizer', 'Vanicream Daily Facial Moisturizer, for night. Stops minoxidil flaking.'],
  ['Disposable spoolies', 'About $6. Puts the brow minoxidil on the follicles and not the tips.']
];
var BUY_LATER = [
  ['Band pull-aparts (needs a ~$10 resistance band)', 'What it is: hold a light band in front of you at shoulder height, arms straight, and pull it apart until it touches your chest, squeezing your shoulder blades. It works the upper back for posture, not the neck. Do 2 × 20 before lifting. Optional. Say the word and it goes in the Training section.'],
  ['Wedge pillow, 7–7.5 inch', 'Keeps fluid from pooling under the eyes overnight. Limited evidence, cheap.'],
  ['Caffeine eye serum', 'Mild morning de-puff. Limited evidence.'],
  ['Urea 20% cream (Eucerin Roughness Relief)', 'For rough bumps on the arms, nightly. Moderate evidence.'],
  ['Boil-and-bite night guard', 'Only if you wake with a sore jaw or tight temples, which means clenching.']
];
var LEFT_OUT = [
  ['Jaw exercisers, mastic gum, “hard mewing”', 'No trial shows a sharper jawline. They mostly widen the lower face and stress the jaw joint. Resting your tongue on the roof of your mouth with your lips closed is harmless, but evidence is weak and you should never clench.'],
  ['Facial exercise programs', 'One small 20-week trial in women aged 40–65 found fuller cheeks. It needed 30 min a day, and the method’s creator was a coauthor. Not tested in men, and not tested on a lean face.'],
  ['Biotin and facial-hair “growth” pills', 'No benefit unless you’re deficient, and biotin can skew blood tests.'],
  ['Facial gua sha tools', 'You skipped these. The hand drainage in the morning covers the same idea without a tool or the bruising risk.']
];
function renderGuide() {
  var h = '<div class="p-top"><div class="p-title">Guide</div></div><p class="fine">How it all fits.</p>';
  var starts = [];
  state.plan.steps.forEach(function (s) { if (s.f > 0) { var k = firstDue(s); if (k) starts.push({ n: s.n, k: k }); } });
  starts.sort(function (a, b) { return a.k < b.k ? -1 : a.k > b.k ? 1 : 0; });
  if (starts.length) {
    h += '<div class="panel"><h3>What starts when</h3>' + starts.map(function (x) { return '<div class="li"><span>' + esc(x.n) + '</span><span>' + DN[parseKey(x.k).getDay()] + ' ' + fmtMD(parseKey(x.k)) + '</span></div>'; }).join('') +
      '<p class="hint2">Counted from the start date in Edit. Everything else is on from day one.</p></div>';
  }
  h += '<div class="panel"><h3>Rules the schedule follows</h3>' + RULES.map(function (x) { return '<div class="exp"><b>' + esc(x[0]) + '</b>' + esc(x[1]) + '</div>'; }).join('') + '</div>';
  h += '<div class="panel"><h3>Every step</h3><p class="hint2">Tap a step for how to do it and why it’s here. Evidence: Strong means solid human trials, Moderate means some trials that are small or short, Limited means case reports or evidence from related things, Habit means routine that hasn’t been tested.</p>';
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
    ['Whitening strips', 'A box is one course. Repeat in 4–6 months by changing the start day in Edit.'],
    ['Shower filter cartridge', 'On the box’s schedule, usually about every 6 months.'],
    ['SheaMoisture and Cantu', 'As they run out, about 1–3 months each.']
  ].map(function (x) { return '<div class="exp"><b>' + esc(x[0]) + '</b>' + esc(x[1]) + '</div>'; }).join('') + '</div>';
  h += '<div class="panel"><h3>Buy next (in your steps already)</h3>' + BUY_NOW.map(function (x) { return '<div class="exp"><b>' + esc(x[0]) + '</b>' + esc(x[1]) + '</div>'; }).join('') + '</div>';
  h += '<div class="panel"><h3>Not in your steps yet</h3><p class="hint2">From your earlier lists. Say the word and they go into the right spot in the day.</p>' + BUY_LATER.map(function (x) { return '<div class="exp"><b>' + esc(x[0]) + '</b>' + esc(x[1]) + '</div>'; }).join('') + '</div>';
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
  var H = '';
  var h = '<div class="p-top"><div class="p-title">Edit routine</div></div><p class="fine">Saves as you type.</p>';
  h += '<div class="ed"><div class="edh"><b ' + H + '>Start date</b></div>' +
    '<div class="two"><div><label>Routine started</label><input type="date" data-set="start" value="' + esc(state.start) + '"></div></div>' +
    '<p class="fine">New things start one at a time and some ease in over the first four weeks. Both count from this date. Weeks 1–2, weeks 3–4 and week 5 on can each have different days.</p></div>';
  h += '<div class="ed"><div class="edh"><b ' + H + '>Editing days for</b></div>' +
    '<div class="phs">' + [1, 2, 3].map(function (p) { return '<button data-act="ed-phase" data-p="' + p + '" class="' + (ph === p ? 'on' : '') + '">' + PHN[p] + '</button>'; }).join('') + '</div></div>';
  state.plan.blocks.forEach(function (b) {
    h += '<div class="ed"><div class="edh"><b ' + H + '>' + esc(b.n) + '</b></div>' +
      '<div class="two"><div><label>Section name</label><input data-bf="n" data-b="' + esc(b.id) + '" value="' + esc(b.n) + '"></div><div><label>Time (optional)</label><input data-bf="t" data-b="' + esc(b.id) + '" value="' + esc(b.t || '') + '" placeholder="None"></div></div></div>';
    state.plan.steps.filter(function (s) { return s.b === b.id; }).forEach(function (s) {
      var open = !!edit.open[s.id];
      h += '<div class="ed"><div class="edh"><div><b>' + esc(s.n) + '</b><div class="last">' + daySummary(s, ph) + (s.f > 0 ? ' · starts day ' + (s.f + 1) : '') + (s.u != null ? ' · ends day ' + (s.u + 1) : '') + '</div></div>' +
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
          '<label>Last day (days after the start date, blank = no end)</label><input data-sf="u" data-id="' + esc(s.id) + '" type="number" inputmode="numeric" min="0" max="365" value="' + (s.u == null ? '' : s.u) + '">' +
          '<label>Starts (days after the start date)</label><input data-sf="f" data-id="' + esc(s.id) + '" type="number" inputmode="numeric" min="0" max="365" value="' + (s.f || 0) + '">' +
          '<label>Days (' + PHN[ph] + ')</label><div class="dchips">' + [1, 2, 3, 4, 5, 6, 0].map(function (x) { return '<button class="dc' + (daysFor(s, ph).indexOf(x) >= 0 ? ' on' : '') + '" data-act="ed-day" data-id="' + esc(s.id) + '" data-x="' + x + '">' + DN[x] + '</button>'; }).join('') + '</div>' +
          '<div style="margin-top:14px"><button class="del" data-act="ed-del" data-id="' + esc(s.id) + '">Delete step</button></div>';
      }
      h += '</div>';
    });
    h += '<div style="margin-top:8px"><button class="wide-btn dim" data-act="ed-add" data-b="' + esc(b.id) + '">+ Add a step to ' + esc(b.n) + '</button></div>';
  });
  h += '<div class="ed"><div class="edh"><b ' + H + '>Backup</b></div>' +
    '<p class="fine">Your data lives only on this phone. Copy a backup and paste it into Notes now and then. To restore, paste it below.</p>' +
    '<div class="row2"><button class="btn" style="flex:1" data-act="bk-copy">Copy backup</button></div>' +
    '<label>Restore from backup</label><textarea id="bkin" placeholder="Paste backup text here" style="min-height:90px"></textarea>' +
    '<div style="margin-top:10px"><button class="wide-btn dim" data-act="bk-restore">Restore</button></div>' +
    '<div style="margin-top:10px"><button class="wide-btn dim" data-act="ed-reset">Reset plan to default</button></div></div>';
  $('#list').innerHTML = h;
  $('#ft').innerHTML = '<div class="status" id="bkstat">' + esc(statusMsg) + '</div>';
}

function render() {
  renderHeader();
  if (view === 'today') renderToday(); else if (view === 'week') renderWeek(); else if (view === 'photos') renderPhotos(); else if (view === 'guide') renderGuide(); else renderEdit();
}

/* ---------- photo check-ins (kept on this phone in IndexedDB, not in the text backup) ---------- */
var POSES = ['front', 'left', 'right'];
var POSE_L = { front: 'Front', left: 'Left side', right: 'Right side' };
var POSE_HINT = {
  front: 'Face the camera. Neutral expression, hair pushed back, chin level, shoulders relaxed.',
  left: 'Turn your head so your left cheek and jaw face the camera. Chin level, eyes forward.',
  right: 'Turn your head so your right cheek and jaw face the camera. Chin level, eyes forward.'
};
var PH = { list: [], loaded: false, loading: false, failed: false, urls: {} };
var CAM = { on: false, step: 0, facing: 'user', timer: 10, stream: null, shots: {}, review: null, count: 0, cd: null, err: '', saving: false };
var DBH = null, flashT = null, ac = null;

function idb() {
  return new Promise(function (res, rej) {
    if (DBH) return res(DBH);
    if (!window.indexedDB) return rej(new Error('no indexedDB'));
    var r; try { r = indexedDB.open('blueprint-photos', 1); } catch (e) { return rej(e); }
    r.onupgradeneeded = function () { r.result.createObjectStore('photos', { keyPath: 'k' }); };
    r.onsuccess = function () { DBH = r.result; res(DBH); };
    r.onerror = function () { rej(r.error); }; r.onblocked = function () { rej(new Error('blocked')); };
  });
}
function idbRun(mode, fn) {
  return idb().then(function (db) {
    return new Promise(function (res, rej) {
      var tx = db.transaction('photos', mode), rq = fn(tx.objectStore('photos'));
      tx.oncomplete = function () { res(rq && rq.result); }; tx.onerror = function () { rej(tx.error); }; tx.onabort = function () { rej(tx.error); };
    });
  });
}
function byDate(a, b) { return a.date < b.date ? -1 : (a.date > b.date ? 1 : 0); }
function loadPhotos() {
  if (PH.loading) return; PH.loading = true;
  idbRun('readonly', function (st) { return st.getAll(); }).then(function (arr) {
    Object.keys(PH.urls).forEach(function (k) { try { URL.revokeObjectURL(PH.urls[k]); } catch (e) {} }); PH.urls = {};
    PH.list = (arr || []).sort(byDate); PH.loaded = true; PH.loading = false;
    if (view === 'photos' || view === 'today') render();
  }).catch(function () { PH.failed = true; PH.loaded = true; PH.loading = false; });
}
function photoRec(d, p) { for (var i = 0; i < PH.list.length; i++) if (PH.list[i].date === d && PH.list[i].pose === p) return PH.list[i]; return null; }
function photoUrl(r) { var k = r.k + r.ts; if (!PH.urls[k]) PH.urls[k] = URL.createObjectURL(r.blob); return PH.urls[k]; }
function savePhoto(date, pose, blob, w, h) {
  var rec = { k: date + '|' + pose, date: date, pose: pose, blob: blob, w: w, h: h, ts: Date.now() };
  return idbRun('readwrite', function (st) { return st.put(rec); }).then(function () {
    PH.list = PH.list.filter(function (r) { return r.k !== rec.k; }); PH.list.push(rec); PH.list.sort(byDate);
  });
}
function delCheckin(date) {
  return idbRun('readwrite', function (st) { POSES.forEach(function (p) { st.delete(date + '|' + p); }); }).then(function () { PH.list = PH.list.filter(function (r) { return r.date !== date; }); });
}
function checkDates() { var o = {}; PH.list.forEach(function (r) { o[r.date] = 1; }); return Object.keys(o).sort(); }
function fmtFull(k) { var d = parseKey(k); return fmtMD(d) + ', ' + d.getFullYear(); }
function lastCheckin() { var d = checkDates(); return d.length ? d[d.length - 1] : null; }
function photoDue() {
  if (!PH.loaded || PH.failed || selKey !== todayKey || state.photoLater === todayKey) return false;
  var last = lastCheckin();
  return !last || diffDays(last, todayKey) >= (state.photoEvery || 28);
}
function flash(msg) {
  statusMsg = msg; var el = $('#ft'); if (el) el.innerHTML = '<div class="status">' + esc(msg) + '</div>';
  clearTimeout(flashT); flashT = setTimeout(function () { statusMsg = ''; var e2 = $('#ft'); if (e2 && view === 'photos') e2.innerHTML = ''; }, 4000);
}

function compareHtml() {
  var pose = ui.cmpPose || 'front';
  var h = '<div class="chips">' + POSES.map(function (p) { return '<button class="chip' + (p === pose ? ' on' : '') + '" data-act="cpose" data-p="' + p + '" aria-pressed="' + (p === pose) + '">' + POSE_L[p] + '</button>'; }).join('') + '</div>';
  var ds = PH.list.filter(function (r) { return r.pose === pose; }).map(function (r) { return r.date; });
  if (ds.length < 2) return h + '<p class="fine">Compare needs two check-ins with a ' + POSE_L[pose].toLowerCase() + ' photo. You have ' + ds.length + '.</p>';
  var a = ui.cmpA, b = ui.cmpB;
  if (ds.indexOf(a) < 0) a = ds[0]; if (ds.indexOf(b) < 0) b = ds[ds.length - 1];
  ui.cmpA = a; ui.cmpB = b;
  var ra = photoRec(a, pose), rb = photoRec(b, pose);
  function opt(v) { return ds.map(function (d) { return '<option value="' + d + '"' + (d === v ? ' selected' : '') + '>' + fmtFull(d) + '</option>'; }).join(''); }
  h += '<div class="cmp-sel-row"><label>Before<select id="cmp-a">' + opt(a) + '</select></label><label>After<select id="cmp-b">' + opt(b) + '</select></label></div>';
  h += '<div class="cmp" id="cmp" style="--pos:50%;aspect-ratio:' + (rb.w || 3) + ' / ' + (rb.h || 4) + '"><img class="cmp-b" alt="After photo" src="' + photoUrl(rb) + '"><img class="cmp-a" alt="Before photo" src="' + photoUrl(ra) + '"><div class="cmp-line"></div>' +
    '<span class="cmp-la">' + esc(fmtMD(parseKey(a))) + '</span><span class="cmp-lb">' + esc(fmtMD(parseKey(b))) + '</span>' +
    '<input type="range" min="0" max="100" value="50" id="cmp-r" aria-label="Slide between before and after"></div>';
  return h;
}
function historyHtml() {
  return checkDates().slice().reverse().map(function (d) {
    var th = POSES.map(function (p) {
      var r = photoRec(d, p);
      return r ? '<button class="thumb" data-act="phview" data-k="' + esc(r.k) + '" aria-label="View ' + POSE_L[p] + ' photo"><img alt="" src="' + photoUrl(r) + '"><span>' + POSE_L[p] + '</span></button>' : '<div class="thumb none"><span>' + POSE_L[p] + '</span></div>';
    }).join('');
    return '<div class="ex"><div class="ex-name">' + esc(fmtFull(d)) + '</div><div class="thumbs">' + th + '</div>' +
      '<div class="row2"><button class="mini" style="flex:1" data-act="phshare" data-d="' + d + '">Share or save</button><button class="mini danger" style="flex:1" data-act="phdel" data-d="' + d + '">' + (ui.armed === 'phdel' + d ? 'Tap again to delete' : 'Delete') + '</button></div></div>';
  }).join('');
}
function renderPhotos() {
  var last = lastCheckin(), ev = state.photoEvery || 28;
  var h = '<div class="p-top"><div class="p-title">Photos</div></div><p class="fine">Check-ins stay on this phone. No scores, just before and after.</p>';
  h += '<div class="ex"><div class="ex-name">' + (last ? 'Last check-in: ' + esc(fmtFull(last)) + ' · ' + diffDays(last, todayKey) + ' days ago' : 'No check-ins yet') + '</div>' +
    '<p class="fine">Front and both sides with a self-timer. Same spot, same window light, same time of day (right after you wake up works), no filters. That’s what makes the comparison fair.</p>' +
    '<div class="lab">Remind me</div><div class="chips"><button class="chip' + (ev === 7 ? ' on' : '') + '" data-act="ph-every" data-n="7" aria-pressed="' + (ev === 7) + '">Weekly</button><button class="chip' + (ev === 28 ? ' on' : '') + '" data-act="ph-every" data-n="28" aria-pressed="' + (ev === 28) + '">Monthly</button></div>' +
    '<button class="wide-btn" data-act="camstart">Start check-in</button></div>';
  h += '<div class="sec-t"><span>Compare</span></div>';
  if (PH.failed) h += '<div class="empty">This browser is blocking photo storage, so check-ins can’t be saved here.</div>';
  else if (!PH.loaded) h += '<p class="fine">Loading photos…</p>';
  else if (!PH.list.length) h += '<div class="empty">No photos yet. Do a check-in and your photos show up here. They stay on this phone.</div>';
  else h += '<div class="ex">' + compareHtml() + '</div><div class="sec-t"><span>All check-ins</span></div>' + historyHtml() +
    '<p class="fine">Photos live only on this phone, not in the text backup. Use Share or save now and then so a phone problem can’t take them.</p>';
  $('#list').innerHTML = h;
  $('#ft').innerHTML = statusMsg ? '<div class="status">' + esc(statusMsg) + '</div>' : '';
}
function sharePhotos(d) {
  var files = POSES.map(function (p) { return photoRec(d, p); }).filter(Boolean).map(function (r) { return new File([r.blob], 'blueprint-' + r.date + '-' + r.pose + '.jpg', { type: 'image/jpeg' }); });
  try { if (files.length && navigator.canShare && navigator.canShare({ files: files })) { navigator.share({ files: files, title: 'Blueprint check-in ' + d }).catch(function () {}); return; } } catch (e) {}
  flash('Sharing isn’t supported here. Tap a photo, then press and hold it to save.');
}
function viewPhoto(k) {
  var r = null; PH.list.forEach(function (x) { if (x.k === k) r = x; }); if (!r) return;
  var v = $('#viewer'); v.innerHTML = '<button class="v-x" data-act="vclose" aria-label="Close photo">Close</button><img alt="' + POSE_L[r.pose] + ' photo from ' + esc(fmtFull(r.date)) + '" src="' + photoUrl(r) + '"><div class="v-cap">' + esc(fmtFull(r.date)) + ' · ' + POSE_L[r.pose] + '</div>';
  v.classList.add('on');
}

/* camera */
var GUIDE = '<svg class="cam-guide" viewBox="0 0 100 150" preserveAspectRatio="xMidYMid meet" aria-hidden="true"><g fill="none" stroke="#fff" stroke-opacity=".7" stroke-width=".8" stroke-dasharray="2 1.6"><ellipse cx="50" cy="62" rx="26" ry="35"/><path d="M24 62 q-4 0 -4 8 q0 8 4 8 M76 62 q4 0 4 8 q0 8 -4 8"/><path d="M36 54 h10 M54 54 h10"/></g></svg>';
function camShell() {
  $('#cam').innerHTML =
    '<div class="cam-top"><button class="cam-btn" data-act="camx">Close</button><div class="cam-t" id="cam-t"></div><button class="cam-btn" data-act="camflip" id="cam-flip">Flip</button></div>' +
    '<div class="cam-stage"><video id="cam-v" playsinline muted autoplay></video><img id="cam-r" alt="Photo preview">' + GUIDE + '<div class="cam-count" id="cam-c"></div><div class="cam-msg" id="cam-m"></div></div>' +
    '<div class="cam-hint" id="cam-h"></div>' +
    '<div class="cam-bot" id="cam-live"><div class="cam-timers" id="cam-tm"></div><button class="shutter" id="cam-s" data-act="camshot" aria-label="Take photo"></button><div class="cam-side"><button class="cam-btn" data-act="camlib">Library</button><button class="cam-btn" data-act="camskip">Skip pose</button></div></div>' +
    '<div class="cam-bot rv" id="cam-rv"><button class="cam-btn big" data-act="camretake">Retake</button><button class="cam-btn big blue" data-act="camkeep" id="cam-keep">Keep</button></div>' +
    '<input type="file" id="cam-f" accept="image/*" hidden>';
  $('#cam').classList.add('on');
}
function camUpdate() {
  var pose = POSES[CAM.step] || 'front', rv = !!CAM.review;
  function g(id) { return document.getElementById(id); } if (!g('cam-t')) return;
  g('cam-t').textContent = (CAM.step + 1) + ' of 3 · ' + POSE_L[pose];
  g('cam-h').textContent = CAM.err || POSE_HINT[pose];
  g('cam-h').className = 'cam-hint' + (CAM.err ? ' err' : '');
  var v = g('cam-v');
  v.className = CAM.facing === 'user' ? 'mir' : '';
  v.style.display = rv ? 'none' : 'block';
  if (CAM.stream && v.srcObject !== CAM.stream) { v.srcObject = CAM.stream; var pr = v.play(); if (pr && pr.catch) pr.catch(function () {}); }
  var im = g('cam-r'); im.style.display = rv ? 'block' : 'none'; if (rv && im.src !== CAM.review.url) im.src = CAM.review.url;
  g('cam-live').style.display = rv ? 'none' : 'flex'; g('cam-rv').style.display = rv ? 'flex' : 'none';
  g('cam-tm').innerHTML = [0, 5, 10].map(function (n) { return '<button class="cam-chip' + (CAM.timer === n ? ' on' : '') + '" data-act="camtimer" data-n="' + n + '" aria-pressed="' + (CAM.timer === n) + '">' + (n ? n + 's' : 'Off') + '</button>'; }).join('');
  g('cam-c').textContent = CAM.count > 0 ? String(CAM.count) : '';
  g('cam-s').className = 'shutter' + (CAM.cd ? ' on' : '');
  g('cam-s').setAttribute('aria-label', CAM.cd ? 'Cancel countdown' : 'Take photo');
  g('cam-keep').textContent = CAM.saving ? 'Saving…' : (CAM.step >= 2 ? 'Save check-in' : 'Keep');
  g('cam-m').textContent = (!CAM.stream && !rv && !CAM.err) ? 'Starting camera…' : '';
  g('cam-flip').style.visibility = CAM.stream ? 'visible' : 'hidden';
}
function camStop() {
  if (CAM.cd) { clearInterval(CAM.cd); CAM.cd = null } CAM.count = 0;
  if (CAM.stream) { CAM.stream.getTracks().forEach(function (t) { t.stop(); }); CAM.stream = null; }
}
function camStart() {
  camStop();
  if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) { CAM.err = 'This browser can’t open the camera. Use Library to pick a photo.'; camUpdate(); return; }
  navigator.mediaDevices.getUserMedia({ video: { facingMode: CAM.facing, width: { ideal: 1080 }, height: { ideal: 1440 } }, audio: false }).then(function (s) {
    if (!CAM.on) { s.getTracks().forEach(function (t) { t.stop(); }); return; }
    CAM.stream = s; CAM.err = ''; camUpdate();
  }).catch(function () { CAM.err = 'Camera is blocked. Allow it in Settings, or use Library to pick a photo.'; camUpdate(); });
}
function camOpen() { CAM.on = true; CAM.step = 0; CAM.shots = {}; CAM.review = null; CAM.err = ''; CAM.saving = false; camShell(); camUpdate(); camStart(); }
function camClose() {
  CAM.on = false; camStop();
  if (CAM.review) { try { URL.revokeObjectURL(CAM.review.url); } catch (e) {} CAM.review = null; }
  var c = $('#cam'); c.classList.remove('on'); c.innerHTML = '';
}
function ensureAudio() { try { if (!ac) { var C = window.AudioContext || window.webkitAudioContext; if (C) ac = new C(); } if (ac && ac.state === 'suspended') ac.resume(); } catch (e) {} }
function tickBeep(f) {
  ensureAudio(); if (!ac) return;
  try { var t0 = ac.currentTime, os = ac.createOscillator(), g = ac.createGain(); os.type = 'sine'; os.frequency.value = f;
    g.gain.setValueAtTime(.0001, t0); g.gain.exponentialRampToValueAtTime(.4, t0 + .01); g.gain.exponentialRampToValueAtTime(.0001, t0 + .15);
    os.connect(g); g.connect(ac.destination); os.start(t0); os.stop(t0 + .16); } catch (e) {}
}
function reviewFromCanvas(cv) {
  cv.toBlob(function (b) {
    if (!b) { CAM.err = 'Could not capture the photo. Try again.'; camUpdate(); return; }
    CAM.review = { blob: b, url: URL.createObjectURL(b), w: cv.width, h: cv.height }; camUpdate();
  }, 'image/jpeg', .85);
}
function drawScaled(src, sw, sh, mirror) {
  var sc = Math.min(1, 1280 / Math.max(sw, sh)), w = Math.round(sw * sc), h = Math.round(sh * sc);
  var cv = document.createElement('canvas'); cv.width = w; cv.height = h;
  var cx = cv.getContext('2d'); if (mirror) { cx.translate(w, 0); cx.scale(-1, 1); }
  cx.drawImage(src, 0, 0, w, h); return cv;
}
function camSnap() {
  var v = document.getElementById('cam-v');
  if (!v || !v.videoWidth) { CAM.err = 'Camera isn’t ready yet. Try again in a moment.'; camUpdate(); return; }
  reviewFromCanvas(drawScaled(v, v.videoWidth, v.videoHeight, CAM.facing === 'user'));
}
function camShot() {
  if (CAM.cd) { clearInterval(CAM.cd); CAM.cd = null; CAM.count = 0; camUpdate(); return; }
  if (!CAM.stream) return;
  ensureAudio();
  if (CAM.timer <= 0) { camSnap(); return; }
  CAM.count = CAM.timer; camUpdate();
  CAM.cd = setInterval(function () {
    CAM.count--;
    if (CAM.count > 0 && CAM.count <= 3) tickBeep(660);
    if (CAM.count <= 0) { clearInterval(CAM.cd); CAM.cd = null; tickBeep(1000); camSnap(); }
    camUpdate();
  }, 1000);
}
function camFromFile(f) {
  if (!f) return;
  function done(src) { reviewFromCanvas(drawScaled(src, src.width, src.height, false)); }
  function fallback() {
    var u = URL.createObjectURL(f), im = new Image();
    im.onload = function () { done(im); URL.revokeObjectURL(u); };
    im.onerror = function () { CAM.err = 'That file couldn’t be opened as a photo.'; camUpdate(); }; im.src = u;
  }
  if (window.createImageBitmap) createImageBitmap(f, { imageOrientation: 'from-image' }).then(done, fallback); else fallback();
}
function camKeep() {
  if (!CAM.review || CAM.saving) return;
  var pose = POSES[CAM.step];
  CAM.shots[pose] = { blob: CAM.review.blob, w: CAM.review.w, h: CAM.review.h };
  try { URL.revokeObjectURL(CAM.review.url); } catch (e) {} CAM.review = null;
  if (CAM.step >= 2) { camFinish(); return; }
  CAM.step++; camUpdate();
}
function camFinish() {
  var poses = Object.keys(CAM.shots);
  if (!poses.length) { camClose(); return; }
  CAM.saving = true; camUpdate();
  poses.reduce(function (p, pose) { return p.then(function () { return savePhoto(todayKey, pose, CAM.shots[pose].blob, CAM.shots[pose].w, CAM.shots[pose].h); }); }, Promise.resolve()).then(function () {
    camClose(); render(); flash('Check-in saved on this phone.');
  }).catch(function () { CAM.saving = false; CAM.err = 'Could not save. Photo storage may be blocked in this browser.'; camUpdate(); });
}
function camSkip() { if (CAM.step >= 2) { camFinish(); return; } CAM.step++; camUpdate(); }

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
      if (view === 'photos' && !PH.loaded) loadPhotos();
      render(); window.scrollTo(0, 0); break;
    case 'wk-prev': weekMon = addDays(weekMon, -7); selKey = dkey(weekMon); render(); break;
    case 'wk-next': weekMon = addDays(weekMon, 7); selKey = dkey(weekMon) === dkey(mondayOf(parseKey(todayKey))) ? todayKey : dkey(weekMon); render(); break;
    case 'wv-prev': wvMon = addDays(wvMon, -7); render(); break;
    case 'wv-next': wvMon = addDays(wvMon, 7); render(); break;
    case 'day': selKey = el.getAttribute('data-k'); render(); break;
    case 'hint': state.hint = true; save(); render(); break;
    case 'ph-later': state.photoLater = todayKey; save(); render(); break;
    case 'ph-every': state.photoEvery = +el.getAttribute('data-n'); save(); render(); break;
    case 'camstart': camOpen(); break;
    case 'camx': camClose(); break;
    case 'camflip': CAM.facing = CAM.facing === 'user' ? 'environment' : 'user'; CAM.stream = null; camUpdate(); camStart(); break;
    case 'camtimer': CAM.timer = +el.getAttribute('data-n'); camUpdate(); break;
    case 'camshot': camShot(); break;
    case 'camlib': { var cf = document.getElementById('cam-f'); if (cf) { cf.value = ''; cf.click(); } break; }
    case 'camretake': if (CAM.review) { try { URL.revokeObjectURL(CAM.review.url); } catch (x) {} CAM.review = null; camUpdate(); } break;
    case 'camkeep': camKeep(); break;
    case 'camskip': camSkip(); break;
    case 'cpose': ui.cmpPose = el.getAttribute('data-p'); ui.cmpA = null; ui.cmpB = null; render(); break;
    case 'phview': viewPhoto(el.getAttribute('data-k')); break;
    case 'vclose': { var vv = $('#viewer'); vv.classList.remove('on'); vv.innerHTML = ''; break; }
    case 'phshare': sharePhotos(el.getAttribute('data-d')); break;
    case 'phdel': {
      var dd = el.getAttribute('data-d');
      if (ui.armed === 'phdel' + dd) { ui.armed = null; delCheckin(dd).then(function () { render(); flash('Check-in deleted.'); }).catch(function () { flash('Could not delete.'); }); }
      else { ui.armed = 'phdel' + dd; render(); setTimeout(function () { if (ui.armed === 'phdel' + dd) { ui.armed = null; if (view === 'photos') render(); } }, 3000); }
      break;
    }
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
  if (t.id === 'cmp-r') { var ce = document.getElementById('cmp'); if (ce) ce.style.setProperty('--pos', t.value + '%'); return; }
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
    else if (f === 'u') { if (t.value === '') delete s.u; else s.u = Math.min(365, Math.max(0, parseInt(t.value, 10) || 0)); }
    else if (f !== 'b' && f !== 'k' && f !== 'e') s[f] = t.value;
    save();
  }
});
document.addEventListener('change', function (e) {
  var t = e.target;
  if (t.id === 'cam-f') { camFromFile(t.files && t.files[0]); return; }
  if (t.id === 'cmp-a' || t.id === 'cmp-b') { if (t.id === 'cmp-a') ui.cmpA = t.value; else ui.cmpB = t.value; render(); return; }
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
  loadPhotos();
  document.addEventListener('visibilitychange', function () { if (!document.hidden && setToday()) render(); });
  if ('serviceWorker' in navigator && /^https?:$/.test(location.protocol)) {
    window.addEventListener('load', function () { navigator.serviceWorker.register('sw.js').catch(function () {}); });
  }
}
window.__bp = { get state() { return state; }, groupsFor: groupsFor, due: due, rawDue: rawDue, stampBefore: stampBefore, dayStat: dayStat, phaseOf: phaseOf, weekNo: weekNo, offList: offList, newToday: newToday, firstDue: firstDue };
init();
})();
