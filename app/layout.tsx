import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'StreamMaster Pro',
  description: 'Advanced streaming platform with live TV channels',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.className} bg-black text-white antialiased`}>
        {children}
        
        {/* HLS.js script */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              if (typeof window !== 'undefined') {
                const script = document.createElement('script');
                script.src = 'https://cdn.jsdelivr.net/npm/hls.js@1.4.10/dist/hls.min.js';
                script.async = true;
                document.head.appendChild(script);
                
                // Global keyboard shortcuts
                document.addEventListener('keydown', (e) => {
                  if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
                  
                  // Space to play/pause
                  if (e.code === 'Space') {
                    e.preventDefault();
                    const video = document.querySelector('video');
                    if (video) {
                      video.paused ? video.play() : video.pause();
                    }
                  }
                  
                  // Mute
                  if (e.code === 'KeyM') {
                    e.preventDefault();
                    const video = document.querySelector('video');
                    if (video) video.muted = !video.muted;
                  }
                });
              }
            `,
          }}
        />
      </body>
    </html>
  );
}