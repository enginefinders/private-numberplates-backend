// pages/_document.js
import { Html, Head, Main, NextScript } from 'next/document';

export default function Document() {
  const siteName = "Custom Plates UK";
  const url = process.env.SITE_URL || "https://example.com";
  const title = "Design Your UK Number Plate | Custom & Show Plates";
  const description = "Customize UK legal or show plates with 3D gel and 4D options. Live preview and fast checkout.";

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    "name": "Custom Number Plate",
    "description": description,
    "brand": { "@type": "Brand", "name": siteName },
    "offers": {
      "@type": "Offer",
      "priceCurrency": "GBP",
      "price": "86.00",
      "availability": "https://schema.org/InStock",
      "url": url
    }
  };

  return (
    <Html lang="en">
      <Head>
        <meta name="description" content={description} />
        <meta property="og:title" content={title} />
        <meta property="og:description" content={description} />
        <meta property="og:type" content="website" />
        <meta property="og:url" content={url} />
        <meta property="og:site_name" content={siteName} />
        <script type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <body><Main /><NextScript /></body>
    </Html>
  );
}
