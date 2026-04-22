const path = require('path');
try {
  console.log(path.extname(undefined));
} catch(e) {
  console.log("ERROR CRASH:", e.message);
}
