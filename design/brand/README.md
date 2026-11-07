# Zukai — Brand & App Icon Specifications
**Document Version:** 1.0.0  
**Scope:** Android Adaptive Icons, Splash Screen, Notification Assets, and Export Manifest

---

## 1. Brand Asset Manifest

| Asset Name | Source File | Dimensions (px) | Format | Usage Context |
| :--- | :--- | :--- | :--- | :--- |
| **Primary App Icon** | `icon.svg` | 1024 x 1024 | SVG / PNG | Google Play Store 512x512, Apple App Store 1024x1024 |
| **Adaptive Foreground** | `adaptive-foreground.svg` | 432 x 432 | Vector XML / SVG | Android Adaptive Icon Foreground layer (Safe zone: 264x264dp) |
| **Adaptive Background** | `adaptive-background.svg` | 432 x 432 | Vector XML / SVG | Android Adaptive Icon Background mesh layer |
| **Splash Screen Mark** | `splash.svg` | 1080 x 1920 | SVG / PNG | Android Splash Screen (`windowSplashScreenAnimatedIcon`) |
| **Status Notification** | `notification-icon.svg` | 24 x 24 | Vector XML / SVG | Android Status Bar Notification (Monochrome White silhouette) |

---

## 2. Android Mipmap DPI Density Export Grid

When bundling for production in **Phase 15**, the source SVGs are exported to the following rasterized densities under `android/app/src/main/res/`:

### Adaptive Icon Foregrounds (`drawable-` / `mipmap-`):
- **`mdpi` (1x):** 108 x 108 px
- **`hdpi` (1.5x):** 162 x 162 px
- **`xhdpi` (2x):** 216 x 216 px
- **`xxhdpi` (3x):** 324 x 324 px
- **`xxxhdpi` (4x):** 432 x 432 px

### Notification Monochrome Icon (`drawable-`):
- **`mdpi` (1x):** 24 x 24 px
- **`hdpi` (1.5x):** 36 x 36 px
- **`xhdpi` (2x):** 48 x 48 px
- **`xxhdpi` (3x):** 72 x 72 px
- **`xxxhdpi` (4x):** 96 x 96 px

---

## 3. Expo `app.json` Configuration Reference

```json
{
  "expo": {
    "name": "Zukai",
    "slug": "zukai",
    "icon": "./assets/brand/icon.png",
    "splash": {
      "image": "./assets/brand/splash.png",
      "resizeMode": "contain",
      "backgroundColor": "#050D10"
    },
    "android": {
      "adaptiveIcon": {
        "foregroundImage": "./assets/brand/adaptive-foreground.png",
        "backgroundImage": "./assets/brand/adaptive-background.png",
        "backgroundColor": "#09161B"
      },
      "notification": {
        "icon": "./assets/brand/notification-icon.png",
        "color": "#92F702"
      }
    }
  }
}
```
