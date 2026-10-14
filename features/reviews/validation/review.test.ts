import { describe, expect, it } from 'vitest';

import { parseReviewFormData, ReviewFormValidationError } from './review';

const createReviewForm = (rating: string, body = '') => {
  const formData = new FormData();

  formData.set('rating', rating);
  formData.set('body', body);

  return formData;
};

describe('parseReviewFormData', () => {
  it('accepts a five-star review', () => {
    const result = parseReviewFormData(createReviewForm('5', 'Great product!'));

    expect(result).toEqual({
      rating: 5,
      body: 'Great product!',
    });
  });

  it('allows ratings without written reviews', () => {
    const result = parseReviewFormData(createReviewForm('4'));

    expect(result).toEqual({
      rating: 4,
      body: null,
    });
  });

  it('trims whitespace from review text', () => {
    const result = parseReviewFormData(
      createReviewForm('3', '  Good quality  ')
    );

    expect(result.body).toBe('Good quality');
  });

  it('rejects ratings below 1', () => {
    expect(() => parseReviewFormData(createReviewForm('0'))).toThrow(
      ReviewFormValidationError
    );
  });

  it('rejects ratings above 5', () => {
    expect(() => parseReviewFormData(createReviewForm('6'))).toThrow(
      ReviewFormValidationError
    );
  });

  
it('accepts valid quarter-star ratings', () => {
  const result = parseReviewFormData(createReviewForm('4.5'));

  expect(result.rating).toBe(4.5);
});

it('rejects ratings outside quarter-star increments', () => {
  expect(() => parseReviewFormData(createReviewForm('4.1'))).toThrow(
    ReviewFormValidationError
  );
});


  it('rejects missing ratings', () => {
    const formData = new FormData();

    expect(() => parseReviewFormData(formData)).toThrow(
      ReviewFormValidationError
    );
  });

  it('rejects reviews longer than 1000 characters', () => {
    expect(() =>
      parseReviewFormData(createReviewForm('5', 'A'.repeat(1001)))
    ).toThrow(ReviewFormValidationError);
  });
});
