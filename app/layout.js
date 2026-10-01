import './globals.css';
export const metadata = { title: 'MWA — My Works API', icons: { icon: '/logo.png' } };
export default function Layout({ children }) {
  return (
    <html lang="en">
      <head>
        <link href="https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Inter:wght@400;500&display=swap" rel="stylesheet" />
      </head>
      <body data-t="start">{children}</body>
    </html>
  );
}
