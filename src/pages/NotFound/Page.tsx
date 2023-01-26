import { FC } from 'react';
import styles from './Page.module.css';

export const NotFoundPage: FC = () => {
  return (
    <div className={styles.root}>
      <h1>Not Found</h1>
    </div>
  );
};
