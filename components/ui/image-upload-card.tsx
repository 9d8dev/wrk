import { AlertCircle, CheckCircle, RotateCcw, Upload, X } from "lucide-react";
import Image from "next/image";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { Button } from "./button";
import { Progress } from "./progress";

interface ImageUploadCardProps {
	file: File;
	previewUrl: string;
	isUploading?: boolean;
	uploadProgress?: number;
	uploadError?: string;
	isComplete?: boolean;
	onRemove: () => void;
	onRetry?: () => void;
	onSetFeatured?: () => void;
	isFeatured?: boolean;
}

export const ImageUploadCard = ({
	file,
	previewUrl,
	isUploading = false,
	uploadProgress = 0,
	uploadError,
	isComplete = false,
	onRemove,
	onRetry,
	onSetFeatured,
	isFeatured = false,
}: ImageUploadCardProps) => {
	const [imageError, setImageError] = useState(false);

	const getStatusIcon = () => {
		if (uploadError)
			return <AlertCircle className="w-4 h-4 text-destructive" />;
		if (isComplete) return <CheckCircle className="w-4 h-4 text-green-500" />;
		if (isUploading)
			return <Upload className="w-4 h-4 text-blue-500 animate-pulse" />;
		return null;
	};

	const getStatusText = () => {
		if (uploadError) return "Failed";
		if (isComplete) return "Complete";
		if (isUploading) return `${uploadProgress}%`;
		return "Pending";
	};

	return (
		<button
			type="button"
			className={cn(
				"relative group border-2 rounded-lg overflow-hidden transition-all aspect-square w-full",
				isFeatured
					? "border-primary ring-2 ring-primary/20 shadow-lg"
					: "border-border hover:border-primary/50",
				uploadError && "border-destructive",
				isComplete && "border-green-500",
			)}
			onClick={onSetFeatured}
			onKeyDown={(e) => {
				if (e.key === 'Enter' || e.key === ' ') {
					e.preventDefault();
					onSetFeatured?.();
				}
			}}
			aria-label={`${isFeatured ? 'Featured' : 'Set as featured'} image: ${file.name}`}
		>
			{/* Image */}
			<div className="relative w-full h-full">
				{!imageError ? (
					<Image
						src={previewUrl}
						alt={file.name}
						fill
						className={cn(
							"object-cover transition-opacity",
							isUploading && "opacity-50",
						)}
						onError={() => setImageError(true)}
					/>
				) : (
					<div className="flex items-center justify-center w-full h-full bg-muted">
						<AlertCircle className="w-8 h-8 text-muted-foreground" />
					</div>
				)}

				{/* Upload Progress Overlay */}
				{isUploading && (
					<div className="absolute inset-0 bg-black/20 flex items-center justify-center">
						<div className="bg-background/90 backdrop-blur-sm rounded-lg p-3 min-w-[120px]">
							<div className="flex items-center gap-2 mb-2">
								<Upload className="w-4 h-4 animate-pulse" />
								<span className="text-sm font-medium">Uploading...</span>
							</div>
							<Progress value={uploadProgress} className="h-2" />
							<p className="text-xs text-muted-foreground mt-1 text-center">
								{uploadProgress}%
							</p>
						</div>
					</div>
				)}
			</div>

			{/* Status Badge */}
			{(isUploading || uploadError || isComplete) && (
				<div
					className={cn(
						"absolute top-2 left-2 px-2 py-1 rounded-md text-xs font-medium flex items-center gap-1",
						uploadError && "bg-destructive text-destructive-foreground",
						isComplete && "bg-green-600 text-white",
						isUploading && "bg-blue-600 text-white",
					)}
				>
					{getStatusIcon()}
					{getStatusText()}
				</div>
			)}

			{/* Featured Badge */}
			{isFeatured && (
				<div className="absolute top-2 right-2 bg-primary text-primary-foreground text-xs px-2 py-1 rounded-md font-medium">
					Featured
				</div>
			)}

			{/* File Info */}
			<div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-2">
				<p className="text-white text-xs truncate font-medium">{file.name}</p>
				<p className="text-white/80 text-xs">
					{(file.size / 1024 / 1024).toFixed(2)} MB
				</p>
			</div>

			{/* Action Buttons */}
			<div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
				{uploadError && onRetry && (
					<Button
						size="icon"
						variant="secondary"
						className="h-6 w-6"
						onClick={(e) => {
							e.stopPropagation();
							onRetry();
						}}
					>
						<RotateCcw className="h-3 w-3" />
					</Button>
				)}

				<Button
					size="icon"
					variant="destructive"
					className="h-6 w-6"
					onClick={(e) => {
						e.stopPropagation();
						onRemove();
					}}
				>
					<X className="h-3 w-3" />
				</Button>
			</div>

			{/* Error Message */}
			{uploadError && (
				<div className="absolute bottom-0 left-0 right-0 bg-destructive text-destructive-foreground p-2 text-xs">
					<p className="truncate">{uploadError}</p>
				</div>
			)}
		</button>
	);
};
