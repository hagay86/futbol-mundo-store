// Gifts a player owns ("My gifts"): a free jersey from the Welcome pack, plus gifts bought with Mundo Credits.
// They ship free inside a paid order of GIFT_MIN dollars or more (items only, before shipping).
import { randomBytes } from 'node:crypto';

export const GIFT_MIN = 40;      // legacy (gifts used to ride along with a paid order)
export const GIFT_UNLOCK = 30;   // gifts unlock once the account has spent this much in the shop; then they ship free
export const newGift = (name, kind, n, src) => ({ id: 'g' + randomBytes(5).toString('hex'), name, kind, n: n || 1, src, at: Date.now() });
export const publicGifts = u => (u.gifts || []).map(g => ({ id: g.id, name: g.name, kind: g.kind, n: g.n, src: g.src, at: g.at, used: g.used || null }));

// Each shop gift unlocks after more shop spending than the one before it. The amounts are never sent to the browser.
export const GIFT_STEPS = { 'Free pants': 30, 'Free jersey': 60, 'Free mystery box': 90, 'Free kids full outfit': 120, 'Free 2-jersey mystery box': 150, 'Free 3-jersey mystery box': 180 };
export const unlockFor = name => GIFT_STEPS[name] || GIFT_UNLOCK;
export const unlockedGifts = u => Object.keys(GIFT_STEPS).filter(n => (u.spent || 0) >= GIFT_STEPS[n]);
