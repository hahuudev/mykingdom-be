import { Injectable, BadRequestException } from '@nestjs/common';
import { v2 as cloudinary } from 'cloudinary';
import { Readable } from 'stream';

@Injectable()
export class UploadService {
  async uploadSingle(file: Express.Multer.File) {
    try {
      const result = await this.uploadToCloudinary(file);
      
      return {
        url: result.secure_url,
        publicId: result.public_id,
        width: result.width,
        height: result.height,
        format: result.format,
        resourceType: result.resource_type,
      };
    } catch (error) {
      throw new BadRequestException('Failed to upload image');
    }
  }

  async uploadMultiple(files: Express.Multer.File[]) {
    try {
      const uploadPromises = files.map(file => this.uploadToCloudinary(file));
      const results = await Promise.all(uploadPromises);

      return results.map(result => ({
        url: result.secure_url,
        publicId: result.public_id,
        width: result.width,
        height: result.height,
        format: result.format,
        resourceType: result.resource_type,
      }));
    } catch (error) {
      throw new BadRequestException('Failed to upload images');
    }
  }

  private async uploadToCloudinary(file: Express.Multer.File) {
    return new Promise<any>((resolve, reject) => {
      const upload = cloudinary.uploader.upload_stream(
        {
          folder: 'your-folder-name',
          resource_type: 'auto',
        },
        (error, result) => {
          if (error) return reject(error);
          resolve(result);
        }
      );

      const buffer = Buffer.from(file.buffer);
      const stream = Readable.from(buffer);
      stream.pipe(upload);
    });
  }
}