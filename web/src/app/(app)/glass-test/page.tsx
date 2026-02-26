"use client";

/**
 * Glass Effect Playground
 *
 * A full-screen scrollable canvas with rich content flowing behind fixed
 * glass surfaces. This is the only way to truly evaluate the glass effect —
 * you need real content moving behind it.
 *
 * Route: /glass-test
 */

import { useState } from "react";
import {
  Search,
  X,
  SlidersHorizontal,
  Bell,
  MessageCircle,
  Gem,
  Compass,
  Heart,
  User,
  ChevronDown,
  LogOut,
  Settings,
  Edit,
  Star,
  Sparkles,
  Check,
  MapPin,
  Clock,
  ArrowLeft,
} from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { GlassContainer } from "@/components/glass/GlassContainer";
import LiquidGlass from "liquid-glass-react";

// ============================================================================
// GLASS STYLE — radial-edge effect (tweak here to see live)
// ============================================================================

const glassStyle: React.CSSProperties = {
  background:
    "radial-gradient(ellipse 90% 120% at 50% 50%, rgba(255,255,255,0.08) 0%, rgba(255,240,235,0.28) 55%, rgba(255,220,210,0.52) 80%, rgba(255,200,190,0.60) 100%)",
};

const glassBaseClasses = [
  "backdrop-blur-[10px]",
  "backdrop-saturate-200",
  "border border-rose-200/30 dark:border-white/10",
  "before:absolute before:inset-0 before:rounded-[inherit]",
  "before:shadow-[inset_0_1px_2px_rgba(255,255,255,0.7)]",
  "before:pointer-events-none",
].join(" ");

// ============================================================================
// FAKE PROFILE CARDS — the "content behind the glass"
// Rich, colorful, image-like blocks that scroll behind fixed glass surfaces
// ============================================================================

const profiles = [
  { name: "Sarah", age: 29, city: "New York", distance: "2 mi", color: "from-rose-400 to-pink-600", emoji: "🌸" },
  { name: "Emma", age: 31, city: "Brooklyn", distance: "4 mi", color: "from-violet-400 to-purple-600", emoji: "✨" },
  { name: "Olivia", age: 27, city: "Manhattan", distance: "1 mi", color: "from-amber-400 to-orange-500", emoji: "🌻" },
  { name: "Chloe", age: 33, city: "Hoboken", distance: "6 mi", color: "from-teal-400 to-cyan-600", emoji: "🌊" },
  { name: "Maya", age: 28, city: "Jersey City", distance: "5 mi", color: "from-emerald-400 to-green-600", emoji: "🍃" },
  { name: "Aria", age: 30, city: "Astoria", distance: "8 mi", color: "from-sky-400 to-blue-600", emoji: "💫" },
  { name: "Zoe", age: 26, city: "Park Slope", distance: "3 mi", color: "from-fuchsia-400 to-pink-600", emoji: "🌷" },
  { name: "Nadia", age: 32, city: "Williamsburg", distance: "7 mi", color: "from-red-400 to-rose-600", emoji: "🍒" },
];

function ProfileCard({ profile }: { profile: typeof profiles[0] }) {
  return (
    <div className={cn(
      "relative rounded-3xl overflow-hidden flex-shrink-0",
      "w-[160px] h-[220px]",
      "bg-gradient-to-br",
      profile.color,
      "shadow-lg"
    )}>
      {/* Fake photo area */}
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-7xl">{profile.emoji}</span>
      </div>
      {/* Name overlay at bottom */}
      <div className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-black/50 to-transparent">
        <p className="text-white font-semibold text-sm">{profile.name}, {profile.age}</p>
        <p className="text-white/70 text-xs flex items-center gap-1">
          <MapPin className="w-2.5 h-2.5" /> {profile.distance}
        </p>
      </div>
    </div>
  );
}

// ============================================================================
// SCROLLABLE BACKGROUND CONTENT
// This is what flows behind the glass — profiles, text, colors, gradients
// ============================================================================

