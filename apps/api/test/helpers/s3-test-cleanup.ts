import { S3Service } from '../../src/s3/s3.service';

export async function deleteS3TestObject(s3: S3Service, key: string): Promise<void> {
  await s3.deleteObject(key).catch(() => {});
}

export async function deleteS3TestObjects(s3: S3Service, keys: string[]): Promise<void> {
  await Promise.all(keys.map((key) => deleteS3TestObject(s3, key)));
}
