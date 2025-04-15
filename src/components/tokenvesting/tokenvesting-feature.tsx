"use client";

import { AppHero, ellipsify } from "../ui/ui-layout";
import { TokenvestingCreate, TokenvestingList } from "./tokenvesting-ui";

import { ExplorerLink } from "../cluster/cluster-ui";
import { WalletButton } from "../solana/solana-provider";
import { useTokenvestingProgram } from "./tokenvesting-data-access";
import { useWallet } from "@solana/wallet-adapter-react";

export default function TokenvestingFeature() {
  const { publicKey } = useWallet();
  const { programId } = useTokenvestingProgram();

  return publicKey ? (
    <div>
      <AppHero
        title="Token Vesting Program"
        subtitle={
          "Tokenvesting is a smart contract that allows you to create vesting accounts for your employees."
        }
      >
        <p className="mb-6">
          <ExplorerLink path={`account/${programId}`} label={ellipsify(programId.toString())} />
        </p>
        <TokenvestingCreate />
      </AppHero>
      <TokenvestingList />
    </div>
  ) : (
    <div className="max-w-4xl mx-auto">
      <div className="hero py-[64px]">
        <div className="hero-content text-center">
          <WalletButton />
        </div>
      </div>
    </div>
  );
}
