interface CompressionOptions {
	maxWidth?: number;
	maxHeight?: number;
	quality?: number;
	type?: string;
	maxFileSize?: number;
	smartFormat?: boolean;
}

// Helper function to detect if browser supports WebP
const supportsWebP = (): boolean => {
	if (typeof window === "undefined") return true; // Assume support on server
	const canvas = document.createElement("canvas");
	canvas.width = 1;
	canvas.height = 1;
	return canvas.toDataURL("image/webp").indexOf("data:image/webp") === 0;
};

// Helper function to choose optimal format
const getOptimalFormat = (
	originalType: string,
	smartFormat: boolean,
): string => {
	if (!smartFormat) return "image/webp"; // Default behavior

	// Keep GIFs as GIFs (they might be animated)
	if (originalType === "image/gif") return originalType;

	// Use AVIF if supported (best compression)
	// Note: You'd need to check browser support for AVIF too
	// For now, stick with WebP as it has broad support

	return supportsWebP() ? "image/webp" : "image/jpeg";
};

export async function compressImage(
	file: File,
	options: CompressionOptions = {},
): Promise<File> {
	const {
		maxWidth = 2048,
		maxHeight = 2048,
		quality = 0.85,
		type, // Allow override
		maxFileSize = 15 * 1024 * 1024,
		smartFormat = true,
	} = options;

	// Determine optimal format
	const optimalType = type || getOptimalFormat(file.type, smartFormat);

	// Don't compress GIFs - but validate size
	if (file.type === "image/gif") {
		if (file.size > maxFileSize) {
			throw new Error(
				`GIF file is too large (${(file.size / 1024 / 1024).toFixed(
					2,
				)}MB). Maximum allowed: ${maxFileSize / 1024 / 1024}MB`,
			);
		}
		return file;
	}

	return new Promise((resolve, reject) => {
		const reader = new FileReader();
		reader.readAsDataURL(file);
		reader.onload = (event) => {
			const img = new Image();
			img.src = event.target?.result as string;
			img.onload = () => {
				const canvas = document.createElement("canvas");
				let { width, height } = img;

				// Calculate new dimensions while maintaining aspect ratio
				if (width > maxWidth || height > maxHeight) {
					const aspectRatio = width / height;
					if (width > height) {
						width = maxWidth;
						height = width / aspectRatio;
					} else {
						height = maxHeight;
						width = height * aspectRatio;
					}
				}

				canvas.width = width;
				canvas.height = height;

				const ctx = canvas.getContext("2d");
				if (!ctx) {
					reject(new Error("Failed to get canvas context"));
					return;
				}

				ctx.drawImage(img, 0, 0, width, height);

				canvas.toBlob(
					(blob) => {
						if (!blob) {
							reject(new Error("Failed to compress image"));
							return;
						}

						const compressedFile = new File([blob], file.name, {
							type: blob.type,
							lastModified: Date.now(),
						});

						// If compressed file is larger than original, return original
						if (compressedFile.size >= file.size) {
							resolve(file);
						} else {
							resolve(compressedFile);
						}
					},
					optimalType,
					quality,
				);
			};
			img.onerror = () => reject(new Error("Failed to load image"));
		};
		reader.onerror = () => reject(new Error("Failed to read file"));
	});
}

export async function compressImages(
	files: File[],
	options?: CompressionOptions,
	onProgress?: (current: number, total: number) => void,
): Promise<File[]> {
	const compressed: File[] = [];

	for (let i = 0; i < files.length; i++) {
		try {
			const compressedFile = await compressImage(files[i], options);
			compressed.push(compressedFile);
			if (onProgress) {
				onProgress(i + 1, files.length);
			}
		} catch (error) {
			console.error(`Failed to compress ${files[i].name}:`, error);
			compressed.push(files[i]); // Use original if compression fails
			if (onProgress) {
				onProgress(i + 1, files.length);
			}
		}
	}

	return compressed;
}
