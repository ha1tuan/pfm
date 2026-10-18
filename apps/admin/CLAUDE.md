# Admin console — React + Vite

Design frame: 1440px wide (desktop only). Audience: Staff.

## Screens

Dashboard, Transaction list, Wallet detail, Fee config, Limit config, Audit log.

## Rules

- UI: Ant Design (`Table`, `Form`, filters). List screens use server-side pagination, sorting and filtering; never load a full list client-side.
- Roles (Admin, Operations, Control/CS) shape what is shown, but the server enforces access — hiding a button is UX, not security.
- Fee and Limit config are versioned: editing creates a new Config Version with an effective date, submitted for maker–checker approval; the screen shows the version in effect, pending versions and history. There is no in-place edit, toggle or delete. The maker cannot approve their own version.
- Ledger data is read-only here. A correction is a reversal action handled by the backend, not an edit.
- Wallet detail and other personal data views are audited server-side; keep data fetching on explicit page loads (no background prefetch of sensitive detail).

### Styling

- Use SCSS with CSS Modules (`*.module.scss`, or `*.module.css` when no SCSS features are needed). One module per component/screen, placed next to it (e.g. `TransactionList.tsx` + `TransactionList.module.scss`). This keeps class names scoped and avoids collisions.
- Import as `import styles from './X.module.scss'` and apply with `className={styles.xxx}`. Combine multiple classes with `clsx`/`classnames`, not string concatenation.
- Inline styles are forbidden: no `style={{ ... }}` in JSX, no `style="..."` in HTML. Every visual rule must live in a class.
- Variants and states (active, error, disabled, etc.) are expressed with modifier classes (e.g. `styles.rowActive`) or `data-*` attributes, never with inline style values.
- Ant Design components are styled via `className` pointing at a module class. Global theming goes through the `ConfigProvider` theme tokens. Overriding antd internals (`.ant-*`) is allowed only inside `:global` within a module, scoped under the component's own root class.
- Shared design values (colors, spacing, breakpoints, z-index) are SCSS variables/mixins in `src/styles/` (e.g. `_variables.scss`), imported with `@use`. Do not hard-code them per component.
- Global styles (reset, base typography) live in a single `src/styles/global.scss`. No other global CSS.
- Class names in modules use camelCase (`styles.tableHeader`) so they can be accessed with dot notation.

## Stack

React + Vite, React Router, Ant Design, SCSS + CSS Modules. Tests: Vitest.