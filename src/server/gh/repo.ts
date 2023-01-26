import axios from 'axios';

export type ParamsOfGetRepoStarCount = Partial<{ userName: string; repoName: string }>;

export type ReturnOfGetRepoStarCount = { result: number };

const fallbackResultOfGetRepoStarCount = 12345;

export async function getGhRepoStarCount(
  params: ParamsOfGetRepoStarCount
): Promise<ReturnOfGetRepoStarCount> {
  if (!params.userName || !params.repoName) throw new Error('Bad params');
  try {
    const { data: repoInfo } = await axios.get(
      `https://api.github.com/repos/${params.userName}/${params.repoName}`
    );
    return { result: repoInfo.stargazers_count };
  } catch {
    return { result: fallbackResultOfGetRepoStarCount };
  }
}
