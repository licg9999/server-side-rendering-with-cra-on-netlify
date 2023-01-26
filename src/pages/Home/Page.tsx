import { FC, useMemo } from 'react';
import logo from '../../assets/logo.svg';
import { useGhRepoStarCountQuery } from '../../queries/gh';
import { ParamsOfGetRepoStarCount } from '../../server/gh/repo';
import styles from './Page.module.css';

export const paramOfGhRepoStarCountQuery: ParamsOfGetRepoStarCount = {
  userName: 'facebook',
  repoName: 'react',
};

export const HomePage: FC = () => {
  const numberFormat = useMemo(() => new Intl.NumberFormat(), []);
  const { isLoading, isSuccess, data } = useGhRepoStarCountQuery(paramOfGhRepoStarCountQuery);

  return (
    <div className={styles.root}>
      <header className={styles.header}>
        <img src={logo} className={styles.logo} alt="logo" />
        <p>
          Edit <code>src/App.tsx</code> and save to reload.
        </p>
        <a
          className={styles.link}
          href="https://reactjs.org"
          target="_blank"
          rel="noopener noreferrer"
        >
          Learn React (⭐️ = {isLoading && 'loading...'}
          {isSuccess && numberFormat.format(data.result)})
        </a>
      </header>
    </div>
  );
};
