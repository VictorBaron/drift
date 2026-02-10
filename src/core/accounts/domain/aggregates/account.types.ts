import { AggregateRootProps } from 'src/common/domain';

export interface AccountProps extends AggregateRootProps {
  name: string;
}

export interface CreateAccountProps {
  name: string;
}

export interface AccountJSON {
  id: string;
  name: string;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
}
