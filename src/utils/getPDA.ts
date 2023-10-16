import * as anchor from "@project-serum/anchor";
import { PublicKey } from "@solana/web3.js";

function encodeString(input: string) {
  return anchor.utils.bytes.utf8.encode(input);
}

function encodeUInt32(input: number) {
  const b = Buffer.alloc(4);
  b.writeUInt32LE(input);
  return new Uint8Array(b);
}

export async function getPDA(
  programId: PublicKey,
  seeds: (PublicKey | string | number)[]
) {
  const parsedSeeds = seeds.map((seed) => {
    if (typeof seed === "string") return encodeString(seed);
    if (typeof seed === "number") return encodeUInt32(seed);
    return seed.toBuffer();
  });

  const [pubkey, bump] = await anchor.web3.PublicKey.findProgramAddress(
    parsedSeeds,
    programId
  );
  return [pubkey, bump] as [typeof pubkey, typeof bump];
}
