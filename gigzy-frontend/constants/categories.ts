export interface CategoryItem {
  key: string;
  label: string;
  icon: string;
}

export interface CategoryGroup {
  name: string;
  categories: CategoryItem[];
}

export const CATEGORY_GROUPS: CategoryGroup[] = [
  {
    name: 'Home Services',
    categories: [
      { key: 'PLUMBING', label: 'Plumbing', icon: 'water-outline' },
      { key: 'ELECTRICAL', label: 'Electrical', icon: 'flash-outline' },
      { key: 'CARPENTRY', label: 'Carpentry', icon: 'hammer-outline' },
      { key: 'PAINTING', label: 'Painting', icon: 'brush-outline' },
      { key: 'CLEANING', label: 'Cleaning', icon: 'sparkles-outline' },
      { key: 'GARDENING', label: 'Gardening', icon: 'leaf-outline' },
    ],
  },
  {
    name: 'Construction',
    categories: [
      { key: 'MASON', label: 'Masonry / Mason', icon: 'construct-outline' },
      { key: 'WELDING', label: 'Welding', icon: 'flame-outline' },
      { key: 'TILING', label: 'Tiling', icon: 'grid-outline' },
      { key: 'ROOFING', label: 'Roofing', icon: 'home-outline' },
    ],
  },
  {
    name: 'Delivery & Logistics',
    categories: [
      { key: 'DELIVERY', label: 'Delivery', icon: 'bicycle-outline' },
      { key: 'DRIVER', label: 'Driver / Chauffeur', icon: 'car-outline' },
      { key: 'LOADING', label: 'Loading', icon: 'download-outline' },
      { key: 'UNLOADING', label: 'Unloading', icon: 'upload-outline' },
      { key: 'WAREHOUSE', label: 'Warehouse Work', icon: 'archive-outline' },
    ],
  },
  {
    name: 'Food & Hospitality',
    categories: [
      { key: 'COOK', label: 'Cook / Chef', icon: 'restaurant-outline' },
      { key: 'WAITER', label: 'Waiter / Server', icon: 'cafe-outline' },
      { key: 'BARTENDER', label: 'Bartender', icon: 'wine-outline' },
      { key: 'HOUSEKEEPING', label: 'Housekeeping', icon: 'bed-outline' },
      { key: 'CATERING', label: 'Catering', icon: 'fast-food-outline' },
    ],
  },
  {
    name: 'Beauty & Wellness',
    categories: [
      { key: 'BEAUTICIAN', label: 'Beautician', icon: 'flower-outline' },
      { key: 'HAIRSTYLIST', label: 'Hairstylist', icon: 'cut-outline' },
      { key: 'MAKEUP_ARTIST', label: 'Makeup Artist', icon: 'color-palette-outline' },
      { key: 'MASSAGE', label: 'Massage Therapist', icon: 'body-outline' },
    ],
  },
  {
    name: 'IT & Digital',
    categories: [
      { key: 'WEB_DEVELOPMENT', label: 'Web Development', icon: 'code-slash-outline' },
      { key: 'MOBILE_DEVELOPMENT', label: 'Mobile Development', icon: 'phone-portrait-outline' },
      { key: 'UI_UX_DESIGN', label: 'UI/UX Design', icon: 'layers-outline' },
      { key: 'GRAPHIC_DESIGN', label: 'Graphic Design', icon: 'image-outline' },
      { key: 'VIDEO_EDITING', label: 'Video Editing', icon: 'videocam-outline' },
      { key: 'CONTENT_WRITING', label: 'Content Writing', icon: 'document-text-outline' },
      { key: 'DIGITAL_MARKETING', label: 'Digital Marketing', icon: 'trending-up-outline' },
      { key: 'DATA_ENTRY', label: 'Data Entry', icon: 'keypad-outline' },
    ],
  },
  {
    name: 'Education',
    categories: [
      { key: 'TUTOR', label: 'Academic Tutor', icon: 'school-outline' },
      { key: 'TRAINER', label: 'Personal Trainer', icon: 'fitness-outline' },
    ],
  },
  {
    name: 'Events',
    categories: [
      { key: 'PHOTOGRAPHY', label: 'Photography', icon: 'camera-outline' },
      { key: 'VIDEOGRAPHY', label: 'Videography', icon: 'videocam-outline' },
      { key: 'EVENT_MANAGEMENT', label: 'Event Management', icon: 'calendar-outline' },
      { key: 'DECORATION', label: 'Decoration', icon: 'ribbon-outline' },
    ],
  },
  {
    name: 'Business & Office',
    categories: [
      { key: 'SALES', label: 'Sales / Retail', icon: 'pricetag-outline' },
      { key: 'CUSTOMER_SUPPORT', label: 'Customer Support', icon: 'call-outline' },
      { key: 'TELECALLER', label: 'Telecaller', icon: 'headset-outline' },
      { key: 'OFFICE_ASSISTANT', label: 'Office Assistant', icon: 'briefcase-outline' },
      { key: 'ACCOUNTING', label: 'Accounting', icon: 'calculator-outline' },
    ],
  },
  {
    name: 'Healthcare',
    categories: [
      { key: 'NURSE', label: 'Nursing', icon: 'medical-outline' },
      { key: 'CARETAKER', label: 'Caretaker', icon: 'heart-outline' },
      { key: 'PHYSIOTHERAPY', label: 'Physiotherapy', icon: 'walk-outline' },
    ],
  },
  {
    name: 'Vehicle Services',
    categories: [
      { key: 'MECHANIC', label: 'Mechanic', icon: 'build-outline' },
      { key: 'CAR_WASH', label: 'Car Wash / Detailing', icon: 'water-outline' },
    ],
  },
  {
    name: 'Security',
    categories: [
      { key: 'SECURITY_GUARD', label: 'Security Guard', icon: 'shield-checkmark-outline' },
    ],
  },
  {
    name: 'Miscellaneous',
    categories: [
      { key: 'PET_CARE', label: 'Pet Care', icon: 'paw-outline' },
      { key: 'MOVING', label: 'Moving Services', icon: 'bus-outline' },
      { key: 'PACKING', label: 'Packing & Unboxing', icon: 'gift-outline' },
      { key: 'OTHER', label: 'Other / Custom', icon: 'ellipsis-horizontal-outline' },
    ],
  },
];

// Flattened list of all categories for quick lookups or general lists
export const ALL_CATEGORIES: CategoryItem[] = CATEGORY_GROUPS.reduce<CategoryItem[]>((acc, group) => {
  return [...acc, ...group.categories];
}, []);

// Search view categories list that includes the "ALL" option at the beginning
export const SEARCH_CATEGORIES: CategoryItem[] = [
  { key: 'ALL', label: 'All Jobs', icon: 'apps-outline' },
  ...ALL_CATEGORIES,
];

// Helper to look up a category label by key
export const getCategoryLabel = (key: string): string => {
  if (!key) return '';
  const cleanedKey = key.trim().toUpperCase();
  if (cleanedKey === 'ALL') return 'All';
  const match = ALL_CATEGORIES.find((cat) => cat.key === cleanedKey);
  if (match) return match.label;
  
  // Fallback: convert SNAKE_CASE to Title Case
  return cleanedKey
    .toLowerCase()
    .split('_')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
};

// Helper to look up a category icon by key
export const getCategoryIcon = (key: string): string => {
  if (!key) return 'cube-outline';
  const cleanedKey = key.trim().toUpperCase();
  if (cleanedKey === 'ALL') return 'apps-outline';
  const match = ALL_CATEGORIES.find((cat) => cat.key === cleanedKey);
  return match ? match.icon : 'cube-outline';
};
