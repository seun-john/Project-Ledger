/**
 * Shared by the server layout and the client ThemeProvider, so it deliberately
 * lives outside both. A value imported from a "use client" module into a server
 * component arrives as a client reference, not the string — which silently
 * turned the pre-paint theme script into `getItem(undefined)`.
 */

export const THEME_STORAGE_KEY = "npt_theme";

/** "auto" follows the OS via prefers-color-scheme; the others are manual overrides. */
export type ThemePreference = "auto" | "light" | "dark";
