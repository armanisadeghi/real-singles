export interface SignupData {
  Username: string;
  Email: string;
  Password: string;
  FirstName: string;
  LastName: string;
  DisplayName: string;
  DOB: string;
  Gender: string;
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
  Ethniticity: string;
  Language: string;
  Religion: string;
  // Political: string;
  Education: string;
  School: string[];
  JobTitle: string;
  Company: string;
  Marijuna: string;
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
  ReedemPoints?: number | null;
  RefferalCode: string;
  RefferalCodeBy?: string;
  applicantID?: string;
  baseImageUrl?: string;
  social_link1?: string;
  social_link2?: string;
  IsFavourite?: any;
  livePicture?: string;
  distance_in_km?: number;
  TotalRating ?: number
}

export interface EditProfileFormData {
  SocialType?: string;
  Username: string;
  FirstName: string;
  LastName: string;
  DisplayName: string;
  Phone?: string;
  Zipcode?: string;
  DOB?: string;
  Image?: string;
  Address?: string;
  City?: string;
  State?: string;
  Country?: string;
  Street?: string;
  Gender?: string;
  HSign?: string;
  Height?: string;
  BodyType?: string;
  Ethniticity?: string;
  Religion?: string;
  About?: string;
  MaritalStatus?: string;
  HaveChild?: string;
  WantChild?: string;
  Marijuna?: string;
  Smoking?: string;
  Drinks?: string;
  Pets?: string;
  Education?: string;
  School?: string;
  JobTitle?: string;
  Company?: string;
  JobID?: string | number;
  WorstJob?: string;
  Interest?: string;
  Language?: string;
  IdeaDate?: string;
  WayToHeart?: string;
  NightAtHome?: string;
  PastEvent?: string;
  craziestTravelStory?: string;
  CraziestThings?: string;
  weiredestGift?: string;
  social_link1?: string;
  social_link2?: string;
  FindMe?: string;
  livePicture?: string;
  NonNegotiable?: string;
  DeviceToken?: string;
  applicantID?: string;
  Political?: string
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