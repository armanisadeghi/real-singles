export interface SignupData {
  Username: string;
  Email: string;
  Password: string;
  FirstName: string;
  LastName: string;
  DisplayName: string;
  DOB: string;
  Gender: string; // 'male', 'female', 'non-binary', 'other'
  LookingFor: string[]; // Array of genders: ['male'], ['female'], ['male', 'female'], etc.
  Phone: string | null;
  Zipcode: string;
  HSign: string;
  City : string;
  State : string;
  MaritalStatus: string;
  HaveChild: string;
  WantChild: string;
  Height: number;
  BodyType: string;
  Ethnicity: string | string[]; // Fixed spelling, now supports multi-select
  Language: string | string[]; // Now supports multi-select
  Religion: string;
  Political?: string;
  Education: string;
  School: string[];
  JobTitle: string;
  Company: string;
  Marijuana: string; // Fixed spelling
  Smoking: string;
  Drinks: string;
  Pets: string;
  About: string;
  CraziestThings: string;
  Interest: string[];
  livePicture: string | null;
  liveVideo: string | null;
  Latitude: string;
  Longitude: string;
  NightAtHome: string;
}

export interface signupProps {
  data?: SignupData;
  updateData: (data: Partial<any>) => void;
  onNext: () => void;
  error?: string;
}

export interface ProfileProps {
  id: number;
  name: string;
  age: number;
  image: any;
  location: string;
  rating: number;
  distanceFromYou?: string;
}
export interface EventsProps {
  id: number;
  name: string;
  age: number;
  image: any;
  location: string;
  rating: number;
}

export interface VideoCardProps {
  id: string;
  image?: any;
  title: string;
  author: string;
  isVideo?: boolean;
  link?: string;
}

export interface EventCardProps {
   EventID: string;
  EventName: string;
  EventDate: string;
  EventPrice: string;
  StartTime: string;
  EndTime: string;
  Description: string;
  Street: string;
  City: string;
  PostalCode: string;
  EventImage: string;
  Link: string;
  Latitude: string;
  Longitude: string;
  UserID: string;
  CreateDate: string;
  interestedUserImage: any[];
  HostedBy: string;
  HostedID: string;
  isMarkInterested?: number;
  State?: string;
}

export interface ProductCardProps {
  ProductID: string;
  Image?: any;
  ProductName: string;
  Points: string;
  CategoryID: string;
  Description: string;
  CreateDate: string;
}

export interface User {
  ID: string;
  id?: string;
  FirstName?: string;
  LastName?: string;
  DisplayName: string;
  Email: string;
  Phone?: string;
  DOB?: string;
  Gender?: string;
  Image?: string;
  About?: string;
  Address?: string;
  City?: string;
  State?: string;
  HSign?: string;
  Height?: string;
  Interest?: string;
  RATINGS?: number;
  FollowStatus?: string;
  WalletPoint?: number | null;
  RedeemPoints?: number | null;
  ReferralCode: string;
  ReferralCodeBy?: string;
  applicantID?: string;
  baseImageUrl?: string;
  social_link1?: string;
  social_link2?: string;
  IsFavorite?: any;
  livePicture?: string;
  distance_in_km?: number;
  TotalRating ?: number
}

export interface EditProfileFormData {
  // Basic info
  SocialType?: string;
  Username?: string;
  FirstName: string;
  LastName: string;
  DisplayName: string;
  Phone?: string;
  DOB?: string;
  Gender?: string; // 'male', 'female', 'non-binary', 'other'
  LookingFor?: string[]; // Array of genders seeking
  HSign?: string;
  About?: string;
  
  // Height - stored as total inches in DB, but displayed as feet/inches in UI
  Height?: string; // Total inches as string
  HeightFeet?: number; // New: feet portion (4-7)
  HeightInches?: number; // New: inches portion (0-11)
  
  // Physical
  BodyType?: string;
  Ethnicity?: string | string[]; // Multi-select for mixed heritage
  
  // Location
  Address?: string;
  Street?: string;
  City?: string;
  State?: string;
  Country?: string;
  Zipcode?: string;
  
  // Lifestyle
  MaritalStatus?: string;
  Religion?: string;
  Political?: string;
  Education?: string;
  School?: string | string[]; // Multi-select
  JobTitle?: string;
  Company?: string;
  JobID?: string | number;
  Smoking?: string;
  Drinks?: string;
  Marijuana?: string; // Fixed spelling
  Exercise?: string;
  Language?: string | string[]; // Multi-select
  
  // Family
  HaveChild?: string;
  WantChild?: string;
  Pets?: string | string[]; // Multi-select
  
  // Interests
  Interest?: string | string[]; // Multi-select
  
  // Profile prompts
  IdeaDate?: string; // ideal_first_date
  NonNegotiable?: string; // non_negotiables
  WorstJob?: string; // worst_job
  DreamJob?: string; // dream_job
  NightAtHome?: string; // nightclub_or_home
  PetPeeves?: string; // pet_peeves
  FindMe?: string; // after_work
  WayToHeart?: string; // way_to_heart
  craziestTravelStory?: string; // craziest_travel_story
  CraziestThings?: string; // Alias for craziest_travel_story
  weirdestGift?: string; // weirdest_gift
  PastEvent?: string; // past_event
  
  // Social and media
  social_link1?: string;
  social_link2?: string;
  livePicture?: string;
  Image?: string;
  
  // System
  DeviceToken?: string;
  applicantID?: string;
}


export interface VirtualDataListItem {
  VirtualDateID: string;
  VirtualDate: string;
  StartTime: string;
  EndTime: string;
  SlotID: string;
}

export interface VirtualDateSpeedDetails {
  ID: string;
  UserID: string;
  Title: string;
  Description: string;
  type: string;
  CreatedDate: string;
  Image: string;
  Status: string;
  virtual_data_list: VirtualDataListItem[];
}