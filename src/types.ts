import type { HandlerContext, HandlerEvent } from '@netlify/functions';
import type { QueryClient } from '@tanstack/react-query';

export type ParamsOfFillInSsrData = {
  event: HandlerEvent;
  context: HandlerContext;
  queryClient: QueryClient;
};
