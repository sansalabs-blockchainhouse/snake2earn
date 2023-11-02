import { confirmTx } from "@/utils/confirmTx";
import { getPDA } from "@/utils/getPDA";
import { getProgram } from "@/utils/program";
import { toBN } from "@/utils/toBn";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { SystemProgram, SYSVAR_RENT_PUBKEY } from "@solana/web3.js";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import toast from "react-hot-toast";

export const FaucetContext = createContext({} as any);

export const FaucetProvider = ({ children }: any) => {
  const { connection } = useConnection();
  const wallet = useWallet();

  const [isUserInitialized, setIsUserInitialized] = useState(false);
  const [claimed, setClaimed] = useState(0);

  const program = useMemo(() => {
    if (connection) {
      return getProgram(connection, wallet);
    }
  }, [connection, wallet]);

  const getUsePool = useCallback(async () => {
    try {
      if (!program || !wallet.publicKey) return;

      const [userPoolKey] = await getPDA(program.programId, [
        "user-pool",
        wallet.publicKey,
      ]);
      const txHash: any = await program.account.userPool.fetch(userPoolKey);
      if (txHash) {
        console.log(txHash.receivedAmount.toNumber() / 1e9);
        setClaimed(txHash.receivedAmount.toNumber() / 1e9);
        setIsUserInitialized(true);
      }
    } catch (error) {
      setIsUserInitialized(false);
    }
  }, [program, wallet.publicKey]);

  useEffect(() => {
    getUsePool();
  }, [getUsePool]);

  const initialize = async () => {
    if (!program) return toast.error("Something went wrong!");

    const [globalStateKey] = await getPDA(program.programId, ["global-state"]);

    const [vaultWalletKey, vaultWalletBump] = await getPDA(program.programId, [
      "vault-wallet",
    ]);

    console.log(program);

    const txHash = await program.methods
      .initialize(toBN(BigInt(0.001 * 1e9)), vaultWalletBump)
      .accounts({
        admin: wallet.publicKey,
        globalState: globalStateKey,
        vaultWallet: vaultWalletKey,
        systemProgram: SystemProgram.programId,
        rent: SYSVAR_RENT_PUBKEY,
      })
      .rpc();
    await confirmTx(txHash, connection);
  };

  const deposit_vault = async () => {
    if (!program) return toast.error("Something went wrong!");

    const [globalStateKey] = await getPDA(program.programId, ["global-state"]);

    const [vaultWalletKey] = await getPDA(program.programId, ["vault-wallet"]);

    const txHash = await program.methods
      .depositVault(toBN(BigInt(0.2 * 1e9)))
      .accounts({
        admin: wallet.publicKey,
        globalState: globalStateKey,
        vaultWallet: vaultWalletKey,
        systemProgram: SystemProgram.programId,
        rent: SYSVAR_RENT_PUBKEY,
      })
      .rpc();

    await confirmTx(txHash, connection);
  };

  const update_limit = async () => {
    if (!program) return toast.error("Something went wrong!");

    const [globalStateKey] = await getPDA(program.programId, ["global-state"]);

    const txHash = await program.methods
      .updateLimit(toBN(BigInt(0.01 * 1e9)))
      .accounts({
        admin: wallet.publicKey,
        globalState: globalStateKey,
        systemProgram: SystemProgram.programId,
        rent: SYSVAR_RENT_PUBKEY,
      })
      .rpc();

    await confirmTx(txHash, connection);
  };

  const init_user_pool = async () => {
    if (!program || !wallet.publicKey)
      return toast.error("Something went wrong!");

    const [userPoolKey] = await getPDA(program.programId, [
      "user-pool",
      wallet.publicKey,
    ]);

    const txHash = await program.methods
      .initUserPool()
      .accounts({
        payer: wallet.publicKey,
        userPool: userPoolKey,
        systemProgram: SystemProgram.programId,
        rent: SYSVAR_RENT_PUBKEY,
      })
      .rpc();

    await confirmTx(txHash, connection);
    await getUsePool();
  };

  const request_faucet = async () => {
    if (!program || !wallet.publicKey)
      return toast.error("Something went wrong!");

    const toastId = toast.loading("Loading...");

    try {
      const [globalStateKey] = await getPDA(program.programId, [
        "global-state",
      ]);
      const [vaultWalletKey] = await getPDA(program.programId, [
        "vault-wallet",
      ]);
      const [userPoolKey] = await getPDA(program.programId, [
        "user-pool",
        wallet.publicKey,
      ]);

      const txHash = await program.methods
        .requestFaucet(toBN(BigInt(0.0005 * 1e9)))
        .accounts({
          payer: wallet.publicKey,
          globalState: globalStateKey,
          vaultWallet: vaultWalletKey,
          userPool: userPoolKey,
          systemProgram: SystemProgram.programId,
          rent: SYSVAR_RENT_PUBKEY,
        })
        .rpc();

      await confirmTx(txHash, connection);
      return txHash;
    } catch (error) {
      toast.dismiss();

      toast.error("Error requesting");
    } finally {
      toast.dismiss(toastId);
    }
  };

  return (
    <FaucetContext.Provider
      value={{
        initialize,
        deposit_vault,
        init_user_pool,
        request_faucet,
        isUserInitialized,
        claimed,
        update_limit,
      }}
    >
      {children}
    </FaucetContext.Provider>
  );
};

export const useFaucetContext = () => {
  return useContext(FaucetContext);
};
