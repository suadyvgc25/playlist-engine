import type { FormEvent } from "react";
import { FaSearch } from "react-icons/fa";
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
  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!query.trim()) return;
    onSearch();
  };

  return (
    <form className={styles.searchBar} onSubmit={handleSubmit}>
      <div className={styles.inputWrapper}>
        <FaSearch className={styles.searchIcon} />
        <input
          type="text"
          placeholder="Search for songs or artists..."
          className={styles.input}
          value={query}
          onChange={(e) => onQueryChange(e.target.value)}
        />
      </div>
      <button
        type="submit"
        className={styles.button}
        disabled={loading}
      >
        {loading ? "Searching..." : "Search"}
      </button>
    </form>
  );
}
