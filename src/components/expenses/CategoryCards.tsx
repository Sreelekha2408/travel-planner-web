import { Box, Typography } from "@mui/material";
import { expenseCategoryOption, type CategoryTotal } from "../../common/expenseUtils";
import { formatBudget } from "../../common/tripUtils";

// The design's stat cards for the biggest categories: emoji, amount, label and share.
const CategoryCards = ({ categories, currency }: { categories: CategoryTotal[]; currency: string | null }) => (
  <Box component="ul" aria-label="Top spending categories" sx={{ listStyle: "none", m: 0, p: 0, display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))", gap: 1.5 }}>
    {categories.slice(0, 4).map(({ category, total, percent }) => {
      const option = expenseCategoryOption(category);
      return (
        <Box component="li" key={category} sx={{ bgcolor: "background.paper", borderRadius: 3.5, boxShadow: 1, p: 2 }}>
          <Box aria-hidden sx={{ fontSize: 20, mb: 0.75 }}>{option.emoji}</Box>
          <Typography sx={{ fontSize: 20, fontWeight: 800 }}>{formatBudget(total, currency)}</Typography>
          <Typography sx={{ fontSize: 12, color: "text.secondary" }}>{option.label}</Typography>
          <Box component="span" sx={{ display: "inline-block", mt: 0.75, px: 1, py: 0.25, borderRadius: 5, bgcolor: "brand.soft", color: "primary.main", fontSize: 10, fontWeight: 600 }}>
            {percent}%
          </Box>
        </Box>
      );
    })}
  </Box>
);
export default CategoryCards;
