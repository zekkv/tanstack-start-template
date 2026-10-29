import { Circle, CircleCheck } from "lucide-react";

import { cn } from "#/lib/utils";
import { PASSWORD_REQUIREMENTS } from "#/features/auth/schema/password";

export function PasswordRequirements({ password }: { password: string }) {
  return (
    <ul className="space-y-1.5" aria-label="Password requirements">
      {PASSWORD_REQUIREMENTS.map(requirement => {
        const met = requirement.test(password);
        const Icon = met ? CircleCheck : Circle;
        return (
          <li
            key={requirement.label}
            aria-label={`${requirement.label}: ${met ? "met" : "not met"}`}
            className="flex items-center gap-2 text-xs"
          >
            <Icon
              aria-hidden="true"
              className={cn("size-3.5", met ? "text-foreground" : "text-muted-foreground")}
            />
            <span className={met ? "text-foreground" : "text-muted-foreground"}>
              {requirement.label}
            </span>
          </li>
        );
      })}
    </ul>
  );
}
