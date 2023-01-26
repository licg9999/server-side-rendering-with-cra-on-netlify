import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { ParamsOfGetRepoStarCount, ReturnOfGetRepoStarCount } from '../server/gh/repo';

export function getKeyOfGhRepoStarCountQuery(params: ParamsOfGetRepoStarCount) {
  return ['ghRepoStarCountQuery', params];
}

export function useGhRepoStarCountQuery(params: ParamsOfGetRepoStarCount) {
  return useQuery(getKeyOfGhRepoStarCountQuery(params), async () => {
    const { data } = await axios.get(
      '/.netlify/functions/gh_repo_star_count?' + new URLSearchParams(params).toString()
    );
    return data as ReturnOfGetRepoStarCount;
  });
}
