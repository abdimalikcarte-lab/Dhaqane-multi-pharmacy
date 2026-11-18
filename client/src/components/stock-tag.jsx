export default function StockTag({ qty, reorder }) {
  if (qty <= reorder / 2) return <span className="tag urgent">Urgent</span>;
  if (qty <= reorder) return <span className="tag low">Low</span>;
  return <span className="tag ok">Normal</span>;
}
