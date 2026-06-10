import AWS from 'aws-sdk';
import config from '../../config';
import path from 'path';
import fs from 'fs';

const s3 = new AWS.S3({
  accessKeyId: config.aws.access_key_id,
  secretAccessKey: config.aws.secret_access_key,
  region: config.aws.region,
});

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const uploadFileWithS3 = async (file: any) => {
  if (!config.aws.bucket_name) {
    throw new Error('AWS bucket name is not defined');
  }

  const params = {
    Bucket: config.aws.bucket_name,
    Key: file.fieldname + '_' + Date.now() + path.extname(file.originalname),
    Body: fs.createReadStream(file.path),
    ContentType: file.mimetype,
  };

  const imagePath = (await s3.upload(params).promise()).Location;

  if (imagePath) {
    fs.unlinkSync(file.path);
  }

  return imagePath;
};

export default uploadFileWithS3;
