import "@/styles/globals.css";
import { FaucetProvider } from "@/context/faucet";
require("@solana/wallet-adapter-react-ui/styles.css");
import type { AppProps } from "next/app";
import dynamic from "next/dynamic";
import { Toaster } from "react-hot-toast";
import { ChakraProvider } from "@chakra-ui/react";

const WalletConnectionProvider = dynamic(
  () => import("../providers/wallet-connection-provider"),
  {
    ssr: false,
  }
);

export default function App({ Component, pageProps }: AppProps) {
  return (
    <ChakraProvider>
      <WalletConnectionProvider>
        <Toaster
          position="top-right"
          toastOptions={{
            className: "",
            style: {
              border: "1px solid #2e2e2e",
              color: "#FFFFFF",
              backgroundColor: "#000000",
            },
          }}
        />

        <FaucetProvider>
          <Component {...pageProps} />
        </FaucetProvider>
      </WalletConnectionProvider>
    </ChakraProvider>
  );
}
