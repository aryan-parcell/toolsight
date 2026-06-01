import { useEffect, useRef, useState } from "react";
import { Upload, Camera, Image as ImageIcon, X } from "lucide-react";

interface ImageUploadDropzoneProps {
    onImageSelected: (dataUrl: string) => void;
}

/* ---------- Helper Image Processing Functions ---------- */

/**
 * Checks if the image is portrait (height > width). If so, rotates it -90 degrees
 * to landscape and draws it to a canvas. Otherwise, draws it as-is.
 */
function enforceLandscape(img: HTMLImageElement): HTMLCanvasElement {
    const { naturalWidth: w, naturalHeight: h } = img;
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    if (!ctx) {
        throw new Error("Could not get 2D context from canvas");
    }

    if (h > w) {
        canvas.width = h;
        canvas.height = w;
        ctx.translate(canvas.width / 2, canvas.height / 2);
        ctx.rotate(-Math.PI / 2);
        ctx.drawImage(img, -w / 2, -h / 2);
    } else {
        canvas.width = w;
        canvas.height = h;
        ctx.drawImage(img, 0, 0);
    }

    return canvas;
}

/**
 * Scales the canvas down proportionally if either dimension exceeds maxDim.
 */
function enforceMaxDimensions(canvas: HTMLCanvasElement, maxDim: number = 1600): HTMLCanvasElement {
    const { width: w, height: h } = canvas;
    if (w <= maxDim && h <= maxDim) return canvas;

    const scale = Math.min(maxDim / w, maxDim / h);
    const targetWidth = Math.round(w * scale);
    const targetHeight = Math.round(h * scale);

    const scaledCanvas = document.createElement("canvas");
    scaledCanvas.width = targetWidth;
    scaledCanvas.height = targetHeight;
    const ctx = scaledCanvas.getContext("2d");
    if (!ctx) {
        throw new Error("Could not get 2D context from scaled canvas");
    }

    ctx.drawImage(canvas, 0, 0, targetWidth, targetHeight);
    return scaledCanvas;
}

/**
 * Iteratively decreases JPG quality to ensure size is < maxSizeBytes.
 */
function enforceMaxFileSize(canvas: HTMLCanvasElement, maxSizeBytes: number = 1e6): string {
    const estimateSize = (url: string) => url.length * 0.75;

    let quality = 0.9;
    let outputDataUrl = canvas.toDataURL("image/jpeg", quality);

    // Iteratively adjust JPEG quality
    while (estimateSize(outputDataUrl) > maxSizeBytes && quality > 0.5) {
        quality -= 0.1;
        outputDataUrl = canvas.toDataURL("image/jpeg", quality);
    }

    return outputDataUrl;
}

