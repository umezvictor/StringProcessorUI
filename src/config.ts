import z from "zod";

const ENVSchema = z.object({
  VITE_API_URL: z.string(),
});

const { VITE_API_URL } = import.meta.env;

const parsedResult = ENVSchema.safeParse({ VITE_API_URL });

if (!parsedResult.success) {
  //stop the app from running if environment variables are not properly configured
  console.log(parsedResult.error);
  throw new Error("An error occured when loading your environment variables");
}

export const environmentVariable = parsedResult.data;
