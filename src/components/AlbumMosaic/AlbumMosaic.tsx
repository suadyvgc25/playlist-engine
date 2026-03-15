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
  album16   
];

export default function AlbumMosaic() {
  const repeated = Array.from({ length: 80 }, (_, i) => albums[i % albums.length])
  .sort(() => Math.random() - 0.5); 

  return (
    <div className={styles.grid}>
      {repeated.map((src, i) => (
        <img key={i} src={src}/>
      ))}
    </div>
  );
}