function BackgroundContent() {
  return (
    <div className="space-y-10 px-4 pt-6 pb-48">

      {/* Hero gradient area — top section behind header */}
      <div className="h-32 rounded-3xl bg-gradient-to-br from-rose-400 via-pink-500 to-purple-600 flex items-center justify-center">
        <p className="text-white/80 text-sm font-medium tracking-wide">↑ Glass header floats above this</p>
      </div>

      {/* Profile grid */}
      <div>
        <p className="text-xs text-gray-500 font-medium uppercase tracking-wider mb-3 px-1">People Near You</p>
        <div className="flex gap-3 overflow-x-auto scrollbar-hide -mx-4 px-4 pb-2">
          {profiles.map((p) => <ProfileCard key={p.name} profile={p} />)}
        </div>
      </div>

      {/* Colorful banner blocks */}
      <div className="space-y-3">
        <div className="h-36 rounded-3xl bg-gradient-to-r from-violet-500 via-purple-500 to-indigo-600 p-5 flex flex-col justify-end">
          <p className="text-white font-bold text-lg">Speed Dating</p>
          <p className="text-white/70 text-sm">Next event this Friday</p>
        </div>
        <div className="h-36 rounded-3xl bg-gradient-to-r from-amber-400 via-orange-500 to-red-500 p-5 flex flex-col justify-end">
          <p className="text-white font-bold text-lg">Boost Your Profile</p>
          <p className="text-white/70 text-sm">10x more visibility today</p>
        </div>
      </div>

      {/* Second profile row — different colors */}
      <div>
        <p className="text-xs text-gray-500 font-medium uppercase tracking-wider mb-3 px-1">Recently Active</p>
        <div className="flex gap-3 overflow-x-auto scrollbar-hide -mx-4 px-4 pb-2">
          {[...profiles].reverse().map((p) => <ProfileCard key={p.name + "2"} profile={p} />)}
        </div>
      </div>

      {/* Text-heavy area */}
      <div className="space-y-3">
        {[
          { title: "Match of the Day", bg: "from-teal-400 to-cyan-600", time: "2 min ago" },
          { title: "New Like from Emma", bg: "from-rose-400 to-pink-600", time: "15 min ago" },
          { title: "Message from Olivia", bg: "from-amber-400 to-orange-500", time: "1 hr ago" },
          { title: "Event: Speed Dating NYC", bg: "from-violet-400 to-purple-600", time: "Tomorrow" },
        ].map(({ title, bg, time }) => (
          <div key={title} className={cn("h-20 rounded-2xl bg-gradient-to-r p-4 flex items-center justify-between", bg)}>
            <div>
              <p className="text-white font-semibold text-sm">{title}</p>
              <p className="text-white/60 text-xs flex items-center gap-1 mt-0.5">
                <Clock className="w-3 h-3" />{time}
              </p>
            </div>
            <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
              <Heart className="w-5 h-5 text-white" />
            </div>
          </div>
        ))}
      </div>

      {/* ↓ bottom nav note */}
      <div className="h-20 rounded-3xl bg-gradient-to-r from-rose-400 via-pink-500 to-rose-600 flex items-center justify-center">
        <p className="text-white/80 text-sm font-medium">↓ Glass bottom nav floats above this</p>
      </div>
    </div>
  );
}

// ============================================================================
// GLASS HEADER — fixed, floats above scrolling content
//
// liquid-glass-react workaround for position:fixed:
// The LiquidGlass SVG filter is rendered as an absolutely-positioned
// background layer that fills the header. Content sits above it in normal
// flow. This avoids the SVG filter coordinate-space bug with fixed elements.
// ============================================================================

