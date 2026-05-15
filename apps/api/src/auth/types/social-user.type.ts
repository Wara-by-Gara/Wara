import { Provider } from '../enums/provider.enum';

export type SocialUser = {
  provider: Provider;
  providerAccountId: string;
  email?: string;
  name?: string;
  gender?: string;
  birthYear?: string;
  profileImage?: string;
};
