// Gifts a player owns ("My gifts"): a free jersey from the Welcome pack, plus gifts bought with Mundo Credits.
// They ship free inside a paid order of GIFT_MIN dollars or more (items only, before shipping).
import { randomBytes } from 'node:crypto';

export const GIFT_MIN = 40;      // legacy (gifts used to ride along with a paid order)
export const GIFT_UNLOCK = 30;   // gifts unlock once the account has spent this much in the shop; then they ship free
export const newGift = (name, kind, n, src) => ({ id: 'g' + randomBytes(5).toString('hex'), name, kind, n: n || 1, src, at: Date.now() });
export const publicGifts = u => (u.gifts || []).map(g => ({ id: g.id, name: g.name, kind: g.kind, n: g.n, src: g.src, at: g.at, used: g.used || null }));
