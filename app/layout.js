import './globals.css';

export const metadata = {
  title: 'AIPJ Mock Hub',
  description: 'Multi-AI mock orchestration MVP',
};

export default function RootLayout({ children }) {
  return (
    <html lang="ko">
      <body>{children}</body>
    </html>
  );
}
