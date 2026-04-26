import { BottomNavLinks } from "./nav-items";

export function BottomNav() {
  return (
    <nav
      aria-label="Primary"
      className="fixed bottom-0 left-0 right-0 z-40 border-t border-rule-strong bg-ivory lg:hidden"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      <BottomNavLinks />
    </nav>
  );
}
