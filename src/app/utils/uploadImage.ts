import multer from 'multer';
import fs from 'fs';
import path from 'path';

const uploadDir = './public/uploads/images/';

if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    cb(
      null,
      file.fieldname + '_' + Date.now() + path.extname(file.originalname),
    );
  },
});

const upload = multer({ storage: storage });
export default upload;
// import multer from 'multer';
// import path from 'path';

// const storage = multer.diskStorage({
//   destination: function (req, file, cb) {
//     cb(null, './public/uploads/images/');
//   },
//   filename: function (req, file, cb) {
//     cb(
//       null,
//       file.fieldname + '_' + Date.now() + path.extname(file.originalname),
//     );
//   },
// });

// const upload = multer({ storage: storage });
// export default upload;

// import multer from 'multer';
// import path from 'path';
// const filePath = './public/uploads/images/';
// import fs from 'fs';

// const fileUpload = (fileDirectory: string) => {
//   if (!fs.existsSync(fileDirectory)) {
//     fs.mkdirSync(filePath, { recursive: true });
//   }

//   const storage = multer.diskStorage({
//     destination: function (req, file, cb) {
//       cb(null, fileDirectory);
//     },
//     filename: function (req, file, cb) {
//       cb(
//         null,
//         file.originalname + '_' + Date.now() + path.extname(file.originalname),
//       );
//     },
//   });
//   const upload = multer({ storage: storage });
//   return upload;
// };

// export default fileUpload;
