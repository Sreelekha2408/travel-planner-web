import { Box, Typography } from "@mui/material";
import { PieChart, type PieChartProps } from "@mui/x-charts/PieChart";
import { useState } from "react";
import { expenseCategoryOption, type CategoryTotal } from "../../common/expenseUtils";
import { formatBudget } from "../../common/tripUtils";

type HighlightedItem = Parameters<NonNullable<PieChartProps["onHighlightChange"]>>[0];

const SERIES_ID = "spending";
const SIZE = 160;

// The design's "Spending Breakdown" as an interactive donut (MUI X Charts): hovering a
// slice lifts it, fades the others and shows a tooltip ("🏨 Stay · €840 (72%)"); hovering a
// legend row highlights its slice. The legend always names each category with its share,
// so identity never depends on colour alone.
const SpendingDonut = ({ categories, total, currency }: { categories: CategoryTotal[]; total: number; currency: string | null }) => {
  // Controlled highlight, so the chart and our legend highlight the same slice.
  const [highlighted, setHighlighted] = useState<HighlightedItem>(null);

  const data = categories.map(({ category, total: sum, percent }) => {
    const option = expenseCategoryOption(category);
    return { id: category, value: sum, label: `${option.emoji} ${option.label}`, name: option.label, color: option.chart, percent };
  });

  return (
    <Box sx={{ bgcolor: "background.paper", borderRadius: 4, boxShadow: 1, p: 2.5, display: "flex", flexDirection: "column", alignItems: "center", gap: 2 }}>
      <Box sx={{ position: "relative", width: SIZE, height: SIZE }}>
        <PieChart
          width={SIZE}
          height={SIZE}
          margin={{ top: 0, right: 0, bottom: 0, left: 0 }}
          hideLegend // our own legend below shows the percentages
          highlightedItem={highlighted}
          onHighlightChange={setHighlighted}
          series={[
            {
              id: SERIES_ID,
              data,
              innerRadius: 50,
              outerRadius: 72,
              paddingAngle: 1.5, // a thin gap keeps neighbouring slices apart
              cornerRadius: 3,
              highlightScope: { highlight: "item", fade: "global" },
              highlighted: { additionalRadius: 4 },
              faded: { additionalRadius: -2 }, // the library also dims faded slices; they keep their own colour
              valueFormatter: (item, { dataIndex }) => `${formatBudget(item.value, currency)} (${data[dataIndex].percent}%)`,
            },
          ]}
        />
        {/* Total in the hole; pointer-events off so hovering still reaches the slices */}
        <Box sx={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", pointerEvents: "none" }}>
          <Typography sx={{ fontSize: 15, fontWeight: 800 }}>{formatBudget(total, currency)}</Typography>
          <Typography sx={{ fontSize: 10, color: "text.secondary" }}>Total spent</Typography>
        </Box>
      </Box>

      <Box component="ul" aria-label="Spending by category" sx={{ listStyle: "none", m: 0, p: 0, width: "100%", display: "grid", gridTemplateColumns: "1fr 1fr", gap: 0.5 }}>
        {data.map((slice, dataIndex) => {
          const active = highlighted?.dataIndex === dataIndex;
          return (
            <Box
              component="li"
              key={slice.id}
              onMouseEnter={() => setHighlighted({ type: "pie", seriesId: SERIES_ID, dataIndex })}
              onMouseLeave={() => setHighlighted(null)}
              sx={{
                display: "flex",
                alignItems: "center",
                gap: 0.75,
                fontSize: 12,
                px: 0.75,
                py: 0.5,
                borderRadius: 1.5,
                cursor: "default",
                bgcolor: active ? "brand.soft" : "transparent",
                opacity: highlighted && !active ? 0.55 : 1,
                transition: "opacity 0.15s, background-color 0.15s",
              }}
            >
              <Box aria-hidden sx={{ width: 10, height: 10, borderRadius: 0.5, bgcolor: slice.color, flexShrink: 0 }} />
              <Box component="span" sx={{ flex: 1, minWidth: 0 }}>{slice.name}</Box>
              <Box component="span" sx={{ color: "text.secondary" }}>{slice.percent}%</Box>
            </Box>
          );
        })}
      </Box>
    </Box>
  );
};
export default SpendingDonut;
