import styles from "./SearchBar.module.scss";

type Props = {
  query: string;
  onQueryChange: (value: string) => void;
  onSearch: () => void;
  loading: boolean;
};

export default function SearchBar({
  query,
  onQueryChange,
  onSearch,
  loading,
}: Props) { 

  return (
    <div className={styles.searchBar}>
      <input
        type="text"
        placeholder="Search for songs or artists..."
        className={styles.input}
        value={query}
        onChange={(e) => onQueryChange(e.target.value)}
      />
      <button
        className={styles.button}
        onClick={onSearch}
        disabled={loading}
      >
        {loading ? "Searching..." : "Search"}
      </button>
    </div>
  );
}