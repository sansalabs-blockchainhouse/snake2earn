import { AnchorProvider, BN, Program } from "@project-serum/anchor";
import IDL from "./idl.json";
import { PROGRAM_ID } from "./constants";

export const getProgram = (connection: any, wallet: any) => {
  const provider = new AnchorProvider(connection, wallet, {
    commitment: "confirmed",
  });
  const program = new Program(IDL as any, PROGRAM_ID, provider);
  return program;
};
