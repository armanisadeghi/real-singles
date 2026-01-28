import { Slot } from "expo-router";

// Pass-through layout - screens are configured in root _layout.tsx
// This allows the root stack to handle navigation and back buttons properly
export default function SpeedDatingLayout() {
  return <Slot />;
}
