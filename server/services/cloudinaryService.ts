import { v2 as cloudinary } from 'cloudinary';

let configured = false;

function ensureConfigured(): void {
  if (configured) return;
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  });
  configured = true;
}

export async function uploadImageFromUrl(imageUrl: string, publicId: string): Promise<string> {
  ensureConfigured();
  const result = await cloudinary.uploader.upload(imageUrl, {
    folder: 'ai-graffiti-wall',
    public_id: publicId,
    resource_type: 'image',
  });
  return result.secure_url;
}

export async function uploadImageFromBase64(dataUrl: string, publicId: string): Promise<string> {
  ensureConfigured();
  const result = await cloudinary.uploader.upload(dataUrl, {
    folder: 'ai-graffiti-wall',
    public_id: publicId,
    resource_type: 'image',
  });
  return result.secure_url;
}
