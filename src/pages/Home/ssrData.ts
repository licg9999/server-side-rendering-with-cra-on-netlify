import { paramOfGhRepoStarCountQuery } from './Page';
import { getKeyOfGhRepoStarCountQuery } from '../../queries/gh';
import { getGhRepoStarCount } from '../../server/gh/repo';
import { ParamsOfFillInSsrData } from '../../types';

export async function fillInSsrData({ queryClient }: ParamsOfFillInSsrData): Promise<void> {
  await queryClient.prefetchQuery(getKeyOfGhRepoStarCountQuery(paramOfGhRepoStarCountQuery), () =>
    getGhRepoStarCount(paramOfGhRepoStarCountQuery)
  );
}
