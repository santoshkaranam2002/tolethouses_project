export type CategoryKey = 'to-let' | 'rental-house' | 'individual-house' | 'flat-apartment' | 'service-apartment';
export type UserRole = 'customer' | 'admin';
export type EnquiryStatus = 'New' | 'Contacted' | 'Interested' | 'Visit Scheduled' | 'Completed' | 'Closed';

export interface Category { key: CategoryKey; label: string; short: string; blurb: string; count: number; }
export interface City { id: number; name: string; state: string; tagline: string; active: boolean; areas: string[]; propertyCount: number; }

export interface Meta {
  categories: Category[];
  cities: City[];
  furnishing: string[];
  amenities: string[];
  statuses: string[];
  enquiryStatuses: EnquiryStatus[];
  priceRange: { min: number; max: number };
  totalListings: number;
}

export interface Property {
  id: number;
  title: string;
  category: CategoryKey;
  categoryLabel: string;
  price: number;
  priceUnit: string;
  location: string;
  city: string;
  beds: number;
  baths: number;
  area: number;
  floor: string;
  furnishing: string;
  amenities: string[];
  status: 'Available' | 'Rented';
  approved: boolean;
  featured: boolean;
  ownerId: number;
  ownerName: string;
  ownerPhone: string;
  ownerEmail: string;
  description: string;
  images: string[];
  latitude: number | null;
  longitude: number | null;
  createdDate: string;
}

export interface Enquiry {
  id: number; propertyId: number; customerId: number | null; name: string; phone: string; message: string;
  date: string; status: EnquiryStatus; propertyTitle: string; propertyImage: string; propertyCity: string;
}

export interface AppUser { id: number; name: string; email: string; phone: string; role: UserRole; createdDate: string; }
export interface Session extends AppUser { token: string; }

export interface Paged<T> { items: T[]; total: number; page: number; pages: number; pageSize: number; }

export interface SearchFilters {
  q?: string; category?: string; city?: string; area?: string;
  minPrice?: string; maxPrice?: string; beds?: string; furnishing?: string; sort?: string; page?: string;
}

export interface NearbyArea {
  name: string; city: string; state: string; count: number; available: number;
  minPrice: number; avgPrice: number; cover: string; latitude: number | null; longitude: number | null;
  topCategory: string; distanceKm: number | null;
}
export interface NearbyResult {
  origin: { latitude: number; longitude: number; source: 'gps' | 'area'; label: string } | null;
  outsideServiceArea: boolean; nearestArea: string;
  areas: NearbyArea[]; totalAreas: number;
  properties: (Property & { distanceKm: number | null })[];
}
