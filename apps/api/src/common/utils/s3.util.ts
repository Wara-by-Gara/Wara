import { GetObjectCommand, S3Client } from '@aws-sdk/client-s3';

/** S3 객체를 Buffer로 읽어 반환 */
export async function getObject(s3: S3Client, bucket: string, key: string): Promise<Buffer> {
  const command = new GetObjectCommand({ Bucket: bucket, Key: key });
  const response = await s3.send(command);

  if (!response.Body) {
    throw new Error(`S3 객체를 읽을 수 없습니다: ${key}`);
  }

  const chunks: Uint8Array[] = [];
  for await (const chunk of response.Body as AsyncIterable<Uint8Array>) {
    chunks.push(chunk);
  }
  return Buffer.concat(chunks);
}
