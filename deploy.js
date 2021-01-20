const AWS = require('aws-sdk');
const fsp = require('fs').promises;
const path = require('path');

const FILE = path.join(__dirname, 'build', 'funnelbranch.js');
const BUCKET = 'funnelbranch-assets';
const DESTINATION = 'script/funnelbranch.js';

const args = process.argv.slice(2);
const accessKeyId = args[0];
const secretAccessKey = args[1];

const usage = `\nUsage: ${path.basename(process.argv[1])} <AWS_ACCESS_KEY> <AWS_SECRET_KEY>\n`;

if (!accessKeyId) {
  console.error(`Missing AWS access key\n${usage}`);
  process.exit(1);
}
if (!secretAccessKey) {
  console.error(`Missing AWS secret key\n${usage}`);
  process.exit(1);
}

(async () => {
  const s3 = new AWS.S3({
    accessKeyId,
    secretAccessKey,
  });

  let fileContent;
  try {
    fileContent = await fsp.readFile(FILE, 'utf8');
    if (fileContent.length === 0) {
      console.error(`File empty: '${FILE}'`);
      process.exit(1);
    }
  } catch (err) {
    console.error(`File not found: '${FILE}'`);
    process.exit(1);
  }

  try {
    await s3
      .putObject({
        Bucket: BUCKET,
        Key: DESTINATION,
        Body: fileContent,
        ContentType: 'text/javascript',
      })
      .promise();
    console.log('Success');
  } catch (err) {
    console.error(err);
    console.error(usage);
    process.exit(1);
  }
})();
