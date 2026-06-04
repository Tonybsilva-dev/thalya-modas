import { createR2PresignedUpload } from '../src/core/infra/storage/r2-presigned-upload';
import { env } from '../src/shared/env';

const tinyWebpBase64 =
	'UklGRiIAAABXRUJQVlA4IBYAAAAwAQCdASoBAAEADsD+JaQAA3AA/vuUAAA=';

async function main() {
	assertR2Env();

	const body = Buffer.from(tinyWebpBase64, 'base64');
	const key = `validation/r2-upload-check-${Date.now()}.webp`;
	const signingDate = await getProviderDate(env.R2_ENDPOINT);
	const upload = createR2PresignedUpload(
		{
			accessKeyId: env.R2_ACCESS_KEY,
			bucketName: env.R2_BUCKET_NAME,
			endpoint: env.R2_ENDPOINT,
			publicUrl: env.R2_PUBLIC_URL,
			secretAccessKey: env.R2_SECRET_KEY,
			uploadExpiresInSeconds: 300,
		},
		{
			contentType: 'image/webp',
			key,
		},
		signingDate,
	);

	const putResponse = await fetch(upload.url, {
		body,
		headers: upload.headers,
		method: upload.method,
	});

	if (!putResponse.ok) {
		throw new Error(
			`R2 PUT falhou com status ${putResponse.status} em ${putResponse.headers.get('date') ?? 'data indisponível'}: ${await putResponse.text()}`,
		);
	}

	console.log(`R2 PUT OK: ${putResponse.status}`);
	console.log(`Object key: ${upload.key}`);

	if (!upload.publicUrl) {
		console.log('R2_PUBLIC_URL não configurada; validação pública pulada.');
		return;
	}

	const publicResponse = await fetch(upload.publicUrl, { method: 'HEAD' });
	if (!publicResponse.ok) {
		throw new Error(
			`R2 public HEAD falhou com status ${publicResponse.status}. URL pública: ${upload.publicUrl}`,
		);
	}

	console.log(`R2 public HEAD OK: ${publicResponse.status}`);
	console.log(`Public URL: ${upload.publicUrl}`);
}

async function getProviderDate(endpoint: string) {
	const response = await fetch(endpoint, { method: 'HEAD' });
	const dateHeader = response.headers.get('date');
	if (!dateHeader) {
		return new Date();
	}

	const providerDate = new Date(dateHeader);
	return Number.isNaN(providerDate.getTime()) ? new Date() : providerDate;
}

function assertR2Env(): asserts env is typeof env & {
	R2_ACCESS_KEY: string;
	R2_BUCKET_NAME: string;
	R2_ENDPOINT: string;
	R2_SECRET_KEY: string;
} {
	const missing = [
		['R2_ENDPOINT', env.R2_ENDPOINT],
		['R2_ACCESS_KEY', env.R2_ACCESS_KEY],
		['R2_SECRET_KEY', env.R2_SECRET_KEY],
		['R2_BUCKET_NAME', env.R2_BUCKET_NAME],
	]
		.filter(([, value]) => !value)
		.map(([key]) => key);

	if (missing.length > 0) {
		throw new Error(`Variáveis R2 ausentes: ${missing.join(', ')}`);
	}
}

main().catch((error) => {
	console.error(error instanceof Error ? error.message : error);
	process.exit(1);
});
