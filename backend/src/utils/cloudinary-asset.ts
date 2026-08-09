import cloudinary from "../config/cloudinary";

export interface UploadedCloudinaryAsset {
    publicId: string;
    resourceType: "image" | "video";
    deliveryType: "upload" | "authenticated";
}

export const destroyCloudinaryAsset = async (asset: UploadedCloudinaryAsset) => {
    try {
        await cloudinary.uploader.destroy(asset.publicId, {
            resource_type: asset.resourceType,
            type: asset.deliveryType,
            invalidate: true
        });
    } catch (error) {
        console.error("Cloudinary cleanup error:", error);
    }
};

export const destroyStoredAsset = async (publicId: string | null | undefined, mediaType: "image" | "audio") => {
    if (!publicId) return;
    await destroyCloudinaryAsset({
        publicId,
        resourceType: mediaType === "audio" ? "video" : "image",
        deliveryType: mediaType === "audio" ? "authenticated" : "upload"
    });
};
