import "@/styles/globals.css";
require("@solana/wallet-adapter-react-ui/styles.css");
import type { AppProps } from "next/app";
import dynamic from "next/dynamic";

const WalletConnectionProvider = dynamic(
  () => import("../providers/wallet-connection-provider"),
  {
    ssr: false,
  }
);

export default function App({ Component, pageProps }: AppProps) {
  return (
    <WalletConnectionProvider>
      <Component {...pageProps} />
    </WalletConnectionProvider>
  );
}
