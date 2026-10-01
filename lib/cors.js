// PORTFOLIO_ORIGIN = one or more origins separated by commas (no trailing slash). Empty or "*" = any site.
export function cors(req) {
  const list = (process.env.PORTFOLIO_ORIGIN || '*').split(',').map(s => s.trim()).filter(Boolean);
  const o = req.headers.get('origin');
  const h = { Vary: 'Origin' };
  if (list.includes('*')) h['Access-Control-Allow-Origin'] = '*';
  else if (o && list.includes(o)) h['Access-Control-Allow-Origin'] = o;
  return h;
}
