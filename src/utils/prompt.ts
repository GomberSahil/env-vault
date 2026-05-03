import inquirer from "inquirer";

export async function promptPassphrase(message: string): Promise<string> {
  const { passphrase } = await inquirer.prompt([
    {
      type: "password",
      name: "passphrase",
      message,
      mask: "*",
    },
  ]);

  return passphrase as string;
}

export async function promptConfirm(message: string): Promise<boolean> {
  const { confirmed } = await inquirer.prompt([
    {
      type: "confirm",
      name: "confirmed",
      message,
      default: false,
    },
  ]);

  return confirmed as boolean;
}
