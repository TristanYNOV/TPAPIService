import { Matches } from 'class-validator';

export class UserIdParamDto {
  @Matches(/^c[a-z0-9]{24}$/i, { message: 'userId must be a valid CUID' })
  userId!: string;
}
