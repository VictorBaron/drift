import { AggregateRootProps } from 'src/common/domain';
import { Email } from 'src/core/users/domain';

export interface UserProps extends AggregateRootProps {
  email: Email;
  name: string | null;
  password: string | null;
  googleId: string | null;
}

export interface CreateUserProps {
  email: string;
  name?: string | null;
  password?: string | null;
  googleId?: string | null;
}

export interface CreateOAuthUserProps {
  email: string;
  googleId: string;
  name?: string | null;
}

export interface UserJSON {
  id: string;
  email: string;
  name: string | null;
  password: string | null;
  googleId: string | null;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
}

export interface UserLightJSON {
  id: string;
  email: string;
  name: string | null;
}