export default function ImageUploadDropzone({
    onImageSelected,
}: ImageUploadDropzoneProps) {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const videoRef = useRef<HTMLVideoElement>(null);

    const [isDraggingFile, setIsDraggingFile] = useState(false);
    const [showCamera, setShowCamera] = useState(false);
    const [isCameraLoading, setIsCameraLoading] = useState(false);
    const [stream, setStream] = useState<MediaStream | null>(null);

    /* ---------- Image processing ---------- */

    const enforceImageRules = (dataUrl: string): Promise<string> => {
        return new Promise((resolve) => {
            const img = new Image();
            img.onload = () => {
                try {
                    // 1. Enforce landscape orientation
                    const landscapeCanvas = enforceLandscape(img);

                    // 2. Enforce max dimensions (capping long-edge at 1600px)
                    const boundedCanvas = enforceMaxDimensions(landscapeCanvas, 1600);

                    // 3. Enforce max file size and format (JPEG, < 1MB)
                    const finalDataUrl = enforceMaxFileSize(boundedCanvas, 1e6);

                    resolve(finalDataUrl);
                } catch (err) {
                    console.error("Image optimization failed, falling back to original", err);
                    resolve(dataUrl);
                }
            };
            img.onerror = (err) => {
                console.error("Image optimization failed, falling back to original", err);
                resolve(dataUrl);
            };
            img.src = dataUrl;
        });
    };

    /* ---------- File handling ---------- */

    const processFile = (file: File) => {
        if (!file.type.startsWith("image/")) return;

        const reader = new FileReader();
        reader.onload = (ev) => {
            let result = ev.target?.result;
            if (result && typeof result === "string") {
                enforceImageRules(result).then(onImageSelected);
            }
        };
        reader.readAsDataURL(file);
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) processFile(file);
    };

    const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        setIsDraggingFile(true);
    };

    const handleDragLeave = () => {
        setIsDraggingFile(false);
    };

    const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        setIsDraggingFile(false);

        const file = e.dataTransfer.files[0];
        if (file) processFile(file);
    };

    /* ---------- Camera handling ---------- */

    const startCamera = async () => {
        setShowCamera(true);
        setIsCameraLoading(true);

        try {
            const mediaStream = await navigator.mediaDevices.getUserMedia({
                video: { facingMode: "environment" },
            });

            setStream(mediaStream);

            if (videoRef.current) {
                videoRef.current.srcObject = mediaStream;
            }
        } catch (err) {
            console.error("Camera access failed:", err);
            alert("Unable to access camera");
            setShowCamera(false);
        } finally {
            setIsCameraLoading(false);
        }
    };


    const stopCamera = () => {
        stream?.getTracks().forEach((track) => track.stop());
        setStream(null);
        setShowCamera(false);
    };

    const capturePhoto = () => {
        if (!videoRef.current) return;

        const video = videoRef.current;
        const canvas = document.createElement("canvas");
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;

        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        ctx.drawImage(video, 0, 0);
        const dataUrl = canvas.toDataURL("image/jpeg");

        stopCamera();

        enforceImageRules(dataUrl).then(onImageSelected);
    };

    /* ---------- Cleanup on unmount ---------- */

    useEffect(() => {
        return () => {
            stream?.getTracks().forEach((track) => track.stop());
        };
    }, [stream]);

    return (
        <>
            {/* Camera Overlay */}
            {showCamera && (
                <div className="fixed inset-0 z-50 bg-black flex flex-col items-center justify-center">
                    <div className="relative w-full max-w-4xl aspect-video bg-gray-900">
                        <video
                            ref={videoRef}
                            autoPlay
                            playsInline
                            className="w-full h-full object-cover"
                        />

                        <button
                            onClick={stopCamera}
                            className="absolute top-4 right-4 p-2 bg-black/50 rounded-full text-white hover:bg-black/80"
                        >
                            <X size={24} />
                        </button>

                        <div className="absolute bottom-8 left-0 right-0 flex justify-center">
                            <button
                                onClick={capturePhoto}
                                className="w-20 h-20 rounded-full border-4 border-white bg-white/20 hover:bg-white/40 flex items-center justify-center"
                            >
                                <div className="w-16 h-16 rounded-full bg-white" />
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Dropzone */}
            <div className="flex-1 flex flex-col gap-6">
                <div
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    className={`flex-1 flex flex-col items-center justify-center bg-axiom-surfaceLight dark:bg-axiom-surfaceDark border-2 border-dashed rounded-xl p-12 transition-colors ${isDraggingFile
                        ? "border-axiom-cyan bg-axiom-cyan/5"
                        : "border-axiom-borderLight dark:border-axiom-borderDark"
                        }`}
                >
                    <div className="w-24 h-24 bg-axiom-borderLight dark:bg-gray-800 rounded-full flex items-center justify-center mb-6">
                        <ImageIcon size={48} className="text-gray-400" />
                    </div>

                    <h3 className="text-xl font-bold dark:text-white mb-2">
                        Upload Reference Image
                    </h3>

                    <p className="text-gray-500 mb-8 max-w-md text-center">
                        Drag & Drop an image here, or use one of the options below.
                    </p>

                    <div className="flex gap-4">
                        <button
                            onClick={startCamera}
                            className="bg-gray-800 text-white px-8 py-4 rounded-full font-bold flex items-center gap-2"
                        >
                            <Camera size={20} />
                            Use Camera
                        </button>

                        <button
                            onClick={() => fileInputRef.current?.click()}
                            className="bg-axiom-cyan text-black px-8 py-4 rounded-full font-bold flex items-center gap-2"
                        >
                            <Upload size={20} />
                            Select File
                        </button>
                    </div>

                    <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handleFileChange}
                        className="hidden"
                    />
                </div>
            </div>
        </>
    );
}
