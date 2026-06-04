import { describe, expect, it } from 'vitest';
import { createR2PresignedUpload } from '../../../../../src/core/infra/storage/r2-presigned-upload';

describe('createR2PresignedUpload', () => {
	it('deve criar URL assinada para upload PUT no R2', () => {
		const upload = createR2PresignedUpload(
			{
				accessKeyId: 'access-key',
				bucketName: 'store-flow',
				endpoint: 'https://account.r2.cloudflarestorage.com',
				publicUrl: 'https://cdn.example.com',
				secretAccessKey: 'secret-key',
				uploadExpiresInSeconds: 300,
			},
			{
				contentType: 'image/webp',
				key: 'products/user-id/product-id/image.webp',
			},
			new Date('2026-06-03T12:34:56.000Z'),
		);

		const url = new URL(upload.url);

		expect(upload).toMatchObject({
			headers: { 'content-type': 'image/webp' },
			key: 'products/user-id/product-id/image.webp',
			method: 'PUT',
			publicUrl:
				'https://cdn.example.com/products/user-id/product-id/image.webp',
		});
		expect(url.origin).toBe(
			'https://store-flow.account.r2.cloudflarestorage.com',
		);
		expect(url.pathname).toBe('/products/user-id/product-id/image.webp');
		expect(url.searchParams.get('X-Amz-Algorithm')).toBe('AWS4-HMAC-SHA256');
		expect(url.searchParams.get('X-Amz-Content-Sha256')).toBe(
			'UNSIGNED-PAYLOAD',
		);
		expect(url.searchParams.get('X-Amz-Credential')).toContain(
			'access-key/20260603/auto/s3/aws4_request',
		);
		expect(url.searchParams.get('X-Amz-Date')).toBe('20260603T123456Z');
		expect(url.searchParams.get('X-Amz-Expires')).toBe('300');
		expect(url.searchParams.get('X-Amz-SignedHeaders')).toBe(
			'content-type;host',
		);
		expect(url.searchParams.get('X-Amz-Signature')).toMatch(/^[a-f0-9]{64}$/);
		expect(url.searchParams.get('x-id')).toBe('PutObject');
	});
});
