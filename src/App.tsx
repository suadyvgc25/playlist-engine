import Header from "./components/Header/Header";
import SearchBar from "./components/SearchBar/SearchBar";
import SearchResults from "./components/SearchResults/SearchResults";
import Playlist from "./components/Playlist/Playlist";
import styles from "./App.module.scss";

export default function App() {
  return (
    <div className={styles.appShell}>
      <Header />

      <main className={styles.main}>
        <section className={styles.leftCol} aria-label="Search and results">
          <h2 className={styles.sectionTitle}>Browse Music</h2>
          <SearchBar />
          <SearchResults />
        </section>

        <section className={styles.rightCol} aria-label="Playlist builder">
          <h2 className={styles.sectionTitle}>Playlist Builder</h2>
          <Playlist />
        </section>
      </main>
    </div>
  );
}