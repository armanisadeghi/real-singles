/**
 * UI Components Index
 * Export all reusable UI components from this barrel file
 */

// Screen layout components
export { Screen } from "./Screen";
export type { ScreenProps } from "./Screen";

export { ScreenHeader, HeaderBackButton, HeaderTitle } from "./ScreenHeader";
export type { ScreenHeaderProps } from "./ScreenHeader";

// Avatar component
export { Avatar } from "./Avatar";
export { default as AvatarDefault } from "./Avatar";

// Card components
export { default as ProfileCard } from "./ProfileCard";
export { default as ProfileListItem } from "./ProfileListItem";
export { default as VideoCard } from "./VideoCard";
export { default as EventCard } from "./EventCard";
export { default as VirtualDateCard } from "./VirtualDateCard";
export { default as ProductCard } from "./ProductCard";
export { default as NotificationCard } from "./NotificationCard";
export { default as CurrentEventCard } from "./CurrentEventCard";
export { default as PastEventCard } from "./PastEventCard";

// Form components
export { default as GradientButton } from "./GradientButton";

// Badge components
export { PointsHeart } from "./PointsHeart";
export { PointsBadge } from "./PointsBadge";
