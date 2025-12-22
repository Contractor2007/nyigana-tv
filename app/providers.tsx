'use client';

import { ReactNode } from 'react';

interface ProvidersProps {
  children: ReactNode;
}

export function Providers({ children }: ProvidersProps) {
  return (
    <>
      {/* Error Boundary would go here in production */}
      {children}
      
      {/* Global Keyboard Shortcuts */}
      <script
        dangerouslySetInnerHTML={{
          __html: `
            document.addEventListener('keydown', (e) => {
              // Prevent shortcuts when typing in inputs
              if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
              
              // Space to play/pause video
              if (e.code === 'Space' || e.code === 'KeyK') {
                e.preventDefault();
                const video = document.querySelector('video');
                if (video) {
                  video.paused ? video.play() : video.pause();
                }
              }
              
              // Fullscreen
              if ((e.ctrlKey || e.metaKey) && e.code === 'KeyF') {
                e.preventDefault();
                const video = document.querySelector('video');
                if (video && !document.fullscreenElement) {
                  video.requestFullscreen();
                }
              }
              
              // Mute
              if (e.code === 'KeyM') {
                e.preventDefault();
                const video = document.querySelector('video');
                if (video) {
                  video.muted = !video.muted;
                }
              }
              
              // Seek forward/backward
              if (e.code === 'ArrowRight') {
                e.preventDefault();
                const video = document.querySelector('video');
                if (video) {
                  video.currentTime += 10;
                }
              }
              if (e.code === 'ArrowLeft') {
                e.preventDefault();
                const video = document.querySelector('video');
                if (video) {
                  video.currentTime -= 10;
                }
              }
              
              // Focus search
              if (e.code === 'Slash' && !e.ctrlKey) {
                e.preventDefault();
                const searchInput = document.querySelector('input[placeholder*="Search"]');
                if (searchInput) {
                  (searchInput as HTMLInputElement).focus();
                }
              }
            });
            
            // Online/Offline detection
            window.addEventListener('online', () => {
              // Show notification
              const notification = document.createElement('div');
              notification.className = 'fixed top-4 right-4 bg-green-500 text-white px-4 py-2 rounded-lg shadow-lg z-50 animate-fade-in';
              notification.textContent = '✓ Connection restored';
              document.body.appendChild(notification);
              setTimeout(() => notification.remove(), 3000);
            });
            
            window.addEventListener('offline', () => {
              // Show notification
              const notification = document.createElement('div');
              notification.className = 'fixed top-4 right-4 bg-red-500 text-white px-4 py-2 rounded-lg shadow-lg z-50 animate-fade-in';
              notification.textContent = '⚠ Connection lost';
              document.body.appendChild(notification);
            });
          `
        }}
      />
    </>
  );
}