export type ConvertImageToWebpOptions = {
	maxHeight?: number;
	maxWidth?: number;
	quality?: number;
};

const defaultOptions = {
	maxHeight: 1600,
	maxWidth: 1600,
	quality: 0.7,
} satisfies Required<ConvertImageToWebpOptions>;

export async function convertImageFileToWebp(
	file: File,
	options: ConvertImageToWebpOptions = {},
) {
	if (!file.type.startsWith("image/")) {
		throw new Error("O arquivo selecionado não é uma imagem.");
	}

	if (file.type === "image/webp") {
		return file;
	}

	const settings = { ...defaultOptions, ...options };
	const bitmap = await createImageBitmap(file);
	const { height, width } = getConstrainedSize({
		height: bitmap.height,
		maxHeight: settings.maxHeight,
		maxWidth: settings.maxWidth,
		width: bitmap.width,
	});
	const canvas = document.createElement("canvas");
	canvas.height = height;
	canvas.width = width;
	const context = canvas.getContext("2d");

	if (!context) {
		throw new Error("Não foi possível preparar a imagem para otimização.");
	}

	context.drawImage(bitmap, 0, 0, width, height);
	bitmap.close();

	const blob = await canvasToBlob(canvas, settings.quality);
	const fileName = `${getFileBaseName(file.name)}.webp`;

	return new File([blob], fileName, {
		lastModified: Date.now(),
		type: "image/webp",
	});
}

function getConstrainedSize(input: {
	height: number;
	maxHeight: number;
	maxWidth: number;
	width: number;
}) {
	const scale = Math.min(
		1,
		input.maxWidth / input.width,
		input.maxHeight / input.height,
	);

	return {
		height: Math.round(input.height * scale),
		width: Math.round(input.width * scale),
	};
}

function canvasToBlob(canvas: HTMLCanvasElement, quality: number) {
	return new Promise<Blob>((resolve, reject) => {
		canvas.toBlob(
			(blob) => {
				if (!blob) {
					reject(new Error("Não foi possível converter a imagem para WebP."));
					return;
				}

				resolve(blob);
			},
			"image/webp",
			quality,
		);
	});
}

function getFileBaseName(fileName: string) {
	const extensionIndex = fileName.lastIndexOf(".");
	return extensionIndex > 0 ? fileName.slice(0, extensionIndex) : fileName;
}