function GlassHeader({ onBack, menuOpen, setMenuOpen }: {
  onBack: () => void;
  menuOpen: boolean;
  setMenuOpen: (v: boolean) => void;
}) {
  return (
    <div className="fixed top-0 left-0 right-0 z-50 px-3 pt-3">
      {/* Outer shell — clips the LiquidGlass to rounded rect */}
      <div className="relative rounded-2xl overflow-hidden shadow-[0_4px_32px_rgba(0,0,0,0.14)]">

        {/* LiquidGlass as the background — absolute fill */}
        <div className="absolute inset-0 pointer-events-none">
          <LiquidGlass
            displacementScale={35}
            blurAmount={0.05}
            saturation={150}
            aberrationIntensity={1.5}
            cornerRadius={16}
            mode="prominent"
            className="w-full h-full"
            style={{ width: "100%", height: "100%" }}
          >
            {/* Empty — just the glass layer */}
            <div className="w-full h-full" />
          </LiquidGlass>
        </div>

        {/* Content on top of the glass layer */}
        <div className="relative flex items-center justify-between px-4 h-14">
          <div className="flex items-center gap-2">
            <button onClick={onBack} className="p-1.5 rounded-full hover:bg-white/20 transition-colors">
              <ArrowLeft className="w-4 h-4 text-gray-800" />
            </button>
            <span className="text-sm font-bold text-gray-900 tracking-tight">RealSingles</span>
            <button className="p-2 rounded-full hover:bg-white/20 transition-colors">
              <SlidersHorizontal className="w-4 h-4 text-gray-800" />
            </button>
          </div>
          <div className="flex items-center gap-1">
            <button className="p-2 rounded-full hover:bg-white/20 transition-colors relative">
              <MessageCircle className="w-5 h-5 text-gray-800" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-pink-500 rounded-full" />
            </button>
            <button className="p-2 rounded-full hover:bg-white/20 transition-colors">
              <Bell className="w-5 h-5 text-gray-800" />
            </button>
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="flex items-center gap-1 pl-1 pr-2 py-1 rounded-full hover:bg-white/20 transition-colors"
            >
              <div className="w-7 h-7 rounded-full bg-gradient-to-br from-rose-400 to-pink-600 flex items-center justify-center">
                <User className="w-4 h-4 text-white" />
              </div>
              <ChevronDown className={cn("w-3.5 h-3.5 text-gray-700 transition-transform duration-200", menuOpen && "rotate-180")} />
            </button>
          </div>
        </div>
      </div>

      {/* Dropdown — also liquid glass */}
      {menuOpen && (
        <div className="absolute right-3 top-[76px] w-48">
          <div className="relative rounded-2xl overflow-hidden shadow-[0_8px_32px_rgba(0,0,0,0.18)]">
            <div className="absolute inset-0 pointer-events-none">
              <LiquidGlass
                displacementScale={25}
                blurAmount={0.04}
                saturation={150}
                aberrationIntensity={1.2}
                cornerRadius={16}
                mode="prominent"
                className="w-full h-full"
                style={{ width: "100%", height: "100%" }}
              >
                <div className="w-full h-full" />
              </LiquidGlass>
            </div>
            <div className="relative py-1.5">
              {[
                { icon: User, label: "My Profile" },
                { icon: Edit, label: "Edit Profile" },
                { icon: Star, label: "Favorites" },
                { icon: Settings, label: "Settings" },
                { icon: LogOut, label: "Sign Out" },
              ].map(({ icon: Icon, label }) => (
                <button
                  key={label}
                  onClick={() => setMenuOpen(false)}
                  className="flex items-center gap-3 w-full px-4 py-2.5 text-sm text-gray-800 hover:bg-white/30 transition-colors"
                >
                  <Icon className="w-4 h-4 text-gray-600" />
                  {label}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ============================================================================
// GLASS BOTTOM NAV — fixed, floats above scrolling content
// ============================================================================

function GlassBottomNav() {
  const [active, setActive] = useState("discover");
  const items = [
    { id: "discover", icon: Gem, label: "Discover" },
    { id: "explore", icon: Compass, label: "Explore" },
    { id: "likes", icon: Heart, label: "Likes" },
    { id: "messages", icon: MessageCircle, label: "Messages" },
    { id: "profile", icon: User, label: "Profile" },
  ];

  return (
    <div className="fixed bottom-3 left-3 right-3 z-50 md:left-1/2 md:-translate-x-1/2 md:right-auto md:w-full md:max-w-md">
      <div
        className={cn("relative rounded-3xl overflow-hidden shadow-[0_-2px_20px_rgba(0,0,0,0.06),0_4px_16px_rgba(0,0,0,0.1)]", glassBaseClasses)}
        style={glassStyle}
      >
        <div className="flex items-stretch px-1">
          {items.map(({ id, icon: Icon, label }) => (
            <button
              key={id}
              onClick={() => setActive(id)}
              className={cn(
                "flex flex-col items-center justify-center flex-1 py-2 min-h-[52px] rounded-xl transition-colors",
                active === id ? "text-pink-600" : "text-gray-600"
              )}
            >
              <Icon
                className={cn("w-[22px] h-[22px] mb-0.5 transition-transform", active === id && "scale-110")}
                strokeWidth={active === id ? 2.5 : 2}
                fill={active === id ? "currentColor" : "none"}
              />
              <span className={cn("text-[10px] font-medium leading-tight", active === id && "font-semibold")}>
                {label}
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// FLOATING GLASS SEARCH — fixed mid-screen, shows effect over scrolling content
// ============================================================================

function GlassSearchBar() {
  const [value, setValue] = useState("");
  const [show, setShow] = useState(true);

  if (!show) return (
    <button
      onClick={() => setShow(true)}
      className="fixed top-20 left-3 right-3 z-40 md:left-1/2 md:-translate-x-1/2 md:right-auto md:w-full md:max-w-sm"
    >
      <div
        className={cn("relative rounded-full overflow-hidden shadow-[0_4px_16px_rgba(0,0,0,0.1)] flex items-center gap-2 px-4 py-2.5", glassBaseClasses)}
        style={glassStyle}
      >
        <Search className="w-4 h-4 text-gray-500" />
        <span className="text-gray-400 text-sm">Search people...</span>
      </div>
    </button>
  );

  return null;
}

// ============================================================================
// GLASS BOTTOM SHEET
// ============================================================================

function GlassBottomSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  if (!open) return null;
  return (
    <div
      className="fixed inset-0 z-[200] bg-black/20 backdrop-blur-[2px] flex items-end justify-center"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        className="w-full max-w-lg mx-2 mb-2 rounded-3xl overflow-hidden"
        style={{
          background: "radial-gradient(ellipse 110% 140% at 50% 100%, rgba(255,255,255,0.10) 0%, rgba(255,240,235,0.32) 50%, rgba(255,220,210,0.58) 80%, rgba(255,200,190,0.68) 100%)",
          backdropFilter: "blur(16px) saturate(200%)",
          border: "1px solid rgba(255,180,170,0.3)",
          boxShadow: "0 -4px 32px rgba(0,0,0,0.12), 0 8px 32px rgba(0,0,0,0.12), inset 0 1px 2px rgba(255,255,255,0.7)",
        }}
      >
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 rounded-full bg-white/50" />
        </div>
        <div className="flex items-center justify-between px-5 py-3 border-b border-white/20">
          <h3 className="text-base font-semibold text-gray-900">Search Filters</h3>
          <button onClick={onClose} className="p-2 -m-2 rounded-full hover:bg-white/30 transition-colors">
            <X className="w-5 h-5 text-gray-600" />
          </button>
        </div>
        <div className="p-5 space-y-4 max-h-[60vh] overflow-y-auto">
          {[
            { label: "Age Range", value: "25 – 45" },
            { label: "Distance", value: "Up to 50 miles" },
            { label: "Education", value: "Any" },
            { label: "Religion", value: "Any" },
            { label: "Body Type", value: "Any" },
            { label: "Zodiac Sign", value: "Any" },
          ].map(({ label, value }) => (
            <div key={label} className="flex items-center justify-between py-2 border-b border-white/15">
              <span className="text-sm font-medium text-gray-800">{label}</span>
              <span className="text-sm text-gray-600">{value}</span>
            </div>
          ))}
        </div>
        <div className="flex gap-3 px-5 py-4">
          <button
            onClick={onClose}
            className="flex-1 py-3 rounded-full border border-white/40 text-sm font-medium text-gray-700 hover:bg-white/30 transition-colors"
          >
            Reset
          </button>
          <button
            onClick={onClose}
            className="flex-1 py-3 rounded-full bg-gradient-to-r from-rose-500 to-pink-600 text-white text-sm font-semibold flex items-center justify-center gap-2 shadow-lg shadow-rose-500/25"
          >
            <Check className="w-4 h-4" />
            Apply
          </button>
        </div>
        <div className="pb-[env(safe-area-inset-bottom)]" />
      </div>
    </div>
  );
}

// ============================================================================
// VARIANT SWITCHER — lets you toggle between CSS glass and liquid-glass-react
// for any floating element in real time
// ============================================================================

type GlassMode = "css" | "liquid";

function VariantSwitcher({ mode, setMode }: { mode: GlassMode; setMode: (m: GlassMode) => void }) {
  return (
    <div className="fixed top-20 right-3 z-50 flex flex-col gap-2">
      <div className="bg-white/90 dark:bg-neutral-900/90 backdrop-blur-sm rounded-2xl p-2 shadow-lg border border-gray-200/60 dark:border-neutral-700/60 space-y-1">
        <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider px-1 pb-0.5">Mode</p>
        {(["css", "liquid"] as GlassMode[]).map((m) => (
          <button
            key={m}
            onClick={() => setMode(m)}
            className={cn(
              "flex items-center gap-1.5 w-full px-3 py-1.5 rounded-xl text-xs font-medium transition-colors",
              mode === m
                ? "bg-pink-500 text-white"
                : "text-gray-600 hover:bg-gray-100 dark:hover:bg-neutral-800"
            )}
          >
            {mode === m && <Check className="w-3 h-3" />}
            {m === "css" ? "CSS Glass" : "Liquid React"}
          </button>
        ))}
      </div>
      <div className="bg-white/90 dark:bg-neutral-900/90 backdrop-blur-sm rounded-2xl p-2 shadow-lg border border-gray-200/60 dark:border-neutral-700/60 space-y-1">
        <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider px-1 pb-0.5">Test</p>
        <Link href="/explore" className="flex items-center gap-1.5 w-full px-3 py-1.5 rounded-xl text-xs font-medium text-gray-600 hover:bg-gray-100 dark:hover:bg-neutral-800 transition-colors">
          → /explore
        </Link>
      </div>
    </div>
  );
}

// ============================================================================
// MAIN PAGE
// ============================================================================

export default function GlassTestPage() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [mode, setMode] = useState<GlassMode>("css");

  return (
    <div className="relative min-h-dvh bg-gray-50 dark:bg-neutral-950">

      {/* ── FIXED GLASS ELEMENTS (float above everything) ── */}

      {/* Glass Header */}
      <GlassHeader
        onBack={() => window.history.back()}
        menuOpen={menuOpen}
        setMenuOpen={setMenuOpen}
      />

      {/* Mode switcher — top right */}
      <VariantSwitcher mode={mode} setMode={setMode} />

      {/* Glass Bottom Nav */}
      {mode === "css"
        ? <GlassBottomNav />
        : (
          <div className="fixed bottom-3 left-3 right-3 z-50 md:left-1/2 md:-translate-x-1/2 md:right-auto md:w-full md:max-w-md">
            <GlassContainer variant="nav" className="px-1">
              <div className="flex items-stretch">
                {[
                  { id: "discover", icon: Gem, label: "Discover" },
                  { id: "explore", icon: Compass, label: "Explore" },
                  { id: "likes", icon: Heart, label: "Likes" },
                  { id: "messages", icon: MessageCircle, label: "Messages" },
                  { id: "profile", icon: User, label: "Profile" },
                ].map(({ id, icon: Icon, label }) => (
                  <button key={id} className="flex flex-col items-center justify-center flex-1 py-2 min-h-[52px] rounded-xl text-gray-600">
                    <Icon className="w-[22px] h-[22px] mb-0.5" strokeWidth={2} />
                    <span className="text-[10px] font-medium">{label}</span>
                  </button>
                ))}
              </div>
            </GlassContainer>
          </div>
        )
      }

      {/* Filter Sheet */}
      <GlassBottomSheet open={sheetOpen} onClose={() => setSheetOpen(false)} />

      {/* Tap anywhere to close menu */}
      {menuOpen && (
        <div className="fixed inset-0 z-40" onClick={() => setMenuOpen(false)} />
      )}

      {/* ── SCROLLABLE CONTENT (flows behind the glass) ── */}
      <div className="pt-20 pb-8">
        <BackgroundContent />
      </div>

      {/* Floating "Open Filter Sheet" button */}
      <button
        onClick={() => setSheetOpen(true)}
        className="fixed bottom-24 right-4 z-40 flex items-center gap-2 px-4 py-2.5 rounded-full bg-white/90 dark:bg-neutral-800/90 backdrop-blur-sm shadow-lg border border-gray-200/60 dark:border-neutral-700/60 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-white transition-colors"
      >
        <SlidersHorizontal className="w-4 h-4" />
        Filter Sheet
      </button>
    </div>
  );
}
