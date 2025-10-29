import React from "react";

interface Category {
  name: string;
  id: number;
}

interface CategorySelectorProps {
  selectedCategory: string;
  onCategoryChange: (category: string) => void;
  onResetFeed?: () => void;
}

export const popularCategories: Category[] = [
  { name: "All", id: 0 },
  { name: "Art", id: 9 },
  { name: "Beauty", id: 10 },
  { name: "Business", id: 11 },
  { name: "Fashion", id: 12 },
  { name: "Fitness", id: 14 },
  { name: "Food", id: 15 },
  { name: "Gaming", id: 16 },
  { name: "Music", id: 17 },
  { name: "Tech", id: 20 },
  { name: "Travel", id: 21 },
];

const CategorySelector = ({
  selectedCategory,
  onCategoryChange,
  onResetFeed
}: CategorySelectorProps) => {
  const handleCategoryClick = (categoryName: string) => {
    onCategoryChange(categoryName);
    onResetFeed?.();
  };

  return (
    <div className="fixed left-0 right-0 z-30 py-4 overflow-x-auto no-scrollbar md:flex md:justify-center"
      style={{ top: 'calc(var(--navbar-height, 56px) + 8px)', background: 'transparent' }}
    >
      <div className="flex gap-2 px-4 min-w-max">
        {popularCategories.map((category) => (
          <button
            key={category.name}
            onClick={() => handleCategoryClick(category.name)}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-all backdrop-blur-xl border shadow-lg hover:scale-105 ${
              selectedCategory === category.name
                ? "bg-gradient-to-r from-[#00dcaa] to-[#00b894] text-white border-white/20"
                : "bg-white/70 dark:bg-gray-800/70 text-gray-700 dark:text-gray-200 border-white/30 dark:border-gray-700/30 hover:bg-white/90 dark:hover:bg-gray-800/90"
            }`}
            style={{
              backdropFilter: 'blur(16px) saturate(180%)',
              WebkitBackdropFilter: 'blur(16px) saturate(180%)',
            }}
          >
            {category.name}
          </button>
        ))}
      </div>
    </div>
  );
};

export default CategorySelector;