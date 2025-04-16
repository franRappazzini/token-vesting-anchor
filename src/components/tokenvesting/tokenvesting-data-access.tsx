"use client";

import { Cluster, Keypair, PublicKey } from "@solana/web3.js";
import { getTokenvestingProgram, getTokenvestingProgramId } from "@project/anchor";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { useMutation, useQuery } from "@tanstack/react-query";

import { BN } from "bn.js";
import { TOKEN_PROGRAM_ID } from "@solana/spl-token";
import toast from "react-hot-toast";
import { useAnchorProvider } from "../solana/solana-provider";
import { useCluster } from "../cluster/cluster-data-access";
import { useMemo } from "react";
import { useTransactionToast } from "../ui/ui-layout";

interface CreateVestingAccountArgs {
  companyName: string;
  mint: string;
}

interface CreateEmployeeAccountArgs {
  startTime: number;
  endTime: number;
  cliffTime: number;
  totalAmount: number;
  beneficiary: string;
}

interface ClaimTokensVestingParams {
  companyName: string;
}

export function useTokenvestingProgram() {
  const { connection } = useConnection();
  const { cluster } = useCluster();
  const transactionToast = useTransactionToast();
  const provider = useAnchorProvider();
  const programId = useMemo(() => getTokenvestingProgramId(cluster.network as Cluster), [cluster]);
  const program = useMemo(() => getTokenvestingProgram(provider, programId), [provider, programId]);

  const { wallet } = useWallet();

  const accounts = useQuery({
    queryKey: ["tokenvesting", "all", { cluster }],
    queryFn: () => program.account.vestingAccount.all(),
  });

  const getProgramAccount = useQuery({
    queryKey: ["get-program-account", { cluster }],
    queryFn: () => connection.getParsedAccountInfo(programId),
  });

  /*   const initialize = useMutation({
    mutationKey: ["tokenvesting", "initialize", { cluster }],
    mutationFn: (keypair: Keypair) =>
      program.methods
        .initialize()
        .accounts({ tokenvesting: keypair.publicKey })
        .signers([keypair])
        .rpc(),
    onSuccess: (signature) => {
      transactionToast(signature);
      return accounts.refetch();
    },
    onError: () => toast.error("Failed to initialize account"),
  }); */

  const createVestingAccount = useMutation<string, Error, CreateVestingAccountArgs>({
    mutationKey: ["tokenvesting", "create vesting account", { cluster }],
    mutationFn: ({ companyName, mint }) =>
      program.methods
        .createVestingAccount(companyName)
        .accounts({ tokenProgram: TOKEN_PROGRAM_ID, mint: new PublicKey(mint) })
        // .signers([keypair])
        .rpc(),
    onSuccess: (signature) => {
      transactionToast(signature);
      return accounts.refetch();
    },
    onError: () => toast.error("Failed to initialize account"),
  });

  return {
    program,
    programId,
    accounts,
    getProgramAccount,
    // initialize,
    createVestingAccount,
  };
}

export function useTokenvestingProgramAccount({ account }: { account: PublicKey }) {
  const { cluster } = useCluster();
  const transactionToast = useTransactionToast();
  const { program, accounts } = useTokenvestingProgram();

  const accountQuery = useQuery({
    queryKey: ["tokenvesting", "fetch", { cluster, account }],
    queryFn: () => program.account.vestingAccount.fetch(account),
  });

  /*   const closeMutation = useMutation({
    mutationKey: ["tokenvesting", "close", { cluster, account }],
    mutationFn: () => program.methods.close().accounts({ tokenvesting: account }).rpc(),
    onSuccess: (tx) => {
      transactionToast(tx);
      return accounts.refetch();
    },
  });

  const decrementMutation = useMutation({
    mutationKey: ["tokenvesting", "decrement", { cluster, account }],
    mutationFn: () => program.methods.decrement().accounts({ tokenvesting: account }).rpc(),
    onSuccess: (tx) => {
      transactionToast(tx);
      return accountQuery.refetch();
    },
  });

  const incrementMutation = useMutation({
    mutationKey: ["tokenvesting", "increment", { cluster, account }],
    mutationFn: () => program.methods.increment().accounts({ tokenvesting: account }).rpc(),
    onSuccess: (tx) => {
      transactionToast(tx);
      return accountQuery.refetch();
    },
  });

  const setMutation = useMutation({
    mutationKey: ["tokenvesting", "set", { cluster, account }],
    mutationFn: (value: number) =>
      program.methods.set(value).accounts({ tokenvesting: account }).rpc(),
    onSuccess: (tx) => {
      transactionToast(tx);
      return accountQuery.refetch();
    },
  }); */

  const createEmployeeAccount = useMutation<string, Error, CreateEmployeeAccountArgs>({
    mutationKey: ["tokenvesting", "create employee account", { cluster, account }],
    mutationFn: ({ startTime, endTime, cliffTime, totalAmount, beneficiary }) =>
      program.methods
        .createEmployeeAccount(bn(startTime), bn(endTime), bn(cliffTime), bn(totalAmount))
        .accounts({ vestingAccount: account, beneficiary: new PublicKey(beneficiary) })
        .rpc(),
    onSuccess: (tx) => {
      transactionToast(tx);
      return accounts.refetch();
    },
  });

  const claimTokensVesting = useMutation<string, Error, ClaimTokensVestingParams>({
    mutationKey: ["tokenvesting", "claim tokens", { cluster, account }],
    mutationFn: ({ companyName }) =>
      program.methods
        .claimTokensVesting(companyName)
        .accounts({ tokenProgram: TOKEN_PROGRAM_ID })
        .rpc(),
    onSuccess: (tx) => {
      transactionToast(tx);
      return accounts.refetch();
    },
    onError: (e) => {
      console.log(e);
      toast.error("Failed to claim tokens");
    },
  });

  return {
    accountQuery,
    createEmployeeAccount,
    claimTokensVesting,
    // closeMutation,
    // decrementMutation,
    // incrementMutation,
    // setMutation,
  };
}

function bn(n: number) {
  return new BN(n);
}
