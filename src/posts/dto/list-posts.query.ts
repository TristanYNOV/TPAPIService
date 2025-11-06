import { Transform, Type } from 'class-transformer';
import { IsEnum, IsInt, IsOptional, IsString, Matches, Max, Min } from 'class-validator';

export const POSTS_FEED_SCOPES = ['global', 'me'] as const;
export type PostsFeedScope = (typeof POSTS_FEED_SCOPES)[number];

export class ListPostsQueryDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number;

  @IsOptional()
  @Transform(({ value }) => (typeof value === 'string' ? value.toLowerCase() : value))
  @IsEnum(POSTS_FEED_SCOPES, {
    message: `scope must be one of: ${POSTS_FEED_SCOPES.join(', ')}`,
  })
  scope?: PostsFeedScope;

  @IsOptional()
  @IsString()
  @Matches(/^\S+$/, { message: 'cursor must be a non-empty string without spaces' })
  cursor?: string;
}
