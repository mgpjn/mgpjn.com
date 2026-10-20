import React from 'react';

export const PLAY_STORE_URL = 'https://play.google.com/store/apps/details?id=com.mgpjn.app';

export default function PlayStoreLink({ className = '', iconClassName = 'h-5 w-5', children = 'Download on Play Store', onClick }) {
  return (
    <a href={PLAY_STORE_URL} target="_blank" rel="noopener noreferrer" className={className} onClick={onClick}>
      <svg viewBox="0 0 24 24" className={`${iconClassName} shrink-0`} aria-hidden="true" focusable="false">
        <path fill="#4285F4" d="M3.5 2.4 13.1 12l-9.6 9.6A1.8 1.8 0 0 1 3 20.3V3.7c0-.5.2-1 .5-1.3Z" />
        <path fill="#34A853" d="m3.5 2.4 11.8 6.8-2.2 2.8L3.5 2.4Z" />
        <path fill="#FBBC04" d="m15.3 9.2 4.8 2.1c.9.4.9 1 0 1.4l-4.8 2.1-2.2-2.8 2.2-2.8Z" />
        <path fill="#EA4335" d="m3.5 21.6 9.6-9.6 2.2 2.8-11.8 6.8Z" />
      </svg>
      <span>{children}</span>
    </a>
  );
}
