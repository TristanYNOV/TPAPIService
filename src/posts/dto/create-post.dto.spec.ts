import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { CreatePostDto } from './create-post.dto';

describe('CreatePostDto validation', () => {
  it('should validate when content is a non-empty string', async () => {
    const dto = plainToInstance(CreatePostDto, { content: 'Hello world' });

    const errors = await validate(dto);

    expect(errors).toHaveLength(0);
  });

  it('should reject empty content', async () => {
    const dto = plainToInstance(CreatePostDto, { content: '' });

    const errors = await validate(dto);

    expect(errors).not.toHaveLength(0);
    expect(errors[0].constraints).toBeDefined();
  });

  it('should reject non-string content', async () => {
    const dto = plainToInstance(CreatePostDto, { content: 123 });

    const errors = await validate(dto as unknown as CreatePostDto);

    expect(errors).not.toHaveLength(0);
    expect(errors[0].constraints).toBeDefined();
  });
});
