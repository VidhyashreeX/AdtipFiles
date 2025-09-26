export interface NormalizedProduct {
  id: number;
  name: string;
  description: string;
  imageUrls: string[];
  primaryImage?: string;
  regularPrice: number;
  marketPrice: number;
  price: number;
  sizeOptions: string[];
  stock: number;
  totalLikes: number;
  totalViews: number;
  totalRatings: number;
  raw: any;
}

const toNumber = (value: unknown): number => {
  if (value === null || value === undefined || value === '') {
    return 0;
  }
  const numeric = Number(value);
  return Number.isNaN(numeric) ? 0 : numeric;
};

const extractArrayFromValue = (value: any): string[] => {
  if (!value && value !== 0) {
    return [];
  }

  if (Array.isArray(value)) {
    return value.filter(Boolean);
  }

  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (!trimmed) {
      return [];
    }

    if (trimmed.startsWith('[')) {
      try {
        const parsed = JSON.parse(trimmed);
        if (Array.isArray(parsed)) {
          return parsed.filter(Boolean);
        }
      } catch (error) {
        // fall through to comma split
      }
    }

    return trimmed
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean);
  }

  return [];
};

export const normalizeProduct = (raw: any): NormalizedProduct => {
  // Build comprehensive list of potential image sources
  const fallbackImages = [
    raw.image,
    raw.image_path,
    raw.product_image,
    raw.primary_image,
    raw.primaryImage,
    raw.filename ? `https://api.adtip.in/api/photo/${raw.filename}` : undefined,
    raw.imageFilename ? `https://api.adtip.in/api/photo/${raw.imageFilename}` : undefined,
    raw.product_filename ? `https://api.adtip.in/api/photo/${raw.product_filename}` : undefined,
  ].filter(Boolean) as string[];

  const imageCandidates = extractArrayFromValue(raw.images);
  
  // Merge all image sources, prioritizing the parsed images array
  let imageUrls: string[] = [];
  
  if (imageCandidates.length > 0) {
    // Process images array - each item might be a filename that needs full URL
    imageUrls = imageCandidates.map(img => {
      if (typeof img === 'string') {
        // If it's already a full URL, use it
        if (img.startsWith('http')) {
          return img;
        }
        // If it's just a filename, build the full URL
        return `https://api.adtip.in/api/photo/${img}`;
      }
      return img;
    }).filter(Boolean);
  }
  
  // If no processed images, use fallback images
  if (imageUrls.length === 0) {
    imageUrls = fallbackImages;
  }

  const primaryImage = imageUrls[0];

  const sizeCandidates = extractArrayFromValue(raw.size);

  return {
    id: Number(raw.id) || raw.productId || 0,
    name: raw.name || raw.title || raw.productName || 'Untitled Product',
    description: raw.description || raw.details || raw.product_description || '',
    imageUrls,
    primaryImage,
    regularPrice: toNumber(raw.regularPrice ?? raw.regular_price ?? raw.selprice ?? raw.price),
    marketPrice: toNumber(raw.marketPrice ?? raw.market_price ?? raw.originalPrice),
    price: toNumber(
      raw.your_price ??
        raw.regularPrice ??
        raw.regular_price ??
        raw.price ??
        raw.selprice ??
        raw.marketPrice ??
        raw.market_price
    ),
    sizeOptions: sizeCandidates,
    stock: toNumber(raw.stock ?? raw.units ?? raw.unitsAvailable ?? raw.quantity),
    totalLikes: toNumber(raw.total_likes ?? raw.totalLikes ?? raw.likes),
    totalViews: toNumber(raw.total_views ?? raw.totalViews ?? raw.views),
    totalRatings: toNumber(raw.total_rating ?? raw.totalRating ?? raw.rating),
    raw,
  };
};

export const formatCurrency = (amount: number, currency: string = 'INR') => {
  try {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency,
      maximumFractionDigits: 2,
    }).format(amount || 0);
  } catch (error) {
    return `${currency === 'INR' ? '₹' : ''}${(amount || 0).toFixed(2)}`;
  }
};
