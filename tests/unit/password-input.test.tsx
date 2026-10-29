import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { PasswordInput } from "#/features/auth/components/password-input";

describe("PasswordInput component", () => {
  it("toggles the field between hidden and visible without submitting its form", async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn<(event: React.FormEvent) => void>();
    render(
      <form onSubmit={onSubmit}>
        <PasswordInput id="password" aria-label="Password" defaultValue="correct-horse" />
      </form>
    );

    const input = screen.getByLabelText("Password");
    expect(input.getAttribute("type")).toBe("password");

    await user.click(screen.getByRole("button", { name: "Show password" }));
    expect(input.getAttribute("type")).toBe("text");

    await user.click(screen.getByRole("button", { name: "Hide password" }));
    expect(input.getAttribute("type")).toBe("password");
    expect(onSubmit).not.toHaveBeenCalled();
  });
});
