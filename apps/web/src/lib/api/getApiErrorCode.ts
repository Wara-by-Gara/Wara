/** api client가 throw new Error(code) 형태로 던진 에러 코드 추출 */
export function getApiErrorCode(err: unknown): string | undefined {
  if (err instanceof Error) return err.message;
  if (typeof err === 'object' && err !== null && 'error' in err) {
    const nested = err as { error?: { code?: string } };
    return nested.error?.code;
  }
  return undefined;
}

export function isOptionalVotePollError(err: unknown): boolean {
  const code = getApiErrorCode(err);
  return code === 'VOTE_POLL_NOT_FOUND' || code === 'PARTICIPANT_NOT_FOUND';
}
