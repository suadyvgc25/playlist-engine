import styles from "./SearchBar.module.scss";

export default function SearchBar() {
  return (
    <div className={styles.searchBar}>
      <input
        type="text"
        placeholder="Search for songs or artists..."
        className={styles.input}
      />
      <button className={styles.button}>Search</button>
    </div>
  );
}