# Documentation

Reference documentation for RealSingles.

**For active development rules, see `.cursor/rules/`** — those are the authoritative source for coding standards.

---

## Documentation Index

| File | Purpose | When to Use |
|------|---------|-------------|
| **`data_inventory.md`** | Complete field inventory with DB/API/UI status | **Source of truth** for all data fields |
| `project_requirements.md` | Tech stack, deployment guide, outstanding items | Setting up or deploying |
| `business_logic.md` | Core business requirements and features | Understanding app functionality |
| `competitor_analysis.md` | Industry research (League, Hinge, Bumble, Raya) | Feature decisions |
| `ui_patterns.md` | Native UI component patterns per platform | Building forms and components |
| `BOTTOM_NAVIGATION_SPEC.md` | Bottom navigation implementation | Modifying navigation |
| `EXTERNAL_SERVICES_SETUP.md` | Third-party service credentials | Configuring Agora, Twilio, etc. |

---

## Key Principles

1. **`.cursor/rules/` is authoritative** — Development rules live there, not in docs
2. **`data_inventory.md` is the field source of truth** — All field definitions, options, and status
3. **Constants must be synced** — `mobile/constants/options.ts` and `web/src/types/index.ts` must match
4. **Cross-platform parity** — Every feature works on iOS, Android, Web Desktop, and Web Mobile
