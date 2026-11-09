import './globals.css'
// Fonts are bundled with the site (no call to Google at build time or for visitors).
import '@fontsource-variable/big-shoulders/opsz.css'
import '@fontsource-variable/hanken-grotesk/index.css'
import '@fontsource-variable/noto-sans-tamil/index.css'
import { SITE_URL, SITE_NAME, TAGLINE, DESCRIPTION } from '@/lib/site'


export const metadata = {
  metadataBase: new URL(SITE_URL),
  title: { default: `${SITE_NAME} — ${TAGLINE}`, template: `%s | ${SITE_NAME}` },
  description: DESCRIPTION,
  applicationName: SITE_NAME,
  openGraph: { siteName: SITE_NAME, locale: 'en_CA', type: 'website' },
  twitter: { card: 'summary_large_image', site: '@tamilto' },
}

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#0E0A07' },
    { media: '(prefers-color-scheme: dark)', color: '#0E0A07' },
  ],
}

// Set theme before paint to avoid a flash.
// Set theme before paint to avoid a flash. Dark is the TamilTO default; visitors can switch.
// A password-reset or login link from Supabase can land on any page (it uses the Site URL):
// send it to the admin, which shows the "new password" box.
const themeScript = `(function(){try{var h=location.hash;if(/(type=recovery|error_code=|type=invite|type=signup|type=magiclink)/.test(h)&&location.pathname.indexOf('/admin')!==0){location.replace('/admin'+h);return}}catch(e){}})();(function(){try{var t=localStorage.getItem('tto-theme')||'dark';document.documentElement.setAttribute('data-theme',t)}catch(e){document.documentElement.setAttribute('data-theme','dark')}})()`

export default function RootLayout({ children }) {
  return (
    <html lang="en-CA" data-theme="dark" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body>{children}</body>
    </html>
  )
}
