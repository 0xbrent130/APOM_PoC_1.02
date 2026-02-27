import { createConfig, http } from "wagmi";
import { injected } from "wagmi/connectors";
import { base, mainnet, polygon } from "wagmi/chains";

export const wagmiConfig = createConfig({
  chains: [mainnet, polygon, base],
  connectors: [
    injected({
      shimDisconnect: true,
      unstable_shimAsyncInject: 200,
    }),
  ],
  transports: {
    [mainnet.id]: http(),
    [polygon.id]: http(),
    [base.id]: http(),
  },
});
