export interface IAuthStrategy<T = unknown> {
  validate(token: string): Promise<T>;
}
