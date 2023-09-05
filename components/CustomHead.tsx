import { FC } from 'react';
import Head from 'next/head';

interface CustomHeadProps {
  title?: string;
  description?: string;
  favicon?: string;
}

const CustomHead: FC<CustomHeadProps> = ({ title = 'Discogs Plus', description = 'Descripción de la app', favicon = '/favicon.png' }) => {
  return (
    <Head>
      <title>{title}</title>
      <meta name="description" content={description} />
      <link rel="shortcut icon" href={favicon} />
      {/* Otros metadatos */}
    </Head>
  );
}

export default CustomHead;
