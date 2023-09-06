import React from 'react';
import styles from './Turntable.module.css';

interface TurnTableProps {
  style?: React.CSSProperties;  // Aceptar props de estilo
}

const TurnTable: React.FC<TurnTableProps> = ({ style }) => {
  return (

    <div className={styles.turntable}>
      <div className={styles.record}>
        <div className={styles.inner}></div>
      </div>
      <div className={styles.overlay}></div>
      <div className={styles.armHolder}>
        <div className={styles.arm}></div>
      </div>
      <div className={styles.dial}></div>
    </div>
 
  );
}

export default TurnTable;
