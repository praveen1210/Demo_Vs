// const https = require('https');

// const API_KEY = 'AIzaSyCfmkPXH32itZj4UppdHDyR7IUePUFsV4c';
// const IMG_URL = 'https://www.google.com/recaptcha/enterprise/payload?p=06AFcWeA7JtLpxtYv4tWJTjS_jIycAJW_qm5AJS3G5HIEyiSYo1JCG9aSLX8wdJxAMuf6sD-QflLZCyFC8bvhA9B6IlaUFkhsFJtX2Tyg5VOZQYgSN43lNlMOU-Zkq0gYDM8eRq7aCxFmjLpIlY0QfJIQBmpIW_RmG5gMLQKhPvNrBdZX5QmKHRxkELfghIHIl9yHQgbOj3BzqhmzOMVPhkYGRIq17sZg&k=6LdlWF8pAAAAAAprdtXKwKQWxajQiNJgW3WfBz_T';

// https.get(IMG_URL, (res) => {
//   const chunks = [];
//   res.on('data', (c) => chunks.push(c));
//   res.on('end', () => {
//     const buf = Buffer.concat(chunks);
//     const b64 = buf.toString('base64');
//     console.log('Image size:', buf.length, 'bytes');

//     const body = JSON.stringify({
//       contents: [{
//         parts: [
//           { text: 'Does this image contain a "motorcycle"? Answer only YES or NO.' },
//           { inline_data: { mime_type: 'image/png', data: b64 } }
//         ]
//       }],
//       generationConfig: { temperature: 0.1, maxOutputTokens: 10 }
//     });

//     const opts = {
//       hostname: 'generativelanguage.googleapis.com',
//       path: '/v1beta/models/gemini-2.5-flash:generateContent?key=' + API_KEY,
//       method: 'POST',
//       headers: { 'Content-Type': 'application/json' }
//     };

//     const req = https.request(opts, (res2) => {
//       let data = '';
//       res2.on('data', (c) => data += c);
//       res2.on('end', () => {
//         const json = JSON.parse(data);
//         const text = json?.candidates?.[0]?.content?.parts?.[0]?.text;
//         console.log('Gemini response:', text);
//         console.log('Full response:', JSON.stringify(json).substring(0, 500));
//       });
//     });
//     req.write(body);
//     req.end();
//   });
// });
