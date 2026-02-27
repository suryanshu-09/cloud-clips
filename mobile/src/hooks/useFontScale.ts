import { useEffect } from 'react';
import { PixelRatio } from 'react-native';
import { useAtom, useAtomValue } from 'jotai';
import { fontScaleAtom, setFontScaleAtom } from '@/store/atoms/themeAtom';

/**
 * useFontScale - Returns the effective font scale for the app.
 *
 * The effective scale is the in-app preference stored in themeAtom.
 * On first run this defaults to 1.0, which then gets overridden by the OS
 * font scale so the app automatically honours the system Dynamic Type /
 * Font Size accessibility setting.
 *
 * Consumers can also let the user manually set a custom scale via
 * `setFontScaleAtom` (clamped to 0.8–1.5).
 *
 * @returns The current font scale multiplier (e.g. 1.0, 1.2, 1.5)
 *
 * @example
 * ```tsx
 * const fontScale = useFontScale();
 * <Text style={{ fontSize: 16 * fontScale }}>Hello</Text>
 * ```
 */
export function useFontScale(): number {
  return useAtomValue(fontScaleAtom);
}

/**
 * useFontScaleSync - Syncs the OS font scale into the fontScaleAtom on mount.
 *
 * Call this once at the root of the app (e.g. in AppContent in _layout.tsx).
 * After the initial sync the user's manual overrides (via settings screen) are
 * preserved across sessions because the atom is backed by MMKV storage.
 */
export function useFontScaleSync(): void {
  const [, setFontScale] = useAtom(setFontScaleAtom);

  useEffect(() => {
    // PixelRatio.getFontScale() reflects the OS-level "Font Size" / Dynamic Type
    // setting. A value of 1.0 means "standard", > 1.0 means the user has
    // increased font size in Accessibility settings.
    const osFontScale = PixelRatio.getFontScale();

    // Only sync the OS scale on first mount so that explicit user preferences
    // (set via app settings) are not overwritten on every app open. If you
    // want the OS setting to always win, remove the conditional guard in the
    // settings screen and always call setFontScale here.
    setFontScale(osFontScale);
  }, [setFontScale]);
}
