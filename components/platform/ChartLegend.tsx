/** Leyenda compartida de los gráficos de la plataforma.
 *  Recharts trae su propia leyenda, pero usa markup e inline styles propios:
 *  esto la reemplaza por el mismo `.plat-status-legend` del resto de la UI,
 *  para que el tamaño de texto y las formas queden iguales en todas las tarjetas.
 *  Uso: <Legend content={<ChartLegend />} /> */
export default function ChartLegend({
  payload,
}: {
  payload?: { value?: string; color?: string }[];
}) {
  if (!payload?.length) return null;
  return (
    <ul className="plat-status-legend plat-chart-legend">
      {payload.map((entry) => (
        <li key={entry.value}>
          <span style={{ background: entry.color }} />
          {entry.value}
        </li>
      ))}
    </ul>
  );
}
