import type { NextPage } from 'next';
import Head from 'next/head';
import { Picture } from '../components/Picture';

const Home: NextPage = () => {
  return (
    <div>
      <Head>
        <title>sidepix Next.js example</title>
        <meta name="description" content="<picture>" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <main>
        <h1>sidepix Next.js example</h1>

        <h2>One source, different aspect ratios:</h2>

        <Picture
          sources={{
            '(min-width: 840px)': {
              aspectRatio: 2,
              widths: [800, 1200],
              sizes: {
                '(min-width: 1240px)': '1200px',
                default: '800px',
              },
            },
            '(min-width: 640px)': {
              widths: [600],
              aspectRatio: 2 / 3,
              sizes: {
                default: '600px',
              },
            },
            default: {
              src: 'pexels-carlos-spitzer-17811.jpg',
              aspectRatio: 1,
              focalPoint: [0.46, 0.14],
              widths: [400],
              sizes: {
                default: '400px',
              },
            },
          }}
          alt="Black and Green Toucan on Tree Branch"
        />

        <p>
          Credits:{' '}
          <a href="https://www.pexels.com/@lestrade84">Carlos Spitzer</a>
        </p>

        <h2>Several sources:</h2>

        <Picture
          sources={{
            '(min-width: 840px)': {
              src: 'pexels-andre-ulysses-de-salis-8199932.jpg',
              aspectRatio: 2,
              focalPoint: [0.45, 0.13],
              widths: [800, 1200],
              sizes: {
                '(min-width: 1240px)': '1200px',
                default: '800px',
              },
            },
            '(min-width: 640px)': {
              widths: [600],
              aspectRatio: 3 / 2,
              sizes: {
                default: '600px',
              },
            },
            default: {
              src: 'pexels-magda-ehlers-1427457.jpg',
              aspectRatio: 1,
              focalPoint: [0.25, 0.44],
              widths: [400],
              sizes: {
                default: '400px',
              },
            },
          }}
          alt="Scarlet Macaw"
        />

        <p>
          Credits:{' '}
          <a href="https://www.pexels.com/@andre-ulysses-de-salis-2100065">
            André Ulysses De Salis
          </a>{' '}
          /{' '}
          <a href="https://www.pexels.com/@magda-ehlers-pexels">Magda Ehlers</a>
        </p>

        <h2>Animation:</h2>

        <Picture
          sources={{
            default: {
              src: 'Duvor.gif',
            },
          }}
          alt="Flock"
        />

        <p>
          Credits:{' '}
          <a href="https://commons.wikimedia.org/wiki/User:Jonnmann">
            Jonn Leffmann
          </a>
        </p>
      </main>
    </div>
  );
};

export default Home;
