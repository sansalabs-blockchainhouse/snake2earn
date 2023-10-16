import { BN } from "@project-serum/anchor";

export function toBN(amount: BigInt): BN {
  const str = amount.toString();
  return new BN(str);
}
