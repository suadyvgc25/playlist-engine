import styles from "./AlbumMosaic.module.scss";

import album1 from "../../assets/albums/album1.webp";
import album2 from "../../assets/albums/album2.webp";
import album3 from "../../assets/albums/album3.webp";
import album4 from "../../assets/albums/album4.webp";
import album5 from "../../assets/albums/album5.webp";
import album6 from "../../assets/albums/album6.webp";
import album7 from "../../assets/albums/album7.webp";
import album8 from "../../assets/albums/album8.webp";
import album9 from "../../assets/albums/album9.webp";
import album10 from "../../assets/albums/album10.webp";
import album11 from "../../assets/albums/album11.webp";
import album12 from "../../assets/albums/album12.webp";
import album13 from "../../assets/albums/album13.webp";
import album14 from "../../assets/albums/album14.webp";
import album15 from "../../assets/albums/album15.webp";
import album16 from "../../assets/albums/album16.webp";
import album17 from "../../assets/albums/album17.webp";
import album18 from "../../assets/albums/album18.webp";
import album19 from "../../assets/albums/album19.webp";
import album20 from "../../assets/albums/album20.webp";
import album21 from "../../assets/albums/album21.webp";
import album22 from "../../assets/albums/album22.webp";
import album23 from "../../assets/albums/album23.webp";
import album24 from "../../assets/albums/album24.webp";
import album25 from "../../assets/albums/album25.webp";
import album26 from "../../assets/albums/album26.webp";
import album27 from "../../assets/albums/album27.webp";
import album28 from "../../assets/albums/album28.webp";
import album29 from "../../assets/albums/album29.webp";
import album30 from "../../assets/albums/album30.webp";
import album31 from "../../assets/albums/album31.webp";
import album32 from "../../assets/albums/album32.webp";
import album33 from "../../assets/albums/album33.webp";
import album34 from "../../assets/albums/album34.webp";
import album35 from "../../assets/albums/album35.webp";


const albums = [
  album1,
  album2,
  album3,
  album4,
  album5,
  album6,
  album7,
  album8,
  album9,
  album10,
  album11,
  album12,
  album13,
  album14,
  album15,
  album16,
  album17,
  album18,
  album19,
  album20,
  album21,
  album22,   
  album23,
  album24,
  album25,
  album26,
  album27,
  album28,
  album29,
  album30,
  album31,
  album32,
  album33,
  album34,
  album35
];

function shuffle<T>(array: T[]): T[] {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

export default function AlbumMosaic() {
  const cols = 12;              
  const totalItems = 168;
  const repeatDiameter = 8;
  const repeatRadius = repeatDiameter / 2;

  const grid: string[] = [];

  for (let i = 0; i < totalItems; i++) {
    const shuffled = shuffle(albums);

    const row = Math.floor(i / cols);
    const col = i % cols;

    const picked =
      shuffled.find((album) => {
        // Keep repeated covers outside an 8-tile visual diameter.
        for (let r = -repeatRadius; r <= repeatRadius; r++) {
          for (let c = -repeatRadius; c <= repeatRadius; c++) {
            if (r === 0 && c === 0) continue;
            if (Math.hypot(r, c) > repeatRadius) continue;

            const checkRow = row + r;
            const checkCol = col + c;

            if (checkRow < 0 || checkCol < 0) continue;

            const index = checkRow * cols + checkCol;

            if (grid[index] === album) {
              return false;
            }
          }
        }

        return true;
      }) 
      // Use the first shuffled cover if the spacing rule cannot be satisfied.
      || shuffled[0];

    grid.push(picked);
  }

  return (
    <div className={styles.grid} aria-hidden="true">
      {grid.map((src, i) => (
        <img key={i} src={src} alt="" loading="lazy" decoding="async" />
      ))}
    </div>
  );
}
