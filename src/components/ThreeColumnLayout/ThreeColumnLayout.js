'use client';

import { useState } from 'react';
import styles from './ThreeColumnLayout.module.scss';
import { FiChevronLeft, FiChevronRight } from 'react-icons/fi';

export default function ThreeColumnLayout({ 
  children, 
  rightPanel
}) {
  const [isRightPanelCollapsed, setIsRightPanelCollapsed] = useState(false);

  const handleToggleRightPanel = () => {
    setIsRightPanelCollapsed(!isRightPanelCollapsed);
  };

  return (
    <div className={styles.container}>
      {/* Main Content Area */}
      <main className={`${styles.mainContent} ${isRightPanelCollapsed ? styles.withCollapsedRightPanel : styles.withRightPanel}`}>
        {children}
      </main>

      {/* Right Panel - Always present */}
      <aside className={`${styles.rightPanel} ${isRightPanelCollapsed ? styles.collapsed : styles.expanded}`}>
        <div className={styles.rightPanelHeader}>
          <button 
            className={styles.toggleButton}
            onClick={handleToggleRightPanel}
            aria-label={isRightPanelCollapsed ? "Expand panel" : "Collapse panel"}
            title={isRightPanelCollapsed ? "Expand panel" : "Collapse panel"}
          >
            {isRightPanelCollapsed ? <FiChevronLeft size={16} /> : <FiChevronRight size={16} />}
          </button>
        </div>
        {!isRightPanelCollapsed && (
          <div className={styles.rightPanelContent}>
            {rightPanel}
          </div>
        )}
      </aside>
    </div>
  );
}
