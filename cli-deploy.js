#!/usr/bin/env node

const AWS = require('aws-sdk');
const fsp = require('fs').promises;
const path = require('path');

async function deploy() {
  const file = path.join(__dirname, 'build', 'funnelbranch.js');
  const objectKey = 'script/funnelbranch.js';

  const bucket = process.env.AWS_BUCKET;
  const accessKeyId = process.env.AWS_ACCESS_KEY;
  const secretAccessKey = process.env.AWS_SECRET_KEY;

  if (!bucket) {
    throw new Error('Missing AWS bucket');
  }
  if (!accessKeyId) {
    throw new Error('Missing AWS access key');
  }
  if (!secretAccessKey) {
    throw new Error('Missing AWS secret key');
  }

  let fileContent;
  try {
    fileContent = await fsp.readFile(file, 'utf8');
    if (fileContent.length === 0) {
      throw new Error(`File empty: '${file}'`);
    }
  } catch (err) {
    throw new Error(`File not found: '${file}'`);
  }

  await new AWS.S3({ accessKeyId, secretAccessKey })
    .putObject({
      Bucket: bucket,
      Key: objectKey,
      Body: fileContent,
      ContentType: 'text/javascript',
    })
    .promise();
}

deploy().catch((err) => {
  console.error(err);
  process.exit(1);
});
