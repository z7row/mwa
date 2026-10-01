export function clean(b) {
  const name = String(b.name || '').trim().slice(0, 100);
  if (!name) return { error: 'Name is required' };
  const link = String(b.link || '').trim();
  if (link && !/^https?:\/\//i.test(link)) return { error: 'Link must start with http(s)://' };
  const img = String(b.img || '');
  if (img && (!/^data:image\/(jpeg|png|webp|gif);base64,/.test(img) || img.length > 900000)) return { error: 'Invalid or too large image' };
  return { data: {
    name, link, img,
    description: String(b.description || '').slice(0, 2000),
    date: String(b.date || '').slice(0, 10),
    type: b.type === 'received' ? 'received' : 'created',
  } };
}
