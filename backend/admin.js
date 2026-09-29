
const {
  randomBytes,
  scryptSync,
} = require("node:crypto");

const readline = require("node:readline");

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

console.log("RAKA Tech Admin Setup");
console.log("---------------------");

rl.question(
  "Enter a new admin password (minimum 12 characters): ",
  (password) => {
    if (password.length < 12) {
      console.log(
        "Password must contain at least 12 characters."
      );

      rl.close();
      return;
    }

    const salt = randomBytes(16).toString("hex");

    const hash = scryptSync(
      password,
      salt,
      32
    ).toString("hex");

    console.log("\nPassword hash generated successfully!");
    console.log("\nCopy this value into ADMIN_PASSWORD_HASH:");

    console.log(`${salt}:${hash}`);

    rl.close();
  }
);