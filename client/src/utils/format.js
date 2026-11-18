export const money = (n) => '$' + Number(n || 0).toFixed(2);

export const dateTime = (d) =>
  new Date(d).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' });

export const payLabel = (p) =>
  ({ cash: 'Cash', card: 'Card', mobile_money: 'Mobile money' })[p] || p;
