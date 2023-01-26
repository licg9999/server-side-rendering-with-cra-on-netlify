import { Handler } from '@netlify/functions';
import { getGhRepoStarCount } from '../gh/repo';

export const handler: Handler = async (event, context) => {
  return {
    statusCode: 200,
    body: JSON.stringify(await getGhRepoStarCount(event.queryStringParameters ?? {})),
  };
};
