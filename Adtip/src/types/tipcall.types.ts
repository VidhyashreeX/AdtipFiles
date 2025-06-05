export interface Language {
  id: string;
  name: string;
}

export interface Interest {
  id: number;
  name: string;
  isPrimary: boolean;
}

export interface Contact {
  id: number;
  name?: string | null;
  emailId?: string | null;
  mobile_number?: string;
  is_available?: boolean;
  dnd?: boolean;
  updated_date?: string;
  last_active?: string | null;
  languages?: Language[];
  interests?: Interest[];
  product_count?: number;
  post_count?: number;
  is_following?: number;
  following_count?: number;
  followers_count?: number;
  is_blocked?: boolean;
  social_links?: string[];
  is_active?: boolean;
  last_seen?: string;
  online_status?: boolean;
}

export interface ApiResponse {
  status: boolean;
  message: string;
  error?: string;
  data: Contact[];
  pagination: {
    page: number;
    limit: number;
    totalRecords: number;
  };
}
