import styles from "./AlbumMosaic.module.scss";

import album1 from "../../assets/albums/album1.png";
import album2 from "../../assets/albums/album2.png";
import album3 from "../../assets/albums/album3.png";
import album4 from "../../assets/albums/album4.png";
import album5 from "../../assets/albums/album5.png";
import album6 from "../../assets/albums/album6.png";
import album7 from "../../assets/albums/album7.png";
import album8 from "../../assets/albums/album8.png";
import album9 from "../../assets/albums/album9.png";
import album10 from "../../assets/albums/album10.png";
import album11 from "../../assets/albums/album11.png";
import album12 from "../../assets/albums/album12.png";
import album13 from "../../assets/albums/album13.png";
import album14 from "../../assets/albums/album14.png";
import album15 from "../../assets/albums/album15.png";
import album16 from "../../assets/albums/album16.png";
import album17 from "../../assets/albums/album17.png";
import album18 from "../../assets/albums/album18.png";
import album19 from "../../assets/albums/album19.png";
import album20 from "../../assets/albums/album20.png";
import album21 from "../../assets/albums/album21.png";
import album22 from "../../assets/albums/album22.png";
import album23 from "../../assets/albums/album23.png";
import album24 from "../../assets/albums/album24.png";
import album25 from "../../assets/albums/album25.png";
import album26 from "../../assets/albums/album26.png";
import album27 from "../../assets/albums/album27.png";
import album28 from "../../assets/albums/album28.png";
import album29 from "../../assets/albums/album29.png";
import album30 from "../../assets/albums/album30.png";
import album31 from "../../assets/albums/album31.png";
import album32 from "../../assets/albums/album32.png";
import album33 from "../../assets/albums/album33.png";
import album34 from "../../assets/albums/album34.png";
import album35 from "../../assets/albums/album35.png";


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
  const cols = 8;              
  const totalItems = 120;
  const radius = 5;            

  const grid: string[] = [];

  for (let i = 0; i < totalItems; i++) {
    const shuffled = shuffle(albums);

    const row = Math.floor(i / cols);
    const col = i % cols;

    const picked =
      shuffled.find((album) => {
        // Keep repeated covers from clustering too closely in the mosaic.
        for (let r = -radius; r <= radius; r++) {
          for (let c = -radius; c <= radius; c++) {
            if (r === 0 && c === 0) continue;

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
      // Fall back when every shuffled option is already nearby.
      || shuffled[0];

    grid.push(picked);
  }

  return (
    <div className={styles.grid}>
      {grid.map((src, i) => (
        <img key={i} src={src} />
      ))}
    </div>
  );
}
