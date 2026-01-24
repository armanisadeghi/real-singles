# Documentation

Reference documentation for RealSingles. For active development rules, see `.cursor/rules/`.

---

## Active Reference Docs

| File | Purpose | Use When |
|------|---------|----------|
| `business_logic.md` | Core business requirements and features | Understanding what the app should do |
| `project_requirements.md` | Technical spec with API endpoints | Building new features |
| `EXTERNAL_SERVICES_SETUP.md` | Third-party service credentials | Setting up Agora, Twilio, etc. |
| `ui_patterns.md` | Native UI patterns per platform | Building forms and components |
| `BOTTOM_NAVIGATION_SPEC.md` | Bottom nav implementation details | Modifying navigation |

## Research & Inventory

| File | Purpose | Notes |
|------|---------|-------|
| `competitor_analysis.md` | Industry research (League, Hinge, Bumble) | Feature decisions and standards |
| `data_inventory.md` | Complete field inventory | Field types, validation, options |
| `integration_tracker.md` | Field implementation status | May have outdated status info |

---

## Important Notes

1. **Status info may be outdated** - `data_inventory.md` and `integration_tracker.md` contain status columns that may not reflect current state. Always check the actual code.

2. **For development rules, use `.cursor/rules/`** - The rules files are the source of truth for:
   - Cross-platform parity requirements
   - Native-feel guidelines
   - Project structure

3. **Constants must be synced** - When you see field options in these docs, ensure `mobile/constants/options.ts` and `web/src/types/index.ts` match.
