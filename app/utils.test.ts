import { validateEmail } from "./utils";

test("validateEmail returns false for non-emails", () => {
  expect(validateEmail(undefined)).toBe(false);
  expect(validateEmail(null)).toBe(false);
  expect(validateEmail("")).toBe(false);
  expect(validateEmail("not-an-email")).toBe(false);
  expect(validateEmail("n@")).toBe(false);
});

test("validateEmail returns true for emails", () => {
  expect(validateEmail("kody@example.com")).toBe(true);
});

// 30 min
//ttl: 1000 * 60 * 30,
// 24 hr
//staleWhileRevalidate: 1000 * 60 * 60 * 24,