import { createHash, createHmac } from 'node:crypto';

export type R2StorageConfig = {
	accessKeyId: string;
	bucketName: string;
	endpoint: string;
	publicUrl?: string;
	secretAccessKey: string;
	uploadExpiresInSeconds?: number;
};

export type PresignedUploadInput = {
	contentType: 'image/webp';
	key: string;
};

export type PresignedUpload = {
	headers: Record<string, string>;
	key: string;
	method: 'PUT';
	publicUrl?: string;
	url: string;
};

const defaultUploadExpiresInSeconds = 60 * 5;
const region = 'auto';
const service = 's3';
const unsignedPayload = 'UNSIGNED-PAYLOAD';

export function createR2PresignedUpload(
	config: R2StorageConfig,
	input: PresignedUploadInput,
	date = new Date(),
): PresignedUpload {
	const endpoint = new URL(config.endpoint);
	const normalizedKey = input.key.replace(/^\/+/, '');
	const encodedKey = encodePath(normalizedKey);
	const uploadUrl = new URL(`${endpoint.protocol}//${endpoint.host}`);
	uploadUrl.hostname = `${config.bucketName}.${endpoint.hostname}`;
	uploadUrl.pathname = `/${encodedKey}`;
	const amzDate = toAmzDate(date);
	const dateStamp = amzDate.slice(0, 8);
	const credentialScope = `${dateStamp}/${region}/${service}/aws4_request`;
	const query = new URLSearchParams({
		'X-Amz-Algorithm': 'AWS4-HMAC-SHA256',
		'X-Amz-Content-Sha256': unsignedPayload,
		'X-Amz-Credential': `${config.accessKeyId}/${credentialScope}`,
		'X-Amz-Date': amzDate,
		'X-Amz-Expires': String(
			config.uploadExpiresInSeconds ?? defaultUploadExpiresInSeconds,
		),
		'X-Amz-SignedHeaders': 'content-type;host',
		'x-id': 'PutObject',
	});
	const canonicalQueryString = sortQueryParams(query);
	const canonicalRequest = [
		'PUT',
		uploadUrl.pathname,
		canonicalQueryString,
		`content-type:${input.contentType}`,
		`host:${uploadUrl.host}`,
		'',
		'content-type;host',
		unsignedPayload,
	].join('\n');
	const stringToSign = [
		'AWS4-HMAC-SHA256',
		amzDate,
		credentialScope,
		sha256Hex(canonicalRequest),
	].join('\n');
	const signingKey = getSigningKey(config.secretAccessKey, dateStamp);
	const signature = hmacHex(signingKey, stringToSign);

	uploadUrl.search = `${canonicalQueryString}&X-Amz-Signature=${signature}`;

	return {
		headers: { 'content-type': input.contentType },
		key: normalizedKey,
		method: 'PUT',
		publicUrl: config.publicUrl
			? `${trimTrailingSlash(config.publicUrl)}/${encodedKey}`
			: undefined,
		url: uploadUrl.href,
	};
}

function encodePath(path: string) {
	return path.split('/').map(encodeURIComponent).join('/');
}

function getSigningKey(secretAccessKey: string, dateStamp: string) {
	const dateKey = hmacBuffer(`AWS4${secretAccessKey}`, dateStamp);
	const dateRegionKey = hmacBuffer(dateKey, region);
	const dateRegionServiceKey = hmacBuffer(dateRegionKey, service);
	return hmacBuffer(dateRegionServiceKey, 'aws4_request');
}

function hmacBuffer(key: string | Buffer, value: string) {
	return createHmac('sha256', key).update(value).digest();
}

function hmacHex(key: Buffer, value: string) {
	return createHmac('sha256', key).update(value).digest('hex');
}

function sha256Hex(value: string) {
	return createHash('sha256').update(value).digest('hex');
}

function sortQueryParams(query: URLSearchParams) {
	return Array.from(query.entries())
		.sort(([left], [right]) => left.localeCompare(right))
		.map(
			([key, value]) =>
				`${encodeURIComponent(key)}=${encodeURIComponent(value)}`,
		)
		.join('&');
}

function toAmzDate(date: Date) {
	return date.toISOString().replace(/[:-]|\.\d{3}/g, '');
}

function trimTrailingSlash(value: string) {
	return value.replace(/\/+$/, '');
}
