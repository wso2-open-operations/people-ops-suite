

import { createContext } from "react";

/**
 * Defines the shape of the Context object.
 * This helps TypeScript provide autocomplete suggestions.
 */
export interface ColorModeContextProps {
  toggleColorMode: () => void;
}

/**
 * The Context is initialized with a default "no-op" function.
 * This prevents the app from crashing if a component tries to use this
 * context outside of a Provider (though that shouldn't happen in your App.tsx).
 */
export const ColorModeContext = createContext<ColorModeContextProps>({
  toggleColorMode: () => {},
});