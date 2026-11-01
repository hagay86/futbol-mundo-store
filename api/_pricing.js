// Fixed shop prices by product type (same function runs in the browser, see index.html).
export const PRICE = { shirt: 35, pants: 25, kids: 29, shorts: 20, outer: 45, shoes: 55, other: 35 };
export function tierOf(p) {
  const n = String(p.n || ''), c = String(p.c || '');
  if (/\bpants?\b|trouser/i.test(n)) return 'pants';
  if (c === 'Kids' || /\bkids?\b|\bbaby\b|infant|youth|children|\bchild\b/i.test(n)) return 'kids';
  if (c === 'Shoes' || /shoe|boot|sneaker|\bslides?\b|cleat|jordan|dunk|air max|air force/i.test(n)) return 'shoes';
  if (/jacket|hoodie|tracksuit|windbreaker|coat|sweatshirt|sweater|zip/i.test(n)) return 'outer';
  if (/jersey|shirt|\bkit\b|\btop\b|polo|vest|\bsuit\b|uniform/i.test(n)) return 'shirt';
  if (/\bshorts?\b/i.test(n)) return 'shorts';
  return 'other';
}
export const fixedPrice = p => PRICE[tierOf(p)];
