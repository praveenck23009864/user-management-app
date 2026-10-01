const { randomBytes, scryptSync } = require("node:crypto");
const readline = require("node:readline");

const MIN_PASSWORD_LENGTH = 12;

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

console.log("RAKA Tech Admin Setup");
console.log("---------------------");

function askPassword() {
  rl.question(
    `Enter a new admin password (minimum ${MIN_PASSWORD_LENGTH} characters): `,
    function (password) {
      if (password.trim().length < MIN_PASSWORD_LENGTH) {
        console.log(
          `\nPassword must contain at least ${MIN_PASSWORD_LENGTH} characters, excluding leading and trailing spaces.\n`
        );

        askPassword();
        return;
      }

      rl.question(
        "Confirm your new admin password: ",
        function (confirmation) {
          if (password !== confirmation) {
            console.log(
              "\nPasswords do not match. Please try again.\n"
            );

            askPassword();
            return;
          }

          try {
            const salt = randomBytes(16).toString("hex");

            const hash = scryptSync(
              password,
              salt,
              32
            ).toString("hex");

            console.log("\nPassword hash generated successfully!");
            console.log(
              "Replace ADMIN_PASSWORD_HASH in backend/.env with:"
            );

            console.log(
              `\nADMIN_PASSWORD_HASH=${salt}:${hash}\n`
            );

            console.log(
              "Save backend/.env and restart the backend."
            );
          } catch {
            console.error(
              "\nUnable to generate the password hash."
            );

            process.exitCode = 1;
          } finally {
            rl.close();
          }
        }
      );
    }
  );
}

askPassword();