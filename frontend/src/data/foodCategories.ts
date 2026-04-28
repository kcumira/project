export const foodCategories = [
  { id: 'veggies', icon: 'nutrition', label: 'Veggies', value: 'Vegetables', tone: 'bg-emerald-50 text-emerald-600 border-emerald-100' },
  { id: 'fruits', icon: 'grocery', label: 'Fruits', value: 'Fruits', tone: 'bg-rose-50 text-rose-500 border-rose-100' },
  { id: 'dairy', icon: 'egg_alt', label: 'Dairy', value: 'Dairy', tone: 'bg-yellow-50 text-yellow-600 border-yellow-100' },
  { id: 'meat', icon: 'skillet', label: 'Meat', value: 'Meat', tone: 'bg-red-50 text-red-500 border-red-100' },
  { id: 'bakery', icon: 'bakery_dining', label: 'Bakery', value: 'Bakery', tone: 'bg-orange-50 text-orange-600 border-orange-100' },
  { id: 'pantry', icon: 'kitchen', label: 'Pantry', value: 'Pantry', tone: 'bg-sky-50 text-sky-600 border-sky-100' },
];

export const fallbackFoodCategory = {
  id: 'food',
  icon: 'restaurant',
  label: 'Food',
  value: 'Food',
  tone: 'bg-slate-50 text-slate-500 border-slate-100',
};

export function getFoodCategoryMeta(category?: string | null) {
  if (!category) return fallbackFoodCategory;
  const normalized = category.toLowerCase();
  return (
    foodCategories.find((item) =>
      [item.id, item.label, item.value]
        .map((value) => value.toLowerCase())
        .includes(normalized)
    ) ?? fallbackFoodCategory
  );
}

