'use client';

import { useState } from 'react';
import { FiSearch, FiFilter } from 'react-icons/fi';
import styles from './SearchBar.module.scss';
import Button from '../Button/Button';

export default function SearchBar({
  placeholder = 'Search...',
  value = '',
  onChange,
  onSearch,
  showFilter = true,
  onFilterClick,
  width = '300px',
  className = '',
  showButton = false,
  buttonLabel = 'New',
  handleOnClick,
}) {
  const [searchValue, setSearchValue] = useState(value);

  const handleInputChange = (e) => {
    const newValue = e.target.value;
    setSearchValue(newValue);

    if (onChange) {
      onChange(newValue);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && onSearch) {
      onSearch(searchValue);
    }
  };

  const handleFilterClick = () => {
    if (onFilterClick) {
      onFilterClick();
    }
  };

  return (
    <div className={`${styles.searchSection} ${className}`}>
      <div className={styles.searchContainer}>
        <FiSearch className={styles.searchIcon} />
        <input
          type="text"
          placeholder={placeholder}
          value={searchValue}
          onChange={handleInputChange}
          onKeyPress={handleKeyPress}
          className={styles.searchInput}
          style={{ width }}
        />
      </div>
      {showButton && (
        <Button onClick={handleOnClick} variant="primary">
          {buttonLabel}
        </Button>
      )}
      {showFilter && (
        <button
          className={styles.filterButton}
          onClick={handleFilterClick}
          aria-label="Filter options">
          <FiFilter size={16} />
        </button>
      )}
    </div>
  );
}
