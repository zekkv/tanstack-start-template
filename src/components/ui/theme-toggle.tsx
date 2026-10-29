import * as React from "react";
import { Moon, Sun } from "lucide-react";

import { useTheme } from "#/components/providers/theme-provider";

import { Button } from "#/components/ui/button";

const emptySubscribe = () => () => {};

export function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();
  const mounted = React.useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false
  );

  if (!mounted) {
    return <div aria-hidden="true" className="size-8" />;
  }

  const isDark = resolvedTheme === "dark";
  const nextTheme = isDark ? "light" : "dark";
  const Icon = isDark ? Sun : Moon;

  return (
    <Button
      type="button"
      variant="ghost"
      size="icon-sm"
      onClick={() => setTheme(nextTheme)}
      aria-label={`Switch to ${nextTheme} theme`}
      title={`Switch to ${nextTheme} theme`}
    >
      <Icon className="size-3.5" />
    </Button>
  );
}
