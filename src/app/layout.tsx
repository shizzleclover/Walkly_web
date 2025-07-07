import type {Metadata} from 'next';
import './globals.css';
import { Toaster } from "@/components/ui/toaster";

export const metadata: Metadata = {
  title: 'Walkly',
  description: 'Discover new paths and enjoy your walks.',
  manifest: '/manifest.json',
  icons: [
    {
      rel: 'icon',
      url: '/favicon.ico',
      sizes: 'any',
    },
    {
      rel: 'icon',
      url: '/appicon.png',
      type: 'image/png',
    },
    {
      rel: 'apple-touch-icon',
      url: '/apple-touch-icon.png',
      sizes: '180x180',
    },
    {
      rel: 'shortcut icon',
      url: '/appicon.png',
    }
  ],
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: 'hsl(144.2 38.8% 52.3%)' },
    { media: '(prefers-color-scheme: dark)', color: 'hsl(144.2 45.4% 67.3%)' }
  ],
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Walkly',
    startupImage: [
      '/apple-touch-icon.png'
    ]
  },
  other: {
    'mobile-web-app-capable': 'yes',
    'apple-mobile-web-app-capable': 'yes',
    'apple-mobile-web-app-status-bar-style': 'default',
  }
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no, viewport-fit=cover" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="format-detection" content="telephone=no" />
        <meta name="msapplication-TileColor" content="hsl(144.2 38.8% 52.3%)" />
        <meta name="theme-color" content="hsl(144.2 38.8% 52.3%)" />
        
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Merriweather:ital,wght@0,400;0,700;1,400;1,700&family=Montserrat:ital,wght@0,100..900;1,100..900&family=Source+Code+Pro:ital,wght@0,200..900;1,200..900&display=swap" rel="stylesheet" />
      </head>
      <body className="font-body antialiased overscroll-none">
        <div className="min-h-screen bg-background">
          {children}
        </div>
        <Toaster />
      </body>
    </html>
  );
}
