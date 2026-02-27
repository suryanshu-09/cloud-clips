import { ScrollView, Pressable, type ScrollViewProps } from 'react-native';
import { Badge } from '@/components/ui/Badge';

export interface ICategoryFilterItem {
  value: string;
  label: string;
  icon?: string;
}

interface ICategoryFilterProps extends Omit<ScrollViewProps, 'children'> {
  categories: ICategoryFilterItem[];
  selectedCategory: string;
  onCategorySelect: (category: string) => void;
}

export function CategoryFilter({
  categories,
  selectedCategory,
  onCategorySelect,
  ...props
}: ICategoryFilterProps) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerClassName="px-4 py-3 gap-2"
      {...props}
    >
      {categories.map((category) => (
        <Pressable
          key={category.value}
          onPress={() => onCategorySelect(category.value)}
          className="flex-row items-center"
        >
          <Badge variant={selectedCategory === category.value ? 'primary' : 'secondary'} size="md">
            {category.icon && `${category.icon} `}
            {category.label}
          </Badge>
        </Pressable>
      ))}
    </ScrollView>
  );
}
