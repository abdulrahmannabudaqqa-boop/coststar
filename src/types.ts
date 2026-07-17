export interface SiteConfig {
  name: string;
  location: string;
  phone: string;
  description: string;
  aboutText: string;
  email: string;
}

export type Category = 'all' | 'laptop' | 'desktop' | 'print';

export interface Product {
  id: string;
  name: string;
  category: Category;
  subCategory: string;
  specs: string;
  price: number;
  isSold: boolean;
  icon: string;
}

export interface TenderRequest {
  id: string;
  companyName: string;
  contact: string;
  requestType: string;
  details: string;
  status: 'pending' | 'reviewed' | 'closed';
  createdAt: string;
}
