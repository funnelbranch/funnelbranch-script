const AWS = require('aws-sdk');
const fsp = require('fs').promises;
const path = require('path');

async function publish() {
  const FILE = path.join(__dirname, 'build', 'funnelbranch.js');
  const BUCKET = 'funnelbranch-assets';
  const DESTINATION = 'script/funnelbranch.js';

  const accessKeyId = process.env.AWS_ACCESS_KEY;
  const secretAccessKey = process.env.AWS_SECRET_KEY;

  if (!accessKeyId) {
    throw new Error('Missing AWS access key');
  }
  if (!secretAccessKey) {
    throw new Error('Missing AWS secret key');
  }

  let fileContent;
  try {
    fileContent = await fsp.readFile(FILE, 'utf8');
    if (fileContent.length === 0) {
      throw new Error(`File empty: '${FILE}'`);
    }
  } catch (err) {
    throw new Error(`File not found: '${FILE}'`);
  }

  await new AWS.S3({ accessKeyId, secretAccessKey })
    .putObject({
      Bucket: BUCKET,
      Key: DESTINATION,
      Body: fileContent,
      ContentType: 'text/javascript',
    })
    .promise();
}

publish().catch((err) => {
  console.error(err);
  process.exit(1);
});
