# **App Name**: Walkly

## Core Features:

- Splash Screen: Display a splash screen with a brief logo animation or progress loader upon app launch.
- Onboarding Flow: Guide new users with an onboarding flow consisting of three full-screen slides explaining the app's purpose and features. Request location permissions and offer a light/dark theme preview.
- Authentication: Enable users to sign up or log in with their email addresses using Supabase OTP for verification.
- Home Screen: Present a dashboard summarizing user progress, including walks taken this week and the last walk's details, with options to generate a new walk or start walking without a route.
- Map Screen: Display the user's current location on a map with the ability to generate a route, track distance and time, and save the walk session.
- History Screen: Offer a scrollable list of past walks with details such as distance, duration, and timestamp. Tapping on a walk shows its route and moments.
- Smart Route Generation: Generate random circular or one-way walkable routes near the user using Mapbox, which will encourage people to get out and walk

## Style Guidelines:

- Background: oklch(0.9711 0.0074 80.7211) in light mode, oklch(0.2683 0.0279 150.7681) in dark mode
- Foreground: oklch(0.3000 0.0358 30.2042) in light mode, oklch(0.9423 0.0097 72.6595) in dark mode
- Card: oklch(0.9711 0.0074 80.7211) in light mode, oklch(0.3327 0.0271 146.9867) in dark mode
- Card Foreground: oklch(0.3000 0.0358 30.2042) in light mode, oklch(0.9423 0.0097 72.6595) in dark mode
- Popover: oklch(0.9711 0.0074 80.7211) in light mode, oklch(0.3327 0.0271 146.9867) in dark mode
- Popover Foreground: oklch(0.3000 0.0358 30.2042) in light mode, oklch(0.9423 0.0097 72.6595) in dark mode
- Primary: oklch(0.5234 0.1347 144.1672) in light mode, oklch(0.6731 0.1624 144.2083) in dark mode
- Primary Foreground: oklch(1.0000 0 0) in light mode, oklch(0.2157 0.0453 145.7256) in dark mode
- Secondary: oklch(0.9571 0.0210 147.6360) in light mode, oklch(0.3942 0.0265 142.9926) in dark mode
- Secondary Foreground: oklch(0.4254 0.1159 144.3078) in light mode, oklch(0.8970 0.0166 142.5518) in dark mode
- Muted: oklch(0.9370 0.0142 74.4218) in light mode, oklch(0.3327 0.0271 146.9867) in dark mode
- Muted Foreground: oklch(0.4495 0.0486 39.2110) in light mode, oklch(0.8579 0.0174 76.0955) in dark mode
- Accent: oklch(0.8952 0.0504 146.0366) in light mode, oklch(0.5752 0.1446 144.1813) in dark mode
- Accent Foreground: oklch(0.4254 0.1159 144.3078) in light mode, oklch(0.9423 0.0097 72.6595) in dark mode
- Destructive: oklch(0.5386 0.1937 26.7249) in both light and dark modes
- Destructive Foreground: oklch(1.0000 0 0) in light mode, oklch(0.9423 0.0097 72.6595) in dark mode
- Border: oklch(0.8805 0.0208 74.6428) in light mode, oklch(0.3942 0.0265 142.9926) in dark mode
- Input: oklch(0.8805 0.0208 74.6428) in light mode, oklch(0.3942 0.0265 142.9926) in dark mode
- Ring: oklch(0.5234 0.1347 144.1672) in light mode, oklch(0.6731 0.1624 144.2083) in dark mode
- Chart 1: oklch(0.6731 0.1624 144.2083) in light mode, oklch(0.7660 0.1179 145.2950) in dark mode
- Chart 2: oklch(0.5752 0.1446 144.1813) in light mode, oklch(0.7185 0.1417 144.8887) in dark mode
- Chart 3: oklch(0.5234 0.1347 144.1672) in light mode, oklch(0.6731 0.1624 144.2083) in dark mode
- Chart 4: oklch(0.4254 0.1159 144.3078) in light mode, oklch(0.6291 0.1543 144.2031) in dark mode
- Chart 5: oklch(0.2157 0.0453 145.7256) in light mode, oklch(0.5752 0.1446 144.1813) in dark mode
- Sidebar: oklch(0.9370 0.0142 74.4218) in light mode, oklch(0.2683 0.0279 150.7681) in dark mode
- Sidebar Foreground: oklch(0.3000 0.0358 30.2042) in light mode, oklch(0.9423 0.0097 72.6595) in dark mode
- Sidebar Primary: oklch(0.5234 0.1347 144.1672) in light mode, oklch(0.6731 0.1624 144.2083) in dark mode
- Sidebar Primary Foreground: oklch(1.0000 0 0) in light mode, oklch(0.2157 0.0453 145.7256) in dark mode
- Sidebar Accent: oklch(0.8952 0.0504 146.0366) in light mode, oklch(0.5752 0.1446 144.1813) in dark mode
- Sidebar Accent Foreground: oklch(0.4254 0.1159 144.3078) in light mode, oklch(0.9423 0.0097 72.6595) in dark mode
- Sidebar Border: oklch(0.8805 0.0208 74.6428) in light mode, oklch(0.3942 0.0265 142.9926) in dark mode
- Sidebar Ring: oklch(0.5234 0.1347 144.1672) in light mode, oklch(0.6731 0.1624 144.2083) in dark mode
- Font Sans: Montserrat, sans-serif
- Font Serif: Merriweather, serif
- Font Mono: Source Code Pro, monospace
- Radius: 0.7rem
- Shadow 2xs: 0 1px 3px 0px hsl(0 0% 0% / 0.05)
- Shadow xs: 0 1px 3px 0px hsl(0 0% 0% / 0.05)
- Shadow sm: 0 1px 3px 0px hsl(0 0% 0% / 0.10), 0 1px 2px -1px hsl(0 0% 0% / 0.10)
- Shadow: 0 1px 3px 0px hsl(0 0% 0% / 0.10), 0 1px 2px -1px hsl(0 0% 0% / 0.10)
- Shadow md: 0 1px 3px 0px hsl(0 0% 0% / 0.10), 0 2px 4px -1px hsl(0 0% 0% / 0.10)
- Shadow lg: 0 1px 3px 0px hsl(0 0% 0% / 0.10), 0 4px 6px -1px hsl(0 0% 0% / 0.10)
- Shadow xl: 0 1px 3px 0px hsl(0 0% 0% / 0.10), 0 8px 10px -1px hsl(0 0% 0% / 0.10)
- Shadow 2xl: 0 1px 3px 0px hsl(0 0% 0% / 0.25)
- Tracking Normal: 0em
- Spacing: 0.25rem